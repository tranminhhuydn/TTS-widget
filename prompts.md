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

- Chỉ khi Reader đang mở (chế độ đọc đã được bật), mới tạo/nhúng menu ngữ cảnh vào DOM và kích hoạt chức năng chuột phải. Khi Reader đóng, menu phải được gỡ khỏi DOM hoàn toàn; không được chặn hoặc thay thế menu chuột phải mặc định của trang nguồn.
- Menu có lệnh **“Đọc từ đây”**.
- Chỉ cho phép lệnh “Đọc từ đây” khi Reader vẫn đang mở; chọn lệnh bắt đầu đọc từ đúng khối trong Reader, không tự mở Reader từ trang nguồn.
- Trong Reader, xác định điểm bắt đầu bằng chỉ số data-reader-paragraph.
- Chỉ xử lý chuột phải bên trong nội dung Reader; không gắn handler để hiển thị menu trên bài viết nguồn.
- Menu phải nằm trong viewport, không bị cắt ở cạnh màn hình; đóng khi chọn lệnh, nhấn Escape, nhấn ra ngoài, cuộn hoặc resize.
- Khi Reader đóng, chuột phải ở mọi vùng trang nguồn phải giữ nguyên menu mặc định của trình duyệt. Khi Reader mở, chỉ chặn menu mặc định trên các khối nội dung Reader được hỗ trợ.
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
21. Khi Reader đóng: menu ngữ cảnh không tồn tại trong DOM; chuột phải trên trang nguồn hiển thị menu mặc định của trình duyệt.
22. Khi Reader mở: menu được nhúng vào DOM; chuột phải trên đoạn văn/tiêu đề trong Reader hiển thị menu cạnh con trỏ và “Đọc từ đây” bắt đầu đúng đoạn.
23. Khi đóng Reader: menu bị gỡ khỏi DOM và handler không còn chặn chuột phải trang nguồn. Menu không tràn viewport và đóng khi Escape/nhấn ngoài/cuộn/resize.

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

## 9. Yêu cầu đối chiếu và các trường hợp dễ bỏ sót

Các yêu cầu dưới đây được bổ sung sau khi đối chiếu đặc tả với mã nguồn hiện tại. Đây là tiêu chí bắt buộc cho các lần sửa tiếp theo; không được xem việc đã có tên hàm hoặc giao diện tương ứng là bằng chứng tính năng đã hoạt động đúng.

### 9.1. Đồng bộ vị trí từ khi chia utterance

- `SpeechSynthesisEvent.charIndex` là vị trí trong văn bản của utterance hiện tại, không mặc nhiên là vị trí trong toàn bộ đoạn văn gốc.
- Khi chia một đoạn thành nhiều utterance, phải lưu offset bắt đầu của từng phần trong văn bản gốc.
- Khi nhận `onboundary`, cộng offset của phần hiện tại vào `charIndex` trước khi tìm node/vị trí trong đoạn gốc.
- Việc đánh dấu từ phải xử lý đúng cả đoạn có nhiều node văn bản, dấu câu, khoảng trắng và nội dung HTML lồng nhau.
- Trước khi đánh dấu từ mới, phải gỡ đánh dấu từ cũ theo cách không làm thay đổi nội dung hoặc thứ tự văn bản.
- Nếu trình duyệt/giọng đọc không phát boundary đáng tin cậy, chỉ đánh dấu đoạn hiện tại; không tạo vị trí từ giả.
- Acceptance test: kiểm tra từ đầu, giữa và cuối của đoạn; kiểm tra đoạn dài bị chia thành ít nhất hai utterance; xác nhận từ được đánh dấu khớp chính xác với âm thanh đang đọc.

### 9.2. Khôi phục phiên đọc nền sau canceled/interrupted

- Phải phân biệt rõ ba tình huống: SpeechSynthesis đang paused nhưng utterance còn trong hàng đợi; utterance đã bị canceled/interrupted; và utterance đã biến mất khỏi speaking/pending mà không có onend hợp lệ.
- Nếu utterance hiện tại đã bị canceled/interrupted, không được chỉ gọi `speechSynthesis.resume()` rồi coi như đã khôi phục. Phải phát lại đúng queue item hiện tại.
- Chỉ gọi `resume()` khi xác định utterance vẫn còn hiệu lực và đang bị pause ngoài ý muốn.
- Khi phát lại queue item hiện tại, không tăng position; không tạo hai utterance cùng chạy; không khôi phục nếu người dùng đã Pause, Stop, đóng Reader hoặc phiên đọc đã đổi session.
- Có cơ chế chống khôi phục lặp nhiều lần do đồng thời nhận `focus`, `visibilitychange` và các sự kiện liên quan.
- Acceptance test: mô phỏng/kiểm tra riêng trạng thái paused, canceled, interrupted, mất speaking/pending không có onend; xác nhận không bỏ qua câu, không đọc chồng và không tự phát lại sau thao tác Pause/Stop của người dùng.

