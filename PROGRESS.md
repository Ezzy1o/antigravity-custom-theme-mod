# PROGRESS — Antigravity Custom Theme Engine (Tawa Rust Edition)

## Phase Hiện Tại: **P0 — Scaffold, Baseline Recon & Media Deduplication (HOÀN TẤT — Chờ duyệt sang P1)**

| Phase | Trạng Thái | Commit Hash | Bằng Chứng Nghiệm Thu |
| :--- | :--- | :--- | :--- |
| P0 Scaffold & Media Dedup | 🟢 Hoàn tất | Pending P0 commit | `AGENTS.md`, `DECISIONS.md`, `PROGRESS.md`, `.gitignore` (`target/`, `*.exe`, `*.pdb`); xóa 6 MP4 trùng MD5 thu hồi `50,940,452 bytes` (`48.58 MB`), còn `10/10` file tham chiếu nguyên vẹn, `0` bản trùng lặp. |
| P1 `engine/core.js` Perf, FPS & DOM Fixes | ⚪ Chờ duyệt | - | Chưa bắt đầu |
| P2 Rust Core (`builder`, `cdp`, `ws`, `config`, `sys`, `paths`) | ⚪ Chờ duyệt | - | Chưa bắt đầu |
| P3 Rust Media Server, `daemon`, `installer`, CLI & Launcher | ⚪ Chờ duyệt | - | Chưa bắt đầu |
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
- **Phiên gần nhất hoàn tất:** Phase P0 — Thiết lập bộ khung `skill_project_scaffold` (Tier 2) và dọn trùng lặp `themes/user_media/`.
- **Đã làm xong:** Tạo `AGENTS.md`, `DECISIONS.md`, `PROGRESS.md`; cập nhật `.gitignore`; xóa 6 MP4 trùng MD5 (`48.58 MB`), giữ nguyên `10/10` file tham chiếu.
- **File bị biến đổi:** `.gitignore`, `AGENTS.md`, `DECISIONS.md`, `PROGRESS.md` (cùng 6 file trùng gitignored trong `themes/user_media/`).
- **Việc phiên tới cần làm ngay:** Bắt đầu **P1** trên `engine/core.js` (xử lý các điểm nóng tại L396 `syncPrebakedGlass`, L2130 `agySaveThemeConfig`, L2466–2506 `:has(> table)`, L2572–2579 side-panel `:has()`, L3002 & L3026 modal blur/keydown, L4108 `injectMainSidebarButton`, L4251–4266 `hookShellMetrics`, L4415 `tick`) và cập nhật `scripts/verify_cdp.js`.
- **Cảnh báo rủi ro:** `engine/core.js` đang phục vụ Node daemon `PID 16072` hiện hành nên mọi tối ưu Lazy HTTP và `skipSave` trong P1 phải tương thích ngược với `daemon/theme_daemon.js` cho tới cổng cutover P4.
