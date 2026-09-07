import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const out = join(root, 'presets');
const text = (ja, en) => ({ ja, en });
const pick = (value, locale) => typeof value === 'string' ? value : value[locale];
const term = (stat, role) => ({ stat, factor: 1, ...(role ? { role } : {}) });
const prefix = (value, role) => ({ prefix: value, factor: 1, ...(role ? { role } : {}) });

const diamondOres = [
  term('minecraft:mined|minecraft:diamond_ore'),
  term('minecraft:mined|minecraft:deepslate_diamond_ore'),
];
const oreIds = [
  'coal_ore', 'deepslate_coal_ore', 'iron_ore', 'deepslate_iron_ore',
  'copper_ore', 'deepslate_copper_ore', 'gold_ore', 'deepslate_gold_ore',
  'redstone_ore', 'deepslate_redstone_ore', 'emerald_ore', 'deepslate_emerald_ore',
  'lapis_ore', 'deepslate_lapis_ore', 'diamond_ore', 'deepslate_diamond_ore',
  'nether_gold_ore', 'nether_quartz_ore',
];
const oreShare = oreIds.map(id => term(
  `minecraft:mined|minecraft:${id}`,
  id === 'diamond_ore' || id === 'deepslate_diamond_ore' ? 'a' : 'b',
));
const pickaxes = ['wooden', 'stone', 'copper', 'iron', 'golden', 'diamond', 'netherite']
  .map(material => term(`minecraft:broken|minecraft:${material}_pickaxe`));
const planks = ['oak', 'spruce', 'birch', 'jungle', 'acacia', 'dark_oak', 'mangrove', 'cherry', 'pale_oak', 'bamboo', 'crimson', 'warped']
  .map(kind => term(`minecraft:used|minecraft:${kind}_planks`));
const stainedGlass = ['white', 'orange', 'magenta', 'light_blue', 'yellow', 'lime', 'pink', 'gray', 'light_gray', 'cyan', 'purple', 'blue', 'brown', 'green', 'red', 'black']
  .map(color => term(`minecraft:used|minecraft:${color}_stained_glass`));

