# VieNeu-TTS-v3-Turbo trên Windows bằng audio.cpp

Tài liệu này ghi lại cách dựng API TTS local trên Windows PowerShell 5.1. Python project cũ chỉ được dùng để lấy tài nguyên tĩnh (voice presets và SEA-G2P); khi chạy tổng hợp giọng đọc, dùng audio.cpp, không cần chạy Python server.

## Mục lục

1. Thành phần và thư mục
2. Chuẩn bị audio.cpp và model
3. Cài SEA-G2P
4. Xuất tất cả voice presets
5. Cấu hình server.json
6. Chạy API
7. Kiểm tra tiếng Việt
8. Khắc phục lỗi

## 1. Thành phần và thư mục

Các thành phần đã dùng:

- Model GGUF: vieneu-v3-turbo-q8_0.gguf
- audio.cpp portable Windows x64 CPU, phiên bản 0.9.6
- SEA-G2P dictionary: sea_g2p.bin
- SEA-G2P native library: sea_g2p_rs.dll
- Voice preset JSON: voices_v3_turbo.json

Thư mục model:

~~~text
C:\Users\PC\.lmstudio\models\pnnbao-ump\VieNeu-TTS-v3-Turbo
~~~

Thư mục runtime:

~~~text
C:\Users\PC\.lmstudio\models\pnnbao-ump\VieNeu-TTS-v3-Turbo\audio-v0.9.6-bin-windows-x64-cpu-portable
~~~

Trong runtime cần có audiocpp_server.exe, audiocpp_cli.exe, audiocpp_gguf.exe và sea_g2p_rs.dll. Model GGUF và sea_g2p.bin nằm ở thư mục model.

Nếu dùng đường dẫn khác, cập nhật các đường dẫn tuyệt đối tương ứng trong server.json.

## 2. Chuẩn bị audio.cpp và model

1. Đặt vieneu-v3-turbo-q8_0.gguf vào thư mục model.
2. Giải nén bản portable audio.cpp Windows x64 CPU vào thư mục runtime.
3. Kiểm tra phiên bản:

~~~powershell
cd "$env:USERPROFILE\.lmstudio\models\pnnbao-ump\VieNeu-TTS-v3-Turbo\audio-v0.9.6-bin-windows-x64-cpu-portable"
.\audiocpp_server.exe --version
~~~

Phiên bản đã kiểm tra: audio.cpp 0.9.6, backend cpu.

## 3. Cài SEA-G2P

VieNeu cần SEA-G2P để phonemize văn bản tiếng Việt. Cần cả dictionary và native DLL. File sea_g2p_rs.pyd trong virtualenv Python không thay thế được DLL native.

1. Sao chép sea_g2p.bin vào thư mục model.
2. Tải asset Windows x86_64 sea_g2p_rs-windows-x86_64.dll từ release SEA-G2P tương thích.
3. Đổi tên file thành sea_g2p_rs.dll.
4. Đặt DLL cạnh audiocpp_server.exe trong thư mục runtime.

Đường dẫn DLL đã dùng:

~~~text
C:\Users\PC\.lmstudio\models\pnnbao-ump\VieNeu-TTS-v3-Turbo\audio-v0.9.6-bin-windows-x64-cpu-portable\sea_g2p_rs.dll
~~~

## 4. Xuất tất cả voice presets

File nguồn đã dùng:

~~~text
D:\dev\python\VieNeu-TTS\VieNeu-TTS\src\vieneu\assets\voices_v3_turbo.json
~~~

Repository có script scripts/export-vieneu-voices.ps1 để xuất toàn bộ object presets. Mỗi preset được xuất thành một thư mục riêng, gồm:

- speaker.emb.txt: 192 số embedding, phân cách bằng dấu phẩy.
- ref_codes.txt: mỗi frame một dòng, 16 số nguyên phân cách bằng dấu cách.

Chạy từ thư mục repository:

~~~powershell
.\scripts\export-vieneu-voices.ps1
~~~

Hoặc truyền rõ đường dẫn:

~~~powershell
.\scripts\export-vieneu-voices.ps1 -SourceJson "D:\dev\python\VieNeu-TTS\VieNeu-TTS\src\vieneu\assets\voices_v3_turbo.json" -OutputRoot "$env:USERPROFILE\.lmstudio\models\pnnbao-ump\VieNeu-TTS-v3-Turbo\voices"
~~~

Script đọc JSON UTF-8, tự tạo thư mục và xuất tất cả preset có đủ speaker_emb và codes. Tên thư mục được chuyển thành dạng không dấu. Voice Phạm Tuyên đã được xuất trước đó; chạy script sẽ tạo lại/đồng bộ toàn bộ preset, bao gồm các voice còn lại.

Cấu trúc kết quả:

~~~text
voices/
  pham_tuyen/
    speaker.emb.txt
    ref_codes.txt
  <cac_voice_khac>/
    speaker.emb.txt
    ref_codes.txt
~~~

## 5. Cấu hình server.json

Tạo server.json trong thư mục model. Cấu hình mẫu theo thiết lập đã chạy:

