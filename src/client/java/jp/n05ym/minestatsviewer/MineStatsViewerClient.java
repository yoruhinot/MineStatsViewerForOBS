package jp.n05ym.minestatsviewer;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import net.fabricmc.api.ClientModInitializer;
import net.fabricmc.fabric.api.client.event.lifecycle.v1.ClientTickEvents;
import net.fabricmc.fabric.api.client.keymapping.v1.KeyMappingHelper;
import net.fabricmc.fabric.api.event.lifecycle.v1.ServerTickEvents;
import net.minecraft.client.Minecraft;
import net.minecraft.client.KeyMapping;
import net.minecraft.locale.Language;
import net.minecraft.network.chat.Component;
import net.minecraft.network.protocol.game.ServerboundClientCommandPacket;
import net.minecraft.resources.Identifier;
import net.minecraft.stats.StatsCounter;
import org.lwjgl.glfw.GLFW;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicReference;

public final class MineStatsViewerClient implements ClientModInitializer {
    private static final Gson GSON = new Gson();
    private static final AtomicReference<State> CURRENT = new AtomicReference<>(State.EMPTY);
    private static volatile Map<String, Integer> baseline;
    private static volatile String playerId;
    private static volatile StatCatalog catalog;
    private static volatile Language catalogLanguage;
    private static ConfigStore config;
    private static KeyMapping openMenuKey;
    private int ticks;
    private int multiplayerSyncTicks;
    private boolean announced;

    @Override
    public void onInitializeClient() {
        config = new ConfigStore();
        openMenuKey = KeyMappingHelper.registerKeyMapping(new KeyMapping(
                "key.minestatsviewer.open_menu", GLFW.GLFW_KEY_F8, KeyMapping.Category.MISC));
        startWebServer();
        ClientTickEvents.END_CLIENT_TICK.register(this::updateClientStats);
        ServerTickEvents.END_SERVER_TICK.register(server -> {
            if (++ticks % 5 != 0) return;
            var players = server.getPlayerList().getPlayers();
            if (!players.isEmpty()) update(players.getFirst().getUUID().toString(), players.getFirst().getStats());
        });
    }

    private void updateClientStats(Minecraft client) {
        // Translations are unavailable during the Fabric entrypoint. Building the
        // catalog on the first client tick makes Japanese names searchable.
        Language language = Language.getInstance();
        if (catalog == null || catalogLanguage != language) {
            catalog = new StatCatalog();
            catalogLanguage = language;
        }
        while (openMenuKey.consumeClick()) client.gui.setScreen(new OverlayMenuScreen());
        if (client.player == null) {
            playerId = null;
            baseline = null;
            CURRENT.set(State.EMPTY);
            announced = false;
            multiplayerSyncTicks = 0;
            return;
        }
        announce(client);
        if (client.getSingleplayerServer() != null) return;
        // Remote servers only send the statistics cache after REQUEST_STATS.
        // Request it silently so users do not have to open the vanilla stats screen.
        if (++multiplayerSyncTicks % 40 == 1 && client.getConnection() != null) {
            client.getConnection().send(new ServerboundClientCommandPacket(
                    ServerboundClientCommandPacket.Action.REQUEST_STATS));
        }
        if (++ticks % 5 == 0) update(client.player.getUUID().toString(), client.player.getStats());
    }

    private void announce(Minecraft client) {
        if (announced || client.player == null) return;
        announced = true;
        client.gui.chatListener().handleSystemMessage(
                Component.literal("[MineStats Viewer] F8キーで設定・OBSメニューを開けます"), false);
    }

    private static void update(String id, StatsCounter counter) {
        if (catalog == null) return;
        Map<String, Integer> total = catalog.read(counter);
        if (!id.equals(playerId) || baseline == null) {
            playerId = id;
            baseline = new LinkedHashMap<>(total);
        }
        Map<String, Integer> session = new LinkedHashMap<>();
        for (var entry : total.entrySet()) session.put(entry.getKey(), entry.getValue() - baseline.getOrDefault(entry.getKey(), 0));
        CURRENT.set(new State(true, total, session));
    }

