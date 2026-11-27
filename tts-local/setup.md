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
9. Đăng ký Windows Service

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



## 9. Đăng ký Windows Service

Sau khi API chạy ổn định ở chế độ thủ công, có thể đăng ký audio.cpp thành Windows Service để VieNeu tự khởi động cùng Windows. Bộ cài dùng **NSSM 2.24** để quản lý tiến trình `audiocpp_server.exe`.

### Điều kiện trước khi cài

- Đã hoàn tất các mục 1–8 và kiểm tra API hoạt động.
- Dừng server đang chạy thủ công bằng `Ctrl+C`. Không để tiến trình thủ công và service cùng chiếm cổng 8080.
- Các script cài đặt, quản lý và gỡ dịch vụ đã có trong `tts-local/scripts`.
- Tài khoản Windows chạy service cần có mật khẩu tài khoản. PIN Windows Hello không thay thế mật khẩu đăng nhập Windows.
- Mở PowerShell bằng **Run as Administrator**. Nếu không, script sẽ báo lỗi vì có chỉ thị `#requires -RunAsAdministrator`.

> Nên mở PowerShell Administrator bằng chính tài khoản Windows đang dùng VieNeu, không chuyển sang một tài khoản quản trị khác. Service cần quyền đọc model, cấu hình, SEA-G2P và các file voice trong thư mục người dùng.

### Cài đặt

Từ thư mục gốc repository `D:\dev\TTS-widget`, chạy:

```powershell
powershell -ExecutionPolicy Bypass -File ".\tts-local\scripts\install-vieneu-service.ps1"
```

Script thực hiện các bước:

1. Kiểm tra `audiocpp_server.exe` và `server.json`.
2. Tải NSSM 2.24 từ trang phát hành chính thức nếu máy chưa có, sau đó lưu tại thư mục `windows-service` trong thư mục model.
3. Đăng ký service tên `VieNeuTTS`.
4. Cấu hình service chạy bằng tài khoản Windows hiện tại và yêu cầu nhập mật khẩu tài khoản.
5. Đặt kiểu khởi động tự động, bật ghi log và tự khởi động lại tiến trình nếu server bị dừng bất thường.
6. Khởi động service.

Mật khẩu được nhập bằng dấu nhắc bảo mật; script không ghi mật khẩu vào file. Windows/NSSM lưu thông tin đăng nhập service trong cấu hình bảo mật của hệ điều hành.

### Kiểm tra sau cài đặt

```powershell
Get-Service VieNeuTTS
Invoke-RestMethod "http://127.0.0.1:8080/health"
```

Xem tài khoản chạy service, kiểu khởi động và PID:

```powershell
Get-CimInstance Win32_Service -Filter "Name='VieNeuTTS'" |
    Select-Object Name, State, StartMode, StartName, ProcessId
```

Kết quả mong đợi: service có trạng thái `Running`, `StartMode` là `Auto`, và API health trả về trạng thái hoạt động bình thường.

### Quản lý service

Chạy các lệnh trong PowerShell Administrator:

```powershell
# Xem trạng thái
powershell -ExecutionPolicy Bypass -File ".\tts-local\scripts\manage-vieneu-service.ps1" -Action Status

# Khởi động
powershell -ExecutionPolicy Bypass -File ".\tts-local\scripts\manage-vieneu-service.ps1" -Action Start

# Dừng
powershell -ExecutionPolicy Bypass -File ".\tts-local\scripts\manage-vieneu-service.ps1" -Action Stop

# Khởi động lại sau khi thay đổi cấu hình
powershell -ExecutionPolicy Bypass -File ".\tts-local\scripts\manage-vieneu-service.ps1" -Action Restart
```

### Gỡ service

Mở PowerShell Administrator tại thư mục gốc repository:

```powershell
powershell -ExecutionPolicy Bypass -File ".\tts-local\scripts\uninstall-vieneu-service.ps1"
```

Lệnh này dừng và xóa đăng ký service. NSSM và log được giữ lại trong thư mục `windows-service`; model, voice và `server.json` không bị xóa.

### Log và xử lý lỗi

Log stdout/stderr được lưu tại:

```text
%USERPROFILE%\.lmstudio\models\pnnbao-ump\VieNeu-TTS-v3-Turbo\windows-service\logs\
```

