# PROMPT BỔ SUNG – PHÁT TRIỂN TTS-WIDGET CHO WEB

## 1. Mục tiêu

Tiếp tục phát triển TTS-widget dựa trên mã nguồn `index.html` hiện tại.

Xây dựng một trình đọc văn bản trên web sử dụng tối đa các khả năng mà Chrome Web Speech API cung cấp.

**Nguyên tắc bắt buộc:**
- Chỉ duy trì một file `index.html`.
- Không chia HTML, CSS, JavaScript thành các file riêng.
- Không viết lại toàn bộ ứng dụng nếu không cần thiết.
- Bảo toàn các chức năng đang hoạt động.
- Chỉ cập nhật những phần liên quan đến yêu cầu mới.
- Không sử dụng API giả lập hoặc tự nhận có tính năng mà Chrome không cung cấp.

## 2. Phân chia hệ thống chức năng

Thiết kế hệ thống thành 5 nhóm cài đặt độc lập.

### 2.1. Giao diện (Interface)

Cho phép cấu hình:
- Vị trí và cách hiển thị TTS-widget.
- Kích thước cửa sổ đọc.
- Reader chỉ có một trạng thái hiển thị: cửa sổ đọc bình thường; không có chế độ thu nhỏ hoặc mở rộng.
- Giao diện sáng, tối, màu giấy.
- Thanh công cụ thu gọn hoặc mở rộng.
- Hiển thị hoặc ẩn các thành phần điều khiển.
- Responsive cho desktop, tablet và mobile.

### 2.2. Phông chữ (Typography)

Cho phép cấu hình:
- Họ phông chữ.
- Kích thước chữ.
- Độ đậm.
- Chiều cao dòng.
- Khoảng cách giữa các đoạn.
- Chiều rộng vùng văn bản.

Các thay đổi phải được áp dụng trực tiếp lên vùng nội dung đọc.

### 2.3. Giọng nói (Voice)

Khai thác các thuộc tính của `SpeechSynthesis` và `SpeechSynthesisUtterance`.

Cho phép:
- Liệt kê tất cả giọng đọc mà trình duyệt cung cấp.
- Chọn giọng đọc.
- Hiển thị tên giọng và ngôn ngữ.
- Phân biệt giọng mặc định và giọng cài trên thiết bị.
- Tìm kiếm giọng đọc.
- Lọc giọng theo ngôn ngữ.
- Làm mới danh sách giọng đọc.
- Điều chỉnh `rate`.
- Điều chỉnh `pitch`.
- Điều chỉnh `volume`.
- Thử giọng trước khi áp dụng.
- Bộ chọn giọng, ô tìm kiếm/lọc, nút làm mới và nút thử giọng phải nằm bên trong nhóm Voice của bảng Settings, không nằm ngoài bảng Settings.
- Lưu định danh giọng đã chọn (`voiceURI`, tên, ngôn ngữ); khi tải lại trang, đối chiếu với danh sách giọng thực tế và khôi phục nếu còn tồn tại.

Không tự tạo danh sách giọng đọc. Phải lấy dữ liệu thực tế từ `speechSynthesis.getVoices()`.

### 2.4. Đánh dấu bằng giọng nói (Speech Synchronization)

Thiết kế cơ chế đồng bộ giữa văn bản và tiến trình đọc.

Yêu cầu:
- Theo dõi đoạn văn đang được đọc.
- Xác định câu đang được đọc nếu có thể.
- Hỗ trợ điều hướng đến đoạn trước và đoạn tiếp theo.
- Tạm dừng và tiếp tục mà không mất vị trí.
- Dừng đọc và giải phóng trạng thái.
- Cho phép bật/tắt đồng bộ đánh dấu.

Phân biệt rõ:
- Sự kiện `onstart`.
- Sự kiện `onend`.
- Sự kiện `onerror`.
- Sự kiện `onboundary`, nếu trình duyệt và giọng đọc hỗ trợ.

Không giả định `onboundary` hoạt động đồng nhất trên mọi giọng đọc.

