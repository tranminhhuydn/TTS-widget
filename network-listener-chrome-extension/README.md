# Network Listener Chrome Extension

Chrome Extension độc lập (Manifest V3) để theo dõi Network của tab hiện tại, liệt kê response và xem Response Body dạng văn bản.

## Chức năng

1. **Lắng nghe:** bật/tắt giám sát Network của tab hiện tại.
2. **Danh sách file:** liệt kê request/response được ghi nhận, kèm method, URL, HTTP status và MIME type.
3. **Xem file:** chọn một mục để xem metadata và Response Body nếu là văn bản. Nội dung nhị phân chỉ hiển thị thông báo, không giải mã thành text.

## Cài đặt

1. Mở Chrome hoặc Edge và truy cập `chrome://extensions` hoặc `edge://extensions`.
2. Bật **Developer mode / Chế độ nhà phát triển**.
3. Chọn **Load unpacked / Tải tiện ích đã giải nén**.
4. Chọn thư mục `network-listener-chrome-extension`.
5. Mở website cần kiểm tra, bấm biểu tượng Network Listener, rồi chọn **Bắt đầu lắng nghe**.
6. Tải lại trang hoặc thao tác trên website để ghi nhận các request mới.

## Cơ chế kỹ thuật

- Dùng `chrome.debugger` với Chrome DevTools Protocol Network domain.
- Dùng `Network.requestWillBeSent`, `Network.responseReceived`, `Network.loadingFinished` và `Network.getResponseBody`.
- Chỉ lưu văn bản có thể đọc; nội dung nhị phân không được hiển thị.
- Response text bị giới hạn xem trước ở 500 KB mỗi file; danh sách tối đa 300 mục.
- Dữ liệu lưu trong `chrome.storage.session`, không gửi ra máy chủ và bị xóa khi phiên trình duyệt kết thúc.

## Lưu ý và giới hạn

- Chrome hiển thị cảnh báo quyền truy cập khi cài đặt do quyền `debugger` có phạm vi mạnh. Extension chỉ attach vào tab khi người dùng chủ động nhấn **Bắt đầu lắng nghe**.
- Một số tab đặc biệt như `chrome://`, Chrome Web Store và trang nội bộ của trình duyệt không cho phép debugger attach.
- Response body có thể không khả dụng với một số request, nội dung streaming, cache hoặc tài nguyên đã bị Chrome loại khỏi bộ đệm.
- Dữ liệu binary được nhận diện theo MIME type và kiểm tra byte mẫu; định dạng không chuẩn có thể cần cải thiện bộ nhận diện.
- WebSocket frames và EventSource streaming chưa được đưa vào danh sách response body trong phiên bản đầu.
- Khi popup đóng, giám sát vẫn tiếp tục cho đến khi người dùng dừng hoặc tab đóng. Chrome DevTools đang mở có thể xung đột với debugger attachment.
