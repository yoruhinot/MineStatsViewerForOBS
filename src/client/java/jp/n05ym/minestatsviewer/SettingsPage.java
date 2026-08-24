package jp.n05ym.minestatsviewer;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

final class SettingsPage {
    static final String HTML = load();

    private SettingsPage() {}

    private static String load() {
        try (InputStream input = SettingsPage.class.getResourceAsStream(
                "/assets/minestatsviewer/web/settings.html")) {
            if (input == null) throw new IOException("settings.html is missing");
            return new String(input.readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            return "<!doctype html><meta charset=utf-8><h1>設定画面を読み込めませんでした</h1><pre>"
                    + e.getMessage() + "</pre>";
        }
    }
}
