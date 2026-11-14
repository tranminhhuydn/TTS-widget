# PROMPT BỔ SUNG – PHÁT TRIỂN TTS-WIDGET CHO WEB

## 1. Mục tiêu

Tiếp tục phát triển TTS-widget theo kiến trúc dùng chung `tts-widget.js` nhúng vào cả `index.html` và `demo.html`; `index.html` giữ nội dung/bố cục Web Reader gốc, còn `demo.html` là trang demo nội dung dài.

Xây dựng một trình đọc văn bản trên web sử dụng tối đa các khả năng mà Chrome Web Speech API cung cấp.

**Nguyên tắc bắt buộc:**
- Tách phần mã JavaScript của widget thành `tts-widget.js` độc lập để có thể nhúng vào website khác.
- Cả `index.html` và `demo.html` đều phải nhúng trực tiếp `tts-widget.js`; `index.html` giữ lại nội dung và bố cục trang Web Reader gốc, `demo.html` cung cấp bài viết dài để thử nghiệm.
- `tts-widget.js` tự tạo giao diện Reader, điều khiển, Settings và CSS cần thiết; website chủ chỉ cần cung cấp vùng nội dung cần đọc.
- Không yêu cầu website chủ sao chép HTML/CSS nội bộ của Reader.
- Không viết lại toàn bộ ứng dụng nếu không cần thiết.
- Bảo toàn các chức năng đang hoạt động.
- Chỉ cập nhật những phần liên quan đến yêu cầu mới.
- Không sử dụng API giả lập hoặc tự nhận có tính năng mà Chrome không cung cấp.

## 2. Phân chia hệ thống chức năng

Thiết kế hệ thống thành các nhóm cài đặt độc lập.

### 2.1. Giao diện (Interface)

Cho phép cấu hình:
- Vị trí và cách hiển thị TTS-widget.
- Kích thước cửa sổ đọc.
- Reader chỉ có một trạng thái hiển thị: cửa sổ đọc bình thường; không có chế độ thu nhỏ hoặc mở rộng.
- Giao diện sáng, tối, màu giấy.
- Toàn bộ điều khiển phụ trên thanh công cụ luôn hiển thị; không có chế độ thu gọn/mở rộng thanh công cụ.
- Các điều khiển chính và phụ luôn hiển thị trực tiếp trên thanh công cụ.
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
- Nút Settings luôn hiển thị và truy cập được trên thanh công cụ.
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

Có thể tổ chức bằng class hoặc object thuần JavaScript; mã chạy của widget được đóng gói trong `tts-widget.js`.

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

- Cập nhật `tts-widget.js` là mã nguồn JavaScript dùng để nhúng.
- Cập nhật `demo.html` là trang demo độc lập, có nội dung dài và nhúng widget qua thẻ script.
- Giữ `index.html` làm điểm vào tương thích, chuyển người dùng sang `demo.html`.
- Cập nhật `prompts.md` và `README.md` trong cùng đợt khi kiến trúc hoặc cách tích hợp thay đổi.
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
- Không được ghi hoặc sửa bất kỳ thuộc tính cuộn nào trên `html`/`body`; đóng Reader không cần khôi phục style trang chủ vì widget không được phép thay đổi chúng.
- Việc mở Reader nhiều lần liên tiếp không được nhân đôi event listener, menu hoặc nội dung clone; không có trạng thái khóa cuộn trang chủ.
- Escape và nút Đóng phải có hành vi tương đương.
- Acceptance test: đóng Reader trong lúc reading, paused và testing; mở/đóng liên tục nhiều lần; xác nhận CSS và style inline của `html`/`body` không đổi, trang chủ vẫn cuộn độc lập, không còn menu trong DOM và không còn âm thanh.

### 9.5. Tính nhất quán của Settings và giao diện

