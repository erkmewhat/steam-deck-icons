"""
Icon design system for Stream Deck sim racing projects.

Generates branded SVG icons for a game based on:
1. Game config (tools/games/{game-id}.json)
2. Brand config (tools/brands/{game-id}.json)
3. Action definitions from the game config

Usage:
  python tools/design-icons.py --game ace
  python tools/design-icons.py --game ace --preview  (also renders PNGs for preview)

Brand config (tools/brands/{game-id}.json) defines:
  - Primary/secondary/accent colors
  - Background color
  - Border style
  - Icon style per category (increase=yellow, decrease=red, etc.)
  - Typography

If no brand config exists, the script will create a template.
"""

import argparse
import json
import os
import sys
import subprocess

sys.stdout.reconfigure(encoding="utf-8")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GAMES_DIR = os.path.join(ROOT, "tools", "games")
BRANDS_DIR = os.path.join(ROOT, "tools", "brands")

# ── Default icon templates by action type ──────────────────────────────

ICON_TEMPLATES = {
    # Car systems
    "headlights": {
        "symbol": "headlight",
        "desc": "Headlight housing with 3 beam lines",
    },
    "flash-lights": {
        "symbol": "headlight-flash",
        "desc": "Headlight with radiating flash burst",
    },
    "rain-lights": {
        "symbol": "rear-light",
        "desc": "Rear fog/rain light with wavy line through beams",
    },
    "wipers-up": {
        "symbol": "wiper-up",
        "desc": "Windshield wiper arc with up arrow",
    },
    "wipers-down": {
        "symbol": "wiper-down",
        "desc": "Windshield wiper arc with down arrow",
    },
    "ignition": {
        "symbol": "power",
        "desc": "Universal power/ignition symbol (circle + vertical line)",
    },
    "starter": {
        "symbol": "engine-start",
        "desc": "Circular START button with rotating arrow",
    },
    "pit-limiter": {
        "symbol": "speed-limit",
        "desc": "Speed limit circle with PIT text",
    },
    "horn": {
        "symbol": "horn",
        "desc": "Megaphone/horn shape with sound wave lines",
    },
    "drs": {
        "symbol": "wing",
        "desc": "Rear wing shape with DRS text",
    },
    "kers": {
        "symbol": "energy",
        "desc": "Lightning bolt inside circular arrow",
    },
    # Adjustments
    "tc-increase": {
        "symbol": "tc-up",
        "desc": "TC text in triangle with up arrow",
        "direction": "increase",
    },
    "tc-decrease": {
        "symbol": "tc-down",
        "desc": "TC text in triangle with down arrow",
        "direction": "decrease",
    },
    "abs-increase": {
        "symbol": "abs-up",
        "desc": "ABS text in circle with up arrow",
        "direction": "increase",
    },
    "abs-decrease": {
        "symbol": "abs-down",
        "desc": "ABS text in circle with down arrow",
        "direction": "decrease",
    },
    "bb-front": {
        "symbol": "brake-fwd",
        "desc": "Brake disc with forward arrow",
        "direction": "increase",
    },
    "bb-rear": {
        "symbol": "brake-rear",
        "desc": "Brake disc with backward arrow",
        "direction": "decrease",
    },
    "brake-bias-forward": {
        "symbol": "brake-fwd",
        "desc": "Brake disc with forward arrow",
        "direction": "increase",
    },
    "brake-bias-backward": {
        "symbol": "brake-rear",
        "desc": "Brake disc with backward arrow",
        "direction": "decrease",
    },
    "engine-map-up": {
        "symbol": "engine-up",
        "desc": "Engine block silhouette with up arrow",
        "direction": "increase",
    },
    "engine-map-down": {
        "symbol": "engine-down",
        "desc": "Engine block silhouette with down arrow",
        "direction": "decrease",
    },
    "motor-map-up": {
        "symbol": "engine-up",
        "desc": "Motor/engine with up arrow",
        "direction": "increase",
    },
    "motor-map-down": {
        "symbol": "engine-down",
        "desc": "Motor/engine with down arrow",
        "direction": "decrease",
    },
    # Camera/Look
    "glance-left": {
        "symbol": "eye-left",
        "desc": "Eye shape with left arrow",
    },
    "glance-right": {
        "symbol": "eye-right",
        "desc": "Eye shape with right arrow",
    },
    "look-left": {
        "symbol": "eye-left",
        "desc": "Eye shape with left arrow",
    },
    "look-right": {
        "symbol": "eye-right",
        "desc": "Eye shape with right arrow",
    },
    "look-behind": {
        "symbol": "rearview",
        "desc": "Rearview mirror with reflection",
    },
    # Race controls
    "ai-takeover": {
        "symbol": "ai-drive",
        "desc": "Steering wheel with AI text",
    },
    "pit-request": {
        "symbol": "pit-tools",
        "desc": "Crossed wrench and screwdriver in circle",
    },
    "request-pitstop": {
        "symbol": "pit-tools",
        "desc": "Crossed wrench and screwdriver in circle",
    },
    "restart-session": {
        "symbol": "restart",
        "desc": "Circular refresh/restart arrow",
    },
    "replay": {
        "symbol": "replay",
        "desc": "Rewind/play-backward icon",
    },
    "screenshot": {
        "symbol": "camera",
        "desc": "Camera icon with lens",
    },
    # MFD
    "mfd-next": {
        "symbol": "mfd-next",
        "desc": "Screen/display with forward arrow",
    },
    "mfd-up": {
        "symbol": "arrow-up",
        "desc": "Bold up arrow",
        "direction": "increase",
    },
    "mfd-down": {
        "symbol": "arrow-down",
        "desc": "Bold down arrow",
        "direction": "decrease",
    },
    "mfd-increase": {
        "symbol": "arrow-right",
        "desc": "Bold right arrow",
        "direction": "increase",
    },
    "mfd-decrease": {
        "symbol": "arrow-left",
        "desc": "Bold left arrow",
        "direction": "decrease",
    },
}


