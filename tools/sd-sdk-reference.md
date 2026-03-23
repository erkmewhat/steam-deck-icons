# Elgato Stream Deck SDK — Comprehensive Technical Reference

> Compiled from https://docs.elgato.com/streamdeck/sdk and all subpages.
> Last updated: 2026-03-23

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Plugin Structure](#2-plugin-structure)
3. [Manifest Reference (manifest.json)](#3-manifest-reference)
4. [Actions](#4-actions)
5. [Keys (Keypad)](#5-keys-keypad)
6. [Dials & Encoders](#6-dials--encoders)
7. [Touch Strip Layouts](#7-touch-strip-layouts)
8. [WebSocket API — Events Received (SD → Plugin)](#8-websocket-api--events-received-sd--plugin)
9. [WebSocket API — Commands Sent (Plugin → SD)](#9-websocket-api--commands-sent-plugin--sd)
10. [Settings](#10-settings)
11. [Property Inspector (UI)](#11-property-inspector-ui)
12. [Profiles](#12-profiles)
13. [Icon Packs](#13-icon-packs)
14. [Images & Visual Assets](#14-images--visual-assets)
15. [Devices](#15-devices)
16. [Application Monitoring](#16-application-monitoring)
17. [Deep Linking](#17-deep-linking)
18. [Internationalization (i18n)](#18-internationalization-i18n)
19. [Logging](#19-logging)
20. [Resources (Embedded Files)](#20-resources-embedded-files)
21. [Plugin Environment & Runtime](#21-plugin-environment--runtime)
22. [Gotchas & Limitations](#22-gotchas--limitations)

---

## 1. Architecture Overview

### Communication Model
- Plugin connects to Stream Deck app via **WebSocket** on a port provided at launch
- Two execution contexts: **Backend** (Node.js) for event processing, **Frontend** (Chromium) for property inspector UI
- Plugin lifecycle is managed by Stream Deck with **automatic failure recovery**

### System Requirements
- **Node.js**: v20+ (managed by SD, not user-installed)
- **Stream Deck App**: v6.9+ (v7.0+ for newer features)
- **SDK Version**: 2 or 3 (3 recommended)

### Plugin Identification
- **UUID format**: Reverse-DNS, e.g. `com.simracing.lmu`
- **Allowed characters**: lowercase `a-z`, `0-9`, hyphens `-`, periods `.`
- **UUIDs are permanent** — cannot change after Marketplace publication

---

## 2. Plugin Structure

```
project-root/
├── src/                          # TypeScript source
│   ├── plugin.ts                 # Entry point
│   └── actions/                  # Action classes
├── com.example.myplugin.sdPlugin/  # Compiled plugin artifact
│   ├── manifest.json             # Plugin metadata (REQUIRED)
│   ├── bin/                      # Compiled JS output
│   ├── imgs/                     # Plugin images
│   │   └── actions/              # Action images
│   ├── ui/                       # Property inspector HTML
│   ├── logs/                     # Log files
│   └── *.streamDeckProfile       # Bundled profiles (optional)
├── package.json
├── rollup.config.mjs
└── tsconfig.json
```

### Build Commands
```bash
npm run build    # TypeScript compile
npm run watch    # Auto-rebuild + restart in SD
```

---

## 3. Manifest Reference

### Complete Top-Level Schema

```json
{
  "$schema": "https://schemas.elgato.com/streamdeck/plugins/manifest.json",
  "Author": "string (REQUIRED)",
  "Name": "string (REQUIRED)",
  "Description": "string (REQUIRED)",
  "Icon": "string (REQUIRED, no extension, 256x256 + 512x512 @2x PNG)",
  "UUID": "string (REQUIRED, reverse-DNS)",
  "Version": "string (REQUIRED, format: major.minor.patch.build, e.g. 1.0.0.0)",
  "CodePath": "string (REQUIRED, with extension, e.g. bin/plugin.js)",
  "SDKVersion": 2,
  "Software": {
    "MinimumVersion": "6.4|6.5|6.6|6.7|6.8|6.9|7.0|7.1|7.2|7.3"
  },
  "OS": [
    {
      "Platform": "mac|windows",
      "MinimumVersion": "string (e.g. '10', '13')"
    }
  ],
  "Nodejs": {
    "Version": "20|24",
    "Debug": "enabled|break|string (optional)",
    "GenerateProfilerOutput": false
  },
  "Actions": [],
  "Category": "string (optional, defaults to 'Custom')",
  "CategoryIcon": "string (optional, no extension, 28x28 + 56x56 @2x)",
  "CodePathMac": "string (optional, platform override)",
  "CodePathWin": "string (optional, platform override)",
  "DefaultWindowSize": [500, 650],
  "PropertyInspectorPath": "string (optional, .htm/.html, plugin-wide default)",
  "ApplicationsToMonitor": {
    "mac": ["com.app.bundleid"],
    "windows": ["App.exe"]
  },
  "Profiles": [],
  "SupportURL": "string (optional, URL)",
  "URL": "string (optional, URL)"
}
```

### Action Object

```json
{
  "UUID": "string (REQUIRED, reverse-DNS, prefixed with plugin UUID)",
  "Name": "string (REQUIRED, ~30 chars max)",
  "Icon": "string (REQUIRED, no extension, 20x20 + 40x40 @2x)",
  "States": [
    {
      "Image": "string (REQUIRED, no extension, 72x72 + 144x144 @2x)",
      "Title": "string (optional)",
      "Name": "string (optional, shown in multi-action state picker)",
      "ShowTitle": true,
      "TitleAlignment": "top|middle|bottom",
      "TitleColor": "#FFFFFF",
      "FontFamily": "string",
      "FontSize": 16,
      "FontStyle": "|Regular|Bold|Italic|Bold Italic",
      "FontUnderline": false,
      "MultiActionImage": "string (optional, no extension, 72x72 + 144x144 @2x)"
    }
  ],
  "Controllers": ["Keypad", "Encoder"],
  "Encoder": {
    "layout": "$X1|$A0|$A1|$B1|$B2|$C1|custom-file.json",
    "background": "string (optional, no extension, 200x100 + 400x200 @2x)",
    "Icon": "string (optional, no extension, 72x72 + 144x144 @2x)",
    "StackColor": "#D60270",
    "TriggerDescription": {
      "Push": "string",
      "Rotate": "string",
      "Touch": "string",
      "LongTouch": "string"
    }
  },
  "DisableAutomaticStates": false,
  "DisableCaching": false,
  "OS": ["mac", "windows"],
  "PropertyInspectorPath": "string (optional, .htm/.html)",
  "SupportedInMultiActions": true,
  "SupportedInKeyLogicActions": true,
  "SupportURL": "string (optional, URL)",
  "Tooltip": "string (optional)",
  "UserTitleEnabled": true,
  "VisibleInActionsList": true
}
```

### Profile Object (in manifest)

```json
{
  "Name": "string (REQUIRED, no extension, references .streamDeckProfile file)",
  "DeviceType": 0,
  "DontAutoSwitchWhenInstalled": false,
  "AutoInstall": true,
  "Readonly": false
}
```

### Version Format
- **Pattern**: `{major}.{minor}.{patch}.{build}` — e.g. `1.0.0.0`
- All four segments required

### Image Path Rules
| Field | Extension | Format |
|-------|-----------|--------|
| Icon, CategoryIcon, State Image, Encoder background/Icon | **Omitted** | PNG or SVG, provide standard + @2x |
| CodePath, PropertyInspectorPath | **Required** | `.js`, `.htm`, `.html` |

---

## 4. Actions

### Registration
Actions need **two-part registration**: metadata in manifest + implementation class.

```typescript
import streamDeck, { action, KeyDownEvent, SingletonAction } from "@elgato/streamdeck";

@action({ UUID: "com.example.plugin.my-action" })
export class MyAction extends SingletonAction {
  override onKeyDown(ev: KeyDownEvent): void | Promise<void> {
    // handle key press
  }
}

// In plugin.ts entry point:
streamDeck.actions.registerAction(new MyAction());
streamDeck.connect();
```

### Action Lifecycle Events
| Event | When |
|-------|------|
| `onWillAppear` | Action becomes visible (navigate to page/profile) |
| `onWillDisappear` | Action becomes hidden |
| `onKeyDown` | Key pressed |
| `onKeyUp` | Key released |
| `onDialDown` | Dial pressed (SD+) |
| `onDialUp` | Dial released (SD+) |
| `onDialRotate` | Dial rotated (SD+) |
| `onTouchTap` | Touchscreen tapped (SD+) |
| `onDidReceiveSettings` | Settings changed by PI or getSettings response |
| `onTitleParametersDidChange` | User changed title in SD app |
| `onPropertyInspectorDidAppear` | PI opened |
| `onPropertyInspectorDidDisappear` | PI closed |
| `onSendToPlugin` | PI sent message |
| `onDidReceiveResources` | Resources updated (SD 7.1+) |

### Action Instance Methods
```typescript
// Queries
action.isDial(): boolean
action.isKey(): boolean
action.getSettings<T>(): Promise<T>
action.getResources(): Promise<Resources>  // SD 7.1+

// Mutations
action.setSettings<T>(settings: T): Promise<void>
action.setResources(resources: Resources): Promise<void>  // SD 7.1+
action.setImage(image?: string, options?: ImageOptions): Promise<void>
action.setTitle(title?: string, options?: TitleOptions): Promise<void>
action.setState(state: number): Promise<void>
action.showOk(): Promise<void>
action.showAlert(): Promise<void>
```

### Iterating Visible Actions
```typescript
// All visible actions across plugin
streamDeck.actions.forEach((action) => { action.setTitle("Hello"); });

// Visible actions of specific type (from within a SingletonAction)
this.actions.forEach((action) => { action.setTitle("Hello"); });
```

### Multi-State Actions
- Up to **2 states** (index 0 and 1)
- By default, state toggles automatically on keypress
- Set `DisableAutomaticStates: true` in manifest to control manually
- In multi-actions, `ev.payload.userDesiredState` gives the user-selected state

### Display Precedence (highest to lowest)
1. User-defined titles/images (set in SD app)
2. Runtime-set titles/images (setTitle/setImage)
3. Manifest defaults

---

## 5. Keys (Keypad)

### Events
- `onKeyDown(ev: KeyDownEvent)` — user presses key
- `onKeyUp(ev: KeyUpEvent)` — user releases key

### setImage

```typescript
// From SVG (URL-encoded)
action.setImage(`data:image/svg+xml,${encodeURIComponent(svgString)}`);

// From base64 data URI
action.setImage("data:image/png;base64,iVBORw0KGgo...");

// From file path (relative to plugin dir)
action.setImage("imgs/actions/counter/key.png");

// With options
action.setImage("path/to/image.png", {
  target: Target.HardwareAndSoftware,  // or Hardware, Software
  state: 0  // for multi-state: 0 or 1
});

// Reset to manifest default
action.setImage(undefined);
```

**Supported MIME types**: `image/svg+xml`, `image/png`, `image/jpeg`, `image/webp`
**NOT supported**: Animated GIF (static GIF ok), animated formats

**Key constraint**: `setImage` only works when user has NOT set a custom image.

### setTitle

```typescript
action.setTitle("Hello world!");
action.setTitle("Hello", { state: 0, target: Target.Hardware });
action.setTitle(undefined); // reset to manifest default
```

### setState

```typescript
action.setState(0); // or 1
```

### showOk / showAlert

```typescript
action.showOk();     // green checkmark overlay
action.showAlert();  // yellow warning triangle overlay
```

---

## 6. Dials & Encoders

### Events
| Event | Payload Key Fields |
|-------|-------------------|
| `onDialDown` | controller, coordinates, settings |
| `onDialUp` | controller, coordinates, settings |
| `onDialRotate` | controller, coordinates, settings, `pressed` (bool), `ticks` (+clockwise, -counter) |
| `onTouchTap` | controller, coordinates, settings, `hold` (bool), `tapPos` ([x, y]) |

### Built-in Layouts

| ID | Description |
|----|-------------|
| `$X1` | Title + centered icon |
| `$A0` | Title + full-width image canvas |
| `$A1` | Title, icon, value text |
| `$B1` | Title, icon, value, progress bar |
| `$B2` | Title, icon, value, gradient bar |
| `$C1` | Title, two icon/progress-bar pairs |

### Manifest Encoder Config

```json
"Encoder": {
  "layout": "$B1",
  "background": "imgs/encoder-bg",
  "Icon": "imgs/encoder-icon",
  "StackColor": "#D60270",
  "TriggerDescription": {
    "Push": "Play / Pause",
    "Rotate": "Volume",
    "Touch": "Mute",
    "LongTouch": "Settings"
  }
}
```

### Feedback API

```typescript
// Change layout at runtime
action.setFeedbackLayout("$A1");
action.setFeedbackLayout("my-custom-layout.json");

// Update layout item values by key
action.setFeedback({
  title: "Volume",          // text item with key "title"
  value: "75%",             // text item with key "value"
  indicator: { value: 75 }  // bar item with key "indicator"
});

// Update trigger descriptions
action.setTriggerDescription({
  push: "Toggle Mute",
  rotate: "Adjust Volume"
});
```

---

## 7. Touch Strip Layouts

### Canvas Size
**200 x 100 pixels** — each dial's touchscreen area.

### Custom Layout JSON

```json
{
  "$schema": "https://schemas.elgato.com/streamdeck/plugins/layout.json",
  "id": "my-custom-layout",
  "items": [
    {
      "key": "title",
      "type": "text",
      "rect": [0, 0, 200, 30],
      "value": "Title",
      "alignment": "center",
      "color": "#FFFFFF",
      "font": { "size": 16, "weight": 600 }
    },
    {
      "key": "icon",
      "type": "pixmap",
      "rect": [10, 35, 50, 50],
      "value": "imgs/icon.png"
    },
    {
      "key": "indicator",
      "type": "bar",
      "rect": [70, 50, 120, 20],
      "value": 50,
      "range": { "min": 0, "max": 100 },
      "bar_fill_c": "#FFFFFF",
      "bar_bg_c": "#333333"
    }
  ]
}
```

### Layout Item Types

#### Text
```json
{
  "type": "text",
  "key": "identifier",
  "rect": [x, y, width, height],
  "value": "string",
  "alignment": "center|left|right",
  "color": "#FFFFFF|named-color",
  "font": { "size": 16, "weight": 400 },
  "text-overflow": "clip|ellipsis|fade",
  "background": "#000000|gradient",
  "opacity": 0.0-1.0,
  "enabled": true,
  "zOrder": 0
}
```

#### Bar
```json
{
  "type": "bar",
  "key": "identifier",
  "rect": [x, y, width, height],
  "value": 50,
  "range": { "min": 0, "max": 100 },
  "bar_bg_c": "darkGray",
  "bar_fill_c": "white",
  "bar_border_c": "white",
  "border_w": 2,
  "subtype": 0,
  "background": "#000000",
  "opacity": 1.0,
  "enabled": true,
  "zOrder": 0
}
```

Bar subtypes: 0=Rectangle, 1=DoubleRectangle, 2=Trapezoid, 3=DoubleTrapezoid, 4=Groove

#### GBar (Gradient Bar with indicator)
Same as Bar, plus: `"bar_h": 10` (indicator height)

#### Pixmap (Image)
```json
{
  "type": "pixmap",
  "key": "identifier",
  "rect": [x, y, width, height],
  "value": "path/to/image.png|data:image/png;base64,...|<svg>...</svg>",
  "background": "#000000",
  "opacity": 1.0,
  "enabled": true,
  "zOrder": 0
}
```

### Color Formats
- Named: `"pink"`, `"darkGray"`, `"white"`
- Hex: `"#204cfe"`
- Gradient: `"0:#ff0000,0.5:yellow,1:#00ff00"`

### Layout Constraints
- All items must be within 200x100 bounds
- `key`, `rect`, `type` are **immutable at runtime**
- Only `value`, colors, `opacity`, `enabled` can be updated via `setFeedback()`
- Items with same `zOrder` must have **non-overlapping rects**
- `zOrder` range: 0–700
- Reserved keys: `title`, `icon` (allow user overrides with precedence)
- Interactive touch elements: minimum 35x35 px for accessibility
- **Max 10 programmatic calls/second** for setFeedback

---

## 8. WebSocket API — Events Received (SD → Plugin)

### Connection / Registration

Plugin receives CLI args: `-port`, `-pluginUUID`, `-registerEvent`, `-info`

Must send registration on connect:
```json
{
  "event": "<registerEvent value>",
  "uuid": "<pluginUUID value>"
}
```

### RegistrationInfo (from `-info` arg)
```json
{
  "application": {
    "font": "string",
    "language": "de|en|es|fr|ja|ko|zh_CN|zh_TW",
    "platform": "mac|windows",
    "platformVersion": "string",
    "version": "string"
  },
  "colors": {
    "buttonMouseOverBackgroundColor": "#hex",
    "buttonPressedBackgroundColor": "#hex",
    "buttonPressedBorderColor": "#hex",
    "buttonPressedTextColor": "#hex",
    "highlightColor": "#hex"
  },
  "devicePixelRatio": 2,
  "devices": [
    {
      "id": "string",
      "name": "string",
      "size": { "columns": 5, "rows": 3 },
      "type": 0
    }
  ],
  "plugin": {
    "uuid": "string",
    "version": "string"
  }
}
```

### keyDown
```json
{
  "action": "com.example.plugin.action",
  "context": "unique-instance-id",
  "device": "device-id",
  "event": "keyDown",
  "payload": {
    "controller": "Keypad",
    "isInMultiAction": false,
    "coordinates": { "column": 2, "row": 1 },
    "settings": {},
    "resources": {},
    "state": 0,
    "userDesiredState": 0
  }
}
```

### keyUp
Same structure as keyDown, event = `"keyUp"`.

### dialDown
```json
{
  "action": "action-uuid",
  "context": "instance-id",
  "device": "device-id",
  "event": "dialDown",
  "payload": {
    "controller": "Encoder",
    "coordinates": { "column": 0, "row": 0 },
    "settings": {},
    "resources": {}
  }
}
```
Note: `row` is always 0 for SD+ dials.

### dialUp
Same as dialDown, event = `"dialUp"`.

### dialRotate
```json
{
  "event": "dialRotate",
  "payload": {
    "controller": "Encoder",
    "coordinates": { "column": 0, "row": 0 },
    "pressed": false,
    "ticks": 3,
    "settings": {},
    "resources": {}
  }
}
```
`ticks`: positive = clockwise, negative = counter-clockwise.

### touchTap
```json
{
  "event": "touchTap",
  "payload": {
    "controller": "Encoder",
    "coordinates": { "column": 0, "row": 0 },
    "hold": false,
    "tapPos": [100, 50],
    "settings": {},
    "resources": {}
  }
}
```

### willAppear
```json
{
  "action": "action-uuid",
  "context": "instance-id",
  "device": "device-id",
  "event": "willAppear",
  "payload": {
    "controller": "Keypad|Encoder",
    "isInMultiAction": false,
    "coordinates": { "column": 2, "row": 1 },
    "settings": {},
    "resources": {},
    "state": 0
  }
}
```

### willDisappear
Same structure as willAppear, event = `"willDisappear"`.

### didReceiveSettings
```json
{
  "action": "action-uuid",
  "context": "instance-id",
  "device": "device-id",
  "event": "didReceiveSettings",
  "id": "optional-request-id",
  "payload": {
    "controller": "Keypad|Encoder",
    "isInMultiAction": false,
    "coordinates": { "column": 2, "row": 1 },
    "settings": {},
    "resources": {},
    "state": 0
  }
}
```

### didReceiveGlobalSettings
```json
{
  "event": "didReceiveGlobalSettings",
  "id": "optional-request-id",
  "payload": {
    "settings": {}
  }
}
```

### didReceiveResources (SD 7.1+)
Same structure as didReceiveSettings, event = `"didReceiveResources"`.

### didReceiveSecrets
```json
{
  "event": "didReceiveSecrets",
  "payload": {
    "secrets": {}
  }
}
```

### titleParametersDidChange
```json
{
  "action": "action-uuid",
  "context": "instance-id",
  "device": "device-id",
  "event": "titleParametersDidChange",
  "payload": {
    "controller": "Keypad|Encoder",
    "coordinates": { "column": 2, "row": 1 },
    "title": "My Title",
    "settings": {},
    "resources": {},
    "state": 0,
    "titleParameters": {
      "fontFamily": "string",
      "fontSize": 12,
      "fontStyle": "Regular|Bold|Italic|Bold Italic",
      "fontUnderline": false,
      "showTitle": true,
      "titleAlignment": "top|middle|bottom",
      "titleColor": "#FFFFFF"
    }
  }
}
```

### propertyInspectorDidAppear / propertyInspectorDidDisappear
```json
{
  "action": "action-uuid",
  "context": "instance-id",
  "device": "device-id",
  "event": "propertyInspectorDidAppear"
}
```

### sendToPlugin (from Property Inspector)
```json
{
  "action": "action-uuid",
  "context": "instance-id",
  "event": "sendToPlugin",
  "payload": {}
}
```

### applicationDidLaunch / applicationDidTerminate
```json
{
  "event": "applicationDidLaunch",
  "payload": {
    "application": "App.exe"
  }
}
```

### deviceDidConnect
```json
{
  "device": "device-id",
  "event": "deviceDidConnect",
  "deviceInfo": {
    "id": "device-id",
    "name": "Stream Deck XL",
    "type": 2,
    "size": { "columns": 8, "rows": 4 }
  }
}
```

### deviceDidDisconnect
```json
{
  "device": "device-id",
  "event": "deviceDidDisconnect"
}
```

### deviceDidChange (SD 7.0+)
```json
{
  "device": "device-id",
  "event": "deviceDidChange",
  "deviceInfo": {
    "name": "string",
    "type": 0,
    "size": { "columns": 5, "rows": 3 }
  }
}
```

### systemDidWakeUp
```json
{
  "event": "systemDidWakeUp"
}
```
Note: `willAppear` fires for all visible actions **before** this event.

### didReceiveDeepLink
```json
{
  "event": "didReceiveDeepLink",
  "payload": {
    "url": "path?query#fragment"
  }
}
```

---

## 9. WebSocket API — Commands Sent (Plugin → SD)

### setImage
```json
{
  "context": "instance-id",
  "event": "setImage",
  "payload": {
    "image": "path/to/image.png | data:image/png;base64,... | data:image/svg+xml,...",
    "state": 0,
    "target": 0
  }
}
```
Target values: 0 = HardwareAndSoftware, 1 = Hardware, 2 = Software

### setTitle
```json
{
  "context": "instance-id",
  "event": "setTitle",
  "payload": {
    "title": "string (undefined to reset)",
    "state": 0,
    "target": 0
  }
}
```

### setState
```json
{
  "context": "instance-id",
  "event": "setState",
  "payload": {
    "state": 0
  }
}
```

### showOk
```json
{
  "context": "instance-id",
  "event": "showOk"
}
```

### showAlert
```json
{
  "context": "instance-id",
  "event": "showAlert"
}
```

### setFeedback (Encoder touchscreen)
```json
{
  "context": "instance-id",
  "event": "setFeedback",
  "payload": {
    "element_key": "value or object",
    "title": "Volume",
    "indicator": {
      "value": 75,
      "bar_fill_c": "#00FF00"
    }
  }
}
```

### setFeedbackLayout
```json
{
  "context": "instance-id",
  "event": "setFeedbackLayout",
  "payload": {
    "layout": "$B1 | custom-layout.json"
  }
}
```

### setTriggerDescription
```json
{
  "context": "instance-id",
  "event": "setTriggerDescription",
  "payload": {
    "push": "string (optional)",
    "rotate": "string (optional)",
    "touch": "string (optional)",
    "longTouch": "string (optional)"
  }
}
```

### getSettings / setSettings
```json
{
  "context": "instance-id",
  "event": "getSettings",
  "id": "optional-tracking-id"
}

{
  "context": "instance-id",
  "event": "setSettings",
  "payload": { "key": "value" }
}
```

### getGlobalSettings / setGlobalSettings
```json
{
  "context": "instance-id",
  "event": "getGlobalSettings",
  "id": "optional-tracking-id"
}

{
  "context": "instance-id",
  "event": "setGlobalSettings",
  "payload": { "key": "value" }
}
```

### getSecrets
```json
{
  "context": "instance-id",
  "event": "getSecrets"
}
```

### getResources / setResources (SD 7.1+)
```json
{
  "context": "instance-id",
  "event": "getResources",
  "id": "optional-tracking-id"
}

{
  "context": "instance-id",
  "event": "setResources",
  "payload": { "key": "file-path-or-content" }
}
```

### sendToPropertyInspector
```json
{
  "context": "instance-id",
  "event": "sendToPropertyInspector",
  "payload": {}
}
```

### switchToProfile
```json
{
  "context": "instance-id",
  "device": "device-id",
  "event": "switchToProfile",
  "payload": {
    "profile": "profile-name-from-manifest",
    "page": 0
  }
}
```

### openUrl
```json
{
  "event": "openUrl",
  "payload": {
    "url": "https://example.com"
  }
}
```
Note: Custom URL schemes (`my-app://`) not yet supported.

### logMessage
```json
{
  "event": "logMessage",
  "payload": {
    "message": "string"
  }
}
```

---

## 10. Settings

### Action Settings (per-instance)
```typescript
// Read (from event)
const settings = ev.payload.settings;

// Read (explicit)
const settings = await ev.action.getSettings<MySettings>();

// Write
await ev.action.setSettings({ count: 1 });
```

### Global Settings (plugin-wide)
```typescript
// Read
const settings = await streamDeck.settings.getGlobalSettings<MyGlobalSettings>();

// Write
await streamDeck.settings.setGlobalSettings({ theme: "dark" });
```

### Persistence
- Settings persist as JSON objects
- Supported types: boolean, number, string, null, arrays, objects
- Settings survive app restarts and device reconnects
- Changes trigger `didReceiveSettings` / `didReceiveGlobalSettings`

### Type Safety
TypeScript types are hints only — not runtime guarantees. Use default values or validation (Zod recommended).

---

## 11. Property Inspector (UI)

### Setup
HTML file in `ui/` directory, declared in manifest:
```json
{
  "Actions": [{
    "PropertyInspectorPath": "ui/my-action.html"
  }]
}
```

### HTML Template
```html
<!doctype html>
<html>
<head>
  <script src="sdpi-components.js"></script>
</head>
<body>
  <sdpi-item label="Name">
    <sdpi-textfield setting="name"></sdpi-textfield>
  </sdpi-item>
</body>
</html>
```

### SDPIComponents Library
Web component library with 20+ components:
- Input: `<sdpi-textfield>`, `<sdpi-password>`, `<sdpi-textarea>`
- Selection: `<sdpi-checkbox>`, `<sdpi-radio>`, `<sdpi-select>`, `<sdpi-checkbox-list>`
- Specialized: `<sdpi-color>`, `<sdpi-file>`, `<sdpi-range>`, `<sdpi-button>`
- Calendar: `<sdpi-calendar type="date|datetime-local|time|month|week">`
- Advanced: `<sdpi-delegate>`

### Communication (PI → Plugin)
```javascript
const { streamDeckClient } = SDPIComponents;
streamDeckClient.setSettings({ name: "value" });
```

### Debugging
- Dev mode: `streamdeck dev`
- Remote debugger: `http://localhost:23654/`
- PI must be visible in SD to appear in debug list

---

## 12. Profiles

### Creating Profiles
1. Build profile in Stream Deck app UI
2. Export via right-click → "Export" → `.streamDeckProfile` file
3. Place file in `*.sdPlugin/` directory
4. Declare in manifest `Profiles` array

### Manifest Declaration
```json
"Profiles": [
  {
    "Name": "My Cool Profile",
    "DeviceType": 0,
    "Readonly": false,
    "DontAutoSwitchWhenInstalled": false,
    "AutoInstall": true
  }
]
```

### Programmatic Switching
```typescript
streamDeck.profiles.switchToProfile(deviceId, "My Cool Profile");
// With page navigation:
streamDeck.profiles.switchToProfile(deviceId, "My Cool Profile", { page: 2 });
```

### Limitations
- Can only switch to profiles **bundled with the plugin** (in manifest)
- Cannot access or switch to user-defined profiles
- Requires SDK version 2+ and SD 6.6+

### Device Types for Profiles
| DeviceType | Device |
|------------|--------|
| 0 | Stream Deck |
| 1 | Stream Deck Mini |
| 2 | Stream Deck XL |
| 3 | Stream Deck Mobile |
| 4 | Corsair GKeys |
| 5 | Stream Deck Pedal |
| 6 | Corsair Voyager |
| 7 | Stream Deck + |
| 8 | SCUF Controller |
| 9 | Stream Deck Neo |
| 10 | Stream Deck Studio |
| 11 | Virtual Stream Deck |
| 12 | Galleon 100 SD |
| 13 | Stream Deck + XL |

---

## 13. Icon Packs

### Directory Structure
```
com.example.my-icons.sdIconPack/
├── manifest.json           # Pack metadata (REQUIRED)
├── icons.json              # Icon index with tags (REQUIRED)
├── icon.svg                # Pack identifier icon (REQUIRED, 56x56 px, #C8C8C8)
├── license.txt             # License file (optional)
├── icons/                  # Icon files (REQUIRED folder)
│   ├── alarm.svg
│   ├── bell.svg
│   └── animated.gif        # Animated icons need matching .png preview
│   └── animated.png        # Static preview for animated icon
└── previews/               # Marketplace preview images
    ├── 1-preview.png       # 1920x960 px, PNG, non-transparent
    ├── 2-preview.png
    └── 3-preview.png       # Up to 10 total
```

### manifest.json
```json
{
  "Name": "My Icon Pack",
  "Author": "Author Name",
  "Version": "1.0.0",
  "Icon": "icon.svg",
  "Description": "Optional marketplace description",
  "URL": "https://example.com",
  "License": "license.txt"
}
```

### icons.json
```json
[
  {
    "path": "alarm.svg",
    "name": "Alarm Clock",
    "tags": ["alarm", "clock", "time", "notification"]
  },
  {
    "path": "bell.svg",
    "name": "Bell",
    "tags": ["bell", "notification", "alert"]
  }
]
```

### Icon Specifications
- **Supported formats**: SVG, PNG, JPG, GIF, WebP
- **Recommended size**: 144 x 144 px (or multiples like 288 x 288)
- **SVG recommended** for crisp scaling
- **Pack icon**: 56 x 56 px, color `#C8C8C8` (rgb 200,200,200)
- **Animated icons**: Must include matching static PNG preview with same name

### Installation Path for Testing
- **Windows**: `%appdata%\Elgato\StreamDeck\Plugins\com.elgato.StreamDeck\Icons\`
- **macOS**: `~/Library/Application Support/com.elgato.StreamDeck/Icons/`

### Distribution
Compile to `.streamDeckIconPack` using the **IconPackMan** tool.

---

## 14. Images & Visual Assets

### Size Requirements by Asset Type

| Asset | Standard | @2x (High DPI) | Format |
|-------|----------|-----------------|--------|
| **Plugin Icon** | 256 x 256 px | 512 x 512 px | PNG only |
| **Category Icon** | 28 x 28 px | 56 x 56 px | SVG (preferred) or PNG |
| **Action Icon** (list) | 20 x 20 px | 40 x 40 px | SVG (preferred) or PNG |
| **Key Image** (state) | 72 x 72 px | 144 x 144 px | SVG, PNG, or static GIF |
| **Encoder Background** | 200 x 100 px | 400 x 200 px | SVG or PNG |
| **Encoder Icon** | 72 x 72 px | 144 x 144 px | SVG or PNG |
| **Touch Strip Canvas** | 200 x 100 px | — | N/A (rendering canvas) |
| **Icon Pack Icons** | — | 144 x 144 px | SVG, PNG, JPG, GIF, WebP |
| **Icon Pack Previews** | 1920 x 960 px | — | PNG, non-transparent |

### @2x Convention
- Standard file: `image.png`
- High DPI file: `image@2x.png`
- Both must be provided for all rasterized (PNG) assets
- SVG scales automatically (no @2x needed)

### Image Path Convention
- Manifest paths for icons: **no extension** (SD finds .png/.svg and @2x automatically)
  - e.g. `"Icon": "imgs/actions/counter/icon"` → looks for `icon.png`, `icon@2x.png`, `icon.svg`
- Code paths: **with extension** (e.g. `"CodePath": "bin/plugin.js"`)

### setImage Format Requirements
| Method | Example |
|--------|---------|
| SVG string | `data:image/svg+xml,${encodeURIComponent(svg)}` |
| Base64 PNG | `data:image/png;base64,iVBOR...` |
| Base64 JPEG | `data:image/jpeg;base64,/9j/4...` |
| Base64 WebP | `data:image/webp;base64,...` |
| File path | `imgs/actions/counter/key.png` (relative to plugin dir) |

### Design Guidelines
- **Category/Action icons**: Monochromatic, white stroke (#FFFFFF), transparent background
- **Key images**: Design states effectively — update when action state changes
- **Max 10 programmatic setImage/setFeedback calls per second**
- Animated GIF can be used as static key image but **cannot be updated programmatically**

---

## 15. Devices

### Device Type Registry

| Type | Device | Grid Size |
|------|--------|-----------|
| 0 | Stream Deck (& Scissor Keys) | 5 x 3 (15 keys) |
| 1 | Stream Deck Mini | 3 x 2 (6 keys) |
| 2 | Stream Deck XL | 8 x 4 (32 keys) |
| 3 | Stream Deck Mobile | Variable (up to 64 keys) |
| 4 | Corsair GKeys | Variable |
| 5 | Stream Deck Pedal | 3 x 1 (3 pedals) |
| 6 | Corsair Voyager | Variable |
| 7 | Stream Deck + | 4 x 2 (8 keys + 4 dials) |
| 8 | SCUF Controller | Variable |
| 9 | Stream Deck Neo | 4 x 2 (8 keys) |
| 10 | Stream Deck Studio | 8 x 4 (32 keys) |
| 11 | Virtual Stream Deck | Variable |
| 12 | Galleon 100 SD | Variable |
| 13 | Stream Deck + XL | Variable |

### Device Properties
```typescript
streamDeck.devices.forEach((device) => {
  const { id, isConnected, name, size, type } = device;
  // size = { columns: N, rows: N }
});
```

### Device Events
```typescript
streamDeck.devices.onDeviceDidConnect((ev) => { /* device connected */ });
streamDeck.devices.onDeviceDidChange((ev) => { /* device changed (SD 7.0+) */ });
streamDeck.devices.onDeviceDidDisconnect((ev) => { /* device disconnected */ });
```

---

## 16. Application Monitoring

### Manifest Declaration
```json
"ApplicationsToMonitor": {
  "mac": ["com.elgato.WaveLink"],
  "windows": ["Elgato Wave Link.exe"]
}
```

### Events
```typescript
streamDeck.system.onApplicationDidLaunch((ev) => {
  console.log(`${ev.application} launched`);
});

streamDeck.system.onApplicationDidTerminate((ev) => {
  console.log(`${ev.application} terminated`);
});
```

### Platform Identifiers
- **Windows**: Executable filename (e.g. `"Notepad.exe"`)
- **macOS**: CFBundleIdentifier (e.g. `"com.apple.mail"`, max 125 chars)

---

## 17. Deep Linking

### URL Scheme
```
streamdeck://plugins/message/<PLUGIN_UUID>[path][?query][#fragment]
```

Example: `streamdeck://plugins/message/com.elgato.hello-world/settings?tab=audio#volume`

### Handling
```typescript
streamDeck.system.onDidReceiveDeepLink((ev) => {
  const { path, fragment } = ev.url;
});
```

### Passive Mode (SD 7.0+)
Add `?streamdeck=hidden` to prevent SD window from foregrounding.

### OAuth2 Redirect Proxy
For providers rejecting custom schemes:
```
https://oauth2-redirect.elgato.com/streamdeck/plugins/message/<PLUGIN_UUID>
```

### Constraints
- Max ~2000 characters
- Local access only
- Some OAuth providers don't accept custom schemes

---

## 18. Internationalization (i18n)

### Supported Languages
| Language | File |
|----------|------|
| English | `en.json` |
| German | `de.json` |
| French | `fr.json` |
| Spanish | `es.json` |
| Japanese | `ja.json` |
| Korean | `ko.json` |
| Chinese (Simplified) | `zh_CN.json` |
| Chinese (Traditional) | `zh_TW.json` (SD 6.8+) |

### File Location
Language files go directly in `*.sdPlugin/` root.

### Localizable Fields
- Root: `Name`, `Description`
- Per action (keyed by UUID): `Name`, `Tooltip`, State `Name`, Encoder `TriggerDescription` fields

### Custom Strings
```json
{
  "Localization": {
    "my.custom.key": "Translated string"
  }
}
```

### API
```typescript
streamDeck.i18n.translate("my.custom.key");
```

---

## 19. Logging

### API
```typescript
streamDeck.logger.error("Failure message");
streamDeck.logger.warn("Warning message");
streamDeck.logger.info("Info message");
streamDeck.logger.debug("Debug message");
streamDeck.logger.trace("Trace message");

// Set minimum level
streamDeck.logger.setLevel("warn");

// Scoped loggers
const log = streamDeck.logger.createScope("MyAction");
log.info("Action triggered");  // Output: "MyAction: Action triggered"
```

### Log Levels (highest to lowest)
ERROR > WARN > INFO > DEBUG > TRACE

### Default Levels
- Development: DEBUG
- Production: INFO

### Log Files
- Plugin logs: `*.sdPlugin/logs/*.0.log` (0 = most recent)
- SD app logs (Windows): `%appdata%\Elgato\StreamDeck\logs\`
- SD app logs (macOS): `~/Library/Logs/ElgatoStreamDeck/`

### Rotation
- Max 10 MiB per file
- Retains 10 most recent files
- Rotates on plugin startup or size limit

---

## 20. Resources (Embedded Files)

### Purpose
Embed files (audio, config, etc.) into action instances for portability. Available from **SD 7.1+**.

### API
```typescript
// Embed files
await action.setResources({ audioFile: "C:\\audio\\track.mp3" });

// Retrieve resources
const resources = await action.getResources();

// Listen for PI updates
override onDidReceiveResources(ev) {
  // Only fires when updated via property inspector
}
```

### Behavior
- File names preserved across export/import
- Paths auto-updated when imported on different systems

---

## 21. Plugin Environment & Runtime

### Node.js Versions by SD Release
| Stream Deck Version | Node.js Version |
|--------------------|-----------------|
| 7.1 – 7.3 | 20.20.0 or 24.13.1 |
| 7.0 | 20.19.0 |
| 6.9 | 20.19.0 |
| 6.8 | 20.18.0 |

### Runtime Flags
All Node.js plugins run with:
- `--enable-source-maps`
- `--no-global-search-paths`
- `--no-addons` (SD 6.4 only)

### Chromium UI Runtime
Property inspectors run in Chromium (v130.0.0.0 for recent SD versions).

### Plugin Lifecycle
- Stream Deck manages lifecycle with automatic failure recovery
- Plugin starts when SD starts, stops when SD stops
- Crashes trigger automatic restart

---

## 22. Gotchas & Limitations

### Images
- `setImage` **only works when user has NOT set a custom image** — user overrides take precedence
- Max **10 programmatic calls/second** for setImage and setFeedback
- Animated GIF/WebP NOT supported for programmatic updates
- SVG recommended for crisp scaling; complex SVGs may not render properly
- All rasterized images need standard + @2x variants

### UUIDs
- Permanent after publication — cannot change
- Action UUIDs should be prefixed with plugin UUID
- Only lowercase alphanumeric, hyphens, periods allowed

### Profiles
- Can only switch to plugin-bundled profiles, NOT user-created ones
- `context` of an action is not persistent across app cycles — don't use as external identifier

### States
- Maximum 2 states per action (index 0 and 1)
- Automatic state toggle can be disabled with `DisableAutomaticStates`
- State 0 is default

### Actions
- Max 30 actions per plugin (recommended 2-30)
- Only visible actions owned by the plugin can be accessed/controlled
- Actions must register before `streamDeck.connect()`

### Manifest
- Version format must be `major.minor.patch.build` (4 segments)
- Category defaults to "Custom" if not specified
- File paths: icons = no extension, code/PI = with extension

### Touch Strip
- Canvas is 200 x 100 px
- Layout item `key`, `rect`, `type` are immutable at runtime
- Items at same zOrder must not overlap
- zOrder range: 0–700
- Interactive elements minimum 35 x 35 px

### Property Inspector
- Runs in Chromium, separate from Node.js backend
- `onDidReceiveResources` only fires when updated via PI, not from plugin

### System
- `systemDidWakeUp` only available in plugin context, not PI
- `openUrl` only supports `http://` and `https://`, not custom schemes
- Deep links max ~2000 characters

### Deployment
- Plugin install path (Windows): `%appdata%\Elgato\StreamDeck\Plugins\`
- Icon pack install path (Windows): `%appdata%\Elgato\StreamDeck\Plugins\com.elgato.StreamDeck\Icons\`
- Profile install path (Windows): `%appdata%\Elgato\StreamDeck\ProfilesV3\`