- Các điều khiển nhanh bên ngoài Settings (nếu còn được giữ) phải cập nhật cùng một đối tượng cấu hình, đồng bộ lại giá trị trong Settings và lưu localStorage.
- Thanh công cụ không có trạng thái thu gọn/mở rộng; tất cả điều khiển phụ luôn hiển thị.
- Reader tiếp tục chỉ có một trạng thái hiển thị bình thường; không có chế độ thu nhỏ/mở rộng Reader.
- Reset phải đưa toàn bộ cấu hình thuộc Settings về mặc định và cập nhật đồng bộ giao diện; phải xác định rõ dữ liệu giọng đọc được lưu riêng có được giữ hay không.
- Acceptance test: thay đổi từng thiết lập còn tồn tại, đóng/mở Settings, tải lại trang và reset; xác nhận giá trị giao diện và localStorage nhất quán. Không còn tùy chọn hoặc trạng thái thu gọn thanh công cụ.

### 9.6. Quy tắc đối chiếu trước khi kết thúc mỗi lần sửa

- Đối chiếu từng yêu cầu trong prompt với phần triển khai thực tế trong `tts-widget.js` và `demo.html`; không chỉ kiểm tra sự tồn tại của selector, class, hàm hoặc nút.
- Ghi nhận rõ ba trạng thái: đã triển khai và có kiểm chứng; đã triển khai nhưng chưa kiểm chứng trên trình duyệt; chưa triển khai hoặc còn lỗi.
- Mỗi lỗi phát hiện khi đối chiếu phải được chuyển thành acceptance test cụ thể trong prompt.
- Không ghi một tiêu chí là hoàn thành chỉ vì mã có đoạn xử lý tương ứng; phải kiểm tra cả luồng thành công, luồng lỗi, trạng thái biên và tương tác giữa các tính năng.
- Không tuyên bố đã kiểm thử tương tác nếu chỉ mới kiểm tra cú pháp JavaScript hoặc đọc mã tĩnh.


## 10. Tài liệu hướng dẫn sử dụng (README)

- Repository phải có `README.md` bằng tiếng Việt, mô tả cách nhúng `tts-widget.js`, cấu hình vùng nội dung và chạy `demo.html`.
- README cần có mục lục, yêu cầu môi trường, cách mở Reader, các nút điều khiển, Settings, chọn/thử giọng, đọc từ vị trí chuột phải, lưu cấu hình, đọc nền, giới hạn Web Speech API và hướng xử lý sự cố.
- Không mô tả tính năng chưa được triển khai như thể đã hoạt động. Phải nêu rõ giới hạn của trình duyệt/hệ điều hành và những phần chỉ hoạt động best-effort.
- Khi thay đổi hành vi hoặc giao diện người dùng, phải rà soát và cập nhật README trong cùng đợt nếu hướng dẫn hiện tại không còn chính xác.
- README phải phản ánh kiến trúc nhiều file theo yêu cầu mới; `tts-widget.js` là script nhúng, `demo.html` là trang demo và `index.html` là điểm vào tương thích.


## 11. Biểu tượng mở Reader và vị trí thanh điều khiển

- Nút mở chế độ đọc trên trang nguồn phải có biểu tượng quyển sách dễ nhận biết, đặt cạnh nhãn “Mở chế độ đọc”; biểu tượng trang trí phải được ẩn khỏi trình đọc màn hình khi nhãn truy cập đã đầy đủ.
- Trong nhóm cài đặt Giao diện, cung cấp tùy chọn **Vị trí thanh điều khiển** với hai lựa chọn:
  - **Header - Đầu trang**: đặt thanh điều khiển ở đầu Reader và giữ hành vi sticky ở cạnh trên khi cuộn.
  - **Footer - Chân trang**: đặt thanh điều khiển sau nội dung Reader ở cuối luồng nội dung và giữ hành vi sticky ở cạnh dưới khi cuộn.
