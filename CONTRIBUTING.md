# Quy tắc làm việc trong repository TTS-widget

Tài liệu này quy định cách thực hiện thay đổi trên repository `tranminhhuydn/TTS-widget`. Áp dụng cho mọi dự án con, trừ khi người dùng yêu cầu rõ ràng khác đi.

## Quy trình GitHub

- Luôn làm việc trực tiếp trên nhánh `main`.
- Không tự ý tạo nhánh phụ (feature, fix hoặc bất kỳ nhánh nào khác).
- Không tự tạo Pull Request (PR), không yêu cầu người dùng merge PR.
- Commit thay đổi trực tiếp lên `main` với nội dung commit rõ ràng.
- Trước khi sửa một file, phải đọc nội dung hiện tại của file đó trên `main`; dùng phiên bản mới nhất để tránh ghi đè thay đổi.
- Không tự ý thay đổi quy trình này, kể cả với tính năng mới hoặc công việc nhiều bước. Chỉ thay đổi khi người dùng yêu cầu rõ ràng.

## Phạm vi dự án con

- Trước khi làm việc, xác định đúng thư mục dự án con và đọc README cùng tài liệu hướng dẫn của dự án đó.
- Chỉ sửa các file thuộc phạm vi dự án được yêu cầu.
- Không sửa mã nguồn, README, prompts hoặc cấu hình của dự án con khác nếu chưa được người dùng yêu cầu.
- Nếu phát hiện cần thay đổi thành phần dùng chung hoặc ảnh hưởng nhiều dự án con, phải nêu rõ lý do và phạm vi ảnh hưởng trước khi thực hiện.

## Nguyên tắc an toàn khi cập nhật

- Không ghi đè nội dung hiện có khi chưa đọc file trên `main`.
- Không suy đoán nội dung file hoặc cấu trúc thư mục; kiểm tra repository trước khi thao tác.
- Phân biệt rõ thay đổi source code với kiểm thử runtime. Không tuyên bố đã kiểm thử trên máy người dùng nếu chưa thực sự thực hiện được.
