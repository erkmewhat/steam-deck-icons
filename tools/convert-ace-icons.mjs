/**
 * Convert ACE SVG icons to 144x144 PNGs for the Stream Deck profile.
 * Generates unique image IDs and updates the profile page manifests.
 */

import sharp from 'sharp';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import crypto from 'crypto';

const ROOT = 'C:/Users/charc/claudeprojects/steam-deck-icons';
const ICONS_DIR = join(ROOT, 'com.simracing.ace-icons.sdIconPack/icons');
const PROFILE_DIR = join(ROOT, 'profile-ace/D7E4F2A8-91B3-4C6D-A5E7-8F2B1C3D4E5A.sdProfile');
const INSTALLED_DIR = 'C:/Users/charc/AppData/Roaming/Elgato/StreamDeck/ProfilesV3/D7E4F2A8-91B3-4C6D-A5E7-8F2B1C3D4E5A.sdProfile';
const IMAGES_SUBDIR = 'Profiles/Images';

// Map of (page UUID, coordinate) → icon SVG filename (without .svg)
const BUTTON_ICONS = {
  // Main page
  'B9C8D7E6-F5A4-4321-8765-1A2B3C4D5E6F': {
    '0,0': 'pit-limiter',
    '1,0': 'headlights',
    '2,0': 'headlight-flash',
    '3,0': 'rain-lights',
    '0,1': 'ignition',
    '1,1': 'starter',
    '2,1': 'wipers',
    '3,1': 'hazard-lights',
    '4,1': 'horn',
    '0,2': 'look-left',
    '1,2': 'look-behind',
    '2,2': 'look-right',
    '3,2': 'display-page',
    '4,2': 'display-device',
  },
  // Performance page
  'E3F4A5B6-C7D8-4E9F-0A1B-2C3D4E5F6A7B': {
    '0,0': 'brake-bias-fwd',
    '1,0': 'tc-increase',
    '2,0': 'abs-increase',
    '3,0': 'engine-map-up',
    '0,1': 'brake-bias-bwd',
    '1,1': 'tc-decrease',
    '2,1': 'abs-decrease',
    '3,1': 'engine-map-down',
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
