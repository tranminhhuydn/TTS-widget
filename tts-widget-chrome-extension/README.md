# TTS-widget – Chrome Extension

## Trạng thái

**Bản tích hợp VieNeu GPU TTS** – Extension Manifest V3 với cơ chế bật/tắt theo tab, hỗ trợ VieNeu GPU và Browser TTS.

## Cách hoạt động

1. Người dùng mở website cần đọc.
2. Nhấn biểu tượng TTS-widget trên thanh công cụ Chrome.
3. Chọn **Kích hoạt trên trang này** để nạp lõi TTS-widget.
4. Mở Reader, nhấn nút **⚙ Cài đặt**. Cài đặt được chia thành năm danh mục: **Giọng đọc**, **Âm thanh**, **Tùy chọn đọc**, **Đồng bộ đọc** và **Highlight**. Trong Giọng đọc, chọn Browser TTS hoặc VieNeu GPU. Khi chọn GPU, danh sách giọng đọc tự tải từ API cổng 8081; có thể tìm kiếm và đánh dấu nhiều giọng bằng checkbox (không cần giữ Ctrl), thử giọng, thêm các giọng đã chọn vào danh sách luân phiên, đổi thứ tự và chỉnh tốc độ/âm lượng riêng cho từng giọng.
5. Nhấn nút **🔊 Đọc nội dung này** xuất hiện ở góc dưới bên phải trang.
6. Trong Cài đặt, cấu hình giọng đọc ở danh mục Giọng đọc; tốc độ, cao độ và âm lượng ở danh mục Âm thanh; các tùy chọn còn lại nằm trong Tùy chọn đọc, Đồng bộ đọc và Highlight. Tốc độ cũng áp dụng cho WAV VieNeu khi phát; cao độ chỉ áp dụng cho Browser TTS. Có thể chọn giao diện Sáng/Tối/Theo hệ thống và cỡ chữ website từ 12–24 px.
7. Chọn **Tắt trên trang này** để dừng đọc và ẩn bộ điều khiển.

Extension chọn vùng nội dung theo thứ tự: `article`, `main`, rồi `body` (khi tìm được ít nhất một khối văn bản phù hợp). Popup xác minh nút loa đã được tạo và hiển thị trước khi báo kích hoạt thành công.

## Cấu trúc

- `manifest.json`: cấu hình Manifest V3 và icon.
- `icons/`: icon 16, 48 và 128 px.
- `popup.html`, `popup.css`, `popup.js`: giao diện bật/tắt bộ đọc cho tab hiện tại.
- `content.js`: tìm vùng nội dung và khởi tạo widget.
- `background.js`: service worker gọi API VieNeu local, tránh giới hạn CORS của content script.
- `vieneu-tts-client.js`: phát WAV, quản lý tạm dừng/tiếp tục/dừng.
- Các module `youtube-*.js` là phần đọc phụ đề YouTube có sẵn; không thuộc tích hợp VieNeu cho Reader website.
- `lib/tts-widget.js`: bản đóng gói của lõi TTS-widget dùng trong Extension.

### Đồng bộ lõi

Chrome Extension phải đóng gói các tệp mà nó sử dụng trong thư mục Extension; đường dẫn trong gói không thể tham chiếu ngược ra ngoài thư mục Extension. Vì vậy `lib/tts-widget.js` là bản đóng gói từ lõi `tts-widget-embeding-web/tts-widget.js`, có phần điều chỉnh riêng cho adapter VieNeu TTS của Extension. Các thay đổi tích hợp engine phải nằm trong bản Extension, không sửa ngược lõi website nếu chưa được yêu cầu.

Khi cập nhật lõi nhúng website, cần chủ động đồng bộ bản này và kiểm tra diff. Không chỉnh sửa trực tiếp một bản mà quên bản còn lại. Nguồn chuẩn hiện tại: [phiên bản nhúng website](../tts-widget-embeding-web/tts-widget.js).

## VieNeu TTS Local

Extension gọi API trên cùng máy tính:

- GPU: `http://127.0.0.1:8081`
- Health: `/health`
- Voices: `/v1/audio/voices?model=vieneu`
- Speech: `POST /v1/audio/speech`

Cần cài và khởi động VieNeu GPU theo [`../tts-local/setup.md`](../tts-local/setup.md). Chọn engine trong **Cài đặt → Giọng đọc** của Reader; thiết lập `ttsEngine` và `ttsLocalVoice` được lưu bằng `chrome.storage.sync`. Browser TTS vẫn được giữ làm lựa chọn thủ công. VieNeu tạo WAV theo từng đoạn văn bản; highlight đồng bộ theo đoạn, còn highlight từng từ và cao độ phụ thuộc Browser TTS. Tốc độ WAV được điều chỉnh ở trình phát phía client.

Các request local được gửi qua Manifest V3 service worker `background.js`. Không mở API ra mạng công cộng; giữ server bind ở `127.0.0.1`.

## Quyền được yêu cầu

- `activeTab`: chỉ cấp quyền tương tác với tab hiện tại sau thao tác rõ ràng của người dùng.
- `scripting`: cho phép nạp các tệp JavaScript đóng gói vào tab hiện tại.
- `storage`: lưu engine và voice đã chọn.
- Host permission `127.0.0.1:8081`: gọi API VieNeu GPU local từ service worker.

Extension hiện dùng content script để quản lý giao diện trang và Manifest V3 service worker để gọi API VieNeu GPU tại localhost; không đưa API local ra Internet.

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
- Chế độ tối/sáng toàn trang dùng các quy tắc CSS tổng quát; website có CSS nền/kiểu chữ đặc thù hoặc shadow DOM có thể cần tinh chỉnh riêng. Ảnh, video, SVG và iframe được loại trừ khỏi tác động font/filter.
- Trên ChatGPT, bộ chọn `main` có thể lấy nhiều khối nội dung trong vùng hội thoại; chưa có bộ điều khiển riêng cho từng phản hồi assistant.
- Extension Reader website hỗ trợ VieNeu TTS Local GPU và Web Speech API của trình duyệt. Phần đọc phụ đề YouTube hiện có không dùng adapter VieNeu trong phạm vi tích hợp này. Nó không truy cập hoặc điều khiển giao diện Chrome Read Aloud và không thể bảo đảm danh sách giọng đọc giống Chrome Read Aloud.
- Các trang nội bộ của Chrome, Chrome Web Store và một số trang có chính sách bảo mật đặc biệt không cho phép Extension chèn script.
- Đọc nền và sự kiện highlight phụ thuộc vào trình duyệt, hệ điều hành và giọng đọc.
- Khi tắt, widget được ẩn và phiên đọc hiện tại bị dừng; tài nguyên và listeners đã đăng ký bởi lõi vẫn còn trong trang để hỗ trợ bật lại mà không phải tải lại trang.

## Kiểm thử

- Popup mở và tự nhận diện trạng thái đang bật/tắt.
- Kích hoạt trên trang bài viết có `article`.
- Kích hoạt trên trang ngắn chỉ có một khối văn bản đọc được.
- Popup chỉ báo thành công khi launcher thực sự tồn tại và hiển thị.
- Kích hoạt trên trang chỉ có `main`.
- Bật → tắt: âm thanh dừng và bộ điều khiển biến mất.
- Tắt → bật lại: bộ điều khiển xuất hiện mà không nhân đôi.
- Mở Reader, chọn giọng, thử giọng, đọc, tạm dừng, tiếp tục và dừng.
- Xác nhận trang nội bộ Chrome bị từ chối với thông báo dễ hiểu.

Xem thêm [prompts.md](./prompts.md) để biết quy tắc phát triển.