const stats = {
  mined: { label: text('総採掘数', 'Blocks mined'), emoji: '⛏', iconKind: 'item', iconId: 'minecraft:diamond_pickaxe', terms: [prefix('minecraft:mined|')] },
  stone: { label: text('石・深層岩', 'Stone & deepslate'), emoji: '🪨', iconKind: 'block', iconId: 'minecraft:stone', terms: [term('minecraft:mined|minecraft:stone'), term('minecraft:mined|minecraft:deepslate')] },
  diamond: { label: text('ダイヤ鉱石', 'Diamond ore'), emoji: '💎', iconKind: 'block', iconId: 'minecraft:diamond_ore', terms: diamondOres },
  pickaxes: { label: text('壊したツルハシ', 'Broken pickaxes'), emoji: '🔨', iconKind: 'item', iconId: 'minecraft:diamond_pickaxe', terms: pickaxes },
  deaths: { label: text('死んだ回数', 'Deaths'), emoji: '💀', iconKind: 'item', iconId: 'minecraft:skeleton_skull', source: 'total', terms: [term('minecraft:custom|minecraft:deaths')] },
  playSession: { label: text('プレイ時間', 'Play time'), emoji: '⏱', iconKind: 'item', iconId: 'minecraft:clock', format: 'time', terms: [term('minecraft:custom|minecraft:play_time')] },
  playTotal: { label: text('プレイ時間', 'Play time'), emoji: '⏱', iconKind: 'item', iconId: 'minecraft:clock', format: 'time', source: 'total', terms: [term('minecraft:custom|minecraft:play_time')] },
  alive: { label: text('生存時間', 'Time alive'), emoji: '❤', iconKind: 'item', iconId: 'minecraft:totem_of_undying', format: 'time', source: 'total', terms: [term('minecraft:custom|minecraft:time_since_death')] },
  kills: { label: text('Mob討伐', 'Mob kills'), emoji: '⚔', iconKind: 'item', iconId: 'minecraft:diamond_sword', terms: [term('minecraft:custom|minecraft:mob_kills')] },
  totalKills: { label: text('総討伐数', 'Total kills'), emoji: '⚔', iconKind: 'item', iconId: 'minecraft:diamond_sword', terms: [prefix('minecraft:killed|')] },
  totems: { label: text('トーテム使用', 'Totems used'), emoji: '✨', iconKind: 'item', iconId: 'minecraft:totem_of_undying', source: 'total', terms: [term('minecraft:used|minecraft:totem_of_undying')] },
  fish: { label: text('釣った魚', 'Fish caught'), emoji: '🎣', iconKind: 'item', iconId: 'minecraft:fishing_rod', terms: [term('minecraft:custom|minecraft:fish_caught')] },
  bred: { label: text('動物を繁殖', 'Animals bred'), emoji: '🐄', iconKind: 'item', iconId: 'minecraft:wheat', terms: [term('minecraft:custom|minecraft:animals_bred')] },
  trades: { label: text('村人との取引', 'Villager trades'), emoji: '💚', iconKind: 'item', iconId: 'minecraft:emerald', terms: [term('minecraft:custom|minecraft:traded_with_villager')] },
  sleep: { label: text('ベッドで寝た回数', 'Times slept'), emoji: '☾', iconKind: 'item', iconId: 'minecraft:pink_bed', terms: [term('minecraft:custom|minecraft:sleep_in_bed')] },
  stonePlaced: { label: text('石系ブロック使用', 'Stone blocks placed'), emoji: '🧱', iconKind: 'block', iconId: 'minecraft:stone_bricks', terms: ['stone', 'cobblestone', 'stone_bricks', 'deepslate', 'cobbled_deepslate', 'deepslate_bricks'].map(id => term(`minecraft:used|minecraft:${id}`)) },
  woodPlaced: { label: text('木材使用', 'Wood placed'), emoji: '🪵', iconKind: 'block', iconId: 'minecraft:oak_planks', terms: planks },
  glassPlaced: { label: text('ガラス使用', 'Glass placed'), emoji: '◇', iconKind: 'block', iconId: 'minecraft:glass', terms: [term('minecraft:used|minecraft:glass'), ...stainedGlass] },
  remaining100: { label: text('100個まであと', 'Until 100'), emoji: '🎯', iconKind: 'item', iconId: 'minecraft:diamond', operation: 'remaining', target: 100, terms: diamondOres, suffix: text(' 個', ' items') },
  diamondRate: { label: text('1時間あたり', 'Per hour'), emoji: '⏱', iconKind: 'item', iconId: 'minecraft:clock', operation: 'rate', terms: diamondOres, suffix: text(' 個/時', ' /h') },
  diamondShare: { label: text('鉱石のうちダイヤ', 'Diamond share of ores'), emoji: '◇', iconKind: 'item', iconId: 'minecraft:spyglass', operation: 'share', format: 'percent', terms: oreShare },
  killRate: { label: text('1時間あたり', 'Per hour'), emoji: '⏱', iconKind: 'item', iconId: 'minecraft:clock', operation: 'rate', terms: [prefix('minecraft:killed|')], suffix: text(' 体/時', ' /h') },
  remaining500: { label: text('500体まであと', 'Until 500'), emoji: '🎯', iconKind: 'item', iconId: 'minecraft:target', operation: 'remaining', target: 500, terms: [prefix('minecraft:killed|')], suffix: text(' 体', ' mobs') },
  creeperShare: { label: text('クリーパーの割合', 'Creeper share'), emoji: '💥', iconKind: 'item', iconId: 'minecraft:gunpowder', operation: 'share', format: 'percent', terms: ['creeper', 'zombie', 'skeleton', 'spider', 'enderman', 'witch', 'drowned', 'slime'].map(id => term(`minecraft:killed|minecraft:${id}`, id === 'creeper' ? 'a' : 'b')) },
};

const base = {
  version: 1,
  showTitle: true,
  title: 'STREAM STATS',
  fontPreset: 'modern',
  accent: '#ff8fbd',
  titleColor: '#70405b',
  textColor: '#70405b',
  labelColor: '#765266',
  valueColor: '#df568f',
  background: '#fff1f6',
  backgroundOpacity: 92,
  columns: 1,
  panelPadding: 22,
  itemGap: 6,
  elementGap: 10,
  itemWidth: 380,
  valueWidth: 145,
  columnGap: 20,
  titleSize: 38,
  iconSize: 38,
  labelSize: 20,
  valueSize: 36,
  radius: 24,
  borderWidth: 2,
  resolutionScale: 1,
  resolutionPreset: '1080',
  layoutPreset: 'custom',
  themePreset: 'custom',
  labelVisible: true,
  customPresets: [],
};