~~~json
{
  "host": "127.0.0.1",
  "port": 8080,
  "backend": "cpu",
  "lazy_load": true,
  "max_loaded_models": 1,
  "models": [
    {
      "id": "vieneu",
      "family": "vieneu_v3_turbo",
      "path": "C:/Users/PC/.lmstudio/models/pnnbao-ump/VieNeu-TTS-v3-Turbo/vieneu-v3-turbo-q8_0.gguf",
      "task": "tts",
      "mode": "offline",
      "default_request_options": {
        "reference_codes_file": "C:/Users/PC/.lmstudio/models/pnnbao-ump/VieNeu-TTS-v3-Turbo/voices/pham_tuyen/ref_codes.txt",
        "speaker_embedding_file": "C:/Users/PC/.lmstudio/models/pnnbao-ump/VieNeu-TTS-v3-Turbo/voices/pham_tuyen/speaker.emb.txt"
      },
      "session_options": {
        "vieneu_v3_turbo.g2p_dict_file": "C:/Users/PC/.lmstudio/models/pnnbao-ump/VieNeu-TTS-v3-Turbo/sea_g2p.bin",
        "vieneu_v3_turbo.g2p_library": "C:/Users/PC/.lmstudio/models/pnnbao-ump/VieNeu-TTS-v3-Turbo/audio-v0.9.6-bin-windows-x64-cpu-portable/sea_g2p_rs.dll"
      }
    }
  ]
}
~~~

Nếu thư mục cài đặt khác, sửa các đường dẫn C:/Users/PC/... cho khớp. Nên dùng dấu / trong đường dẫn JSON.

Để đổi voice mặc định, thay cả reference_codes_file và speaker_embedding_file bằng hai file tương ứng trong thư mục voice khác, ví dụ voices/<voice_slug>/. Không chỉ thay một trong hai file.

## 6. Chạy API

Mở PowerShell:

~~~powershell
$ModelRoot = "$env:USERPROFILE\.lmstudio\models\pnnbao-ump\VieNeu-TTS-v3-Turbo"
$AudioCpp = Join-Path $ModelRoot "audio-v0.9.6-bin-windows-x64-cpu-portable"
cd $AudioCpp
.\audiocpp_server.exe --config (Join-Path $ModelRoot "server.json")
~~~

Giữ cửa sổ server mở. API chạy tại http://127.0.0.1:8080.

Mở cửa sổ PowerShell khác và kiểm tra:

~~~powershell
Invoke-RestMethod "http://127.0.0.1:8080/health"
~~~

Trong lần kiểm tra, health trả trạng thái ok, backend cpu, một model và version 0.9.6.

## 7. Kiểm tra tạo WAV tiếng Việt

**Lưu ý quan trọng với Windows PowerShell 5.1:** cần gửi JSON dưới dạng byte UTF-8. Nếu gửi chuỗi trực tiếp, SEA-G2P có thể báo text is not valid UTF-8.

~~~powershell
$body = @{
    model = "vieneu"
    input = "Xin chào! Tôi đang thử nghiệm hệ thống đọc văn bản tiếng Việt bằng VieNeu TTS, với giọng nam Phạm Tuyên."
    voice = "Pham Tuyen"
    response_format = "wav"
} | ConvertTo-Json -Compress

$bytes = [System.Text.Encoding]::UTF8.GetBytes($body)

Invoke-WebRequest -Uri "http://127.0.0.1:8080/v1/audio/speech" -Method Post -ContentType "application/json; charset=utf-8" -Body $bytes -OutFile "$env:USERPROFILE\test-vieneu-vietnamese.wav"

Get-Item "$env:USERPROFILE\test-vieneu-vietnamese.wav" | Select-Object FullName, Length
~~~

Mở file test-vieneu-vietnamese.wav trong thư mục user profile để nghe.

## 8. Khắc phục lỗi

### text is not valid UTF-8

Dùng cách gửi byte UTF-8 ở mục 7. Không truyền chuỗi JSON trực tiếp bằng Invoke-WebRequest trên Windows PowerShell 5.1.

### sea-g2p failed: phonemize...

Kiểm tra sea_g2p.bin, DLL native sea_g2p_rs.dll, hai đường dẫn g2p_dict_file và g2p_library trong session_options. Đảm bảo DLL nằm đúng vị trí và khởi động lại server sau khi sửa cấu hình.

### Không nạp được model hoặc server không khởi động

Kiểm tra đường dẫn model GGUF, server.json và các DLL phụ thuộc. Đọc log trong cửa sổ PowerShell chạy server.

### Tốc độ chậm

Thiết lập hiện tại dùng CPU. Hiệu năng có thể thấp hơn backend CUDA trên GPU được hỗ trợ.

---

Kết quả: VieNeu-TTS-v3-Turbo cung cấp API local tại 127.0.0.1:8080, dùng SEA-G2P xử lý tiếng Việt và audio.cpp tổng hợp WAV. Không cần chạy Python server.


## 9. Chạy Voice Manager wrapper (tùy chọn)

Để có API liệt kê và chọn voice, dùng wrapper Node.js thay vì chạy trực tiếp `audiocpp_server.exe`.

1. Cài Node.js 18 trở lên.
2. Nếu audio.cpp đang chạy thủ công ở port 8080, nhấn `Ctrl+C` trong cửa sổ server để tắt.
3. Từ thư mục gốc repository, chạy:

~~~powershell
node .\tts-local\server.js
~~~

Wrapper tự khởi động audio.cpp bằng cấu hình `server.json` hiện có. API wrapper chạy ở `http://127.0.0.1:8081`; API audio.cpp nội bộ vẫn ở port 8080.

- `GET /api/voices`: liệt kê preset đã xuất và trạng thái đủ file.
- `POST /api/voices/select`: chọn voice theo id thư mục, cập nhật hai file voice trong `server.json` và restart audio.cpp.
- `POST /v1/audio/speech`: gửi yêu cầu tổng hợp qua wrapper.

Chi tiết request/response xem [README Voice Manager API](./README.md#9-voice-manager-api).

**Lưu ý:** chọn voice sẽ restart audio.cpp và nạp model lại. Chỉ chạy một audio.cpp server trên port 8080; không chạy đồng thời server thủ công và wrapper.
