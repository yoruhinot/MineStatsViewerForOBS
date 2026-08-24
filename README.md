# MineStats Viewer for OBS

Minecraft Java Edition 26.2 / Fabric の統計を、OBSへほぼリアルタイム表示するクライアントMODです。全バニラ統計、合計・割合・目標・ペース計算、Minecraftアイコン、自由な見た目調整に対応します。

## インストール

1. [Modrinth App](https://modrinth.com/app)を入れる
2. [Releases](https://github.com/yoruhinot/MineStatsViewerForOBS/releases/latest)の`.mrpack`を開く
3. インストール後に「プレイ」

既存ワールドは、Modrinth Appのプロファイルフォルダー内にある`saves`へコピーすれば使えます。先にバックアップしてください。

## 使い方

1. ワールド内で`F8`を押す
2. 設定画面を開き、右の見本を見ながら調整
3. OBS URLをコピー
4. OBSの「ブラウザ」ソースへ貼り、設定画面が提案する幅・高さを入力

設定は自動保存されます。マルチプレイでも統計画面を開く必要はありません。

手動導入では、[Releases](https://github.com/yoruhinot/MineStatsViewerForOBS/releases/latest)のJARと[Fabric API](https://modrinth.com/mod/fabric-api)を`mods`へ入れてください。

## ビルド

JDK 25で`./gradlew.bat build`を実行します。

非公式ファン制作MODです。Mojang StudiosおよびMicrosoftとは関係ありません。
