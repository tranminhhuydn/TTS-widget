# Prompts – TTS-widget Chrome Extension

## Vai trò

Bạn đang phát triển phiên bản **TTS-widget Chrome Extension** trong thư mục `tts-widget-chrome-extension/` của repository.

## Quy tắc bắt buộc về phạm vi

1. Chỉ tạo mới hoặc chỉnh sửa tệp bên trong `tts-widget-chrome-extension/`, trừ khi người dùng yêu cầu rõ ràng khác.
2. Không tự ý chỉnh sửa, di chuyển, đổi tên hoặc xóa bất kỳ tệp nào trong `tts-widget-embeding-web/`.
3. Không chỉnh sửa `tts-widget-embeding-web/prompts.md`. Tệp đó là bộ yêu cầu độc lập của phiên bản nhúng website.
4. Không thay đổi `.gitignore` hoặc README tổng quan ở root nếu không có yêu cầu.
5. Trước mỗi thay đổi, xác định rõ phiên bản đang làm việc và liệt kê các tệp dự kiến bị tác động.

## Tái sử dụng lõi TTS

- Ưu tiên tái sử dụng mã nguồn và hành vi đã có của phiên bản nhúng website; không viết lại lõi chỉ để phù hợp với cấu trúc Extension.
- Không sao chép mã nguồn một cách tùy tiện hoặc tạo hai bản lõi lệch nhau.
- Không giả định Chrome Extension có thể truy cập hoặc điều khiển giao diện Chrome Read Aloud hay danh sách giọng đọc riêng của tính năng đó. Phải phân biệt rõ Web Speech API với Chrome Read Aloud.
- Nếu việc tích hợp đòi hỏi sửa đổi lõi trong `tts-widget-embeding-web/`, hãy dừng trước khi sửa và trình bày:
  - lý do kỹ thuật;
  - tệp và API bị ảnh hưởng;
  - tác động ngược đến phiên bản nhúng website;
  - phương án thay thế không sửa lõi;
  - đề xuất cần người dùng phê duyệt.

## Nguyên tắc triển khai

- Tuân thủ Manifest V3 và các giới hạn hiện hành của Chrome Extensions.
- Tách biệt content script, service worker, popup/options và tài nguyên dùng chung khi kiến trúc thực tế yêu cầu.
- Chỉ thêm quyền Extension tối thiểu cần thiết; giải thích mục đích từng quyền.
- Không thêm thư viện hoặc phụ thuộc nếu chưa có lý do rõ ràng.
- Bảo toàn các tính năng hiện có khi tích hợp; không tuyên bố tính năng hoạt động nếu chưa kiểm thử.
- Khi báo cáo hoàn thành, nêu tệp đã thay đổi, cách cài thử bằng chế độ Developer mode, các bước kiểm thử và giới hạn còn lại.

## Quy trình làm việc

1. Đọc README và prompts này trước khi thực hiện.
2. Kiểm tra cấu trúc và mã nguồn hiện có trong thư mục Extension.
3. Đề xuất thiết kế ngắn gọn trước các thay đổi có ảnh hưởng kiến trúc.
4. Triển khai theo từng bước nhỏ, giữ phạm vi thay đổi trong thư mục Extension.
5. Kiểm tra cú pháp, manifest và luồng hoạt động liên quan.
6. Báo cáo rõ những gì đã làm và những gì chưa được xác minh.


## Hỗ trợ khối mã nguồn (pre/code)

- Bộ nhận diện vùng nội dung và bộ trích xuất đoạn đọc phải hỗ trợ khối mã nguồn hiển thị trong thẻ `pre`.
- Khi lấy nội dung, ưu tiên xử lý mỗi `pre` như một đoạn đọc duy nhất; không đồng thời lấy các `code` con riêng lẻ vì sẽ gây đọc trùng.
- Dùng văn bản hiển thị (`innerText`) để giữ nội dung người dùng thực sự nhìn thấy; kiểm tra các trang SPA như Gemini khi nội dung được render động.
- Không đưa nút sao chép, nút thao tác hoặc nhãn giao diện bên ngoài `pre` vào nội dung đọc.
- Khi sửa logic trích xuất, phải kiểm tra cả văn bản thường và khối mã để tránh hồi quy.