    private static void startWebServer() {
        try {
            HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 8765), 0);
            server.createContext("/", e -> redirect(e, "/overlay"));
            server.createContext("/overlay", e -> text(e, 200, "text/html; charset=utf-8", WebPages.OVERLAY));
            server.createContext("/settings", e -> text(e, 200, "text/html; charset=utf-8", WebPages.SETTINGS));
            server.createContext("/api/stats", e -> json(e, CURRENT.get().json()));
            server.createContext("/api/catalog", e -> json(e, catalog == null ? "[]" : catalog.json()));
            server.createContext("/api/config", MineStatsViewerClient::configRequest);
            server.createContext("/api/icon", MineStatsViewerClient::iconRequest);
            server.setExecutor(Executors.newVirtualThreadPerTaskExecutor());
            server.start();
            System.out.println("[MineStats Viewer] Settings: http://127.0.0.1:8765/settings");
        } catch (IOException e) {
            System.err.println("[MineStats Viewer] Port 8765 could not be opened: " + e.getMessage());
        }
    }

    private static void configRequest(HttpExchange e) throws IOException {
        if (e.getRequestMethod().equals("GET")) { json(e, config.json()); return; }
        if (!e.getRequestMethod().equals("POST")) { text(e, 405, "text/plain", "Method not allowed"); return; }
        try {
            String body = new String(e.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
            config.save(body);
            json(e, config.json());
        } catch (Exception ex) { text(e, 400, "text/plain; charset=utf-8", ex.getMessage()); }
    }

    private static void iconRequest(HttpExchange e) throws IOException {
        Map<String, String> query = query(e.getRequestURI());
        String kind = query.getOrDefault("kind", "item");
        String raw = query.getOrDefault("id", "minecraft:barrier");
        Identifier id;
        try { id = Identifier.parse(raw); } catch (Exception ex) { text(e, 404, "text/plain", "bad id"); return; }
        String folder = kind.equals("block") ? "block" : "item";
        Identifier texture = Identifier.fromNamespaceAndPath(id.getNamespace(), "textures/" + folder + "/" + id.getPath() + ".png");
        var resource = Minecraft.getInstance().getResourceManager().getResource(texture);
        if (resource.isEmpty()) { text(e, 404, "text/plain", "no icon"); return; }
        byte[] bytes;
        try (var input = resource.get().open()) { bytes = input.readAllBytes(); }
        e.getResponseHeaders().set("Content-Type", "image/png");
        e.getResponseHeaders().set("Cache-Control", "public, max-age=3600");
        e.sendResponseHeaders(200, bytes.length);
        try (var out = e.getResponseBody()) { out.write(bytes); }
    }

    private static Map<String, String> query(URI uri) {
        Map<String, String> result = new LinkedHashMap<>();
        if (uri.getRawQuery() == null) return result;
        for (String part : uri.getRawQuery().split("&")) {
            String[] pair = part.split("=", 2);
            result.put(java.net.URLDecoder.decode(pair[0], StandardCharsets.UTF_8),
                    pair.length > 1 ? java.net.URLDecoder.decode(pair[1], StandardCharsets.UTF_8) : "");
        }
        return result;
    }

    private static void redirect(HttpExchange e, String location) throws IOException {
        e.getResponseHeaders().set("Location", location); e.sendResponseHeaders(302, -1); e.close();
    }
    private static void json(HttpExchange e, String body) throws IOException { text(e, 200, "application/json; charset=utf-8", body); }
    private static void text(HttpExchange e, int status, String type, String body) throws IOException {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        e.getResponseHeaders().set("Content-Type", type);
        e.getResponseHeaders().set("Cache-Control", "no-store");
        e.sendResponseHeaders(status, bytes.length);
        try (var out = e.getResponseBody()) { out.write(bytes); }
    }

    private record State(boolean connected, Map<String, Integer> total, Map<String, Integer> session) {
        static final State EMPTY = new State(false, Map.of(), Map.of());
        String json() {
            JsonObject root = new JsonObject();
            root.addProperty("connected", connected);
            root.add("total", GSON.toJsonTree(total));
            root.add("session", GSON.toJsonTree(session));
            return root.toString();
        }
    }
}
