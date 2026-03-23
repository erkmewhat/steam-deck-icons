"""
Generate an HTML preview page for a game's Stream Deck icons.
Opens in browser for visual review before deploying.

Usage: python tools/preview-icons.py --game ace
"""

import argparse
import json
import os
import sys
import webbrowser

sys.stdout.reconfigure(encoding="utf-8")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def main():
    parser = argparse.ArgumentParser(description="Preview Stream Deck icons")
    parser.add_argument("--game", type=str, required=True)
    parser.add_argument("--open", action="store_true", help="Auto-open in browser")
    args = parser.parse_args()

    config_path = os.path.join(ROOT, "tools", "games", f"{args.game}.json")
    with open(config_path, encoding="utf-8") as f:
        config = json.load(f)

    brand_path = os.path.join(ROOT, "tools", "brands", f"{args.game}.json")
    brand = {}
    if os.path.isfile(brand_path):
        with open(brand_path, encoding="utf-8") as f:
            brand = json.load(f)

    primary = brand.get("colors", {}).get("primary", "#e20613")
    plugin_id = config["plugin_id"]
    icons_dir = os.path.join("plugin", plugin_id, "imgs", "actions")
    game_name = config["name"]

    categories = config.get("categories", {})
    if not categories:
        categories = {"All Actions": list(config.get("bindings", {}).keys())}

    sections_html = ""
    for cat_name, slugs in categories.items():
        cards = ""
        for slug in slugs:
            binding = config.get("bindings", {}).get(slug, {})
            label = binding.get("game_action", slug)
            svg_path = f"{icons_dir}/{slug}.svg"
            cards += f'''  <div class="icon-card">
    <img src="{svg_path}" alt="{label}">
    <div class="label">{label}</div>
  </div>\n'''

        sections_html += f'''<div class="section-title">{cat_name}</div>
<div class="grid">
{cards}</div>\n\n'''

    html = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>{game_name} Icon Preview</title>
<style>
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  body {{
    background: #0a0a0a;
    color: #fff;
    font-family: 'Segoe UI', Arial, sans-serif;
    padding: 40px;
  }}
  h1 {{
    text-align: center;
    font-size: 28px;
    font-weight: 300;
    letter-spacing: 4px;
    margin-bottom: 8px;
    color: {primary};
    text-transform: uppercase;
  }}
  h2 {{
    text-align: center;
    font-size: 13px;
    font-weight: 400;
    letter-spacing: 2px;
    color: #666;
    margin-bottom: 40px;
    text-transform: uppercase;
  }}
  .section-title {{
    font-size: 12px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: #555;
    margin: 36px 0 16px 0;
    padding-bottom: 8px;
    border-bottom: 1px solid #1a1a1a;
  }}
  .grid {{
    display: grid;
    grid-template-columns: repeat(auto-fill, 110px);
    gap: 20px;
    justify-content: center;
  }}
  .icon-card {{
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }}
  .icon-card img {{
    width: 88px;
    height: 88px;
    border-radius: 10px;
    border: 1px solid #222;
    transition: transform 0.15s, border-color 0.15s, box-shadow 0.15s;
  }}
  .icon-card img:hover {{
    transform: scale(1.2);
    border-color: {primary};
    box-shadow: 0 0 16px {primary}44;
  }}
  .icon-card .label {{
    font-size: 9px;
    color: #555;
    text-align: center;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    max-width: 100px;
    line-height: 1.3;
  }}
  .stats {{
    text-align: center;
    margin-bottom: 30px;
    font-size: 11px;
    color: #444;
    letter-spacing: 1px;
  }}
</style>
</head>
<body>

<h1>{game_name}</h1>
<h2>Stream Deck Icon Pack Preview</h2>
<div class="stats">{sum(len(s) for s in categories.values())} icons &middot; {len(categories)} categories</div>

{sections_html}
</body>
</html>'''

    output_path = os.path.join(ROOT, f"preview-{args.game}.html")
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html)

    print(f"Preview generated: {output_path}")

    if args.open:
        webbrowser.open(f"file:///{output_path.replace(os.sep, '/')}")
        print("Opened in browser")


if __name__ == "__main__":
    main()
