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
- Nếu người dùng bật chế độ đọc nền và trình duyệt đưa SpeechSynthesis vào trạng thái paused ngoài ý muốn, có thể gọi `speechSynthesis.resume()` khi trang hiển thị trở lại, nhưng chỉ khi trạng thái ứng dụng vẫn là `reading`. Tuyệt đối không resume khi người dùng đã chủ động Pause hoặc Stop.
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
| Thu nhỏ | minimize |
| Mở rộng | maximize |

Yêu cầu:
- Icon phải dễ nhận biết.
- Có tooltip giải thích.
- Có trạng thái disabled khi không thể thực hiện lệnh.
- Không hiển thị đồng thời những nút có chức năng trùng lặp.
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

Không tuyên bố đã kiểm thử thành công nếu chưa thực sự chạy thử.

## 7. Đầu ra

- Chỉ cập nhật file `index.html` hiện tại.
- Trả về một file hoàn chỉnh.
- Không tạo file phụ.
- Không thay đổi tên các thành phần đang được sử dụng nếu không cần thiết.
- Giữ nguyên các chức năng cũ.
- Báo cáo rõ tính năng nào đã hoàn thành, tính năng nào bị giới hạn bởi Chrome API và tính năng nào chưa kiểm thử.

**Ưu tiên cao nhất:** Tính ổn định của quá trình đọc, đồng bộ nội dung và khả năng mở rộng của hệ thống.