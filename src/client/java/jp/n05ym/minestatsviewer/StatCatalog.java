package jp.n05ym.minestatsviewer;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import net.minecraft.core.registries.BuiltInRegistries;
import net.minecraft.network.chat.Component;
import net.minecraft.resources.Identifier;
import net.minecraft.stats.Stat;
import net.minecraft.stats.StatType;
import net.minecraft.stats.StatsCounter;
import net.minecraft.world.entity.EntityType;
import net.minecraft.world.item.Item;
import net.minecraft.world.level.block.Block;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

final class StatCatalog {
    record Entry(String id, String typeId, String valueId, String typeName, String name,
                 String iconKind, String iconId, Stat<?> stat) {}

    private final List<Entry> entries = new ArrayList<>();

    StatCatalog() {
        for (StatType<?> type : BuiltInRegistries.STAT_TYPE) addType(type);
    }

    @SuppressWarnings({"rawtypes", "unchecked"})
    private void addType(StatType type) {
        Identifier typeKey = BuiltInRegistries.STAT_TYPE.getKey(type);
        if (typeKey == null) return;
        String typeName = type.getDisplayName().getString();
        for (Object value : type.getRegistry()) {
            Identifier valueKey = type.getRegistry().getKey(value);
            if (valueKey == null) continue;
            Stat<?> stat = type.get(value);
            String kind = "none";
            String icon = "";
            String name;
            if (value instanceof Block block) {
                name = block.getName().getString();
                kind = "block";
                icon = valueKey.toString();
            } else if (value instanceof Item item) {
                // ItemStack components are not bound yet when Fabric client entrypoints run.
                // The description id is available immediately and resolves to the same
                // localized vanilla name without constructing an ItemStack.
                name = Component.translatable(item.getDescriptionId()).getString();
                kind = "item";
                icon = valueKey.toString();
            } else if (value instanceof EntityType<?> entity) {
                name = entity.getDescription().getString();
            } else if (value instanceof Identifier id) {
                name = Component.translatable("stat." + id.getNamespace() + "." + id.getPath()).getString();
            } else {
                name = valueKey.toString();
            }
            String id = typeKey + "|" + valueKey;
            entries.add(new Entry(id, typeKey.toString(), valueKey.toString(), typeName, name, kind, icon, stat));
        }
    }

    Map<String, Integer> read(StatsCounter counter) {
        Map<String, Integer> values = new LinkedHashMap<>();
        for (Entry entry : entries) values.put(entry.id(), counter.getValue(entry.stat()));
        return values;
    }

    String json() {
        JsonArray array = new JsonArray();
        for (Entry entry : entries) {
            JsonObject item = new JsonObject();
            item.addProperty("id", entry.id());
            item.addProperty("typeId", entry.typeId());
            item.addProperty("valueId", entry.valueId());
            item.addProperty("type", entry.typeName());
            item.addProperty("name", entry.name());
            item.addProperty("iconKind", entry.iconKind());
            item.addProperty("iconId", entry.iconId());
            array.add(item);
        }
        return array.toString();
    }
}
