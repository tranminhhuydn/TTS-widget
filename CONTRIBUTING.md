# Quy tắc làm việc trong repository TTS-widget

Tài liệu này quy định cách thực hiện thay đổi trên repository `tranminhhuydn/TTS-widget`. Áp dụng cho mọi dự án con, trừ khi người dùng yêu cầu rõ ràng khác đi.

## Quy trình GitHub

- Luôn làm việc trực tiếp trên nhánh `main`.
- Không tự ý tạo nhánh phụ (feature, fix hoặc bất kỳ nhánh nào khác).
- Không tự tạo Pull Request (PR), không yêu cầu người dùng merge PR.
- Commit thay đổi trực tiếp lên `main` với nội dung commit rõ ràng.
- Trước khi sửa một file, phải đọc nội dung hiện tại của file đó trên `main`; dùng phiên bản mới nhất để tránh ghi đè thay đổi.
- Không tự ý thay đổi quy trình này, kể cả với tính năng mới hoặc công việc nhiều bước. Chỉ thay đổi khi người dùng yêu cầu rõ ràng.

## Phạm vi dự án con

- Trước khi làm việc, xác định đúng thư mục dự án con và đọc README cùng tài liệu hướng dẫn của dự án đó.
- Chỉ sửa các file thuộc phạm vi dự án được yêu cầu.
- Không sửa mã nguồn, README, prompts hoặc cấu hình của dự án con khác nếu chưa được người dùng yêu cầu.
- Nếu phát hiện cần thay đổi thành phần dùng chung hoặc ảnh hưởng nhiều dự án con, phải nêu rõ lý do và phạm vi ảnh hưởng trước khi thực hiện.

## Nguyên tắc an toàn khi cập nhật

- Không ghi đè nội dung hiện có khi chưa đọc file trên `main`.
- Không suy đoán nội dung file hoặc cấu trúc thư mục; kiểm tra repository trước khi thao tác.
- Phân biệt rõ thay đổi source code với kiểm thử runtime. Không tuyên bố đã kiểm thử trên máy người dùng nếu chưa thực sự thực hiện được.

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