- Khi trích xuất danh sách, không được đọc trùng nội dung giữa `li` và các phần tử con như `p`; với `li` lồng nhau, chỉ giữ nội dung riêng của từng mục và loại phần danh sách con khỏi văn bản của mục cha.
- Với `blockquote` hoặc `pre` chứa các phần tử con có thể đọc, tránh đưa đồng thời cả phần tử cha và các phần tử con vào hàng đợi.
- Khi trích xuất danh sách động, bỏ qua phần tử không hiển thị (`display:none`, `visibility:hidden` hoặc không có bounding client rect); phát hiện mục `li` trùng văn bản trong cùng một list container để tránh đọc hai bản DOM của cùng mục.


## Điều khiển Đọc/Tiếp tục dùng chung

- Chỉ sử dụng một nút điều khiển cho hai hành động **Đọc** và **Tiếp tục**.
- Khi trạng thái là `paused`, nút hiển thị biểu tượng/nhãn **Tiếp tục** và gọi `SpeechManager.resume()` để tiếp tục đúng vị trí.
- Với các trạng thái còn lại có nội dung để đọc, nút hiển thị **Đọc** và bắt đầu phiên đọc từ đầu bằng `SpeechManager.start(0)`.
- Khi trạng thái là `reading` hoặc `testing`, vô hiệu hóa nút Đọc/Tiếp tục để tránh khởi động chồng hoặc khởi động lại ngoài ý muốn.
- Giữ nút **Tạm dừng** riêng; cập nhật nhãn, tiêu đề và trạng thái disabled của nút dùng chung theo trạng thái SpeechManager.
- Không tạo lại nút Tiếp tục riêng.


## Chế độ giao diện website và cỡ chữ

- Phạm vi chỉ thuộc Chrome/Edge Extension, triển khai trong `tts-widget-chrome-extension/`; không sửa phiên bản nhúng website.
- Trong Cài đặt cung cấp chế độ giao diện **Sáng / Tối / Theo hệ thống**; áp dụng lên toàn bộ website hiện tại (nền, chữ, bề mặt nội dung) và giao diện TTS-widget.
- Cung cấp cỡ chữ toàn trang từ 12 đến 24 px; áp dụng nhất quán lên các phần tử văn bản website, nhưng loại trừ toàn bộ giao diện TTS-widget, SVG/icon và nội dung media.
- Chế độ Theo hệ thống phải theo dõi thay đổi `prefers-color-scheme` khi trang đang mở.
- Lưu `theme` và `fontSize` trong `tts-widget-settings-v2`, giữ tương thích các thiết lập hiện có.
- Khi tắt Extension trên tab, phải gỡ stylesheet và thuộc tính CSS do Extension thêm vào để khôi phục giao diện website; khi bật lại, áp dụng lại thiết lập đã lưu.
- Không dùng bộ lọc đảo màu toàn trang vì sẽ làm sai màu ảnh/video; giữ nguyên ảnh, video, canvas, SVG và iframe.
- Kiểm thử trên trang sáng/tối, trang có nền màu riêng, biểu mẫu, nội dung mã nguồn, ảnh/video, cỡ chữ 12/16/24 px, chuyển theme hệ thống, tắt/bật lại; kiểm tra cả Chrome và Edge. Không tuyên bố đã kiểm thử trình duyệt nếu chưa thực hiện.

## Kích hoạt và hiển thị launcher

- Popup chỉ được báo đã kích hoạt sau khi xác minh .tts-widget-root, #openReaderBtn, trạng thái data-extension-active và kích thước/visibility thực tế của launcher trong tab.
- Không được coi việc chrome.scripting.executeScript hoàn tất là bằng chứng widget đã khởi tạo thành công; content.js có thể từ chối khởi tạo nếu không tìm thấy vùng nội dung.
- Khi bật lại một root đã tồn tại, phải khôi phục launcher và xóa trạng thái Reader đang mở còn sót lại; không tạo root hoặc listeners trùng lặp.
- Bộ dò nội dung có thể dùng body khi có ít nhất một khối văn bản đọc được; không đặt ngưỡng cứng hai khối khiến trang ngắn không thể khởi tạo.
- Khi chỉnh CSS giao diện, kiểm tra cú pháp toàn bộ stylesheet được gán qua style.textContent, đặc biệt dấu ngoặc nhọn; xác nhận launcher vẫn có rule hiển thị độc lập với Settings.
- Khi kiểm thử, xác minh cả popup state và launcher thật trên trang, không chỉ dựa vào thông báo popup.

## Tích hợp VieNeu TTS Local (GPU/CPU)

