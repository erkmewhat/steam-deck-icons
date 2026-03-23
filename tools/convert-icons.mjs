/**
 * Convert SVG icons to 144x144 PNGs for the Stream Deck profile.
 * Generates unique image IDs and updates the profile page manifests.
 */

import sharp from 'sharp';
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'fs';
import { join, basename } from 'path';
import crypto from 'crypto';

const ROOT = 'C:/Users/charc/claudeprojects/steam-deck-icons';
const ICONS_DIR = join(ROOT, 'com.simracing.lmu-icons.sdIconPack/icons');
const PROFILE_DIR = join(ROOT, 'profile/EBAAB49C-EFF9-4A7F-9C43-FFCE95C09427.sdProfile');
const INSTALLED_DIR = 'C:/Users/charc/AppData/Roaming/Elgato/StreamDeck/ProfilesV3/EBAAB49C-EFF9-4A7F-9C43-FFCE95C09427.sdProfile';
const IMAGES_SUBDIR = 'Profiles/Images';

// Map of (page, coordinate) → icon SVG filename (without .svg)
const BUTTON_ICONS = {
  // Main page
  'C8B1A5B1-C375-469C-B4C1-7BA9B2426CB1': {
    '0,0': 'pit-limiter',
    '1,0': 'headlights',
    '2,0': 'headlight-flash',
    '3,0': 'wipers',
    '0,1': 'ignition',
    '1,1': 'starter',
    '2,1': 'request-pitstop',
    '3,1': 'ai-takeover',
    '0,2': 'look-left',
    '1,2': 'look-behind',
    '2,2': 'look-right',
  },
  // MFD page
  'C68F250F-93F5-41F9-B888-D9DD28D9DF3E': {
    '2,0': 'mfd-up',
    '1,1': 'mfd-decrease',
    '2,1': 'mfd-next',
    '3,1': 'mfd-increase',
    '2,2': 'mfd-down',
  },
  // Performance page
  '3AA706B4-3603-4898-B84A-E320A619C8F7': {
    '0,0': 'brake-bias-fwd',
    '1,0': 'tc-increase',
    '2,0': 'abs-increase',
    '3,0': 'motor-map-up',
    '0,1': 'brake-bias-bwd',
    '1,1': 'tc-decrease',
    '2,1': 'abs-decrease',
    '3,1': 'motor-map-down',
  },
};

async function main() {
  // Create Images directory in both profile and installed locations
  for (const base of [PROFILE_DIR, INSTALLED_DIR]) {
    mkdirSync(join(base, IMAGES_SUBDIR), { recursive: true });
  }

  // Build a map: icon name → generated image ID
  const iconToImageId = {};

  // Get all unique icon names
  const allIcons = new Set();
  for (const page of Object.values(BUTTON_ICONS)) {
    for (const icon of Object.values(page)) {
      allIcons.add(icon);
    }
  }

  // Convert each SVG to PNG
  for (const iconName of allIcons) {
    const svgPath = join(ICONS_DIR, `${iconName}.svg`);
    const imageId = crypto.randomBytes(13).toString('hex').toUpperCase().slice(0, 26) + 'Z';
    iconToImageId[iconName] = imageId;

    const pngFilename = `${imageId}.png`;

    for (const base of [PROFILE_DIR, INSTALLED_DIR]) {
      const outPath = join(base, IMAGES_SUBDIR, pngFilename);
      await sharp(svgPath)
        .resize(144, 144)
        .png()
        .toFile(outPath);
    }

    console.log(`  ${iconName} → ${pngFilename}`);
  }

  // Update page manifests to reference the PNG images
  for (const [pageUuid, buttons] of Object.entries(BUTTON_ICONS)) {
    for (const base of [PROFILE_DIR, INSTALLED_DIR]) {
      const manifestPath = join(base, 'Profiles', pageUuid, 'manifest.json');
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      const actions = manifest.Controllers[0].Actions;

      for (const [coord, iconName] of Object.entries(buttons)) {
        if (actions[coord]) {
          const imageId = iconToImageId[iconName];
          actions[coord].States[0].Image = `Images/${imageId}.png`;
        }
      }

      writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    }

    console.log(`  Updated page ${pageUuid}`);
  }

  console.log(`\nDone! ${allIcons.size} icons converted and embedded.`);
  console.log('Restart Stream Deck to see the icons.');
}

main().catch(console.error);