- Mặc định là Header để bảo toàn hành vi hiện tại.
- Khi đổi vị trí, phải di chuyển chính phần tử thanh điều khiển hiện có; không tạo bản sao, không nhân đôi event listener, Settings, nút điều khiển hoặc context menu.
- Lựa chọn Header/Footer phải cập nhật ngay khi thay đổi, đồng bộ với Settings và được lưu/khôi phục qua localStorage.
- Khi đổi vị trí nhiều lần, các nút đọc, tạm dừng, tiếp tục, dừng, chuyển đoạn, Settings và menu “Đọc từ đây” vẫn phải hoạt động.
- Trên màn hình desktop và mobile, thanh điều khiển không được che khuất vùng nội dung đang thao tác; bảng Settings phải mở được ở cả hai vị trí.
- Acceptance test:
  1. Nút mở Reader hiển thị icon quyển sách và nhãn truy cập “Mở chế độ đọc”.
  2. Mặc định Reader hiển thị toolbar ở Header.
  3. Chọn Footer: toolbar chuyển xuống sau nội dung và status, bám cạnh dưới khi cuộn đến vùng cuối.
  4. Chọn lại Header: toolbar trở về trước nội dung và bám cạnh trên.
  5. Tải lại trang: vị trí đã chọn được khôi phục.
  6. Chuyển Header/Footer liên tục không tạo toolbar hoặc listener trùng lặp; toàn bộ điều khiển vẫn hoạt động.
  7. Xác nhận mọi điều khiển phụ luôn hiển thị và dùng được; mở Settings và dùng “Đọc từ đây” ở cả hai vị trí toolbar.

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

## 13. Loại bỏ chế độ thu gọn/mở rộng điều khiển phụ trên thanh công cụ

- Không cung cấp nút, checkbox, phím tắt, trạng thái hoặc thao tác nào để thu gọn/mở rộng các điều khiển phụ trên thanh công cụ.
- Luôn hiển thị hàng điều khiển phụ (giảm/tăng cỡ chữ, chọn phông, đổi nền) cùng các điều khiển chính; không ẩn chúng bằng class CSS hoặc trạng thái JavaScript.
- Xóa nút `collapseBtn`, tùy chọn `settingCompact`, class `toolbar-extra`/`toolbar-collapsed`, listener và logic áp dụng trạng thái compact khỏi `tts-widget.js`.
- Không giữ thuộc tính `compact` trong cấu hình mặc định hoặc đồng bộ Settings. Nếu localStorage còn khóa `compact` từ phiên bản cũ, bỏ qua khóa dư thừa; không để nó ảnh hưởng giao diện.
- Giữ nguyên các chức năng riêng biệt của Settings, điều khiển nhanh, vị trí Header/Footer và các chức năng đọc.
- Acceptance test:
  1. Không còn nút hoặc checkbox thu gọn/mở rộng điều khiển phụ.
  2. Các nút giảm/tăng cỡ chữ, chọn phông và đổi nền luôn hiển thị ở cả Header và Footer.
  3. Mở/đóng Settings, đổi Header/Footer và tải lại trang không làm ẩn điều khiển phụ.
  4. Cấu hình localStorage cũ có thuộc tính `compact` không gây lỗi hoặc làm thay đổi giao diện.
  5. Không còn selector, listener hoặc logic CSS/JavaScript điều khiển trạng thái thu gọn thanh công cụ.


## 14. Đóng gói thành JavaScript widget có thể nhúng

### 14.1. Cấu trúc file chuẩn

- `tts-widget.js`: mã JavaScript độc lập, chứa toàn bộ logic Reader, Speech, Voice, Highlight, Settings, Toolbar, Context Menu; tự tạo markup giao diện và inject CSS cần thiết.
- `demo.html`: website minh họa có nội dung bài viết dài, nhúng `tts-widget.js` bằng thẻ `script`; nội dung phải đủ dài và chia thành nhiều tiêu đề/đoạn để kiểm tra chia utterance, chuyển đoạn và cuộn.
- `index.html`: giữ nguyên trang Web Reader độc lập theo phiên bản trước khi tách widget; đây là trang ứng dụng/điểm vào chính, không chuyển hướng sang `demo.html`.
- `demo.html`: trang demo riêng để kiểm tra bản `tts-widget.js` có thể nhúng; không thay thế nội dung hoặc chức năng của `index.html`.
- `prompts.md` và `README.md`: cập nhật cùng đợt khi có thay đổi kiến trúc/tích hợp.

