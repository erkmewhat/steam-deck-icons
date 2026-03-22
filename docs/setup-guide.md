# LMU Sim Racing - Stream Deck Setup Guide

## Overview

This project provides a **Stream Deck Icon Pack** and **Stream Deck Plugin** for [Le Mans Ultimate](https://www.lemansultimate.com/) sim racing. It gives you one-tap access to car controls, MFD navigation, performance adjustments, and camera views.

## What's Included

### Icon Pack (`com.simracing.lmu-icons.sdIconPack`)

24 custom icons organized into categories:

**Car Systems:** Pit Limiter, Headlights, Headlight Flash, Wipers, Ignition, Starter, Request Pit Stop, AI Takeover

**MFD Navigation:** Next Page, Up, Down, Increase, Decrease

**Performance:** Brake Bias Fwd/Bwd, TC Increase/Decrease, ABS Increase/Decrease, Motor Map Up/Down

**Camera:** Look Left, Look Right, Look Behind

### Plugin (`com.simracing.lmu`)

A Stream Deck plugin with 24 hotkey actions that send keyboard shortcuts to LMU when pressed.

---

## Installation

### Icon Pack

1. Copy the `com.simracing.lmu-icons.sdIconPack` folder to:
   ```
   %appdata%\Elgato\StreamDeck\Plugins\com.elgato.StreamDeck\Icons\
   ```
2. Restart Stream Deck software
3. Icons will appear in the icon picker when customizing any key

### Plugin

1. Run `npm install` in the `plugin/` directory
2. Run `npm run build` to compile TypeScript
3. Copy `plugin/com.simracing.lmu.sdPlugin` to:
   ```
   %appdata%\Elgato\StreamDeck\Plugins\
   ```
4. Restart Stream Deck software
5. Actions will appear under the **LMU Sim Racing** category

---

## LMU Keybinding Reference

### Default Keybindings (already mapped in LMU)

| Action | Default Key | Stream Deck Action |
|--------|------------|-------------------|
| Pit Limiter | `L` | Pit Limiter |
| Headlights | `H` | Headlights |
| Wipers | `'` | Wipers |
| Ignition | `;` | Ignition |
| Request Pit Stop | `E` | Request Pit Stop |
| AI Takeover | `I` | AI Takeover |
| MFD Next Page | `Enter` | MFD Next Page |
| MFD Up | `Up Arrow` | MFD Up |
| MFD Down | `Down Arrow` | MFD Down |
| MFD Increase | `Right Arrow` | MFD Increase |
| MFD Decrease | `Left Arrow` | MFD Decrease |
| Look Left | `S` | Look Left |
| Look Right | `D` | Look Right |
| Look Behind | `B` | Look Behind |

### Keybindings You Need to Map in LMU

These controls have **no default binding** in LMU. You must assign them in LMU's settings before using the Stream Deck actions.

1. Open LMU → **Settings** → **Controls** → **Keyboard**
2. Assign each of the following to a key of your choice:

| Action | Suggested Key | Notes |
|--------|--------------|-------|
| Headlight Flash | `Shift+H` | Flash to signal other drivers |
| Starter | `Shift+;` | Manual engine restart after pit stops |
| Brake Bias Forward | `Numpad +` | Shift bias to front wheels |
| Brake Bias Backward | `Numpad -` | Shift bias to rear wheels |
| TC Increase | `Numpad *` | More traction control intervention |
| TC Decrease | `Numpad /` | Less traction control intervention |
| ABS Increase | `Ctrl+Numpad +` | More ABS intervention (GT3) |
| ABS Decrease | `Ctrl+Numpad -` | Less ABS intervention (GT3) |
| Motor Map Up | `Shift+Numpad +` | More hybrid deploy (Hypercar) |
| Motor Map Down | `Shift+Numpad -` | Less hybrid deploy (Hypercar) |

3. After mapping in LMU, update the plugin's hotkey settings in the Stream Deck property inspector to match.

---

## Recommended Stream Deck Layouts

### Endurance Racing (15-key layout)

```
┌─────────┬─────────┬─────────┬─────────┬─────────┐
│  Pit    │ Head-   │ Wipers  │ Ignition│ Starter │
│ Limiter │ lights  │         │         │         │
├─────────┼─────────┼─────────┼─────────┼─────────┤
│  MFD    │ MFD Up  │ MFD     │ MFD     │   AI    │
│  Next   │         │  Down   │  Inc    │Takeover │
├─────────┼─────────┼─────────┼─────────┼─────────┤
│ Brake   │ Brake   │   TC    │   TC    │ Request │
│Bias Fwd │Bias Bwd │   Up    │  Down   │ Pit Stop│
└─────────┴─────────┴─────────┴─────────┴─────────┘
```

### Sprint Racing (compact 8-key)

```
┌─────────┬─────────┬─────────┬─────────┐
│  Pit    │   TC    │   TC    │ Brake   │
│ Limiter │   Up    │  Down   │Bias Fwd │
├─────────┼─────────┼─────────┼─────────┤
│  MFD    │  MFD    │  MFD    │ Request │
│  Next   │  Inc    │  Dec    │ Pit Stop│
└─────────┴─────────┴─────────┴─────────┘
```

### Hypercar-Specific Row

```
┌─────────┬─────────┬─────────┬─────────┬─────────┐
│ Motor   │ Motor   │ Brake   │ Brake   │  Head-  │
│ Map Up  │Map Down │Bias Fwd │Bias Bwd │ lights  │
└─────────┴─────────┴─────────┴─────────┴─────────┘
```

---

## Class-Specific Tips

### Hypercar (Toyota GR010, Porsche 963, Ferrari 499P, etc.)
- **Motor Map** is your most-used adjustment — controls hybrid deployment strategy
- Brake bias typically runs 55-60% front
- Headlights and wipers are critical for 24h races

### LMGT3 (BMW M4, Corvette Z06, Porsche 911, etc.)
- **ABS** adjustment is key — find the threshold for each track
- TC keeps you out of the gravel on corner exits
- No motor map needed (combustion only)

### LMP2 (Oreca 07)
- Focus on **Brake Bias** — this is your primary handling adjustment
- Less electronics to manage than Hypercar/GT3
- Starter is important after pit stops

---

## Troubleshooting

**Keys not working in LMU?**
- Make sure LMU is the focused/active window
- Verify keybindings are set in LMU's control settings
- Check that the Stream Deck plugin hotkey matches the LMU binding

**Icons not showing?**
- Verify the icon pack folder is in the correct location
- Restart Stream Deck software after installing

**Plugin not appearing?**
- Make sure Node.js 20+ is installed
- Run `npm install && npm run build` in the `plugin/` directory
- Check `plugin/com.simracing.lmu.sdPlugin/logs/` for error messages