### 2.6. Đọc nền khi cửa sổ mất tiêu điểm (Background Reading)

Khi người dùng chuyển sang tab khác, chuyển sang ứng dụng/cửa sổ khác hoặc cửa sổ trình duyệt mất focus, tiến trình đọc phải tiếp tục nếu trình duyệt và hệ điều hành còn cho phép.

Yêu cầu:
- Không gọi `speechSynthesis.cancel()` hoặc `speechSynthesis.pause()` chỉ vì sự kiện `window.blur` hoặc `document.visibilitychange`.
- Không tự thay đổi trạng thái từ `reading` sang `paused` khi tab/cửa sổ mất tiêu điểm.
- Duy trì hàng đợi utterance, vị trí đọc, giọng đọc và cấu hình hiện tại khi chuyển tab/cửa sổ.
- Theo dõi `visibilitychange`, `window.blur` và `window.focus` để cập nhật trạng thái giao diện mà không làm gián đoạn phiên đọc.
- Nếu người dùng bật chế độ đọc nền và trình duyệt đưa SpeechSynthesis vào trạng thái paused ngoài ý muốn, gọi `speechSynthesis.resume()` khi trang hiển thị trở lại, nhưng chỉ khi trạng thái ứng dụng vẫn là `reading`. Tuyệt đối không resume khi người dùng đã chủ động Pause hoặc Stop.
- Phải xử lý cả trường hợp Chrome phát sinh `onerror` với `canceled`/`interrupted`, hoặc utterance đã bắt đầu nhưng bị ngắt mà không còn `speaking`/`pending`. Không được bỏ qua lỗi rồi để state mắc kẹt ở `reading`.
- Tách việc phát utterance hiện tại thành hàm có thể gọi lại (ví dụ `speakCurrent()`). Khi trang hiển thị/focus trở lại, nếu state vẫn là `reading` và xác nhận utterance hiện tại đã bị ngắt, khởi chạy lại đúng phần tử queue hiện tại; không tăng vị trí queue khi chưa có `onend` hợp lệ.
- Trước khi phát lại, kiểm tra `speechSynthesis.paused`, `speaking`, `pending` để tránh đọc chồng. Không phát lại khi utterance vẫn đang chạy hoặc khi state là `paused`, `idle`, `ended` hay `error`.
- Có tùy chọn bật/tắt chế độ đọc nền trong Settings và lưu tùy chọn này vào localStorage.
- Khi quay lại tab, giao diện phải phản ánh đúng trạng thái đọc hiện tại.

Giới hạn nền tảng:
- Web Speech API không cung cấp bảo đảm tuyệt đối rằng âm thanh sẽ tiếp tục trong mọi trường hợp mất focus, tab bị trình duyệt loại bỏ (discard), trang bị đóng/đóng băng, thiết bị ngủ hoặc hệ điều hành chặn âm thanh nền.
- Không tuyên bố có thể vượt qua chính sách tiết kiệm pin, quyền riêng tư hoặc giới hạn nền của trình duyệt/hệ điều hành.
- Phải thông báo rõ đây là cơ chế best-effort; không được giả lập khả năng phát âm thanh nền nếu API không hỗ trợ.

### 2.5. Hiệu ứng đánh dấu dòng (Reading Highlight)

Thiết kế hiệu ứng trực quan độc lập với nhóm giọng nói.

Các chế độ:
- Đánh dấu toàn đoạn.
- Đánh dấu câu đang đọc.
- Đánh dấu từ đang đọc nếu API hỗ trợ.
- Làm nổi bật dòng chứa nội dung đang đọc.
- Tự động cuộn theo vị trí đọc.
- Cho phép tắt hiệu ứng.

Hiệu ứng phải có thể tùy chỉnh:
- Màu nền.
- Màu chữ.
- Viền.
- Độ trong suốt.
- Hiệu ứng chuyển đổi.
- Kiểu đánh dấu.

Nếu Chrome không cung cấp vị trí từ hoặc câu chính xác, phải có cơ chế dự phòng và thông báo giới hạn kỹ thuật.