### 9.3. Vòng đời thao tác thử giọng

- Thao tác thử giọng phải được quản lý tách biệt với hàng đợi đọc nội dung.
- Khi thử giọng bắt đầu, giao diện phải phản ánh trạng thái testing; khi kết thúc hoặc lỗi, phải trở về trạng thái sẵn sàng phù hợp.
- Nút Stop phải dừng được thử giọng; bắt đầu đọc nội dung hoặc đóng Reader phải hủy thử giọng đang chạy.
- Callback cũ của utterance thử giọng không được ghi đè trạng thái của một phiên đọc mới.
- Acceptance test: thử giọng thành công, thử giọng lỗi, Stop khi đang thử, bắt đầu đọc nội dung khi đang thử và đóng Reader khi đang thử.

### 9.4. Đóng Reader và giải phóng tài nguyên

- Khi đóng Reader, phải dừng SpeechSynthesis trước khi xóa nội dung; không để utterance tiếp tục đọc nội dung đã bị gỡ khỏi DOM.
- Phải xóa highlight, menu ngữ cảnh, mục tiêu đọc từ menu, nội dung clone và các trạng thái phiên đọc liên quan.
- Phải khôi phục chính xác thuộc tính cuộn ban đầu của trang nguồn; không ghi đè các giá trị overflow đã tồn tại trước khi mở Reader.
- Việc mở Reader nhiều lần liên tiếp không được nhân đôi event listener, menu, nội dung clone hoặc trạng thái khóa cuộn.
- Escape và nút Đóng phải có hành vi tương đương.
- Acceptance test: đóng Reader trong lúc reading, paused và testing; mở/đóng liên tục nhiều lần; xác nhận trang nguồn cuộn bình thường, không còn menu trong DOM và không còn âm thanh.

### 9.5. Tính nhất quán của Settings và giao diện

- Các điều khiển nhanh bên ngoài Settings (nếu còn được giữ) phải cập nhật cùng một đối tượng cấu hình, đồng bộ lại giá trị trong Settings và lưu localStorage.
- Thu gọn thanh công cụ chỉ được ẩn các điều khiển phụ; nút Settings và các thao tác thiết yếu phải luôn truy cập được.
- Không được nhầm lẫn thu gọn thanh công cụ với thu nhỏ/mở rộng Reader. Reader tiếp tục chỉ có một trạng thái hiển thị bình thường.
- Reset phải đưa toàn bộ cấu hình thuộc Settings về mặc định và cập nhật đồng bộ giao diện; phải xác định rõ dữ liệu giọng đọc được lưu riêng có được giữ hay không.
- Acceptance test: thay đổi từng thiết lập, đóng/mở Settings, thu gọn/mở thanh công cụ, tải lại trang và reset; xác nhận giá trị giao diện và localStorage nhất quán.

### 9.6. Quy tắc đối chiếu trước khi kết thúc mỗi lần sửa

- Đối chiếu từng yêu cầu trong prompt với phần triển khai thực tế trong `index.html`; không chỉ kiểm tra sự tồn tại của selector, class, hàm hoặc nút.
- Ghi nhận rõ ba trạng thái: đã triển khai và có kiểm chứng; đã triển khai nhưng chưa kiểm chứng trên trình duyệt; chưa triển khai hoặc còn lỗi.
- Mỗi lỗi phát hiện khi đối chiếu phải được chuyển thành acceptance test cụ thể trong prompt.
- Không ghi một tiêu chí là hoàn thành chỉ vì mã có đoạn xử lý tương ứng; phải kiểm tra cả luồng thành công, luồng lỗi, trạng thái biên và tương tác giữa các tính năng.
- Không tuyên bố đã kiểm thử tương tác nếu chỉ mới kiểm tra cú pháp JavaScript hoặc đọc mã tĩnh.


## 10. Tài liệu hướng dẫn sử dụng (README)

- Repository phải có `README.md` bằng tiếng Việt, mô tả cách khởi chạy và sử dụng các tính năng thực sự có trong `index.html`.
- README cần có mục lục, yêu cầu môi trường, cách mở Reader, các nút điều khiển, Settings, chọn/thử giọng, đọc từ vị trí chuột phải, lưu cấu hình, đọc nền, giới hạn Web Speech API và hướng xử lý sự cố.
- Không mô tả tính năng chưa được triển khai như thể đã hoạt động. Phải nêu rõ giới hạn của trình duyệt/hệ điều hành và những phần chỉ hoạt động best-effort.
- Khi thay đổi hành vi hoặc giao diện người dùng, phải rà soát và cập nhật README trong cùng đợt nếu hướng dẫn hiện tại không còn chính xác.
- Việc người dùng yêu cầu tạo/cập nhật README là ngoại lệ được cho phép đối với nguyên tắc chỉ duy trì một file mã nguồn `index.html`; không được vì vậy tự ý tách HTML/CSS/JavaScript thành nhiều file.


