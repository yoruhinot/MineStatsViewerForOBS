package jp.n05ym.minestatsviewer;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import net.fabricmc.loader.api.FabricLoader;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.concurrent.atomic.AtomicReference;

final class ConfigStore {
    private static final Gson GSON = new GsonBuilder().setPrettyPrinting().create();
    private final Path path = FabricLoader.getInstance().getConfigDir().resolve("mine-stats-viewer-for-obs.json");
    private final AtomicReference<JsonObject> current = new AtomicReference<>();

    ConfigStore() {
        current.set(load());
    }

    String json() { return GSON.toJson(current.get()); }

    String uiLanguage() {
        JsonObject value = current.get();
        return value.has("uiLanguage") ? value.get("uiLanguage").getAsString() : "auto";
    }

    synchronized void save(String json) throws IOException {
        if (json.length() > 1_000_000) throw new IOException("Configuration is too large / 設定が大きすぎます");
        JsonObject parsed = JsonParser.parseString(json).getAsJsonObject();
        if (!parsed.has("widgets") || !parsed.get("widgets").isJsonArray()) throw new IOException("Missing widgets / widgetsがありません");
        Files.createDirectories(path.getParent());
        Path temporary = path.resolveSibling(path.getFileName() + ".tmp");
        Files.writeString(temporary, GSON.toJson(parsed), StandardCharsets.UTF_8);
        Files.move(temporary, path, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
        current.set(parsed);
    }

    private JsonObject load() {
        try {
            if (Files.exists(path)) return JsonParser.parseString(Files.readString(path)).getAsJsonObject();
        } catch (Exception e) {
            try { Files.move(path, path.resolveSibling(path.getFileName() + ".broken"), StandardCopyOption.REPLACE_EXISTING); }
            catch (IOException ignored) {}
        }
        return defaults();
    }

    private static JsonObject defaults() {
        JsonObject root = new JsonObject();
        root.addProperty("version", 1);
        root.addProperty("uiLanguage", "auto");
        root.addProperty("title", "MINE STATS");
        root.addProperty("showTitle", true);
        root.addProperty("fontPreset", "modern");
        root.addProperty("accent", "#ff3d00");
        root.addProperty("titleColor", "#11110f");
        root.addProperty("textColor", "#11110f");
        root.addProperty("labelColor", "#11110f");
        root.addProperty("valueColor", "#2835f8");
        root.addProperty("background", "#f4e9e1");
        root.addProperty("backgroundOpacity", 96);
        root.addProperty("columns", 1);
        root.addProperty("panelPadding", 24);
        root.addProperty("itemGap", 7);
        root.addProperty("elementGap", 12);
        root.addProperty("labelSize", 24);
        root.addProperty("valueSize", 42);
        root.addProperty("iconSize", 44);
        root.addProperty("titleSize", 42);
        root.addProperty("columnGap", 24);
        root.addProperty("itemWidth", 460);
        root.addProperty("valueWidth", 180);
        root.addProperty("radius", 16);
        root.addProperty("borderWidth", 0);
        root.addProperty("resolutionScale", 1);
        root.addProperty("resolutionPreset", "1080");
        root.addProperty("layoutPreset", "standard");
        root.addProperty("themePreset", "editorial");
        root.addProperty("labelVisible", true);
        root.add("customPresets", new JsonArray());
        JsonArray widgets = new JsonArray();
        widgets.add(widget(defaultLabel("採掘ブロック", "Blocks mined"), "⛏", "block", "minecraft:stone", "session",
                terms("minecraft:mined|minecraft:stone", "minecraft:mined|minecraft:deepslate")));
        widgets.add(widget(defaultLabel("ダイヤ鉱石", "Diamond ore"), "💎", "block", "minecraft:diamond_ore", "session",
                terms("minecraft:mined|minecraft:diamond_ore", "minecraft:mined|minecraft:deepslate_diamond_ore")));
        widgets.add(widget(defaultLabel("死んだ回数", "Deaths"), "💀", "none", "", "total",
                terms("minecraft:custom|minecraft:deaths")));
        root.add("widgets", widgets);
        return root;
    }

    private static JsonArray terms(String... ids) {
        JsonArray terms = new JsonArray();
        for (String id : ids) {
            JsonObject term = new JsonObject();
            term.addProperty("stat", id);
            term.addProperty("factor", 1);
            terms.add(term);
        }
        return terms;
    }

    private static String defaultLabel(String japanese, String english) {
        return Locale.getDefault().getLanguage().equals("ja") ? japanese : english;
    }

    private static JsonObject widget(String label, String emoji, String iconKind, String iconId,
                                     String source, JsonArray terms) {
        JsonObject w = new JsonObject();
        w.addProperty("id", java.util.UUID.randomUUID().toString());
        w.addProperty("label", label);
        w.addProperty("emoji", emoji);
        w.addProperty("iconKind", iconKind);
        w.addProperty("iconId", iconId);
        w.addProperty("source", source);
        w.addProperty("format", "number");
        w.addProperty("color", "#2835f8");
        w.addProperty("visible", true);
        w.addProperty("labelVisible", true);
        w.add("terms", terms);
        return w;
    }
}
