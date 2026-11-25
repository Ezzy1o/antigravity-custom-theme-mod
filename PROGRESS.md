# PROGRESS — Antigravity Custom Theme Engine (Tawa Rust Edition)

## Phase Hiện Tại: **P3 — Rust Media Server, `daemon`, `installer`, CLI & Launcher (HOÀN TẤT — Chờ duyệt sang P4 Cutover)**

| Phase | Trạng Thái | Commit Hash | Bằng Chứng Nghiệm Thu |
| :--- | :--- | :--- | :--- |
| P0 Scaffold & Media Dedup | 🟢 Hoàn tất | `ba66a86` | `AGENTS.md`, `DECISIONS.md`, `PROGRESS.md`, `.gitignore` (`target/`, `*.exe`, `*.pdb`); xóa 6 MP4 trùng MD5 thu hồi `50,940,452 bytes` (`48.58 MB`), còn `10/10` file tham chiếu nguyên vẹn, `0` bản trùng lặp. |
| P1 `engine/core.js` Perf, FPS & DOM Fixes | 🟢 Hoàn tất | `c026887` | Static audit `engine/core.js` (`4,727` dòng, `221,608 bytes`): `0` `:has()`, `0` `backdrop-filter: blur(...)`, `node --check` PASS. Build `dist/theme_payload.js` (`1744.2 KB`) + hot-reload vào Antigravity thật, `node scripts/verify_cdp.js` PASS `1/1`: `styleBytes` giảm `53,020` → `22,610 bytes`, `hasSelectorCount: 0`, `hasLiveBlurRule: false`, `styleHasLiveBlur: false`, `modalHasLiveBlur: false`, `settingsTriggerPresent: true`, `composerPresent: true`. |
| P2 Rust Core (`builder`, `cdp`, `ws`, `config`, `sys`, `paths`, `md5`) | 🟢 Hoàn tất | `58c9e83` | `cargo test -- --nocapture` biên dịch sạch 0 warning (`2.18s`), **12 passed; 0 failed** (`0.07s`): RFC 1321 + streaming MD5 64 KiB, atomic config merge, Win32 PID/memory/trim, RFC 6455 WS loopback fragment+ping/pong, CDP filter chặn `http://127.0.0.1:8787` & `8789`, Lazy HTTP builder biên dịch **4 theme** thành `285,252 bytes` (`278.6 KB`, giảm 6.26× so với `1,786,039 bytes`) trong **`4 ms`** và `node --check` PASS. |
| P3 Rust Media Server, `daemon`, `installer`, CLI & Launcher | 🟢 Hoàn tất | Pending P3 commit | Viết `src/media.rs` (streaming `Range 206`, `/assets/*`, `/user_media/*`, `/user_media_list`, `/upload` 64 KiB MD5 dedup, `/delete_media`), `src/daemon.rs`, `src/bin/daemon.rs`, `src/installer.rs`, `src/main.rs`, `agy-theme.bat`, `scripts/install-win.ps1`, `scripts/install-unix.sh`. `cargo test` **0 warning, 14 passed; 0 failed** (`0.11s`); `cargo build` (`0.90s`) PASS; CLI `agy-theme --help`, `themes`, `status` PASS (`CDP port 53262 active`, Node `PID 16072` giữ nguyên). |
| P4 Release Build, Cutover, Live CDP Verify & Cleanup | ⚪ Chờ duyệt | - | Chưa bắt đầu |

## Số Liệu Nền (Baseline 2026-11-25)
- **Toolchain máy thật:** `rustc 1.96.0` (`x86_64-pc-windows-gnu`), `cargo 1.96.0`, `gcc.exe` + `lld.exe` (MSYS2 UCRT64).
- **Node daemon (`PID 16072`):** Working Set `60.71 MB`, Private RAM `80.68 MB`.
- **Bundle & Runtime:** `dist/theme_payload.js` = `1,777,213 bytes`; `engine/core.js` = `4,498` dòng (`213,011 bytes`), `7` rule `:has()`, `1` live `backdrop-filter: blur(10px)` ở modal, `9` `getBoundingClientRect()`, `skipSave: 0`; `<style id="antigravity-custom-theme-active">` = `53,020 bytes`.
- **Live DOM Recon:** `.bg-sidebar` khớp phần tử `#0` (`w:1683, h:30, spanCount:0`) trước `#2` (`w:256, h:884, hasCustomizations:true`); nút `Customizations` nằm trong `[data-testid="sidebar-navigation-items"]`.

## Việc Đã Hoàn Thành Ở Phase P0
- [x] Khóa kiến trúc D1–D8 qua `/grill-me` và ghi vào `DECISIONS.md`
- [x] Cập nhật `.gitignore` chặn `target/`, `*.exe`, `*.pdb`
- [x] Xác minh `theme_config.json` và xóa 6 file MP4 trùng MD5 trong `themes/user_media/` (`48.58 MB`, còn `10/10` file tham chiếu, `0` bản trùng)
- [x] Khởi tạo bộ ba quản trị `AGENTS.md`, `DECISIONS.md`, `PROGRESS.md` (zero placeholders)
- [x] Giữ nguyên Node daemon `PID 16072` chạy ổn định trong suốt P0