## 11. Biểu tượng mở Reader và vị trí thanh điều khiển

- Nút mở chế độ đọc trên trang nguồn phải có biểu tượng quyển sách dễ nhận biết, đặt cạnh nhãn “Mở chế độ đọc”; biểu tượng trang trí phải được ẩn khỏi trình đọc màn hình khi nhãn truy cập đã đầy đủ.
- Trong nhóm cài đặt Giao diện, cung cấp tùy chọn **Vị trí thanh điều khiển** với hai lựa chọn:
  - **Header - Đầu trang**: đặt thanh điều khiển ở đầu Reader và giữ hành vi sticky ở cạnh trên khi cuộn.
  - **Footer - Chân trang**: đặt thanh điều khiển sau nội dung Reader ở cuối luồng nội dung và giữ hành vi sticky ở cạnh dưới khi cuộn.
- Mặc định là Header để bảo toàn hành vi hiện tại.
- Khi đổi vị trí, phải di chuyển chính phần tử thanh điều khiển hiện có; không tạo bản sao, không nhân đôi event listener, Settings, nút điều khiển hoặc context menu.
- Lựa chọn Header/Footer phải cập nhật ngay khi thay đổi, đồng bộ với Settings và được lưu/khôi phục qua localStorage.
- Khi đổi vị trí nhiều lần, các nút đọc, tạm dừng, tiếp tục, dừng, chuyển đoạn, Settings, thu gọn thanh công cụ và menu “Đọc từ đây” vẫn phải hoạt động.
- Trên màn hình desktop và mobile, thanh điều khiển không được che khuất vùng nội dung đang thao tác; bảng Settings phải mở được ở cả hai vị trí.
- Acceptance test:
  1. Nút mở Reader hiển thị icon quyển sách và nhãn truy cập “Mở chế độ đọc”.
  2. Mặc định Reader hiển thị toolbar ở Header.
  3. Chọn Footer: toolbar chuyển xuống sau nội dung và status, bám cạnh dưới khi cuộn đến vùng cuối.
  4. Chọn lại Header: toolbar trở về trước nội dung và bám cạnh trên.
  5. Tải lại trang: vị trí đã chọn được khôi phục.
  6. Chuyển Header/Footer liên tục không tạo toolbar hoặc listener trùng lặp; toàn bộ điều khiển vẫn hoạt động.
  7. Mở Settings, thu gọn toolbar và dùng “Đọc từ đây” ở cả hai vị trí.

## 12. Kiểm tra hỗ trợ Web Speech API trên trình duyệt

- Khi khởi tạo trang, phải kiểm tra khả năng hỗ trợ Web Speech API trước khi cập nhật nhãn nút mở Reader.
- Feature detection phải kiểm tra tối thiểu:
  - `window.speechSynthesis` tồn tại.
  - `window.SpeechSynthesisUtterance` là constructor/function.
  - `speechSynthesis.speak` là function.
  - `speechSynthesis.getVoices` là function.
- Nếu API được hỗ trợ, giữ nguyên giao diện nút: icon quyển sách và nhãn **Mở chế độ đọc**.
- Nếu API không được hỗ trợ, vẫn giữ icon quyển sách và đổi nhãn thành chính xác **Mở chế độ đọc [ không hỗ trợ ]**; cập nhật accessible name (`aria-label`) và tooltip để nêu rõ trình duyệt không hỗ trợ Web Speech API.
- Không xóa hoặc ẩn icon trong trường hợp không hỗ trợ.
- Reader vẫn được phép mở để người dùng đọc nội dung bằng mắt; không vô hiệu hóa nút mở Reader chỉ vì thiếu API đọc thành tiếng.
- Khi người dùng thử bắt đầu đọc mà API không khả dụng, phải hiển thị thông báo rõ ràng thay vì phát sinh exception.
- Không dựa vào kiểm tra tên trình duyệt hoặc user-agent; phải dùng feature detection.
- Acceptance test:
  1. Trình duyệt có đủ `speechSynthesis`, `SpeechSynthesisUtterance`, `speak()` và `getVoices()`: icon và nhãn nút vẫn là **📖 Mở chế độ đọc**.
  2. Thiếu một trong các thành phần API: icon vẫn hiển thị, nhãn đổi thành **📖 Mở chế độ đọc [ không hỗ trợ ]**.
  3. `aria-label` và tooltip phản ánh đúng trạng thái hỗ trợ.
  4. Ở trình duyệt không hỗ trợ, vẫn mở được Reader và nội dung vẫn đọc bằng mắt bình thường.
  5. Nhấn nút Đọc trong Reader khi API không hỗ trợ phải hiển thị thông báo dễ hiểu, không có lỗi JavaScript.
  6. Không dùng user-agent sniffing để kết luận khả năng hỗ trợ.