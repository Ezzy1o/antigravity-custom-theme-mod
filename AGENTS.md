# Antigravity Custom Theme Engine — Tawa Rust Edition — Project Rules & Operational Invariants

## 0. Tài Liệu Bắt Buộc Đọc Khi Mở Phiên Mới
1. `PROGRESS.md` (xác định phase hiện tại, việc đã xong, bằng chứng nghiệm thu, đọc 5 dòng handoff của phiên trước).
2. `DECISIONS.md` (nắm các quyết định kiến trúc đã đóng băng D1–D8, tuyệt đối không lật lại).
3. `TAWA_MOD_NOTES.md` (kiến trúc tổng thể hiện hữu, các tính năng Tawa bắt buộc bảo toàn 100% và global debug hooks).
4. `references/theme-schema.md` (schema `themes.json` và ghi chú selector DOM Electron).

## 1. Thứ Tự Nguồn Sự Thật (Hierarchy of Truth)
1. Mã nguồn thực tế, kết quả `cargo test`, và đo đạc runtime thực tế qua CDP (`DevToolsActivePort` / `agy-theme verify`).
2. `DECISIONS.md` và `TAWA_MOD_NOTES.md`.
3. Đầu ra từ AI / Mô hình ngôn ngữ (chỉ mang tính tư vấn; mọi selector DOM, khóa config và chữ ký hàm phải kiểm chứng trong code thật trước khi dùng).

## 2. Kỷ Luật Phạm Vi & Ranh Giới An Toàn (Scope & Safety Discipline)
- **Kỷ luật Phase:** Mỗi phiên làm việc CHỈ thực hiện đúng 1 phase đang mở trong `PROGRESS.md`. Tuyệt đối không viết trước code của phase sau.
- **Ranh giới an toàn (Blast Radius & Cấm địa):**
  - TUYỆT ĐỐI CẤM sửa file cài đặt gốc của Antigravity (`app.asar`), `C:\Windows`, `C:\Program Files`, `C:\Program Files (x86)`, `C:\ProgramData\Microsoft`, hoặc thao tác Windows Registry (`reg add`, `reg delete`).
  - TUYỆT ĐỐI CẤM làm hỏng/mất dữ liệu `theme_config.json` hoặc bất kỳ tài nguyên gốc nào trong `themes/assets/` và các file đang được tham chiếu trong `themes/user_media/`.
  - Trong các phase trước P4 (P0–P3), giữ nguyên Node daemon đang chạy để không gián đoạn giao diện Antigravity của Sensei cho đến cổng cutover P4.
- **Bảo mật:** Không lưu bí mật/token vào mã nguồn hoặc git history; giữ nguyên `.gitignore` loại trừ `target/`, `dist/`, `theme_config.json`, `daemon.log`, `daemon.pid`, `themes/user_media/*` (trừ file mẫu đã định).
- **Tiêu chuẩn mã nguồn:**
  - Zero placeholders (`// TODO`, `// phần còn lại...`), zero dead-code, zero unused-imports.
  - `engine/core.js` sau P1 phải duy trì **0 `:has()`** toàn cục và **0 live `backdrop-filter`** toàn cục.
  - Rust CDP daemon (`src/cdp.rs`, `src/daemon.rs`) chỉ attach `https://127.0.0.1:` (và `workbench`/`launchpad`), cấm attach dev server `http://127.0.0.1:*`; bỏ `Runtime.enable`; bật `Page.setBypassCSP`; ghi file atomic; băm MD5 theo luồng 64 KB.
- **Kỷ luật commit:** Mỗi phase kết thúc bằng đúng 1 commit git chuẩn mực: `P<n>: <tóm tắt nghiệp vụ>`.

## 3. Giao Thức Cổng Tiếp Sức Model (Tier 2 — Lean Relay)
- **Cổng G0 (Khởi đầu — Đã chốt):** Khóa toàn bộ kiến trúc D1–D8 qua phiên phỏng vấn `/grill-me` với Sensei và ghi đóng băng vào `DECISIONS.md`.
- **Cổng G2 (Dự phòng):** Kích hoạt `enter_plan_mode` / dừng báo cáo nếu thử nghiệm thất bại 2 lần liên tiếp cùng một lỗi hoặc phát hiện giả định sai khác với runtime thực tế.
- **Cổng G3 (Nghiệm thu tại P4):** Build `--release`, chạy toàn bộ `cargo test`, cắt chuyển daemon sang Rust, chạy `agy-theme verify` trên Antigravity thật, và đo đối chứng RAM/Payload/FPS trước-sau.

## 4. Định Nghĩa Xong Của Một Phase (Definition of Done - DoD)
- Toàn bộ bài kiểm chứng của phase hiện tại PASS 100% trên dữ liệu/runtime thực tế.
- Có bằng chứng thực nghiệm (output terminal, kích thước file, hash commit, hoặc số liệu CDP/RAM) ghi vào `PROGRESS.md`.
- `PROGRESS.md` và `DECISIONS.md` (nếu phát sinh ADR) được cập nhật kèm đúng 5 dòng handoff cho phase kế tiếp.
- Kết thúc bằng 1 git commit sạch và dừng lại báo cáo Sensei, KHÔNG tự ý chuyển sang phase sau khi chưa được duyệt.
