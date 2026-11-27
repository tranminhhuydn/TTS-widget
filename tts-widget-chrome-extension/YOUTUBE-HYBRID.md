# YouTube Hybrid TTS

## Mục tiêu

Đọc phụ đề YouTube thành lời kể liên tục, không phát TTS riêng cho từng event JSON3. Không tạo bảng điều khiển phát riêng: YouTube giữ quyền điều khiển phát, tạm dừng, tua và tốc độ video.

## Các module

- \`youtube-subtitle-parser.js\`: phân tích JSON3, ghép các mảnh phụ đề và chia câu; nội suy timestamp câu từ timestamp của các event.
- \`youtube-hybrid-sync.js\`: lập lịch đọc theo thời gian video, tạm dừng/tiếp tục cùng video và đồng bộ lại sau khi tua.
- \`youtube-hybrid.js\`: tìm caption track từ player response, tải phụ đề JSON3, chọn giọng và phát bằng Web Speech API.
- \`lib/tts-widget.js\`: chia sẻ lựa chọn giọng đọc và âm lượng với các tab thông qua \`chrome.storage.sync\`.

## Cách dùng

1. Mở video YouTube có phụ đề.
2. Mở popup TTS-widget và nhấn **Kích hoạt trên trang này**.
3. Phát/tạm dừng/tua video bằng các nút gốc của YouTube.
4. Chọn giọng đọc trong Cài đặt Reader hiện có; lựa chọn được đồng bộ giữa các tab.
5. Điều chỉnh âm lượng trực tiếp trên popup Extension.

## Nguyên tắc đồng bộ

- Đọc theo câu hoàn chỉnh, không theo ranh giới event.
- Không bỏ event chỉ vì timestamp của chúng chồng lấn.
- Khi video tạm dừng, TTS tạm dừng; khi tiếp tục, TTS tiếp tục.
- Khi tua, hủy câu hiện tại và tìm câu tương ứng với thời gian mới.
- Khi video chạy nhanh hơn lời đọc, bỏ qua câu đã quá cũ tại ranh giới câu; không cắt ngang câu đang đọc.
- Không viết lại nội dung phụ đề bằng AI.

## Giới hạn hiện tại

- Phụ đề phải có trong caption tracks của YouTube và truy cập được bằng JSON3.
- Thời điểm bắt đầu/kết thúc câu được nội suy từ event chứa ký tự đầu/cuối; đây là xấp xỉ, không phải timestamp chính xác từng từ.
- Chưa hỗ trợ tự động dịch phụ đề, chỉnh sửa nội dung bằng AI hoặc đồng bộ highlight từng từ trên video.
- Cần kiểm thử thực tế trên Chrome/Edge với nhiều loại track (phụ đề tải lên, phụ đề tự động, nhiều ngôn ngữ).
