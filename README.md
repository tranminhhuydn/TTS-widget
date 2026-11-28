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

## Quy tắc làm việc với GitHub

Đây là quy tắc bắt buộc khi thực hiện mọi công việc trong repository này:

- **Luôn làm việc trực tiếp trên nhánh `main`**: đọc, tạo và chỉnh sửa file trên `main`.
- **Không tự ý tạo nhánh mới** (feature branch, fix branch hoặc bất kỳ nhánh phụ nào).
- **Không tự tạo Pull Request (PR)** và không yêu cầu người dùng merge PR.
- Sau khi chỉnh sửa, commit thay đổi trực tiếp lên `main` với nội dung commit rõ ràng.
- Trước khi ghi file, phải kiểm tra nội dung hiện tại trên `main` để tránh ghi đè thay đổi mới.
- Không tự ý thay đổi quy trình trên, kể cả khi công việc có nhiều bước hoặc là một tính năng mới. Chỉ thay đổi khi người dùng yêu cầu rõ ràng.
- Các quy tắc phân tách thư mục và phạm vi từng phiên bản ở trên vẫn phải được tuân thủ; làm trực tiếp trên `main` không có nghĩa là được sửa các khu vực ngoài phạm vi yêu cầu.