### 3.1. Menu ngữ cảnh đọc tại vị trí con trỏ (Context Menu)

- Khi người dùng nhấn chuột phải trên đoạn văn, tiêu đề, mục danh sách hoặc blockquote thuộc bài viết nguồn hay Reader, hiển thị menu ngữ cảnh tùy chỉnh ngay cạnh vị trí con trỏ chuột.
- Menu có lệnh **“Đọc từ đây”**.
- Khi chọn lệnh, mở Reader nếu chưa mở và bắt đầu đọc từ đúng khối văn bản được nhấn; không đọc lại các khối đứng trước.
- Trong Reader, xác định điểm bắt đầu bằng chỉ số data-reader-paragraph.
- Trên bài viết nguồn, xác định chỉ số theo đúng thứ tự khối mà Reader trích xuất (p, h1–h4, li, blockquote), để khớp với nội dung sau khi clone.
- Menu phải nằm trong viewport, không bị cắt ở cạnh màn hình; đóng khi chọn lệnh, nhấn Escape, nhấn ra ngoài, cuộn hoặc resize.
- Không chặn menu chuột phải mặc định ở vùng không hỗ trợ đọc và không làm gián đoạn phiên đọc chỉ vì mở/đóng menu.
- Menu có role/nhãn truy cập phù hợp.
## 3. Thiết kế thanh công cụ

Không sử dụng các nhãn chữ dài cho những lệnh điều khiển phổ biến.

Sử dụng icon có tooltip.

| Lệnh | Icon |
|---|---|
| Đóng | x |
| Đọc | play |
| Tạm dừng | pause |
| Tiếp tục | play |
| Dừng | square |
| Cài đặt | settings |
| Đoạn trước | skip-back |
| Đoạn tiếp | skip-forward |

Yêu cầu:
- Icon phải dễ nhận biết.
- Có tooltip giải thích.
- Có trạng thái disabled khi không thể thực hiện lệnh.
- Không hiển thị đồng thời những nút có chức năng trùng lặp.
- Không có nút thu nhỏ hoặc mở rộng Reader.
- Nút Settings phải luôn truy cập được, kể cả khi thanh công cụ đang ở chế độ thu gọn.
- Phân biệt rõ Pause và Stop.

## 4. Hệ thống cài đặt

Tạo nút Settings riêng trên thanh công cụ.

Khi mở Settings, hiển thị các nhóm cài đặt độc lập:
1. Interface.
2. Typography.
3. Voice.
4. Speech Synchronization.
5. Reading Highlight.

Cài đặt phải có khả năng:
- Áp dụng ngay khi thay đổi.
- Khôi phục mặc định.
- Lưu cấu hình vào localStorage.
- Khôi phục cấu hình khi tải lại trang.

Không lưu đối tượng Voice trực tiếp vào localStorage. Chỉ lưu thông tin định danh phù hợp như `voiceURI`, tên và ngôn ngữ, sau đó đối chiếu với danh sách giọng thực tế khi khởi tạo.

Nhóm Voice phải cung cấp ô tìm kiếm/lọc, nút làm mới danh sách và nút thử giọng; toàn bộ điều khiển chọn giọng phải nằm trong bảng Settings.

## 5. Yêu cầu kiến trúc JavaScript

Tách logic thành các nhóm chức năng có trách nhiệm rõ ràng:

- ReaderManager.
- SpeechManager.
- VoiceManager.
- HighlightManager.
- SettingsManager.
- ToolbarManager.

Có thể tổ chức bằng class hoặc object thuần JavaScript, nhưng không tạo thêm file.

Tránh:
- Trùng lặp event listener.
- Gọi `speechSynthesis.cancel()` không kiểm soát.
- Đọc chồng nhiều utterance.
- Mất trạng thái khi pause/resume.
- Tạo nhiều bản sao nội dung không được giải phóng.
- Để cấu hình giao diện ảnh hưởng đến trạng thái đọc.

## 6. Tiêu chuẩn kiểm thử

Kiểm tra các tình huống:

