#!/usr/bin/env node
/**
 * Sync icons from the icon pack (source of truth) to:
 *   1. Plugin imgs/actions/ (SVG copy)
 *   2. Profile manifests (base64 PNG embedded in Image field)
 *
 * Usage: node tools/sync-icons.js [game-id]
 *   Defaults to "lmu" if no game-id provided.
 *
 * The icon pack SVGs are the single source of truth.
 * This script renders them to 144x144 PNGs for profile embedding.
 */

const fs = require("fs");
const path = require("path");
const { Resvg } = require("@resvg/resvg-js");

const ROOT = path.resolve(__dirname, "..");

function getGameConfig(gameId) {
  const configPath = path.join(ROOT, "tools", "games", `${gameId}.json`);
  if (!fs.existsSync(configPath)) {
    console.error(`No game config at ${configPath}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(configPath, "utf-8"));
}

function svgToPngBase64(svgPath) {
  const svgData = fs.readFileSync(svgPath, "utf-8");
  const resvg = new Resvg(svgData, {
    fitTo: { mode: "width", value: 144 },
  });
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();
  return `data:image/png;base64,${pngBuffer.toString("base64")}`;
}

function syncIcons(gameId) {
  const config = getGameConfig(gameId);
  const iconPackId = config.icon_pack_id;
  const pluginId = config.plugin_id;

  const iconPackDir = path.join(ROOT, iconPackId, "icons");
  const pluginImgsDir = path.join(ROOT, "plugin", pluginId, "imgs", "actions");

  if (!fs.existsSync(iconPackDir)) {
    console.error(`Icon pack not found: ${iconPackDir}`);
    process.exit(1);
  }

  // Step 1: Copy SVGs from icon pack → plugin
  if (fs.existsSync(pluginImgsDir)) {
    const svgFiles = fs.readdirSync(iconPackDir).filter((f) => f.endsWith(".svg"));
    let copied = 0;
    for (const file of svgFiles) {
      fs.copyFileSync(path.join(iconPackDir, file), path.join(pluginImgsDir, file));
      copied++;
    }
    console.log(`  ✓ Copied ${copied} SVGs to plugin imgs`);
  }

  // Step 2: Render SVGs to PNG and embed in profile manifests
  const profileDir = path.join(ROOT, "profile");
  if (!fs.existsSync(profileDir)) {
    console.log("  ⚠ No profile directory found, skipping profile embedding");
    return;
  }

  // Build a map of action-id → base64 PNG
  const iconMap = {};
  const svgFiles = fs.readdirSync(iconPackDir).filter((f) => f.endsWith(".svg"));
  for (const file of svgFiles) {
    const actionId = file.replace(".svg", "");
    const svgPath = path.join(iconPackDir, file);
    try {
      iconMap[actionId] = svgToPngBase64(svgPath);
    } catch (err) {
      console.error(`  ✗ Failed to render ${file}: ${err.message}`);
    }
  }
  console.log(`  ✓ Rendered ${Object.keys(iconMap).length} icons to PNG`);

  // Alias map for action UUIDs that don't match icon filenames
  const aliasMap = {
    "brake-bias-forward": "brake-bias-fwd",
    "brake-bias-backward": "brake-bias-bwd",
  };

  // Walk all profile manifests and embed images
  function processDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        processDir(fullPath);
      } else if (entry.name === "manifest.json") {
        embedIconsInManifest(fullPath);
      }
    }
  }

  function svgBase64ToPngBase64(svgDataUri) {
    // Convert a data:image/svg+xml;base64,... URI to data:image/png;base64,...
    const base64 = svgDataUri.split(",")[1];
    const svgData = Buffer.from(base64, "base64").toString("utf-8");
    const resvg = new Resvg(svgData, { fitTo: { mode: "width", value: 144 } });
    const pngBuffer = resvg.render().asPng();
    return `data:image/png;base64,${pngBuffer.toString("base64")}`;
  }

  function embedIconsInManifest(manifestPath) {
    const data = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
    const controllers = data.Controllers;
    if (!controllers || !controllers[0] || !controllers[0].Actions) return;

    let updated = 0;
    const actions = controllers[0].Actions;
    for (const [coord, action] of Object.entries(actions)) {
      const uuid = action.UUID || "";
      const state = action.States && action.States[0];
      if (!state) continue;

      // For folder/back nav: convert any SVG images to PNG
      if (uuid.includes("openchild") || uuid.includes("backtoparent")) {
        if (state.Image && state.Image.startsWith("data:image/svg")) {
          try {
            state.Image = svgBase64ToPngBase64(state.Image);
            updated++;
          } catch (err) {
            console.error(`  ✗ Failed to convert nav icon at ${coord}: ${err.message}`);
          }
        }
        continue;
      }

      // For plugin actions: embed icon from icon pack
      const parts = uuid.split(".");
      let actionId = parts[parts.length - 1];
      if (aliasMap[actionId]) actionId = aliasMap[actionId];

      const pngData = iconMap[actionId];
      if (pngData) {
        state.Image = pngData;
        state.ShowTitle = false;
        state.Title = "";
        updated++;
      }
    }

    if (updated > 0) {
      fs.writeFileSync(manifestPath, JSON.stringify(data, null, 2), "utf-8");
      console.log(`  ✓ Embedded ${updated} icons in ${path.relative(ROOT, manifestPath)}`);
    }
  }

  // Process all .sdProfile directories in profile/
  const profileEntries = fs.readdirSync(profileDir, { withFileTypes: true });
  for (const entry of profileEntries) {
    if (entry.isDirectory() && entry.name.endsWith(".sdProfile")) {
      processDir(path.join(profileDir, entry.name));
    }
  }

  // Step 3: Install everything to Stream Deck
  const sdBase = path.join(process.env.APPDATA, "Elgato", "StreamDeck");
  const sdPlugins = path.join(sdBase, "Plugins");
  const sdIcons = path.join(sdBase, "IconPacks");
  const sdProfiles = path.join(sdBase, "ProfilesV3");

  // Install plugin
  if (fs.existsSync(sdPlugins)) {
    const pluginSrc = path.join(ROOT, "plugin", pluginId);
    const pluginDest = path.join(sdPlugins, pluginId);
    if (fs.existsSync(pluginSrc)) {
      if (fs.existsSync(pluginDest)) fs.rmSync(pluginDest, { recursive: true });
      fs.cpSync(pluginSrc, pluginDest, { recursive: true });
      console.log(`  ✓ Installed plugin to Stream Deck`);
    }
  }

  // Install icon pack
  if (fs.existsSync(sdIcons)) {
    const iconSrc = path.join(ROOT, iconPackId);
    const iconDest = path.join(sdIcons, iconPackId);
    if (fs.existsSync(iconSrc)) {
      if (fs.existsSync(iconDest)) fs.rmSync(iconDest, { recursive: true });
      fs.cpSync(iconSrc, iconDest, { recursive: true });
      console.log(`  ✓ Installed icon pack to Stream Deck`);
    }
  }

  // Install profiles
  if (fs.existsSync(sdProfiles)) {
    for (const entry of profileEntries) {
      if (entry.isDirectory() && entry.name.endsWith(".sdProfile")) {
        const src = path.join(profileDir, entry.name);
        const dest = path.join(sdProfiles, entry.name);
        if (fs.existsSync(dest)) fs.rmSync(dest, { recursive: true });
        fs.cpSync(src, dest, { recursive: true });
        console.log(`  ✓ Installed ${entry.name} to Stream Deck`);
      }
    }
  }
}

// Main
const gameId = process.argv[2] || "lmu";
console.log(`[sync-icons] Syncing icons for ${gameId}...`);
syncIcons(gameId);
console.log("[sync-icons] Done.");