def create_brand_template(game_id, game_name):
    """Create a brand config template for a game."""
    template = {
        "_comment": f"Brand config for {game_name}. Customize colors and style.",
        "game_id": game_id,
        "game_name": game_name,
        "colors": {
            "primary": "#e20613",
            "secondary": "#fff300",
            "background": "#212529",
            "border": "#e20613",
            "text": "#ffffff",
            "text_label": "#ffffff",
            "increase": "#fff300",
            "decrease": "#e20613",
            "neutral": "#ffffff",
        },
        "style": {
            "border_width": 2,
            "border_inset": 4,
            "corner_radius": 12,
            "label_size": 10,
            "label_opacity": 0.8,
            "symbol_stroke_width": 3,
            "font": "Arial,Helvetica,sans-serif",
        },
        "research_notes": {
            "competitor_url": "",
            "brand_primary": "",
            "brand_secondary": "",
            "ui_style": "",
            "mood": "",
        },
    }
    return template


def get_icon_color(slug, brand, direction=None):
    """Determine icon accent color based on action type and brand."""
    colors = brand["colors"]
    template = ICON_TEMPLATES.get(slug, {})
    d = direction or template.get("direction")

    if d == "increase":
        return colors["increase"]
    elif d == "decrease":
        return colors["decrease"]
    else:
        return colors["neutral"]


