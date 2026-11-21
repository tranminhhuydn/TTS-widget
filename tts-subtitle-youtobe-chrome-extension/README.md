# TTS Subtitle YouTube

Chrome Extension (Manifest V3) đọc phụ đề đang hiển thị trên trình phát YouTube bằng Web Speech API.

## Cài đặt thử nghiệm

1. Mở `chrome://extensions`.
2. Bật **Developer mode**.
3. Chọn **Load unpacked** và chọn thư mục `tts-subtitle-youtobe-chrome-extension`.
4. Mở video YouTube, bật phụ đề **CC**.
5. Mở biểu tượng extension, bật **Đọc phụ đề**.

## Bản 0.1.0

- Đọc caption đang hiển thị trong DOM của YouTube.
- Tạm dừng giọng đọc khi video tạm dừng hoặc kết thúc.
- Chọn giọng đọc do trình duyệt/hệ điều hành cung cấp.
- Điều chỉnh tốc độ đọc.
- Nút dừng giọng đọc.

## Giới hạn hiện tại

- Cần bật phụ đề CC; chưa lấy trực tiếp transcript từ YouTube Data API.
- Phụ đề tự động hoặc phụ đề do người dùng tải lên phụ thuộc vào cách YouTube hiển thị caption trong DOM.
- Chưa xử lý đầy đủ việc tua video, đổi video SPA và đồng bộ chính xác từng mốc thời gian.
- Chưa có highlight phụ đề hoặc tự động bật đọc khi phát video.