### 14.2. Hợp đồng tích hợp

- Cách nhúng mặc định:
  `<script src="./tts-widget.js" defer data-content-selector="#article"></script>`
- Widget tự tìm phần tử theo `data-content-selector`; mặc định là `article`.
- Công khai API `window.TTSWidget.init({ contentSelector: "#article" })` để website có thể khởi tạo bằng JavaScript khi cần.
- Khởi tạo phải idempotent: gọi nhiều lần không tạo nhiều giao diện, launcher hoặc listener.
- Nếu selector không hợp lệ hoặc không tìm thấy nội dung, ghi lỗi rõ ràng vào console và không tạo giao diện dang dở.
- Tạo nút mở Reader tự động cạnh vùng nội dung; không yêu cầu website chủ phải dựng markup Reader, Settings hoặc Toolbar.
- CSS của widget phải được inject từ `tts-widget.js` và toàn bộ selector phải nằm dưới `.tts-widget-root`; tuyệt đối không thay đổi CSS, class, thuộc tính style hoặc bố cục của website chủ, bao gồm `html`, `body`, `header`, `main`, `article` và các nút của website.
- Không khóa cuộn trang chủ, không ghi/khôi phục `overflow` trên `html` hoặc `body`. Không tạo lớp phủ toàn màn hình, backdrop hoặc vùng cuộn riêng che nội dung website.
- Đọc và highlight trực tiếp các phần tử trong DOM gốc; tuyệt đối không clone, di chuyển, ẩn hoặc thay thế nội dung được chọn.
- Reader, context menu và các điều khiển phải được tạo trong một root riêng của widget.
- Không tự tải thư viện hoặc tài nguyên bên ngoài.

### 14.3. Bảo toàn chức năng

- Giữ các chức năng đã có: nhận diện Web Speech API, chọn/thử giọng, tốc độ/cao độ/âm lượng, pause/resume/stop, điều hướng đoạn, đồng bộ highlight, đọc nền best-effort, Settings, Header/Footer và context menu “Đọc từ đây”.
- Không làm thay đổi nội dung, CSS, bố cục, thuộc tính style hoặc hành vi cuộn của website chủ ngoài việc thêm launcher. Không khóa cuộn trang chủ khi mở Reader.
- Không có vùng cuộn Reader riêng và không tự cuộn trang. Nội dung website gốc luôn hiển thị, tương tác và giữ nguyên vị trí khi Reader mở.
- Cấu hình lưu trong localStorage cần có namespace riêng để tránh xung đột với website chủ; giữ khả năng đọc các thiết lập TTS đã lưu từ phiên bản cũ.
- Nếu website không hỗ trợ Web Speech API, Reader vẫn mở để đọc bằng mắt và hiển thị trạng thái không hỗ trợ âm thanh.

### 14.4. Demo và kiểm thử

- `index.html` và `demo.html` đều phải nhúng cùng file JavaScript thực tế, không sao chép logic widget vào hai trang.
- `index.html` phải giữ nội dung và bố cục Web Reader gốc; không được biến thành redirect.
- Cả hai trang phải bỏ markup/logic Reader cũ để tránh hai launcher, hai Reader hoặc listener trùng lặp.
- Nội dung demo cần có tối thiểu 8 mục có tiêu đề và nhiều đoạn văn dài bằng tiếng Việt; có danh sách và trích dẫn.
- Kiểm thử: tải demo, mở Reader, xác nhận nội dung được clone đầy đủ; chọn giọng, thử giọng, đọc từ đầu, pause/resume/stop, chuyển đoạn, đọc từ đây, đổi Header/Footer, thay đổi kiểu chữ/chủ đề, tải lại trang.
- Kiểm tra nhúng trên một trang host tối giản có CSS riêng; xác nhận widget không làm thay đổi kiểu chữ, button, header, main và layout của host.
- Kiểm tra selector không tồn tại và khởi tạo lặp lại.
- Không tuyên bố đã chạy kiểm thử trình duyệt nếu chưa thực sự thực hiện.