Nếu service không khởi động:

1. Kiểm tra service có dùng đúng tài khoản Windows và mật khẩu còn hợp lệ không.
2. Kiểm tra tài khoản đó có quyền đọc model, `server.json`, SEA-G2P DLL và thư mục voice không.
3. Kiểm tra cổng 8080 có bị chương trình khác chiếm không.
4. Đọc `stdout.log` và `stderr.log` để xem lỗi từ audio.cpp.
5. Sau khi sửa `server.json` hoặc file liên quan, khởi động lại service.

Nếu tài khoản Windows không có mật khẩu hoặc không thể cấu hình quyền đăng nhập dưới dạng service, không nên đổi tùy tiện sang `LocalSystem`; hãy cân nhắc dùng Task Scheduler chạy khi người dùng đăng nhập.


## 10. Cài thêm API GPU (giữ nguyên CPU)

Cấu hình này tạo một instance CUDA riêng, không sửa cấu hình CPU và không thay đổi API đang chạy ở cổng 8080.

### Cấu hình song song

| Instance | Runtime | Backend | Port |
|---|---|---|---:|
| VieNeu CPU | audio.cpp 0.9.6 CPU portable hiện tại | cpu | 8080 |
| VieNeu GPU | audio.cpp 0.9.6 CUDA 12.4 | cuda | 8081 |

GPU mục tiêu là NVIDIA RTX 2050 4 GB. Model GGUF và thư mục voice được dùng chung; mỗi server có cấu hình riêng. Hai instance có thể cùng tồn tại, nhưng VRAM 4 GB có thể giới hạn khả năng nạp model hoặc mức tăng tốc thực tế.

### Cài runtime CUDA

Gói Windows CUDA 12.4 của audio.cpp v0.9.6 gồm hai archive riêng: CUDA binary khoảng 471 MB và CUDA runtime libraries khoảng 607 MB. Script tự tải cả hai, kiểm tra SHA-256 theo release, giải nén vào thư mục riêng và sao chép SEA-G2P DLL từ runtime CPU. Cần khoảng hơn 1 GB dung lượng tải xuống, cộng dung lượng giải nén.

Từ thư mục gốc repository, chạy PowerShell:

~~~powershell
powershell -ExecutionPolicy Bypass -File ".\tts-local\scripts\install-vieneu-gpu.ps1"
~~~

Script tạo server-gpu.json từ cấu hình CPU, chỉ đổi backend thành cuda, port thành 8081 và cập nhật đường dẫn SEA-G2P DLL. File cấu hình CPU không bị sửa.

### Khởi động và kiểm tra GPU

Không dừng API CPU. Mở một cửa sổ PowerShell khác và chạy:

~~~powershell
powershell -ExecutionPolicy Bypass -File ".\tts-local\scripts\start-vieneu-gpu.ps1"
~~~

Kiểm tra API GPU trong cửa sổ PowerShell khác:

~~~powershell
Invoke-RestMethod "http://127.0.0.1:8081/health"
~~~

Sau đó gửi request tạo WAV theo mục 7, nhưng thay URL thành http://127.0.0.1:8081/v1/audio/speech. Trong lúc tổng hợp, theo dõi nvidia-smi để xác nhận GPU có hoạt động. Chỉ coi GPU đã chạy thành công khi server nạp model, request tạo WAV hoàn tất và log xác nhận backend CUDA.

API CPU vẫn ở http://127.0.0.1:8080. Windows Service VieNeuTTS hiện tại vẫn trỏ tới runtime CPU; chưa cài hoặc thay đổi service GPU ở bước thử nghiệm này.

### Lỗi thường gặp

- ggml-cuda.dll không tìm thấy: kiểm tra đã giải nén cả hai archive CUDA vào runtime GPU.
- cudart, cuBLAS hoặc cuFFT không tìm thấy: kiểm tra nội dung archive cudart đã được giải nén cạnh các binary theo cấu trúc gói.
- Không đủ VRAM: RTX 2050 có 4 GB VRAM; đóng ứng dụng GPU khác, thử tải model khi máy ít sử dụng GPU. Không thay đổi runtime CPU.
- Cổng 8081 đã được sử dụng: kiểm tra tiến trình đang chiếm cổng trước khi chạy GPU API.
