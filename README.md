# TTS Widget – JavaScript Reader

TTS Widget là tiện ích đọc nội dung website thành tiếng bằng Web Speech API có sẵn trong trình duyệt. Phiên bản này được đóng gói thành JavaScript có thể nhúng vào nhiều website mà không cần sao chép HTML/CSS của Reader.

## Mục lục

- [Cấu trúc repository](#cấu-trúc-repository)
- [Chạy demo](#chạy-demo)
- [Nhúng vào website](#nhúng-vào-website)
- [API JavaScript](#api-javascript)
- [Các tính năng](#các-tính-năng)
- [Giới hạn](#giới-hạn)
- [Xử lý sự cố](#xử-lý-sự-cố)

## Cấu trúc repository

- `tts-widget.js`: mã nguồn widget; tự tạo giao diện Reader, thanh công cụ, Settings và CSS.
- `demo.html`: trang mẫu có bài viết dài để thử đọc.
- `index.html`: trang Web Reader chính, giữ nội dung/bố cục gốc và nhúng `tts-widget.js`.
- `demo.html`: trang demo nội dung dài, cũng nhúng `tts-widget.js`.
- `prompts.md`: đặc tả phát triển và tiêu chí nghiệm thu.

## Chạy demo

1. Tải hoặc clone repository.
2. Mở `index.html` để sử dụng trang Web Reader chính với nội dung/bố cục gốc.
3. Mở `demo.html` để thử widget trên bài viết dài.
4. Cả hai trang đều tải cùng `tts-widget.js`; widget tự thêm nút **🔊 Đọc nội dung này** cố định ở góc dưới bên phải viewport.
5. Chọn giọng đọc trong **Cài đặt → Giọng đọc**, sau đó nhấn Đọc.

Để tránh các giới hạn bảo mật của một số trình duyệt với file cục bộ, nên chạy bằng static server, ví dụ:

```bash
python -m http.server 8000
```

Sau đó mở `http://localhost:8000/index.html` để dùng trang Reader chính hoặc `http://localhost:8000/demo.html` để thử bài viết demo.

## Nhúng vào website

Đặt `tts-widget.js` trên máy chủ của website hoặc trong thư mục tài nguyên tĩnh, sau đó thêm thẻ script ở cuối body hoặc dùng thuộc tính `defer`.

Ví dụ website có vùng nội dung:

```html
<article id="article">
  <h1>Tiêu đề bài viết</h1>
  <p>Nội dung cần đọc...</p>
</article>

<script src="/assets/tts-widget.js" defer data-content-selector="#article"></script>
```

Widget sẽ tự tìm phần tử theo selector, tạo nút mở Reader cố định ở góc dưới bên phải viewport và tự dựng giao diện điều khiển. Khi mở, nội dung website gốc vẫn hiển thị và tương tác bình thường. Mặc định selector là `article` nếu không truyền `data-content-selector`.

Không cần sao chép markup Reader, CSS hoặc JavaScript nội bộ vào website chủ.

## API JavaScript

Có thể khởi tạo chủ động khi cần:

```html
<script src="/assets/tts-widget.js" defer></script>
<script>
  window.addEventListener("DOMContentLoaded", () => {
    window.TTSWidget.init({ contentSelector: ".post-content" });
  });
</script>
```

`init(options)` hiện hỗ trợ:

| Thuộc tính | Mặc định | Ý nghĩa |
|---|---|---|
| `contentSelector` | `article` | CSS selector của phần tử chứa nội dung cần đọc |

Khởi tạo lặp lại không tạo thêm bản sao widget.

## Các tính năng

- Đọc trực tiếp DOM website gốc, không tạo bản sao nội dung.
- Khi mở Reader, website gốc vẫn hiển thị và tương tác bình thường; không có lớp phủ toàn màn hình hoặc vùng nội dung Reader che trang.
- Reading Highlight đánh dấu trực tiếp phần tử và text node gốc; không clone hoặc bọc văn bản.
- Thanh điều khiển nổi độc lập, đặt ở Header hoặc Footer; nút mở Reader cố định ở góc màn hình, không chiếm chỗ trong luồng nội dung.
- Đọc, tạm dừng, tiếp tục, dừng, chuyển đoạn và đọc từ đây.
- Chọn/tìm/làm mới/thử giọng; điều chỉnh tốc độ, cao độ và âm lượng.
- Reading Highlight đồng thời cho đoạn và từng từ: đoạn được tô nền khi đọc, từng từ được đánh dấu theo sự kiện `onboundary` nếu giọng đọc/trình duyệt hỗ trợ; cả hai đều tác động trực tiếp lên DOM gốc.
- Tùy chỉnh màu highlight, bật/tắt đồng bộ và lưu cài đặt.
- Đọc nền best-effort; nhận diện Web Speech API.

## Nguyên tắc không can thiệp website

- Không clone hoặc thay đổi cấu trúc DOM; không sửa CSS, class gốc, inline style, font, kích thước hoặc bố cục.
- Không khóa hoặc tự cuộn trang; không thay đổi html/body.
- Chỉ thêm/gỡ class highlight riêng; highlight từ không bọc hoặc sửa text node.
- Giao diện nổi chỉ gồm launcher, toolbar, Settings, status và context menu; không tạo backdrop/lớp phủ toàn màn hình, không che nội dung và không chiếm chỗ trong luồng nội dung.
- Wrapper Reader dùng tên class/ID có namespace riêng để tránh xung đột với CSS của website host.

## Giới hạn

Giọng đọc được cung cấp bởi trình duyệt và hệ điều hành; danh sách và chất lượng giọng tiếng Việt tùy thiết bị. Sự kiện đồng bộ từ `onboundary` không được hỗ trợ đồng nhất.

Đọc nền khi chuyển tab hoặc cửa sổ là best-effort. Trình duyệt hoặc hệ điều hành vẫn có thể đóng băng tab, hủy utterance, dừng âm thanh hoặc đưa thiết bị vào chế độ ngủ.

## Xử lý sự cố

- **Không thấy nút mở Reader**: kiểm tra `data-content-selector` có trỏ đúng phần tử nội dung; kiểm tra Console có lỗi JavaScript; thử tải lại trang sau khi xác nhận script `tts-widget.js` đã tải thành công. Launcher được cố định ở góc dưới bên phải và có CSS ưu tiên để tránh bị CSS website chủ che hoặc ẩn.
- **Không có âm thanh**: kiểm tra Web Speech API, âm lượng hệ thống và giọng đã chọn.
- **Không có giọng tiếng Việt**: cài giọng tiếng Việt ở hệ điều hành nếu có, sau đó nhấn Làm mới trong Settings.
- **Không highlight từng từ**: giọng đọc hoặc trình duyệt có thể không phát `onboundary` hoặc không hỗ trợ CSS Custom Highlight API; khi đó highlight đoạn vẫn hoạt động. Vị trí từng từ được tính riêng trong từng utterance để tránh lệch khi một đoạn được chia thành nhiều lượt đọc.
- **Đọc nền bị ngắt**: đây là giới hạn của trình duyệt/hệ điều hành; quay lại tab để widget thử khôi phục phiên nếu có thể.


### Khắc phục xung đột CSS với website chủ

Launcher được tạo bên trong root riêng của widget, cố định ở góc dưới bên phải viewport và đặt z-index cao. CSS của launcher reset các thuộc tính hiển thị thiết yếu để hạn chế xung đột với quy tắc button toàn cục của website tích hợp.