const patterns = [
  {
    slug: 'pastel-pink-vtuber',
    name: text('パステルピンク VTuber', 'Pastel Pink VTuber'),
    use: text('雑談・採掘配信。右上や左上に置く2列パネル。', 'A soft two-column panel for chatting and mining streams.'),
    config: { title: 'VTUBER STATS', columns: 2, itemWidth: 310, valueWidth: 120, background: '#fff1f6', accent: '#ff9bc4', titleColor: '#75435d', labelColor: '#765266', valueColor: '#df568f', radius: 28, borderWidth: 3 },
    widgets: ['mined', 'diamond', 'deaths', 'playSession'],
  },
  {
    slug: 'pastel-blue-vtuber',
    name: text('パステルブルー VTuber', 'Pastel Blue VTuber'),
    use: text('冒険配信向けの細めサイドパネル。', 'A slim side panel for adventure streams.'),
    config: { title: "TODAY'S ADVENTURE", fontPreset: 'readable', itemWidth: 390, background: '#eef8ff', accent: '#8acdf5', titleColor: '#355f85', textColor: '#355f85', labelColor: '#557691', valueColor: '#397fbd', radius: 24, borderWidth: 2 },
    widgets: ['playSession', 'mined', 'kills', 'deaths'],
  },
  {
    slug: 'lavender-diamond-dream',
    name: text('ラベンダー ダイヤ目標', 'Lavender Diamond Dream'),
    use: text('ダイヤ目標企画。残り・ペース・割合を2列で表示。', 'A two-column diamond goal tracker with pace and share.'),
    config: { title: 'DIAMOND DREAM', columns: 2, itemWidth: 325, valueWidth: 130, background: '#f5efff', accent: '#bea5f5', titleColor: '#67528f', textColor: '#67528f', labelColor: '#76669a', valueColor: '#8464d5', radius: 30, borderWidth: 3 },
    widgets: ['diamond', 'remaining100', 'diamondRate', 'diamondShare'],
  },
  {
    slug: 'mint-cozy-chat',
    name: text('ミント のんびり雑談', 'Mint Cozy Chat'),
    use: text('釣り・生活・雑談配信向けのやさしい2列パネル。', 'A calm two-column panel for fishing, farming, and chatting.'),
    config: { title: 'COZY MINECRAFT', fontPreset: 'serif', columns: 2, itemWidth: 315, valueWidth: 115, background: '#effbf6', accent: '#8adbbd', titleColor: '#356d5a', textColor: '#356d5a', labelColor: '#547d70', valueColor: '#3b9e7b', radius: 26, borderWidth: 2 },
    widgets: ['fish', 'bred', 'trades', 'sleep'],
  },
  {
    slug: 'peach-building-log',
    name: text('ピーチ 建築記録', 'Peach Building Log'),
    use: text('建築配信。素材使用数と作業時間をまとめて表示。', 'A building stream panel for materials and session time.'),
    config: { title: 'BUILD LOG', columns: 2, itemWidth: 335, valueWidth: 125, background: '#fff2ea', accent: '#f5a27d', titleColor: '#874d38', textColor: '#874d38', labelColor: '#916a5a', valueColor: '#d46d4c', radius: 20, borderWidth: 2 },
    widgets: ['playSession', 'stonePlaced', 'woodPlaced', 'glassPlaced', 'mined', 'deaths'],
  },
  {
    slug: 'transparent-bottom-bar',
    name: text('透明 横長ボトムバー', 'Transparent Bottom Bar'),
    use: text('ゲーム画面下部へ置く、背景なしの横長4項目。', 'A transparent four-stat bar for the bottom of the game view.'),
    config: { showTitle: false, title: '', columns: 4, panelPadding: 6, itemGap: 0, elementGap: 7, itemWidth: 245, valueWidth: 100, columnGap: 16, titleSize: 0, iconSize: 32, labelSize: 18, valueSize: 28, background: '#13131a', backgroundOpacity: 0, accent: '#ffffff', titleColor: '#ffffff', textColor: '#ffffff', labelColor: '#ffffff', valueColor: '#ffd6e8', radius: 0, borderWidth: 0 },
    widgets: ['mined', 'diamond', 'kills', 'deaths'],
  },
  {
    slug: 'mini-icon-counters',
    name: text('ミニ アイコンカウンター', 'Mini Icon Counters'),
    use: text('立ち絵の近くへ置く、名前なしの小さな4カウンター。', 'Four tiny icon-and-number counters for placement near an avatar.'),
    config: { showTitle: false, title: '', columns: 4, panelPadding: 10, itemGap: 2, elementGap: 6, itemWidth: 125, valueWidth: 68, columnGap: 10, titleSize: 0, iconSize: 36, labelSize: 0, valueSize: 36, background: '#30273a', backgroundOpacity: 76, accent: '#ffb9d5', titleColor: '#ffffff', textColor: '#ffffff', labelColor: '#ffffff', valueColor: '#fff4fa', radius: 24, borderWidth: 2, labelVisible: false },
    widgets: ['mined', 'diamond', 'kills', 'deaths'],
    widgetConfig: { labelVisible: false, animationType: 'pop' },
  },
  {
    slug: 'dark-elegant-hardcore',
    name: text('ダークエレガント ハードコア', 'Dark Elegant Hardcore'),
    use: text('ハードコア・長期生存企画向けの落ち着いた縦型。', 'A restrained vertical panel for hardcore and long survival runs.'),
    config: { title: 'HARDCORE', fontPreset: 'serif', itemWidth: 445, valueWidth: 185, background: '#17151b', backgroundOpacity: 94, accent: '#d7b56d', titleColor: '#f2dfb1', textColor: '#eee5d4', labelColor: '#ddd1bd', valueColor: '#ff7c78', radius: 8, borderWidth: 2, titleSize: 44, valueSize: 40 },
    widgets: ['playTotal', 'alive', 'deaths', 'kills', 'totems'],
  },
  {
    slug: 'neon-mob-hunt',
    name: text('ネオン Mob討伐', 'Neon Mob Hunt'),
    use: text('討伐数チャレンジ。配信企画向けの派手な2列表示。', 'A vivid two-column challenge panel for mob-hunt streams.'),
    config: { title: 'MOB HUNT', fontPreset: 'game', columns: 2, itemWidth: 305, valueWidth: 120, background: '#111024', backgroundOpacity: 90, accent: '#2af4ed', titleColor: '#ffffff', textColor: '#dcd8ff', labelColor: '#dcd8ff', valueColor: '#ff58d0', radius: 14, borderWidth: 3 },
    widgets: ['totalKills', 'killRate', 'remaining500', 'creeperShare'],
    widgetConfig: { animationType: 'glow', animationDuration: 650 },
  },
  {
    slug: 'cream-editorial-report',
    name: text('クリーム 配信レポート', 'Cream Editorial Report'),
    use: text('情報量を多めに見せたい、読みやすい2列レポート。', 'A readable two-column report with room for six statistics.'),
    config: { title: 'MINE REPORT', columns: 2, itemWidth: 350, valueWidth: 135, background: '#f7eee6', backgroundOpacity: 96, accent: '#ff6035', titleColor: '#171512', textColor: '#302d29', labelColor: '#4f4943', valueColor: '#2835f8', radius: 4, borderWidth: 0, titleSize: 42 },
    widgets: ['mined', 'stone', 'diamond', 'pickaxes', 'playSession', 'deaths'],
  },
  {
    slug: 'monochrome-clean',
    name: text('モノクロ ミニマル', 'Monochrome Minimal'),
    use: text('白背景・黒文字で、動画素材にも合わせやすい縦型。', 'A simple black-and-white vertical panel for clean layouts.'),
    config: { title: 'STATS', itemWidth: 365, valueWidth: 135, background: '#ffffff', backgroundOpacity: 88, accent: '#151515', titleColor: '#151515', textColor: '#151515', labelColor: '#3d3d3d', valueColor: '#151515', radius: 0, borderWidth: 2, panelPadding: 18, itemGap: 4 },
    widgets: ['mined', 'diamond', 'deaths'],
  },
  {
    slug: 'single-diamond-counter',
    name: text('単体 ダイヤカウンター', 'Single Diamond Counter'),
    use: text('立ち絵横や企画タイトル横へ置く、大きな単体カウンター。', 'One large diamond counter for placement beside an avatar or goal title.'),
    config: { showTitle: false, title: '', columns: 1, panelPadding: 18, itemGap: 0, elementGap: 10, itemWidth: 240, valueWidth: 150, columnGap: 0, titleSize: 0, iconSize: 72, labelSize: 0, valueSize: 72, background: '#fff0f7', backgroundOpacity: 84, accent: '#f08bb8', titleColor: '#7f4560', textColor: '#7f4560', labelColor: '#7f4560', valueColor: '#db4f91', radius: 36, borderWidth: 3, labelVisible: false },
    widgets: ['diamond'],
    widgetConfig: { labelVisible: false, suffix: text(' / 100', ' / 100'), suffixSize: 24, animationType: 'pop', animationDuration: 700 },
  },
];