## Phạm Vi Các Phase Tiếp Theo
- **P1:** Tối ưu `engine/core.js`: bỏ `syncShellMetrics()` khỏi `tick()` (chỉ chạy qua `ResizeObserver` & browser-hole attr); loại bỏ toàn bộ `7` rule `:has()` (2 side-panel + 5 markdown table); xóa `backdrop-filter: blur(10px)` trên modal backdrop; chuyển sang Lazy HTTP assets với fallback tương thích ngược; `blob:` URL + LRU revoke; debounce `agySaveThemeConfig` (200ms) + `syncPrebakedGlass` (80ms) + `skipSave: true`; pause video nền khi `document.hidden`; sửa `injectMainSidebarButton()` dùng `[data-testid="sidebar-navigation-items"]`; gắn modal `keydown` qua `AbortController.signal`; cập nhật `scripts/verify_cdp.js` kiểm tra `0 :has()` và `0 live blur`.
- **P2:** Xây dựng crate Rust lõi (`Cargo.toml`, `src/lib.rs`, `src/paths.rs`, `src/sys.rs`, `src/config.rs`, `src/ws.rs`, `src/cdp.rs`, `src/builder.rs`) kèm unit test `cargo test` PASS 100%.
- **P3:** Xây dựng `src/media.rs` (HTTP Media Server thuần `std::net::TcpListener`, streaming `Range 206`, `/assets/*`, `/user_media/*`, `/user_media_list`, `/upload` băm MD5 theo luồng 64 KB, `/delete_media`), `src/daemon.rs` (lọc `https://127.0.0.1:`, `Page.setBypassCSP`, bỏ `Runtime.enable`, `removeScriptToEvaluateOnNewDocument`, watch theo `mtime+size`, delta sync ~150B), `src/bin/daemon.rs`, `src/installer.rs` (Task Scheduler + dọn VBS cũ + patch shortcut), `src/main.rs`, `agy-theme.bat`, cập nhật `scripts/install-win.ps1`.
- **P4:** Biên dịch `cargo build --release`, hoàn thiện `tests/integration_tests.rs`, cắt chuyển Node daemon -> Rust daemon, chạy `agy-theme verify` trên Antigravity thật, xóa code Node/Python/VBS cũ (`daemon/theme_daemon.js`, `scripts/build_payload.py`, `scripts/uninstall.js`, `scripts/verify_cdp.js`, `silent-start.vbs`), cập nhật `README.md` & `TAWA_MOD_NOTES.md`, đo benchmark RAM/Payload/FPS thực tế.

## Nhật Ký Handoff Giữa Các Phiên (5 Dòng Tiêu Chuẩn)
- **Phiên gần nhất hoàn tất:** Phase P3 — Hoàn thiện Rust HTTP Media Server, CDP Daemon, Installer, CLI & Launcher.
- **Đã làm xong:** Thêm `src/media.rs`, `src/daemon.rs`, `src/bin/daemon.rs`, `src/installer.rs`, `src/main.rs`, `agy-theme.bat`, cập nhật `Cargo.toml`, `src/lib.rs`, `scripts/install-win.ps1`, `scripts/install-unix.sh`; `cargo test` PASS 14/14 (0 warning); `cargo build` & CLI smoke checks PASS.
- **File bị biến đổi:** `Cargo.toml`, `src/lib.rs`, `src/media.rs`, `src/daemon.rs`, `src/bin/daemon.rs`, `src/installer.rs`, `src/main.rs`, `agy-theme.bat`, `scripts/install-win.ps1`, `scripts/install-unix.sh`, `PROGRESS.md`.
- **Việc phiên tới cần làm ngay:** Bắt đầu **P4 (Cutover & Cổng G3)** — thêm `tests/integration_tests.rs`, chạy `cargo build --release` & `cargo test`, dừng Node daemon `PID 16072`, build Lazy HTTP `dist/theme_payload.js`, chạy `agy-theme.exe install` (Task Scheduler + dọn `silent-start.vbs`), chạy `agy-theme.exe verify` + test `http://127.0.0.1:47821`, xóa file Node/Python cũ, cập nhật `README.md` & `TAWA_MOD_NOTES.md`, đo bảng RAM/Payload/DOM trước-sau.
- **Cảnh báo rủi ro:** Khi cutover ở P4 cần xóa `silent-start.vbs`, `daemon/theme_daemon.js`, `scripts/build_payload.py`, `scripts/uninstall.js`, `scripts/verify_cdp.js` chỉ SAU KHI `agy-theme.exe install` và `agy-theme.exe verify` PASS 100% trên Antigravity đang chạy.