- Extension hỗ trợ ba engine: `vieneu-gpu`, `vieneu-cpu`, `browser`; lựa chọn được lưu trong `chrome.storage.sync` dưới khóa `ttsEngine`, voice local lưu ở `ttsLocalVoice`.
- GPU dùng `http://127.0.0.1:8081`; CPU dùng `http://127.0.0.1:8080`. Không tự ý đổi cổng hoặc tự động fallback sang engine khác khi API lỗi.
- Mọi request local phải đi qua Manifest V3 service worker `background.js`; không gọi fetch trực tiếp tới localhost từ content script vì origin của trang có thể bị CORS chặn.
- `vieneu-tts-client.js` chỉ phục vụ Reader website trong `tts-widget-chrome-extension`. Không tích hợp adapter này vào luồng YouTube.
- Giữ Browser TTS như lựa chọn thủ công tương thích ngược. Không xóa VoiceManager, voice rotation, highlight, playback controls hoặc đồng bộ phụ đề.
- VieNeu API hiện trả WAV theo request. Tạm dừng/tiếp tục phải điều khiển phần tử Audio; không gọi SpeechSynthesis.pause/resume cho audio VieNeu.
- Voice local là tên preset đã đăng ký trong audio.cpp (ví dụ `pham_tuyen`). Không suy luận danh sách voice từ preset GGUF; dùng endpoint `/v1/audio/voices?model=vieneu` để kiểm tra.
- API README hiện không cam kết hỗ trợ pitch/rate tùy ý. Không gửi các trường request chưa được xác minh; chỉ truyền các trường đã xác nhận.
- Khi thay đổi luồng tổng hợp, chỉ kiểm thử Reader website: dừng trong lúc đang tạo WAV, pause/resume, lỗi server, chuyển engine và phát liên tiếp. Không thay đổi hoặc kiểm thử lại extension YouTube độc lập trong task tích hợp này.
- Không tuyên bố đã kiểm thử thực tế trên máy người dùng nếu chỉ mới kiểm tra cú pháp hoặc mã nguồn.

## Quy tắc tự đánh giá lại khi yêu cầu chưa đạt

Quy tắc này áp dụng bắt buộc cho mọi dự án con và mọi loại công việc trong repository.

- Khi một yêu cầu đã được thực hiện nhưng kết quả vẫn không đáp ứng, hoặc cùng một lỗi/yêu cầu phải xử lý lặp lại mà chưa thành công, phải dừng cách làm hiện tại. Không tiếp tục lặp lại cùng một thao tác, không vá giao diện/triệu chứng khi chưa xác định nguyên nhân.
- Tự đánh giá lại toàn bộ quá trình: yêu cầu thực tế của người dùng, phạm vi dự án, kiến trúc, luồng dữ liệu, hợp đồng API, cấu trúc DOM/HTML, CSS, trạng thái lưu trữ, thứ tự nạp mã, quyền và môi trường chạy — chọn các yếu tố liên quan để kiểm tra.
- Quay lại bằng chứng gốc: đọc lại mã nguồn mới nhất trên `main`, tài liệu dự án, dữ liệu/API thực tế, log và thông báo lỗi. Không dựa vào giả định hoặc kết luận chưa được xác minh từ lần thử trước.
- Nêu rõ điều gì đã thử, vì sao cách trước không giải quyết được, nguyên nhân gốc có bằng chứng nào hỗ trợ, và kiểm tra nào có thể phân biệt các giả thuyết. Nếu chưa đủ dữ liệu, phải nói rõ phần chưa biết và yêu cầu đúng thông tin tối thiểu cần thiết; không đoán mò.
- Sau khi xác định nguyên nhân, thay đổi đúng điểm gây lỗi; ưu tiên giải pháp gốc thay vì thêm nhiều lớp CSS, workaround hoặc thay đổi không liên quan. Kiểm tra hồi quy và xác minh lại nội dung đã cập nhật trên GitHub.
- Nếu không thể thực hiện hoặc xác minh do thiếu quyền, thiếu môi trường runtime, API local không truy cập được hay giới hạn công cụ, phải nói thẳng giới hạn đó và đưa ra bước kiểm tra cụ thể. Tuyệt đối không tuyên bố đã hoàn tất hoặc đã kiểm thử khi chưa có bằng chứng.
- Cụm từ kích hoạt bắt buộc quy trình này là: **“giờ bạn phải tự đánh giá lại và tìm ra nguyên nhân mà vẫn làm chưa đúng yêu cầu”**. Khi người dùng nói câu này, phải thực hiện đánh giá lại từ đầu theo các bước trên, không tranh luận, không yêu cầu người dùng nhắc lại những thông tin đã có.
- Không chờ người dùng phải nói câu kích hoạt: khi nhận thấy mình đang lặp lại một giải pháp không hiệu quả, chủ động áp dụng quy trình tự đánh giá lại này.
