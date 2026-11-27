# Antigravity Custom Theme Mod — Tawa Rust Edition

A prebuilt customizer that adds dynamic backgrounds, a boot screen and frosted-glass effects to **Antigravity** without touching the app's original installation file (`app.asar`). The **Tawa Rust Edition** completely replaces the Node.js daemon, the Python bundler and the VBS script with two native executables (`agy-theme.exe` and `agy-theme-daemon.exe`) that use very little memory and load assets on demand (**Lazy HTTP**).

![Antigravity Custom Theme demo](docs/demo.webp)

> This code is developed and extended from the open-source project [antigravity-custom-theme-skill](https://github.com/giakiet22102006/antigravity-custom-theme-skill) (MIT license).
>
> This repository is a fork of [furinamikuvn/antigravity-custom-theme-mod](https://github.com/furinamikuvn/antigravity-custom-theme-mod) with the boot intro and Custom Theme Studio UI translated to English.

---

## Changes in this fork

| Change | Files |
| :--- | :--- |
| Boot intro and Custom Theme Studio UI translated from Vietnamese to English | `engine/boot.js`, `engine/studio.js`, `README.md` |
| **Fix:** boot intro never auto-played. `core.js` marks `__AGY_BOOT_PLAYED__` before loading `boot.js`, and `boot.js` then checked the same flag and exited. `boot.js` now only checks the Boot Intro setting. | `engine/boot.js` |
| **Fix:** theme sometimes missing after a cold start. A post-attach watchdog checks for the theme style at 3 / 8 / 15 / 30 s and re-injects if it is missing (logged as `Theme missing on ... re-injecting.`). | `src/daemon.rs` |
| Less flash of the stock UI before the intro: the daemon scans for new windows every 0.4 s (was 1.5 s, with a 1 s loop sleep), and `core.js` shows a black cover while `boot.js` loads (auto-removed after 6 s as a safety net). | `src/daemon.rs`, `engine/core.js` |
| `tools/boot-probe.js`: read-only CDP probe that prints boot-intro state for every Antigravity page. Run with `node tools/boot-probe.js` (Node 22+). | `tools/boot-probe.js` |

---

## Notes for this fork (Windows)

Lessons learned while setting this up on Windows:

- **Works with the Antigravity App (2.0) only, not Antigravity IDE.** The theme targets the Agent Manager UI (composer, project pill, chat greeting). In the VS Code–based IDE, `verify` may report `PASS` but nothing changes (`shellFound: false`, `settingsTriggerPresent: false`).
- **Add the debug flag to the shortcut yourself if `install` doesn't.** Check with:
  ```powershell
  $sh = New-Object -ComObject WScript.Shell
  foreach ($s in "$env:USERPROFILE\Desktop\Antigravity.lnk", "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Antigravity.lnk") {
    $l = $sh.CreateShortcut($s); $l.Arguments = '--remote-debugging-port=0'; $l.Save()
  }
  ```
  App updates can rewrite the shortcut and remove the flag — re-run this if the theme disappears.
- **Always launch Antigravity from that shortcut**, never from an Administrator shell. An admin-launched instance can't be controlled by the daemon and can break auto-updates.
- **Port file location.** The daemon looks for `%APPDATA%\Antigravity\DevToolsActivePort`. If your app stores it elsewhere, point the daemon to it with the `AGY_PORT_FILE` environment variable, then restart the daemon (`agy-theme.exe stop` / `start`).
- **Building from source on Windows** needs Rust (`winget install Rustlang.Rustup`) and Visual Studio Build Tools with the **Desktop development with C++** workload, otherwise `cargo build` fails with `link.exe not found`.

---

## Architecture overview

The system runs on two separate layers so it stays stable when Antigravity updates:

1. **Rust background daemon & HTTP media server (`src/daemon.rs`, `src/media.rs`, `agy-theme-daemon.exe`):**
   - Compiled with `windows_subsystem = "windows"`, so it runs in the background with no console window and needs no `Node.js`, `Python` or `wscript.exe`.
   - Automatically detects Antigravity's `DevToolsActivePort` file and attaches only to valid UI pages (`https://127.0.0.1:*`, `workbench`, `launchpad`), completely ignoring local dev servers (`http://127.0.0.1:*`).
   - Enables `Page.setBypassCSP({ enabled: true })`, drops `Runtime.enable` to reduce retained V8 heap references, and cleans up old `Page.removeScriptToEvaluateOnNewDocument` entries before reloading.
   - Starts a local HTTP media server with `std::net::TcpListener` on `127.0.0.1:47821` (or `AGY_MEDIA_PORT`) serving `/assets/*` and `/user_media/*` as 64 KiB streams, with `Range 206` support for video, `Cache-Control: public, max-age=86400`, `/user_media_list`, `POST /upload` (streaming 64 KiB MD5 hashing to prevent duplicates) and `POST /delete_media`.
   - Watches `dist/theme_payload.js` by its `(modified, len)` pair to hot-reload at the right moment, saves settings through `Runtime.addBinding` (`agySaveThemeConfig`) with atomic writes to `theme_config.json`, and syncs deltas (`skipSave: true`) across windows.

2. **Runtime UI engine (`engine/core.js`) & Lazy HTTP bundler (`src/builder.rs`):**
   - `agy-theme.exe build` merges `themes/themes.json` + `engine/core.js` into a compact `dist/theme_payload.js` (**278.6 KB**): only small SVGs and 3 Mali WOFF2 font subsets are inlined; all wallpapers, MP4 videos, starfield, icons and voice files are kept as relative paths and loaded on demand from the HTTP media server.
   - `engine/core.js` keeps **0 global `:has()`** selectors and **0 global live `backdrop-filter: blur(...)`**, uses `ResizeObserver` instead of polling in `tick()`, uses `blob:` URLs with LRU revocation, pauses `<video>` when `document.hidden`, and pre-bakes the frosted-glass layer on an offscreen canvas (`syncPrebakedGlass`).

---

## Key features

- **Separate static image and live video background modes:** Manage uploaded images and videos separately; history is saved automatically every time you pick a new file, with preview and per-item deletion from disk.
- **Bundled default presets:** Includes `Gemini-chan Live` (`themes/assets/wallpapergeminichan.mp4`), `Furina Live` (`themes/assets/furina-bg.mp4`), `WLOP Cosmic` and `Midnight Obsidian`.
- **Sketch Reveal effect:** Extracts line art directly from the current video frame or wallpaper using a multi-channel color edge-detection algorithm combined with curve smoothing.
- **Boot HUD:** A starfield boot sequence with 4 Arisu-Tawa voice clips that can be toggled or replayed from the settings panel.
- **Custom Greeting:** Write your own list of random greetings shown on the empty chat screen, rendered in the bundled offline Mali handwriting font.
- **Task Voice:** Load multiple audio files (`.mp3`, `.wav`, `.ogg`, `.m4a`, `.aac`, `.flac`), played at random when a task finishes; the audio object is released right after playback.
- **Chat frame & avatar customization:** Change the input box, message bubbles, User/Agent avatars (auto-compressed to WebP), background dim and glass blur.

---

## Requirements

- **Antigravity** running with the CDP debug port (`DevToolsActivePort`; the `install` command automatically adds the `--remote-debugging-port=0` flag to the shortcut if missing — see the fork notes above if it doesn't).
- **To run directly on Windows / macOS / Linux:** Only the binaries in `target/release/` (`agy-theme.exe` + `agy-theme-daemon.exe`) are needed — **no Node.js or Python at runtime**.
- **The Rust toolchain (`cargo` / `rustc`) is only needed when building from source.**

---

## Installation and usage

### Fastest way on Windows: interactive launcher

Run **`agy-theme.bat`** in the repository root (or call it from PowerShell):

```powershell
.\agy-theme.bat install
```

If there are no binaries in `target/release/` yet, `agy-theme.bat` runs `cargo build --release` on first use, then opens the menu or runs the requested command.

### Installing via script / CLI

1. **Build the release binaries (if building from source):**

```powershell
cargo build --release
```

2. **Bundle `dist/theme_payload.js` (Lazy HTTP):**

```powershell
.\target\release\agy-theme.exe build
```

3. **Set up auto-start and launch the background daemon:**

- **On Windows (PowerShell):**

```powershell
powershell -ExecutionPolicy Bypass -File ".\scripts\install-win.ps1"
```

This calls `agy-theme.exe install`: adds the `--remote-debugging-port=0` flag to the Antigravity shortcut if missing, registers the Windows Scheduled Task `AntigravityCustomTheme` (runs `agy-theme-daemon.exe` at logon, with a Startup `.lnk` fallback if permissions are insufficient), and removes the old `silent-start.vbs`.

- **On macOS / Linux (Bash):**

```bash
bash scripts/install-unix.sh
```

Supports `install` (LaunchAgent on macOS / `systemd --user` on Linux), `--foreground`, `stop`, `status` and `uninstall`.

4. **Check daemon status, RAM and live CDP:**

```powershell
.\target\release\agy-theme.exe status
.\target\release\agy-theme.exe verify
.\target\release\agy-theme.exe themes
```

A passing `verify` reports `PASS` with `themeActive: true`, `hasSelectorCount: 0`, `hasLiveBlurRule: false`, `settingsTriggerPresent: true` and `composerPresent: true`. To open the customization panel in Antigravity, click **Custom theme** in the left sidebar.

---

## Uninstall

To stop the background daemon, remove the Scheduled Task / LaunchAgent / systemd service and restore the default look on all open Antigravity windows:

```powershell
.\target\release\agy-theme.exe uninstall
```

---

## Real-world performance comparison (old Node/Python vs Tawa Rust Edition)

Measured directly on the same Windows machine and a real Antigravity window (CDP port `53262`):

| Metric | Before (Node/Python) | After (Tawa Rust Edition) | Improvement |
| :--- | :--- | :--- | :--- |
| **Daemon working set RAM** | `63.06 MB` (P0: `60.71 MB`) | **`1.62 – 1.64 MB`** | **~38.5×** lower |
| **Daemon private memory** | `86.42 MB` (P0: `80.68 MB`) | **`0.95 – 1.34 MB`** | **~64.5× – 90.9×** lower |
| **`dist/theme_payload.js`** | `1,786,039 bytes` (`1,744.2 KB`) | **`285,252 bytes` (`278.6 KB`)** | **6.26×** smaller |
| **Payload build time** | Python script + Pillow | **`1 ms`** (`agy-theme.exe build`) | Instant |
| **Active `<style>` (`styleBytes`)** | `53,020 bytes` | **`22,610 bytes`** | **57.4%** smaller |
| **Global CSS `:has()`** | `7` rules | **`0`** (`hasSelectorCount: 0`) | **100%** removed |
| **Live `backdrop-filter: blur()`** | `1` (`blur(10px)` in modal) | **`0`** (`hasLiveBlurRule: false`) | **100%** removed |
| **`Custom theme` sidebar button** | `settingsTriggerPresent: false` | **`settingsTriggerPresent: true`** | 100% fixed |
| **`themes/user_media/` size** | `16` files (6 MP4s with duplicate MD5) | **`10` files** (`48.58 MB` reclaimed) | `0` duplicates |

---

## Directory structure

```text
.
├── src/
│   ├── lib.rs                 # agy_theme library and UTC timestamp helper
│   ├── main.rs                # agy-theme CLI (build, daemon, start, stop, status, install, uninstall, verify, themes)
│   ├── bin/daemon.rs          # Windowless background binary agy-theme-daemon
│   ├── builder.rs             # Lazy HTTP payload bundler (themes.json + core.js -> dist/theme_payload.js)
│   ├── media.rs               # Pure std::net HTTP media server (Range 206, 64 KiB MD5 upload, delete_media)
│   ├── daemon.rs              # CDP session loop, file watching by (mtime, size), delta sync
│   ├── cdp.rs                 # HTTP /json, Antigravity target filter, evaluate_once, verify_live
│   ├── ws.rs                  # Pure Rust RFC 6455 WebSocket client (SHA-1 + 8 KiB masked frames)
│   ├── config.rs              # Atomic read/merge of theme_config.json and daemon.log rotation
│   ├── installer.rs           # Install/remove Task Scheduler, CDP shortcut flag, LaunchAgent / systemd
│   ├── md5.rs                 # Pure Rust RFC 1321 MD5 with 64 KiB streaming reads
│   ├── paths.rs               # Auto-detects root, DevToolsActivePort and sibling binaries
│   └── sys.rs                 # Win32 / Unix PID, memory stats, working-set trim, detached spawn
├── tests/
│   └── integration_tests.rs   # 6 integration tests: CLI, Lazy HTTP builder, HTTP Range/upload/delete, CDP, config/MD5
├── engine/
│   └── core.js                # Runtime UI source (0 :has(), 0 live blur, Boot HUD, Sketch Reveal, Modal)
├── scripts/
│   ├── install-win.ps1        # PowerShell wrapper that calls target/release/agy-theme.exe install
│   └── install-unix.sh        # Bash wrapper for macOS / Linux
├── themes/
│   ├── themes.json            # Declares the 4 default theme presets
│   ├── assets/                # Videos, posters, Mali WOFF2 fonts and default audio
│   └── user_media/            # User-uploaded files
├── docs/
│   └── demo.webp              # Animated demo image for the README
├── references/
│   └── theme-schema.md        # themes.json data structure reference
├── agy-theme.bat              # Quick launcher & CLI menu for Windows
├── Cargo.toml                 # agy-theme crate & release config (LTO / opt-level="s")
├── SKILL.md                   # Skill structure specification
└── LICENSE                    # MIT license
```

---

## License

Released under the **MIT** license — see the [LICENSE](LICENSE) file for details.