## 15. Đọc trực tiếp trên website gốc – chỉ can thiệp Reading Highlight

- Đọc trực tiếp các node trong `contentSelector`; tuyệt đối không dùng `cloneNode()`, không tạo bản sao nội dung.
- Thanh điều khiển là lớp nổi độc lập, đặt ở Header hoặc Footer; nút mở Reader cố định ở góc màn hình. Không chèn launcher vào luồng nội dung và không có lớp nền che trang.
- Không thay đổi font, cỡ chữ, line-height, chiều rộng, margin, padding, theme, inline style, class gốc hoặc bố cục website. Gắn root widget vào body; launcher phải fixed để không chiếm chỗ trong luồng trang.
- Chỉ thêm/gỡ class riêng `tts-widget-reading-active` trên phần tử đang đọc; không ghi đè thuộc tính class và không xóa class khác.
- Highlight từ dùng CSS Custom Highlight API (`CSS.highlights`/`Highlight`), không bọc text bằng `span`/`mark`, không sửa text node. Nếu API không hỗ trợ thì chỉ highlight đoạn.
- Không tự cuộn, không khóa scroll, không thay đổi overflow trên `html`/`body`.
- Gỡ highlight đoạn/từ khi dừng, đóng Reader, kết thúc đọc hoặc chuyển phiên đọc.
- Loại bỏ các điều khiển font/cỡ chữ/line-height/chiều rộng/theme/tự cuộn; giữ giọng đọc, tốc độ/cao độ/âm lượng, Header/Footer và cài đặt highlight.
- Kiểm thử chấp nhận: không tạo/xóa/thay thế node; không thay đổi style/typography/layout; class gốc còn nguyên sau khi gỡ highlight; highlight từ không sửa DOM; scroll position không đổi. Không tuyên bố browser test nếu chưa chạy thực tế.


## 16. Đảm bảo launcher luôn hiển thị trên website nhúng

- Launcher **📖 Mở chế độ đọc** phải luôn được hiển thị cố định ở góc dưới bên phải viewport, không phụ thuộc vị trí hoặc cấu trúc layout của website chủ.
- CSS launcher phải có selector đủ đặc hiệu và reset các thuộc tính giao diện thiết yếu để tránh bị CSS toàn cục của website chủ (ví dụ quy tắc button, visibility, opacity, position hoặc z-index) làm ẩn hoặc đẩy khỏi màn hình.
- Không dùng selector ID toàn cục để tìm nút; mọi truy vấn vẫn phải giới hạn trong `.tts-widget-root`.
- Khi `document.currentScript` không khả dụng, bootstrap được phép tìm thẻ script có `data-content-selector` làm phương án dự phòng; vẫn chỉ khởi tạo một lần.
- Không thay đổi CSS/layout của website chủ ngoài phần tử giao diện riêng của widget.
- Acceptance test: nhúng widget vào trang có CSS toàn cục cho `button`, `#openReaderBtn` và layout grid/flex; xác nhận launcher vẫn hiện, nằm trong viewport, bấm được và mở Reader. Kiểm tra cả script `defer` và trường hợp fallback currentScript.


## 17. Reader không được che hoặc ẩn website gốc