function buildWidget(key, style, locale, index, globalOverrides = {}) {
  const definition = stats[key];
  const valueColor = style.valueColor;
  const widget = {
    id: `${style.slug}-${key}-${index + 1}`,
    label: pick(definition.label, locale),
    emoji: definition.emoji,
    iconKind: definition.iconKind,
    iconId: definition.iconId,
    source: definition.source ?? 'session',
    operation: definition.operation ?? 'sum',
    format: definition.format ?? 'number',
    color: valueColor,
    visible: true,
    labelVisible: style.labelVisible !== false,
    animationEnabled: (definition.format ?? 'number') !== 'time',
    animationType: 'color',
    animationColor: style.accent,
    animationDuration: 450,
    terms: definition.terms,
    ...globalOverrides,
  };
  if (definition.target !== undefined) widget.target = definition.target;
  const suffix = globalOverrides.suffix ?? definition.suffix;
  if (suffix) {
    widget.suffixText = pick(suffix, locale);
    widget.suffixColor = widget.color;
    widget.suffixSize = globalOverrides.suffixSize ?? 16;
  }
  delete widget.suffix;
  return widget;
}

function buildConfig(pattern, locale) {
  const style = { ...base, ...pattern.config, uiLanguage: locale };
  const widgets = pattern.widgets.map((key, index) => buildWidget(key, { ...style, slug: pattern.slug }, locale, index, pattern.widgetConfig));
  return { ...style, widgets };
}

