# TTS-widget

Dự án TTS-widget cung cấp công cụ đọc nội dung thành tiếng trên nền web. Repository được tổ chức thành các phiên bản độc lập để việc phát triển một phiên bản không làm thay đổi tài liệu và mã nguồn của phiên bản còn lại.

## Các phiên bản

### 1. TTS Widget nhúng website

Thư mục: [`tts-widget-embeding-web/`](./tts-widget-embeding-web/)

Phiên bản JavaScript có thể nhúng vào website, sử dụng Web Speech API của trình duyệt.

- Mã nguồn chính: [`tts-widget.js`](./tts-widget-embeding-web/tts-widget.js)
- Trang Reader: [`index.html`](./tts-widget-embeding-web/index.html)
- Trang demo: [`demo.html`](./tts-widget-embeding-web/demo.html)
- Tài liệu sử dụng: [`README.md`](./tts-widget-embeding-web/README.md)
- Quy tắc và lịch sử yêu cầu phát triển: [`prompts.md`](./tts-widget-embeding-web/prompts.md)

### 2. TTS Widget Chrome Extension

Thư mục: [`tts-widget-chrome-extension/`](./tts-widget-chrome-extension/)

Khu vực dành riêng cho phiên bản Chrome Extension. Phần này được tách biệt để prompts và mã nguồn Extension không tự ý tác động đến phiên bản nhúng website. Extension sẽ được triển khai ở giai đoạn tiếp theo; thư mục hiện chứa hướng dẫn phạm vi và quy tắc phát triển.

### 3. Network Listener Chrome Extension

Thư mục: [`network-listener-chrome-extension/`](./network-listener-chrome-extension/)

Chrome Extension độc lập để theo dõi Network của tab hiện tại, liệt kê response và xem nội dung text hoặc nhận diện dữ liệu nhị phân. Không phụ thuộc vào TTS-widget.

## Nguyên tắc tổ chức

- Mỗi phiên bản quản lý README, prompts và mã nguồn riêng.
- Không sửa nội dung trong `tts-widget-embeding-web/` khi làm việc cho Chrome Extension, trừ khi có yêu cầu và thống nhất rõ ràng.
- Không sửa prompts của phiên bản nhúng website trong quá trình phát triển Extension.
- Nếu phát hiện cần dùng chung hoặc thay đổi lõi TTS, hãy nêu rõ lý do, phạm vi ảnh hưởng và đề xuất trước khi chỉnh sửa.
- Giữ `.gitignore` tại root để áp dụng cho toàn repository.

## Bắt đầu

Đọc README trong thư mục của phiên bản tương ứng trước khi sử dụng hoặc phát triển phiên bản đó.