- Khi mở Reader, toàn bộ nội dung website gốc phải tiếp tục hiển thị nguyên vẹn. Không đặt một lớp phủ toàn màn hình có nền, không ẩn source, không thay đổi `display`, `visibility`, `opacity`, `position` hoặc `overflow` của source hay ancestor.
- Không sử dụng class/ID chung chung như `.reader` hoặc `#reader` có thể xung đột CSS của website host. Dùng tên định danh riêng có namespace, ví dụ `.tts-widget-reader` và `#ttsWidgetReader`.
- Wrapper Reader chỉ là wrapper logic, không được chiếm viewport, không có `position:fixed; inset:0` và không tạo backdrop. Khi mở, wrapper có thể dùng `display:contents`; chỉ toolbar, Settings, status và context menu của widget được định vị nổi độc lập.
- Không chặn pointer events trên nội dung website. Chỉ các thành phần điều khiển thực sự của widget nhận pointer events.
- Reading Highlight phải tương tác trực tiếp trên DOM gốc:
  - Đoạn đang đọc: chỉ thêm/gỡ class namespace riêng trên đúng phần tử source.
  - Từ đang đọc: dùng CSS Custom Highlight API với Range tham chiếu trực tiếp text node gốc; không clone node, không wrap text, không tạo bản nội dung khác.
  - Không thay đổi text, cấu trúc DOM, inline style, class gốc khác hoặc thuộc tính layout.
- Khi đóng Reader, dừng đọc hoặc kết thúc phiên, gỡ toàn bộ highlight do widget tạo ra nhưng giữ nguyên mọi class và nội dung vốn có của website.
- Context menu “Đọc từ đây” phải hoạt động trên chính các phần tử source khi Reader đang mở.
- Acceptance test:
  1. Mở Reader: nội dung website gốc vẫn nhìn thấy đầy đủ, không có backdrop/lớp phủ che, vẫn chọn/click/scroll tương tác được.
  2. Kiểm tra computed style và thuộc tính của source/ancestor trước-sau khi mở: widget không sửa display, visibility, opacity, position, overflow hoặc inline style.
  3. Khi đọc, class highlight xuất hiện trên đúng node gốc; khi chuyển đoạn, highlight chuyển theo; khi dừng/đóng, class được gỡ.
  4. Nếu trình duyệt hỗ trợ CSS Custom Highlight API và onboundary, highlight từ phủ đúng Range trong text node gốc, không phát sinh span/mark hoặc node clone.
  5. Kiểm tra trang host có CSS toàn cục cho `.reader`, `#reader` và `button`: không gây xung đột với wrapper widget.
  6. Nội dung website vẫn tương tác và cuộn bình thường trong toàn bộ thời gian Reader mở.


## 18. Launcher và Reading Highlight trên DOM gốc

- Launcher là hành động trực tiếp bắt đầu đọc vùng nội dung đã cấu hình, vì vậy nhãn mặc định phải là `Đọc nội dung này` và biểu tượng loa `🔊`, không dùng “Mở chế độ đọc” hoặc biểu tượng sách.
- Khi Web Speech API không được hỗ trợ, giữ nhãn `Đọc nội dung này` và biểu tượng loa; chỉ thêm trạng thái `[ không hỗ trợ ]`.
- Reading Highlight đoạn phải luôn đánh dấu trực tiếp phần tử gốc hiện đang được đọc khi tùy chọn highlight và đồng bộ đoạn được bật.
- CSS highlight phải đủ đặc hiệu và có `!important` cần thiết để chống CSS website chủ ghi đè; không thay đổi layout, không thêm padding/margin hoặc di chuyển phần tử.
- Khi đánh dấu đoạn, thêm class namespace riêng và data attribute namespace riêng; khi bỏ highlight chỉ gỡ đúng class/data attribute do widget thêm, không xóa class hay thuộc tính vốn có.
- Highlight từ dùng CSS Custom Highlight API với Range trên text node gốc, không wrap text node.
- Acceptance test:
  1. Launcher hiển thị biểu tượng loa và nhãn “Đọc nội dung này”.
  2. Khi bắt đầu đọc, phần tử source hiện tại có class `tts-widget-reading-active` và highlight nền/viền nhìn thấy rõ.
  3. Khi chuyển đoạn, highlight chuyển sang phần tử tương ứng; khi dừng/đóng, class và data attribute của widget được gỡ.
  4. Nếu onboundary và CSS Custom Highlight API được hỗ trợ, từ đang đọc được highlight; nếu không, highlight đoạn vẫn hoạt động.
  5. Kiểm tra với CSS host có selector toàn cục và `!important`; highlight vẫn phải nhìn thấy.