await mkdir(join(out, 'ja'), { recursive: true });
await mkdir(join(out, 'en'), { recursive: true });

for (const pattern of patterns) {
  for (const locale of ['ja', 'en']) {
    const path = join(out, locale, `${pattern.slug}.json`);
    await writeFile(path, `${JSON.stringify(buildConfig(pattern, locale), null, 2)}\n`, 'utf8');
  }
}

const manifest = {
  version: 1,
  generatedFor: 'MineStats Viewer for OBS 1.1.0+',
  presets: patterns.map(pattern => ({
    id: pattern.slug,
    name: pattern.name,
    description: pattern.use,
    files: {
      ja: `ja/${pattern.slug}.json`,
      en: `en/${pattern.slug}.json`,
    },
  })),
};
await writeFile(join(out, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));
const sampleValue = (widget, index) => {
  if (widget.format === 'time') return index % 2 ? '1:18:42' : '3:42:35';
  if (widget.format === 'percent') return '24.8%';
  if (widget.operation === 'remaining') return '37';
  if (widget.operation === 'rate') return '48';
  return new Intl.NumberFormat('ja-JP').format(1284 + index * 137);
};
const scale = 0.54;
const previews = patterns.map(pattern => {
  const config = buildConfig(pattern, 'ja');
  const rows = config.widgets.map((widget, index) => `<div class="stat-row" style="grid-template-columns:${config.iconSize * scale}px ${widget.labelVisible === false ? '0' : 'minmax(45px,1fr)'} auto;gap:${config.elementGap * scale}px;padding:${config.itemGap * scale}px 0"><span class="stat-icon" style="font-size:${config.iconSize * scale * .72}px">${escapeHtml(widget.emoji)}</span>${widget.labelVisible === false ? '' : `<span class="stat-label" style="font-size:${config.labelSize * scale}px">${escapeHtml(widget.label)}</span>`}<span class="stat-value" style="font-size:${config.valueSize * scale}px;color:${widget.color};min-width:${config.valueWidth * scale}px">${escapeHtml(sampleValue(widget, index))}<small style="font-size:${(widget.suffixSize ?? 16) * scale}px">${escapeHtml(widget.suffixText ?? '')}</small></span></div>`).join('');
  const panelWidth = config.columns * config.itemWidth * scale + (config.columns - 1) * config.columnGap * scale + config.panelPadding * scale * 2;
  return `<article class="preset-card"><div class="card-copy"><h2>${escapeHtml(pattern.name.ja)}</h2><p>${escapeHtml(pattern.use.ja)}</p></div><div class="preview-stage"><div class="overlay" style="width:${panelWidth}px;padding:${config.panelPadding * scale}px;border:${config.borderWidth * scale}px solid ${config.accent};border-radius:${config.radius * scale}px;background:color-mix(in srgb,${config.background} ${config.backgroundOpacity}%,transparent);color:${config.textColor}">${config.showTitle === false ? '' : `<h3 style="font-size:${config.titleSize * scale}px;color:${config.titleColor};border-color:${config.accent}">${escapeHtml(config.title)}</h3>`}<div class="stats-grid" style="grid-template-columns:repeat(${config.columns},${config.itemWidth * scale}px);column-gap:${config.columnGap * scale}px">${rows}</div></div></div><div class="downloads"><a href="ja/${pattern.slug}.json" download>日本語JSON</a><a href="en/${pattern.slug}.json" download>English JSON</a></div></article>`;
}).join('');

