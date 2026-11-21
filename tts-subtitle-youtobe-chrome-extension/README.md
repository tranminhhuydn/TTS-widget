# TTS Subtitle YouTube

Chrome Extension Manifest V3 đọc phụ đề YouTube bằng Web Speech API.

## Cài đặt

1. Mở `chrome://extensions` hoặc `edge://extensions`.
2. Bật **Developer mode**.
3. Chọn **Load unpacked** và chọn thư mục `tts-subtitle-youtobe-chrome-extension`.
4. Mở video YouTube, bật **CC**, sau đó mở extension.

## Phiên bản 0.2.0

- Theo dõi cue phụ đề theo thời gian video bằng `TextTrack.activeCues` khi trình duyệt cung cấp track phụ đề có timestamp.
- Kiểm tra caption định kỳ để bắt thay đổi nhanh và hỗ trợ lớp caption DOM của YouTube khi TextTrack không khả dụng.
- Dừng đọc khi video pause/end; đọc lại cue đang hoạt động khi play hoặc seek.
- Tự chọn voice theo ngôn ngữ track hoặc nhận diện script/ngôn ngữ từ văn bản.
- Chọn nhiều voice và bật luân phiên voice theo từng cue.
- Lưu lựa chọn trong `chrome.storage.local`.

## Lưu ý về đồng bộ

YouTube thường vẽ phụ đề qua lớp DOM riêng, không phải lúc nào cũng công khai cue timestamp qua `video.textTracks`. Trong trường hợp đó extension dùng thời điểm caption xuất hiện trong DOM làm mốc kích hoạt. Vì vậy độ chính xác phụ thuộc cách YouTube render caption và thời gian phản hồi của Web Speech API; không thể cam kết đồng bộ tuyệt đối từng mili giây. Voice cũng phụ thuộc các giọng mà hệ điều hành/trình duyệt cài đặt.

## Kiểm thử

Thử với video có phụ đề CC, kiểm tra play/pause/seek, thay đổi ngôn ngữ phụ đề, và bật luân phiên ít nhất hai voice có sẵn trong hệ thống.