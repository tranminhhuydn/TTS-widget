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
- `index.html`: trang Web Reader độc lập được giữ lại từ phiên bản trước khi tách widget.
- `demo.html`: trang demo riêng cho bản widget JavaScript có thể nhúng.
- `prompts.md`: đặc tả phát triển và tiêu chí nghiệm thu.

## Chạy demo

1. Tải hoặc clone repository.
2. Mở `index.html` để sử dụng trang Web Reader độc lập phiên bản gốc.
3. Mở `demo.html` để thử bản `tts-widget.js` có thể nhúng vào website.
4. Trong trang demo, nhấn **📖 Mở chế độ đọc** được widget tự thêm ngay sau vùng bài viết.
5. Chọn giọng đọc trong **Cài đặt → Giọng đọc**, sau đó nhấn Đọc.

Để tránh các giới hạn bảo mật của một số trình duyệt với file cục bộ, nên chạy bằng static server, ví dụ:

```bash
python -m http.server 8000
```

Sau đó mở `http://localhost:8000/index.html` để dùng Reader độc lập hoặc `http://localhost:8000/demo.html` để thử widget nhúng.

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

Widget sẽ tự tìm phần tử theo selector, tạo nút mở Reader ngay sau nội dung và tự dựng giao diện đọc. Mặc định selector là `article` nếu không truyền `data-content-selector`.

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

- Mở Reader riêng, giữ nội dung bài viết và cấu trúc tiêu đề/đoạn/danh sách.
- Đọc, tạm dừng, tiếp tục, dừng và chuyển đoạn.
- Chọn, tìm kiếm, làm mới và thử giọng đọc.
- Điều chỉnh tốc độ, cao độ và âm lượng.
- Chủ đề giấy, sáng, tối; thay đổi phông, cỡ chữ, chiều cao dòng và chiều rộng.
- Thanh công cụ ở Header hoặc Footer.
- Theo dõi đoạn và từ khi trình duyệt/giọng đọc hỗ trợ sự kiện boundary.
- Tự cuộn theo đoạn đang đọc.
- Menu chuột phải “Đọc từ đây” trong Reader.
- Lưu cài đặt trong localStorage.
- Nhận diện Web Speech API; nếu không hỗ trợ, Reader vẫn mở để đọc bằng mắt.

## Giới hạn

Giọng đọc được cung cấp bởi trình duyệt và hệ điều hành; danh sách và chất lượng giọng tiếng Việt tùy thiết bị. Sự kiện đồng bộ từ `onboundary` không được hỗ trợ đồng nhất.

Đọc nền khi chuyển tab hoặc cửa sổ là best-effort. Trình duyệt hoặc hệ điều hành vẫn có thể đóng băng tab, hủy utterance, dừng âm thanh hoặc đưa thiết bị vào chế độ ngủ.

## Xử lý sự cố

- **Không thấy nút mở Reader**: kiểm tra selector trong `data-content-selector` có trỏ đúng phần tử tồn tại khi script chạy hay không.
- **Không có âm thanh**: kiểm tra Web Speech API, âm lượng hệ thống và giọng đã chọn.
- **Không có giọng tiếng Việt**: cài giọng tiếng Việt ở hệ điều hành nếu có, sau đó nhấn Làm mới trong Settings.
- **Không highlight từng từ**: giọng đọc hoặc trình duyệt có thể không phát `onboundary`; khi đó widget chỉ có thể theo dõi đoạn.
- **Đọc nền bị ngắt**: đây là giới hạn của trình duyệt/hệ điều hành; quay lại tab để widget thử khôi phục phiên nếu có thể.
