package jp.n05ym.minestatsviewer;

import net.minecraft.util.Util;
import net.minecraft.client.gui.components.Button;
import net.minecraft.client.gui.screens.Screen;
import net.minecraft.network.chat.Component;

import java.net.URI;

final class OverlayMenuScreen extends Screen {
    static final String SETTINGS_URL = "http://127.0.0.1:8765/settings";
    static final String OVERLAY_URL = "http://127.0.0.1:8765/overlay";

    OverlayMenuScreen() {
        super(Component.literal("MineStats Viewer for OBS"));
    }

    @Override
    protected void init() {
        int x = this.width / 2 - 110;
        int y = this.height / 2 - 58;
        this.addRenderableWidget(Button.builder(Component.literal("設定画面をブラウザで開く"),
                button -> Util.getPlatform().openUri(URI.create(SETTINGS_URL))).bounds(x, y, 220, 20).build());
        this.addRenderableWidget(Button.builder(Component.literal("オーバーレイURLをコピー"), button -> {
            this.minecraft.keyboardHandler.setClipboard(OVERLAY_URL);
            button.setMessage(Component.literal("コピーしました！"));
        }).bounds(x, y + 28, 220, 20).build());
        this.addRenderableWidget(Button.builder(Component.literal("オーバーレイをブラウザで確認"),
                button -> Util.getPlatform().openUri(URI.create(OVERLAY_URL))).bounds(x, y + 56, 220, 20).build());
        this.addRenderableWidget(Button.builder(Component.literal("閉じる"), button -> this.onClose())
                .bounds(x, y + 92, 220, 20).build());
    }
}
