# TTS-widget

Trình đọc nội dung trên trang web và đọc văn bản thành tiếng bằng **Web Speech API** có sẵn trong trình duyệt. Giao diện Reader tách nội dung bài viết khỏi các thành phần gây xao nhãng, đồng thời cung cấp điều khiển giọng đọc, đồng bộ đoạn đang đọc và tùy chỉnh cách hiển thị.

## Mục lục

- [1. Yêu cầu](#1-yêu-cầu)
- [2. Khởi chạy](#2-khởi-chạy)
- [3. Sử dụng Reader](#3-sử-dụng-reader)
- [4. Điều khiển đọc](#4-điều-khiển-đọc)
- [5. Cài đặt](#5-cài-đặt)
- [6. Đọc từ vị trí chuột phải](#6-đọc-từ-vị-trí-chuột-phải)
- [7. Lưu và khôi phục cài đặt](#7-lưu-và-khôi-phục-cài-đặt)
- [8. Đọc nền và giới hạn](#8-đọc-nền-và-giới-hạn)
- [9. Xử lý sự cố](#9-xử-lý-sự-cố)
- [10. Công nghệ](#10-công-nghệ)

## 1. Yêu cầu

- Trình duyệt hiện đại có hỗ trợ **Web Speech API**; dự án hướng tới Chrome.
- Trình duyệt hoặc hệ điều hành cần có ít nhất một giọng đọc được cài đặt.
- Kết nối HTTPS hoặc chạy trên `localhost` được khuyến nghị khi triển khai/kiểm tra trên web.
- Giọng tiếng Việt không được đảm bảo có sẵn trên mọi máy; danh sách giọng phụ thuộc trình duyệt và hệ điều hành.

## 2. Khởi chạy

Dự án hiện được tổ chức trong một file chính là `index.html`.

1. Tải hoặc clone repository về máy.
2. Mở `index.html` bằng Chrome để chạy thử; khi triển khai lên website, hãy phục vụ file qua HTTPS.
3. Nhấn **Mở chế độ đọc** để mở Reader.

Không cần cài thư viện JavaScript bên ngoài hoặc chạy máy chủ backend cho chức năng đọc cơ bản.

## 3. Sử dụng Reader

1. Nhấn **Mở chế độ đọc**.
2. Reader tạo bản trình bày riêng từ nội dung trong vùng bài viết `article`.
3. Đọc nội dung bằng nút **Đọc**, hoặc nhấn chuột phải trên một đoạn/tiêu đề trong Reader và chọn **Đọc từ đây**.
4. Nhấn **Đóng** hoặc phím **Escape** để thoát Reader.

Reader hiện có một trạng thái hiển thị bình thường; không có chế độ thu nhỏ hoặc mở rộng cửa sổ Reader. Có thể thu gọn thanh công cụ để dành thêm không gian cho nội dung.

> Lưu ý: bản demo hiện lấy nội dung từ phần tử `#article`. Khi tích hợp vào website khác, cần điều chỉnh bộ chọn nguồn nội dung cho phù hợp với cấu trúc trang đó.

## 4. Điều khiển đọc

| Điều khiển | Chức năng |
|---|---|
| ✕ | Đóng Reader |
| ⏮ | Chuyển về đoạn trước |
| ▶ | Bắt đầu đọc từ đầu nội dung |
| ⏸ | Tạm dừng |
| ⏵ | Tiếp tục từ vị trí đã tạm dừng |
| ■ | Dừng phiên đọc |
| ⏭ | Chuyển đến đoạn tiếp theo |
| ⚙ | Mở/đóng bảng Settings |
| ⌄ | Thu gọn/mở rộng các điều khiển phụ trên thanh công cụ |
| A− / A+ | Giảm/tăng cỡ chữ nhanh |
| Đổi nền | Chuyển giữa nền màu giấy, tối và sáng |

Các nút điều khiển được vô hiệu hóa khi thao tác tương ứng không khả dụng.

**Phân biệt Pause và Stop:**
- **Pause** tạm dừng phiên đọc để có thể tiếp tục.
- **Stop** hủy phiên đọc hiện tại. Nhấn Đọc để bắt đầu một phiên mới.

## 5. Cài đặt

Nhấn biểu tượng **⚙ Settings** trên thanh công cụ. Các thay đổi được áp dụng trực tiếp lên Reader.

### Giao diện

- Chọn chủ đề màu giấy, sáng hoặc tối.
- Thu gọn thanh công cụ.
- Bật/tắt tự cuộn theo đoạn đang đọc.
- Bật/tắt tùy chọn tiếp tục đọc khi chuyển tab hoặc cửa sổ mất tiêu điểm.

### Kiểu chữ

- Chọn phông chữ.
- Điều chỉnh cỡ chữ.
- Điều chỉnh chiều cao dòng.
- Điều chỉnh chiều rộng vùng nội dung.

Ngoài Settings, có thể dùng các nút A−, A+ và Đổi nền để thay đổi nhanh.

### Giọng đọc

1. Mở nhóm **Giọng đọc** trong Settings.
2. Nhập tên hoặc mã ngôn ngữ vào ô lọc để tìm giọng.
3. Chọn giọng trong danh sách.
4. Nhấn **Thử giọng** để nghe mẫu.
5. Dùng **Làm mới** nếu danh sách giọng chưa xuất hiện hoặc vừa thay đổi.

Có thể điều chỉnh:
- **Tốc độ (Rate):** tốc độ phát âm.
- **Cao độ (Pitch):** cao độ giọng.
- **Âm lượng (Volume):** âm lượng do SpeechSynthesis yêu cầu.

Danh sách được lấy trực tiếp từ `speechSynthesis.getVoices()`; widget không tự tạo giọng đọc.

### Đồng bộ đọc

- **Theo dõi đoạn đang đọc:** đánh dấu đoạn tương ứng với tiến trình đọc.
- **Highlight từ nếu API hỗ trợ:** đánh dấu từ khi trình duyệt/giọng đọc cung cấp sự kiện `onboundary`.

### Highlight

- Bật/tắt đánh dấu đoạn.
- Chọn màu nền, màu chữ và màu viền của đoạn đang đọc.

Nếu giọng đọc không cung cấp sự kiện ranh giới từ đáng tin cậy, tính năng đánh dấu từ có thể không hoạt động; đánh dấu đoạn là cơ chế dự phòng.

Nhấn **Mặc định** để khôi phục cấu hình Settings. Nhấn **Lưu cài đặt** để lưu cấu hình hiện tại.

## 6. Đọc từ vị trí chuột phải

Tính năng này chỉ hoạt động khi Reader đang mở:

1. Đưa con trỏ đến đoạn văn hoặc tiêu đề muốn bắt đầu đọc.
2. Nhấn chuột phải.
3. Chọn **▶ Đọc từ đây**.

Widget sẽ bắt đầu từ khối nội dung được chọn trong Reader. Menu được đặt cạnh con trỏ và tự điều chỉnh để không vượt khỏi viewport.

Menu đóng khi chọn lệnh, nhấn ra ngoài, nhấn Escape, cuộn trang hoặc thay đổi kích thước cửa sổ. Khi Reader đóng, menu tùy chỉnh được gỡ khỏi DOM và chuột phải trên trang nguồn sử dụng menu mặc định của trình duyệt.

## 7. Lưu và khôi phục cài đặt

Widget sử dụng `localStorage` của trình duyệt để lưu cấu hình và định danh giọng đọc đã chọn.

- Cấu hình giao diện, kiểu chữ, tốc độ, cao độ, âm lượng và highlight được lưu theo trình duyệt.
- Giọng đọc được lưu bằng thông tin định danh như `voiceURI`, tên và ngôn ngữ; đối tượng Voice thực tế được lấy lại từ danh sách giọng của trình duyệt.
- Khi tải lại trang, widget đối chiếu định danh đã lưu với danh sách giọng hiện có. Nếu giọng cũ không còn, widget chọn giọng tiếng Việt phù hợp nếu có, nếu không thì dùng giọng mặc định hoặc giọng đầu tiên.
- Dữ liệu `localStorage` thuộc phạm vi trình duyệt và origin hiện tại; xóa dữ liệu website hoặc đổi trình duyệt có thể làm mất cấu hình.

## 8. Đọc nền và giới hạn

Tùy chọn **Tiếp tục đọc khi chuyển tab hoặc cửa sổ mất tiêu điểm** cho phép widget cố gắng duy trì phiên đọc khi người dùng chuyển sang tab, cửa sổ hoặc ứng dụng khác.

Đây là cơ chế **best-effort**, không phải bảo đảm phát âm thanh nền liên tục. Web Speech API và trình duyệt có thể bị giới hạn bởi:

- Tab bị đóng băng hoặc bị loại khỏi bộ nhớ (discard).
- Trình duyệt hoặc hệ điều hành tạm dừng tiến trình nền.
- Thiết bị chuyển sang chế độ ngủ hoặc tiết kiệm năng lượng.
- Giọng đọc hoặc hệ điều hành ngắt utterance.
- Chính sách âm thanh và quyền riêng tư của nền tảng.

Khi quay lại trang, widget có thể thử khôi phục utterance hiện tại nếu trạng thái ứng dụng vẫn là đang đọc. Widget không thể vượt qua các giới hạn do trình duyệt hoặc hệ điều hành áp đặt.

## 9. Xử lý sự cố

**Không thấy giọng đọc**
- Chờ trình duyệt tải danh sách giọng.
- Nhấn **Làm mới**.
- Kiểm tra cài đặt Speech/Accessibility hoặc Text-to-Speech của hệ điều hành.
- Thử tải lại trang.

**Không có giọng tiếng Việt**
- Kiểm tra xem hệ điều hành đã cài giọng tiếng Việt hay chưa.
- Thử tìm bằng mã ngôn ngữ `vi` hoặc `vi-VN`.
- Nếu thiết bị không cung cấp giọng tiếng Việt, widget không thể tự tạo giọng thay thế.

**Không đánh dấu được từ đang đọc**
- Kiểm tra tùy chọn **Highlight từ nếu API hỗ trợ**.
- Thử một giọng khác. Không phải mọi giọng đều phát sự kiện `onboundary` giống nhau.

**Đọc nền bị ngắt**
- Quay lại tab Reader để widget kiểm tra và thử khôi phục phiên đọc.
- Nếu trình duyệt đã discard trang hoặc hệ điều hành chặn âm thanh nền, người dùng có thể phải bắt đầu đọc lại.

**Không đọc đúng nội dung website**
- Bản hiện tại lấy nội dung từ `#article`; cần cấu hình lại vùng nguồn nếu website sử dụng selector khác.

## 10. Công nghệ

- HTML5
- CSS
- JavaScript thuần
- Web Speech API: `SpeechSynthesis`, `SpeechSynthesisUtterance`
- `localStorage` để lưu cài đặt trên trình duyệt

---

**Lưu ý phát triển:** `prompts.md` là đặc tả chức năng và tiêu chí nghiệm thu. README mô tả cách sử dụng theo hành vi hiện có; khi tính năng thay đổi, cần cập nhật README để tránh hướng dẫn sai lệch.
