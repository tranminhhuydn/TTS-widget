# TTS-widget – Chrome Extension

## Trạng thái

**Bản khởi tạo 0.1.0** – Extension Manifest V3 với cơ chế bật/tắt theo tab.

## Cách hoạt động

1. Người dùng mở website cần đọc.
2. Nhấn biểu tượng TTS-widget trên thanh công cụ Chrome.
3. Popup tự kiểm tra trạng thái của tab hiện tại.
4. Chọn **Kích hoạt trên trang này** để nạp lõi TTS-widget.
5. Nhấn nút **🔊 Đọc nội dung này** xuất hiện ở góc dưới bên phải trang.
6. Mở Cài đặt trong bộ điều khiển để chọn giọng, tốc độ, cao độ, âm lượng và tùy chọn highlight.
7. Chọn **Tắt trên trang này** để dừng đọc, đóng cửa sổ đọc và ẩn bộ điều khiển trên tab hiện tại. Có thể kích hoạt lại mà không cần tải lại trang.

Extension chọn vùng nội dung theo thứ tự: `article`, `main`, rồi `body` (chỉ khi tìm được ít nhất hai khối văn bản phù hợp).

## Cấu trúc

- `manifest.json`: cấu hình Manifest V3 và icon.
- `icons/`: icon 16, 48 và 128 px.
- `popup.html`, `popup.css`, `popup.js`: giao diện bật/tắt bộ đọc cho tab hiện tại.
- `content.js`: tìm vùng nội dung và khởi tạo widget.
- `lib/tts-widget.js`: bản đóng gói của lõi TTS-widget dùng trong Extension.

### Đồng bộ lõi

Chrome Extension phải đóng gói các tệp mà nó sử dụng trong thư mục Extension; đường dẫn trong gói không thể tham chiếu ngược ra ngoài thư mục Extension. Vì vậy `lib/tts-widget.js` là bản đóng gói nguyên trạng từ `tts-widget-embeding-web/tts-widget.js`.

Khi cập nhật lõi nhúng website, cần chủ động đồng bộ bản này và kiểm tra diff. Không chỉnh sửa trực tiếp một bản mà quên bản còn lại. Nguồn chuẩn hiện tại: [phiên bản nhúng website](../tts-widget-embeding-web/tts-widget.js).

## Quyền được yêu cầu

- `activeTab`: chỉ cấp quyền tương tác với tab hiện tại sau thao tác rõ ràng của người dùng.
- `scripting`: cho phép nạp các tệp JavaScript đóng gói vào tab hiện tại.

Không khai báo quyền truy cập tất cả website và không cần service worker ở phiên bản đầu.

## Cài đặt thử

1. Clone hoặc tải repository về máy.
2. Mở `chrome://extensions`.
3. Bật **Developer mode**.
4. Chọn **Load unpacked**.
5. Chọn thư mục `tts-widget-chrome-extension`.
6. Mở một trang web có bài viết và kích hoạt Extension từ biểu tượng trên thanh công cụ.

## Phát hiện nội dung động

Extension theo dõi thay đổi DOM của vùng nội dung bằng `MutationObserver`. Khi ChatGPT, Gemini hoặc website SPA thêm/thay thế nội dung mà không tải lại trang, Reader sẽ cập nhật danh sách đoạn đọc sau một khoảng debounce ngắn. Tính năng này chỉ cập nhật nội dung, **không tự động bắt đầu đọc**. Nếu Reader đang phát âm thanh, việc cập nhật được hoãn đến khi phiên đọc kết thúc hoặc dừng để không làm thay đổi hàng đợi đang phát.

## Giới hạn hiện tại

- Đây là nút đọc cho vùng nội dung của trang, không phải nút riêng trên từng câu trả lời ChatGPT.
- Trên ChatGPT, bộ chọn `main` có thể lấy nhiều khối nội dung trong vùng hội thoại; chưa có bộ điều khiển riêng cho từng phản hồi assistant.
- Extension dùng Web Speech API của trình duyệt. Nó không truy cập hoặc điều khiển giao diện Chrome Read Aloud và không thể bảo đảm danh sách giọng đọc giống Chrome Read Aloud.
- Các trang nội bộ của Chrome, Chrome Web Store và một số trang có chính sách bảo mật đặc biệt không cho phép Extension chèn script.
- Đọc nền và sự kiện highlight phụ thuộc vào trình duyệt, hệ điều hành và giọng đọc.
- Khi tắt, widget được ẩn và phiên đọc hiện tại bị dừng; tài nguyên và listeners đã đăng ký bởi lõi vẫn còn trong trang để hỗ trợ bật lại mà không phải tải lại trang.

## Kiểm thử

- Popup mở và tự nhận diện trạng thái đang bật/tắt.
- Kích hoạt trên trang bài viết có `article`.
- Kích hoạt trên trang chỉ có `main`.
- Bật → tắt: âm thanh dừng và bộ điều khiển biến mất.
- Tắt → bật lại: bộ điều khiển xuất hiện mà không nhân đôi.
- Mở Reader, chọn giọng, thử giọng, đọc, tạm dừng, tiếp tục và dừng.
- Xác nhận trang nội bộ Chrome bị từ chối với thông báo dễ hiểu.

Xem thêm [prompts.md](./prompts.md) để biết quy tắc phát triển.