## 19. Đồng bộ chính xác highlight đoạn và từng từ

- Khi bắt đầu một utterance, phải highlight đoạn source tương ứng trên DOM gốc nếu cả tùy chọn highlight và theo dõi đoạn được bật.
- Khi nhận sự kiện `onboundary` có `name === "word"`, phải highlight đúng từ đang được phát âm trên text node gốc.
- `SpeechSynthesisEvent.charIndex` được tính tương đối từ đầu utterance hiện tại, không phải từ đầu đoạn văn. Không được dùng trực tiếp chỉ số này để đi bộ text node từ đầu đoạn.
- Hàm highlight từ phải nhận nội dung utterance hiện tại, tìm đúng vị trí utterance trong văn bản DOM của đoạn, rồi ánh xạ vị trí ký tự về Range trên text node gốc. Cần xử lý khoảng trắng giữa các text node và inline element.
- Mỗi sự kiện boundary phải thay thế highlight từ trước đó; không để từ cũ tiếp tục được đánh dấu.
- Nếu trình duyệt/giọng đọc không phát `onboundary` hoặc không hỗ trợ CSS Custom Highlight API, highlight đoạn vẫn phải hoạt động độc lập.
- Khi chuyển đoạn, dừng, đóng Reader hoặc kết thúc đọc, phải xóa highlight từ và gỡ highlight đoạn do widget tạo.
- Acceptance test:
  1. Bật cả “Theo dõi đoạn đang đọc”, “Highlight từ nếu API hỗ trợ” và “Bật highlight đoạn”.
  2. Khi phát âm một utterance, đoạn chứa utterance có nền/viền highlight.
  3. Khi phát âm, highlight từng từ lần lượt và đúng vị trí, kể cả khi một đoạn được chia thành nhiều utterance.
  4. Kiểm tra đoạn có inline element như `strong`, `em`, `a`; Range vẫn trỏ đúng text node gốc.
  5. Không tạo span/mark, không clone hoặc sửa nội dung DOM.
  6. Nếu không có sự kiện boundary, highlight đoạn vẫn hoạt động và không báo lỗi.


## 20. Sửa stylesheet highlight và đồng bộ trạng thái launcher

- Stylesheet `#tts-widget-highlight-colors` được tạo và gắn vào `document.head`; mọi lần cập nhật màu highlight phải tham chiếu đúng stylesheet này, không tìm bên trong `.tts-widget-root`.
- Không được âm thầm bỏ qua cập nhật màu khi stylesheet không nằm trong widget root. Kiểm tra cả CSS highlight đoạn và `::highlight(tts-widget-word)` được ghi vào cùng stylesheet toàn cục của widget.
- Acceptance test: khi bắt đầu đọc, stylesheet thực sự chứa rule cho `.tts-widget-reading-active`, data attribute tương ứng và `::highlight(tts-widget-word)`; class đoạn xuất hiện trên source element; Custom Highlight được đặt khi có boundary event.
- Launcher và Reader có trạng thái loại trừ nhau:
  - Khi Reader/toolbar mở thành công, thêm trạng thái mở vào widget root và ẩn launcher bằng CSS namespace.
  - Khi Reader đóng, gỡ trạng thái mở và hiện launcher lại.
  - Nếu không tìm thấy source hoặc Reader không mở được, launcher phải tiếp tục hiển thị.
  - Không ẩn launcher chỉ vì trạng thái đọc là paused/ended; chỉ phụ thuộc trạng thái Reader đang mở hay đóng.
- Acceptance test: tải trang thấy launcher; nhấn launcher thấy toolbar và launcher biến mất; nhấn nút đóng hoặc Escape thì toolbar biến mất và launcher xuất hiện lại.