const showcase = `<!doctype html>
<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>MineStats Streamer Presets</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#101114;color:#f5f2ec;font-family:"Noto Sans JP","Yu Gothic UI",system-ui,sans-serif}header{padding:56px max(24px,6vw) 34px;border-bottom:1px solid #2b2d33}header small{color:#ff9bc4;font-weight:800;letter-spacing:.16em}h1{margin:8px 0;font-size:clamp(32px,5vw,62px);letter-spacing:-.04em}header p{margin:0;color:#aeb2bd}.gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(440px,1fr));gap:20px;padding:28px max(20px,4vw) 60px}.preset-card{min-width:0;padding:20px;background:#191b20;border:1px solid #2b2e35;border-radius:20px}.card-copy h2{margin:0;font-size:20px}.card-copy p{margin:6px 0 16px;color:#aeb2bd;font-size:13px}.preview-stage{min-height:235px;display:flex;align-items:center;justify-content:center;overflow:auto;padding:18px;border-radius:14px;background:repeating-conic-gradient(#2c3036 0 25%,#22252a 0 50%) 0/22px 22px}.overlay{flex:none}.overlay h3{margin:0 0 6px;padding-bottom:7px;border-bottom-style:solid;border-bottom-width:2.5px;line-height:1.05;letter-spacing:-.02em}.stats-grid{display:grid}.stat-row{display:grid;align-items:center;border-top:1px solid color-mix(in srgb,currentColor 15%,transparent)}.stats-grid .stat-row:first-child{border-top:0}.stat-icon{text-align:center;line-height:1}.stat-label{font-weight:600;white-space:nowrap}.stat-value{font-family:Bahnschrift,"Segoe UI",sans-serif;font-weight:800;text-align:right;white-space:nowrap}.stat-value small{font-family:inherit}.downloads{display:flex;gap:8px;margin-top:14px}.downloads a{padding:8px 12px;border-radius:9px;background:#292c33;color:#f5f2ec;text-decoration:none;font-size:12px;font-weight:700}.downloads a:first-child{background:#f5f2ec;color:#17181b}@media(max-width:520px){.gallery{grid-template-columns:1fr}.preset-card{padding:14px}.preview-stage{justify-content:flex-start}}
</style></head><body><header><small>MINESTATS VIEWER FOR OBS</small><h1>Streamer Preset Pack</h1><p>配信画面に合わせて選べる12デザイン。日本語・英語JSONを収録。</p></header><main class="gallery">${previews}</main></body></html>`;
await writeFile(join(out, 'showcase.html'), showcase, 'utf8');

console.log(`Generated ${patterns.length * 2} preset files in ${out}`);
