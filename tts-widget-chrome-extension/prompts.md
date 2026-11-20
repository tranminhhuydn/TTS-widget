# Prompts – TTS-widget Chrome Extension

## Vai trò

Bạn đang phát triển phiên bản **TTS-widget Chrome Extension** trong thư mục `tts-widget-chrome-extension/` của repository.

## Quy tắc bắt buộc về phạm vi

1. Chỉ tạo mới hoặc chỉnh sửa tệp bên trong `tts-widget-chrome-extension/`, trừ khi người dùng yêu cầu rõ ràng khác.
2. Không tự ý chỉnh sửa, di chuyển, đổi tên hoặc xóa bất kỳ tệp nào trong `tts-widget-embeding-web/`.
3. Không chỉnh sửa `tts-widget-embeding-web/prompts.md`. Tệp đó là bộ yêu cầu độc lập của phiên bản nhúng website.
4. Không thay đổi `.gitignore` hoặc README tổng quan ở root nếu không có yêu cầu.
5. Trước mỗi thay đổi, xác định rõ phiên bản đang làm việc và liệt kê các tệp dự kiến bị tác động.

## Tái sử dụng lõi TTS

- Ưu tiên tái sử dụng mã nguồn và hành vi đã có của phiên bản nhúng website; không viết lại lõi chỉ để phù hợp với cấu trúc Extension.
- Không sao chép mã nguồn một cách tùy tiện hoặc tạo hai bản lõi lệch nhau.
- Không giả định Chrome Extension có thể truy cập hoặc điều khiển giao diện Chrome Read Aloud hay danh sách giọng đọc riêng của tính năng đó. Phải phân biệt rõ Web Speech API với Chrome Read Aloud.
- Nếu việc tích hợp đòi hỏi sửa đổi lõi trong `tts-widget-embeding-web/`, hãy dừng trước khi sửa và trình bày:
  - lý do kỹ thuật;
  - tệp và API bị ảnh hưởng;
  - tác động ngược đến phiên bản nhúng website;
  - phương án thay thế không sửa lõi;
  - đề xuất cần người dùng phê duyệt.

## Nguyên tắc triển khai

- Tuân thủ Manifest V3 và các giới hạn hiện hành của Chrome Extensions.
- Tách biệt content script, service worker, popup/options và tài nguyên dùng chung khi kiến trúc thực tế yêu cầu.
- Chỉ thêm quyền Extension tối thiểu cần thiết; giải thích mục đích từng quyền.
- Không thêm thư viện hoặc phụ thuộc nếu chưa có lý do rõ ràng.
- Bảo toàn các tính năng hiện có khi tích hợp; không tuyên bố tính năng hoạt động nếu chưa kiểm thử.
- Khi báo cáo hoàn thành, nêu tệp đã thay đổi, cách cài thử bằng chế độ Developer mode, các bước kiểm thử và giới hạn còn lại.

## Quy trình làm việc

1. Đọc README và prompts này trước khi thực hiện.
2. Kiểm tra cấu trúc và mã nguồn hiện có trong thư mục Extension.
3. Đề xuất thiết kế ngắn gọn trước các thay đổi có ảnh hưởng kiến trúc.
4. Triển khai theo từng bước nhỏ, giữ phạm vi thay đổi trong thư mục Extension.
5. Kiểm tra cú pháp, manifest và luồng hoạt động liên quan.
6. Báo cáo rõ những gì đã làm và những gì chưa được xác minh.


## Hỗ trợ khối mã nguồn (pre/code)

- Bộ nhận diện vùng nội dung và bộ trích xuất đoạn đọc phải hỗ trợ khối mã nguồn hiển thị trong thẻ `pre`.
- Khi lấy nội dung, ưu tiên xử lý mỗi `pre` như một đoạn đọc duy nhất; không đồng thời lấy các `code` con riêng lẻ vì sẽ gây đọc trùng.
- Dùng văn bản hiển thị (`innerText`) để giữ nội dung người dùng thực sự nhìn thấy; kiểm tra các trang SPA như Gemini khi nội dung được render động.
- Không đưa nút sao chép, nút thao tác hoặc nhãn giao diện bên ngoài `pre` vào nội dung đọc.
- Khi sửa logic trích xuất, phải kiểm tra cả văn bản thường và khối mã để tránh hồi quy.

- Khi trích xuất danh sách, không được đọc trùng nội dung giữa `li` và các phần tử con như `p`; với `li` lồng nhau, chỉ giữ nội dung riêng của từng mục và loại phần danh sách con khỏi văn bản của mục cha.
- Với `blockquote` hoặc `pre` chứa các phần tử con có thể đọc, tránh đưa đồng thời cả phần tử cha và các phần tử con vào hàng đợi.
- Khi trích xuất danh sách động, bỏ qua phần tử không hiển thị (`display:none`, `visibility:hidden` hoặc không có bounding client rect); phát hiện mục `li` trùng văn bản trong cùng một list container để tránh đọc hai bản DOM của cùng mục.


## Điều khiển Đọc/Tiếp tục dùng chung

- Chỉ sử dụng một nút điều khiển cho hai hành động **Đọc** và **Tiếp tục**.
- Khi trạng thái là `paused`, nút hiển thị biểu tượng/nhãn **Tiếp tục** và gọi `SpeechManager.resume()` để tiếp tục đúng vị trí.
- Với các trạng thái còn lại có nội dung để đọc, nút hiển thị **Đọc** và bắt đầu phiên đọc từ đầu bằng `SpeechManager.start(0)`.
- Khi trạng thái là `reading` hoặc `testing`, vô hiệu hóa nút Đọc/Tiếp tục để tránh khởi động chồng hoặc khởi động lại ngoài ý muốn.
- Giữ nút **Tạm dừng** riêng; cập nhật nhãn, tiêu đề và trạng thái disabled của nút dùng chung theo trạng thái SpeechManager.
- Không tạo lại nút Tiếp tục riêng.
