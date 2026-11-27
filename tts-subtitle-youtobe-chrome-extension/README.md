# TTS Subtitle YouTube

Chrome Extension Manifest V3 đọc phụ đề YouTube thành câu hoàn chỉnh và đồng bộ TTS theo thời gian video.

## Cài đặt
1. Mở \`chrome://extensions\` hoặc \`edge://extensions\`.
2. Bật Developer mode và chọn Load unpacked.
3. Chọn thư mục \`tts-subtitle-youtobe-chrome-extension\`.
4. Mở video YouTube có phụ đề, bật extension từ popup.

## Phiên bản 0.3.0
- Tải caption track của video dưới dạng JSON3.
- Ghép các event phụ đề theo thứ tự thời gian, không bỏ các mảnh chỉ vì timestamp gần hoặc chồng lấn.
- Tách nội dung thành câu và nội suy mốc thời gian bắt đầu/kết thúc từ event nguồn.
- Lập lịch đọc theo thời gian video; chờ khi TTS sớm, bỏ qua câu đã quá cũ tại ranh giới câu khi video chạy nhanh hơn.
- Đồng bộ Play/Pause/Seek và thay đổi tốc độ bằng sự kiện của video YouTube.
- Giữ chọn nhiều giọng, tự nhận diện ngôn ngữ và luân phiên giọng.
- Chọn Chế độ nguyên bản (đọc từng event phụ đề) hoặc Chế độ kể chuyện (ghép thành câu hoàn chỉnh) ngay trong popup.
- Điều chỉnh tốc độ và âm lượng ngay trong popup; lưu thiết lập bằng chrome.storage.local.

## VieNeu TTS Local

Extension hỗ trợ hai engine: giọng đọc trình duyệt (Web Speech API) và VieNeu TTS Local. Để dùng VieNeu:

1. Khởi động VieNeu TTS server trên máy tính và bảo đảm API lắng nghe tại `http://127.0.0.1:8080`.
2. Mở popup extension, chọn **VieNeu TTS Local**.
3. Nhập tên giọng, mặc định là `Pham Tuyen`.
4. Bật **Đọc phụ đề**. Extension gửi từng câu đến `POST /v1/audio/speech` với model `vieneu`, định dạng WAV.

Yêu cầu: Chrome/Edge cần tải lại extension sau khi cập nhật; VieNeu server phải đang chạy. Service worker của extension làm proxy HTTP để tránh giới hạn CORS của content script. Tốc độ và âm lượng được áp dụng khi phát WAV.

## Giới hạn
Timestamp câu được nội suy từ timestamp event, không phải timestamp từng từ. Extension cần caption track truy cập được từ player response và JSON3; một số video hoặc phiên YouTube có thể không cung cấp track tải được. Web Speech API phụ thuộc voice có sẵn của hệ điều hành/trình duyệt.

## Kiểm thử
Kiểm tra video có phụ đề tự động và phụ đề tải lên; thử play/pause, tua tới/lui, tốc độ 0.5x–2x, thay đổi giọng và âm lượng.