def generate_icon_prompt(slug, brand, binding):
    """Generate a description for an agent to create an icon SVG."""
    colors = brand["colors"]
    style = brand["style"]
    template = ICON_TEMPLATES.get(slug, {})
    accent = get_icon_color(slug, brand)

    game_action = binding.get("game_action", slug)
    label = game_action.upper()
    if len(label) > 12:
        words = game_action.split()
        label = " ".join(w[:3].upper() + "." if len(w) > 4 else w.upper() for w in words[:2])

    desc = template.get("desc", f"Icon for {game_action}")

    return {
        "slug": slug,
        "label": label,
        "description": desc,
        "accent_color": accent,
        "template": f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 144 144" width="144" height="144">
  <rect x="{style['border_inset']}" y="{style['border_inset']}" width="{144-2*style['border_inset']}" height="{144-2*style['border_inset']}" rx="{style['corner_radius']}" fill="{colors['background']}" stroke="{colors['border']}" stroke-width="{style['border_width']}"/>
  <!-- {desc} -->
  <!-- Use accent color: {accent} for main symbol -->
  <!-- Use white for secondary elements -->
  <text x="72" y="130" text-anchor="middle" font-family="{style['font']}" font-size="{style['label_size']}" font-weight="bold" fill="{colors['text_label']}" opacity="{style['label_opacity']}">{label}</text>
</svg>""",
    }


def generate_agent_prompt(game_id, brand, game_config, category, slugs):
    """Generate a complete prompt for an agent to create icons for a category."""
    colors = brand["colors"]
    style = brand["style"]
    game_name = game_config["name"]
    plugin_id = game_config["plugin_id"]
    icons_dir = os.path.join(ROOT, "plugin", plugin_id, "imgs", "actions")

    icon_specs = []
    for slug in slugs:
        binding = game_config.get("bindings", {}).get(slug, {})
        info = generate_icon_prompt(slug, brand, binding)
        icon_specs.append(info)

    specs_text = ""
    for i, spec in enumerate(icon_specs, 1):
        specs_text += f"""
{i}. `{icons_dir}/{spec['slug']}.svg`
   - Symbol: {spec['description']}
   - Accent color: {spec['accent_color']}
   - Label: "{spec['label']}"
"""

    return f"""Create SVG icon files for the {game_name} Stream Deck plugin — {category} category ({len(slugs)} icons).

**Design spec:**
- Canvas: 144x144, viewBox="0 0 144 144"
- Background: `{colors['background']}` with rx="{style['corner_radius']}" rounded corners
- Border: {style['border_width']}px stroke of `{colors['border']}`, inset by {style['border_inset']}px (rect at x={style['border_inset']} y={style['border_inset']} width={144-2*style['border_inset']} height={144-2*style['border_inset']})
- Increase actions: Use `{colors['increase']}` for symbol/accents
- Decrease actions: Use `{colors['decrease']}` for symbol/accents
- Neutral actions: White `{colors['neutral']}` symbols with `{colors['primary']}` accents
- Labels: {style['label_size']}px, `{colors['text_label']}`, opacity {style['label_opacity']}, font-family="{style['font']}", font-weight="bold"
- Style: Clean automotive dashboard icons — recognizable shapes, NOT text abbreviations
- NO trailing newline after </svg>

**Template:**
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 144 144" width="144" height="144">
  <rect x="{style['border_inset']}" y="{style['border_inset']}" width="{144-2*style['border_inset']}" height="{144-2*style['border_inset']}" rx="{style['corner_radius']}" fill="{colors['background']}" stroke="{colors['border']}" stroke-width="{style['border_width']}"/>
  <!-- icon shapes here -->
  <text x="72" y="130" text-anchor="middle" font-family="{style['font']}" font-size="{style['label_size']}" font-weight="bold" fill="{colors['text_label']}" opacity="{style['label_opacity']}">LABEL</text>
</svg>
```

**Icons to create:**
{specs_text}
Read each file path before writing. Write all {len(slugs)} files."""


def main():
    parser = argparse.ArgumentParser(description="Design icons for a Stream Deck game")
    parser.add_argument("--game", type=str, required=True, help="Game ID")
    parser.add_argument("--preview", action="store_true", help="Also render PNG previews")
    parser.add_argument("--prompts-only", action="store_true",
                        help="Only print agent prompts, don't create files")
    args = parser.parse_args()

    game_id = args.game
    os.makedirs(BRANDS_DIR, exist_ok=True)

    # Load game config
    game_config_path = os.path.join(GAMES_DIR, f"{game_id}.json")
    if not os.path.isfile(game_config_path):
        print(f"ERROR: No game config at {game_config_path}")
        sys.exit(1)
    with open(game_config_path, encoding="utf-8") as f:
        game_config = json.load(f)

    # Load or create brand config
    brand_path = os.path.join(BRANDS_DIR, f"{game_id}.json")
    if os.path.isfile(brand_path):
        with open(brand_path, encoding="utf-8") as f:
            brand = json.load(f)
        print(f"Loaded brand config: {brand_path}")
    else:
        brand = create_brand_template(game_id, game_config["name"])
        with open(brand_path, "w", encoding="utf-8") as f:
            json.dump(brand, f, indent=4, ensure_ascii=False)
        print(f"Created brand template: {brand_path}")
        print("  → Customize colors in this file, then re-run.")
        if not args.prompts_only:
            sys.exit(0)

    # Group actions by category
    categories = game_config.get("categories", {})
    if not categories:
        # Fallback: all actions in one category
        categories = {"All Actions": list(game_config.get("bindings", {}).keys())}

    print(f"\nGame: {game_config['name']}")
    print(f"Brand: bg={brand['colors']['background']} primary={brand['colors']['primary']} "
          f"secondary={brand['colors']['secondary']}")
    print(f"Categories: {len(categories)}")

    for cat_name, slugs in categories.items():
        prompt = generate_agent_prompt(game_id, brand, game_config, cat_name, slugs)

        if args.prompts_only:
            print(f"\n{'='*60}")
            print(f"AGENT PROMPT: {cat_name} ({len(slugs)} icons)")
            print(f"{'='*60}")
            print(prompt)
        else:
            print(f"\n  {cat_name}: {len(slugs)} icons")
            for slug in slugs:
                info = generate_icon_prompt(slug, brand,
                    game_config.get("bindings", {}).get(slug, {}))
                print(f"    {slug}: {info['accent_color']} — {info['description']}")

    total = sum(len(s) for s in categories.values())
    print(f"\nTotal: {total} icons across {len(categories)} categories")

    if args.prompts_only:
        print("\n  Use these prompts with the Agent tool to create all icons.")
        print("  Then run: bash tools/deploy.sh " + game_id)


if __name__ == "__main__":
    main()
