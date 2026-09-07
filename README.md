# MineStats Viewer for OBS

Display Minecraft Java Edition 26.2 statistics in OBS in near real time. This client-side Fabric mod includes every vanilla statistic, calculated counters, Minecraft icons, presets, and an English/Japanese visual editor.

## Install

1. Install the [Modrinth App](https://modrinth.com/app).
2. Open the `.mrpack` from [Releases](https://github.com/yoruhinot/MineStatsViewerForOBS/releases/latest).
3. Click **Play**.

Press `F8` in a world, open Settings, then copy the suggested URL and size into an OBS Browser Source. Settings save automatically; no server-side mod or statistics-screen refresh is required.

For manual installation, put the release JAR and [Fabric API](https://modrinth.com/mod/fabric-api) in your `mods` folder.

## 日本語

Minecraft Java Edition 26.2の統計を、OBSへほぼリアルタイム表示するFabricクライアントMODです。全バニラ統計、計算カウンター、Minecraftアイコン、プリセット、日英対応の設定画面を搭載しています。

1. [Modrinth App](https://modrinth.com/app)を入れます。
2. [Releases](https://github.com/yoruhinot/MineStatsViewerForOBS/releases/latest)の`.mrpack`を開きます。
3. **プレイ**を押します。

ワールド内で`F8`を押し、設定画面のURLと推奨サイズをOBSのブラウザソースへ入力してください。設定は自動保存され、マルチでも統計画面を開く必要はありません。

[Customization design / カスタマイズ設計](docs/CUSTOMIZATION_DESIGN.md)

Build with JDK 25 and `./gradlew.bat build`. Unofficial fan-made mod; not associated with Mojang Studios or Microsoft.