1. Chrome có nhiều giọng đọc.
2. Chrome chưa tải xong danh sách giọng.
3. Không có giọng tiếng Việt.
4. Đổi giọng khi đang đọc.
5. Đổi tốc độ khi đang đọc.
6. Pause và Resume.
7. Stop rồi đọc lại.
8. Chuyển đoạn.
9. Đọc văn bản dài.
10. Tắt và bật hiệu ứng đánh dấu.
11. Tải lại trang và khôi phục cài đặt.
12. Đóng Reader khi đang phát âm thanh.
13. Chuyển sang tab khác khi đang đọc: âm thanh và hàng đợi đọc vẫn tiếp tục nếu nền tảng cho phép.
14. Chuyển sang cửa sổ/ứng dụng khác khi đang đọc: không tự pause hoặc stop.
15. Quay lại tab sau khi SpeechSynthesis bị pause ngoài ý muốn: chỉ resume nếu trạng thái ứng dụng vẫn là reading; không resume nếu người dùng đã Pause/Stop.
16. Quay lại tab sau khi utterance bị `canceled`/`interrupted`: khôi phục đúng utterance hiện tại, không bỏ qua đoạn và không đọc chồng.
17. Chrome ngừng utterance mà không phát `onend`: khi focus trở lại, phát lại queue item hiện tại nếu state vẫn là reading.
18. Mở Settings, tìm/lọc và chọn giọng đọc; thử giọng và xác nhận lựa chọn được giữ khi đóng/mở Settings.
19. Tải lại trang: khôi phục giọng đã chọn nếu giọng đó vẫn được `speechSynthesis.getVoices()` cung cấp; nếu không còn, chọn giọng tiếng Việt phù hợp hoặc giọng mặc định.
20. Xác nhận Reader chỉ có một trạng thái bình thường; không còn nút thu nhỏ, nút mở rộng, thanh điều khiển nổi hoặc logic chuyển trạng thái.
21. Chuột phải trên đoạn văn/tiêu đề trong bài viết nguồn: menu xuất hiện tại vị trí con trỏ; chọn “Đọc từ đây” mở Reader và bắt đầu đúng khối.
22. Chuột phải trên đoạn bất kỳ trong Reader: menu xuất hiện cạnh con trỏ và bắt đầu đúng đoạn đó.
23. Menu không tràn viewport, đóng khi Escape/nhấn ngoài/cuộn/resize; chuột phải ở vùng không hỗ trợ vẫn dùng menu mặc định.

Không tuyên bố đã kiểm thử thành công nếu chưa thực sự chạy thử.

## 7. Quy trình cập nhật prompt sau mỗi yêu cầu

- Sau mỗi yêu cầu mới của người dùng liên quan đến dự án, phải cập nhật `prompts.md` để phản ánh yêu cầu, quyết định thiết kế, hành vi mong đợi và tiêu chí kiểm thử mới hoặc đã thay đổi.
- Thực hiện cập nhật prompt cùng đợt với thay đổi mã nguồn; không chờ người dùng nhắc lại.
- Giữ lại các yêu cầu cũ còn hiệu lực; chỉ sửa hoặc loại bỏ nội dung khi người dùng yêu cầu thay đổi hoặc khi nội dung đã lỗi thời/mâu thuẫn.
- Trước khi cập nhật, luôn lấy phiên bản mới nhất của `prompts.md` trên nhánh `main` và ghi bằng SHA mới nhất.
- Không tạo file prompt phụ; `prompts.md` là đặc tả chuẩn của dự án.

## 8. Đầu ra

- Chỉ cập nhật file `index.html` hiện tại.
- Trả về một file hoàn chỉnh.
- Không tạo file phụ.
- Không thay đổi tên các thành phần đang được sử dụng nếu không cần thiết.
- Giữ nguyên các chức năng cũ.
- Báo cáo rõ tính năng nào đã hoàn thành, tính năng nào bị giới hạn bởi Chrome API và tính năng nào chưa kiểm thử.

**Ưu tiên cao nhất:** Tính ổn định của quá trình đọc, đồng bộ nội dung và khả năng mở rộng của hệ thống.