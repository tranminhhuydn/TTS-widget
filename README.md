# TTS Widget – Web Reader

Trình đọc nội dung trang web có giao diện Reader riêng, hỗ trợ đọc thành tiếng bằng Web Speech API của trình duyệt.

## Mục lục

- [Giới thiệu](#giới-thiệu)
- [Yêu cầu môi trường](#yêu-cầu-môi-trường)
- [Khởi chạy](#khởi-chạy)
- [Mở và sử dụng Reader](#mở-và-sử-dụng-reader)
- [Điều khiển thanh công cụ](#điều-khiển-thanh-công-cụ)
- [Cài đặt](#cài-đặt)
- [Chọn và thử giọng đọc](#chọn-và-thử-giọng-đọc)
- [Đọc từ vị trí chuột phải](#đọc-từ-vị-trí-chuột-phải)
- [Lưu cấu hình](#lưu-cấu-hình)
- [Đọc nền và giới hạn](#đọc-nền-và-giới-hạn)
- [Xử lý sự cố](#xử-lý-sự-cố)

## Giới thiệu

TTS Widget trích xuất nội dung từ phần tử bài viết `article#article` trong trang demo và hiển thị trong Reader toàn màn hình. Reader hỗ trợ chủ đề sáng/tối/màu giấy, tùy chỉnh kiểu chữ, điều khiển SpeechSynthesis, đánh dấu đoạn/từ khi API phát sự kiện phù hợp và menu “Đọc từ đây”.

Đây là bản demo chạy phía trình duyệt; không có máy chủ TTS riêng.

## Yêu cầu môi trường

- Trình duyệt hiện đại có JavaScript và DOM API.
- Để đọc thành tiếng, trình duyệt cần hỗ trợ Web Speech API (`speechSynthesis` và `SpeechSynthesisUtterance`) và có giọng đọc được cài đặt.
- Giọng tiếng Việt phụ thuộc hệ điều hành, trình duyệt và gói giọng đã cài.

## Khởi chạy

1. Tải hoặc clone repository.
2. Mở `index.html` bằng trình duyệt.
3. Với môi trường kiểm thử, có thể phục vụ thư mục bằng một static web server; ứng dụng không yêu cầu bước build.

## Mở và sử dụng Reader

Nhấn **📖 Mở chế độ đọc**. Nếu trình duyệt không hỗ trợ Web Speech API, nhãn nút sẽ hiển thị **Mở chế độ đọc [ không hỗ trợ ]**; Reader vẫn mở để đọc bằng mắt.

Reader chỉ có một trạng thái hiển thị bình thường. Đóng bằng nút ✕ hoặc phím Escape.

## Điều khiển thanh công cụ

- **Đóng**: đóng Reader.
- **Đoạn trước / Đoạn tiếp**: chuyển đến đoạn liền trước hoặc liền sau.
- **Đọc**: bắt đầu đọc từ đầu nội dung.
- **Tạm dừng / Tiếp tục**: điều khiển phiên đọc hiện tại.
- **Dừng**: dừng đọc và xóa trạng thái phiên.
- **Cài đặt**: mở hoặc đóng bảng Settings.
- **A− / A+**: giảm hoặc tăng cỡ chữ nhanh.
- **Phông chữ**: chọn nhanh phông chữ.
- **Đổi nền**: luân phiên màu giấy, tối và sáng.

Tất cả điều khiển phụ luôn hiển thị. Không có chế độ thu gọn/mở rộng thanh công cụ.

Thanh công cụ có thể đặt ở **Header - Đầu trang** hoặc **Footer - Chân trang** trong Settings → Giao diện.

## Cài đặt

Bảng Settings có các nhóm:

- **Giao diện**: chủ đề, vị trí Header/Footer, tự cuộn theo đoạn đang đọc và tiếp tục đọc khi chuyển tab/mất focus.
- **Kiểu chữ**: phông, cỡ chữ, chiều cao dòng và chiều rộng nội dung.
- **Giọng đọc**: tìm/lọc giọng, làm mới danh sách, thử giọng, tốc độ, cao độ và âm lượng.
- **Đồng bộ đọc**: theo dõi đoạn đang đọc và highlight từ nếu API hỗ trợ.
- **Highlight**: bật/tắt highlight đoạn và chọn màu nền, màu chữ, màu viền.

Nút **Mặc định** khôi phục các thiết lập về giá trị mặc định. Nút **Lưu cài đặt** lưu cấu hình hiện tại.

## Chọn và thử giọng đọc

Mở Settings → Giọng đọc. Chọn giọng trong danh sách; có thể nhập từ khóa để lọc, nhấn **Làm mới** để yêu cầu đọc lại danh sách giọng hoặc **Thử giọng** để nghe câu mẫu.

Danh sách giọng có thể tải trễ. Nếu chưa thấy giọng, thử nhấn Làm mới hoặc kiểm tra cài đặt giọng đọc của hệ điều hành.

## Đọc từ vị trí chuột phải

Khi Reader đang mở, nhấn chuột phải trên một đoạn văn hoặc tiêu đề trong vùng nội dung, sau đó chọn **Đọc từ đây**. Menu này chỉ được tạo trong thời gian Reader mở; trang nguồn vẫn dùng menu chuột phải mặc định khi Reader đóng.

## Lưu cấu hình

Các thiết lập giao diện và đọc được lưu trong `localStorage` của trình duyệt. Cấu hình được khôi phục khi tải lại trang trên cùng trình duyệt và cùng origin. Dữ liệu giọng đọc được lưu riêng dưới dạng thông tin định danh; nếu giọng không còn được cung cấp, widget sẽ chọn giọng phù hợp khác hoặc giọng mặc định.

Xóa dữ liệu trang web hoặc dùng hồ sơ/trình duyệt khác có thể làm mất cấu hình đã lưu.

## Đọc nền và giới hạn

Tùy chọn tiếp tục đọc khi chuyển tab hoặc cửa sổ mất focus hoạt động theo cơ chế best-effort. Widget không chủ động pause/cancel chỉ vì tab mất focus và thử khôi phục phiên khi người dùng quay lại.

Web Speech API do trình duyệt và hệ điều hành quản lý. Widget không thể đảm bảo âm thanh tiếp tục trong mọi tình huống, chẳng hạn tab bị loại khỏi bộ nhớ, trình duyệt bị đóng băng, thiết bị ngủ, hệ điều hành dừng âm thanh hoặc engine giọng đọc tự ngắt. Sự kiện ranh giới từ (`onboundary`) cũng không được mọi giọng/trình duyệt hỗ trợ đồng nhất; khi thiếu sự kiện, widget chỉ có thể theo dõi đoạn hiện tại.

## Xử lý sự cố

- **Không có âm thanh**: kiểm tra âm lượng thiết bị, quyền âm thanh, giọng đã chọn và khả năng hỗ trợ Web Speech API.
- **Không thấy giọng tiếng Việt**: cài thêm giọng tiếng Việt trong hệ điều hành (nếu có), sau đó nhấn Làm mới.
- **Danh sách giọng trống lúc mới mở**: chờ một chút rồi nhấn Làm mới.
- **Không highlight được từng từ**: giọng đọc hoặc trình duyệt có thể không phát sự kiện `onboundary`; bật theo dõi đoạn để vẫn nhận biết vị trí đang đọc.
- **Đọc nền bị ngắt**: quay lại tab để widget thử khôi phục; giới hạn nền tảng có thể khiến không thể khôi phục hoàn toàn.
