# VieNeu TTS Local API

Tài liệu hướng dẫn sử dụng API chuyển văn bản tiếng Việt thành giọng nói (Text-to-Speech) của VieNeu-TTS-v3-Turbo thông qua audio.cpp trên Windows.

- **Base URL:** http://127.0.0.1:8080
- **Model ID:** vieneu
- **Định dạng đầu ra đã kiểm tra:** WAV
- **Backend hiện tại:** CPU
- **Runtime:** audio.cpp 0.9.6
- **Không cần chạy Python server.**

Điều kiện: đã cài model, audio.cpp và SEA-G2P theo [setup.md](./setup.md), đồng thời server đang chạy.

## Mục lục

1. [Khởi động API](#1-khởi-động-api)
2. [Kiểm tra trạng thái](#2-kiểm-tra-trạng-thái)
3. [Các endpoint](#3-các-endpoint)
4. [Tạo giọng nói WAV](#4-tạo-giọng-nói-wav)
5. [Gọi API bằng JavaScript](#5-gọi-api-bằng-javascript)
6. [Sử dụng nhiều voice](#6-sử-dụng-nhiều-voice)
7. [Tích hợp Chrome Extension và web](#7-tích-hợp-chrome-extension-và-web)
8. [Xử lý lỗi thường gặp](#8-xử-lý-lỗi-thường-gặp)

## 1. Khởi động API

Mở PowerShell và chạy:

~~~powershell
$ModelRoot = "$env:USERPROFILE\.lmstudio\models\pnnbao-ump\VieNeu-TTS-v3-Turbo"
$AudioCpp = Join-Path $ModelRoot "audio-v0.9.6-bin-windows-x64-cpu-portable"
Set-Location $AudioCpp
.\audiocpp_server.exe --config (Join-Path $ModelRoot "server.json")
~~~

Giữ cửa sổ PowerShell này mở trong khi sử dụng TTS.

API mặc định lắng nghe tại:

~~~text
http://127.0.0.1:8080
~~~

## 2. Kiểm tra trạng thái

Mở cửa sổ PowerShell thứ hai:

~~~powershell
Invoke-RestMethod "http://127.0.0.1:8080/health"
~~~

Nếu server hoạt động, endpoint trả về thông tin trạng thái và phiên bản. Trên cấu hình đã kiểm tra, server báo trạng thái ok, backend cpu, phiên bản 0.9.6.

## 3. Các endpoint

| Method | Endpoint | Mục đích |
|---|---|---|
| GET | /health | Kiểm tra server |
| GET | /v1/models | Xem model được server cung cấp |
| GET | /v1/audio/voices | Truy vấn danh sách voice API công bố |
| POST | /v1/audio/speech | Tổng hợp văn bản thành âm thanh |

Ví dụ:

~~~powershell
Invoke-RestMethod "http://127.0.0.1:8080/v1/models"
Invoke-RestMethod "http://127.0.0.1:8080/v1/audio/voices?model=vieneu"
~~~

**Lưu ý:** trong lần kiểm tra cấu hình hiện tại, endpoint voices trả về object rỗng ({}). Vì vậy không nên coi endpoint này là danh sách đầy đủ các preset đã xuất trên ổ đĩa.

## 4. Tạo giọng nói WAV

### Endpoint

~~~http
POST http://127.0.0.1:8080/v1/audio/speech
Content-Type: application/json
~~~

### Request body

~~~json
{
  "model": "vieneu",
  "input": "Xin chào! Đây là giọng đọc tiếng Việt từ VieNeu TTS chạy trên máy tính của tôi.",
  "voice": "Pham Tuyen",
  "response_format": "wav"
}
~~~

| Trường | Ý nghĩa |
|---|---|
| model | Model ID, cấu hình hiện tại là vieneu |
| input | Văn bản cần đọc |
| voice | Tên voice gửi trong request |
| response_format | Định dạng âm thanh, ví dụ wav |

API trả về dữ liệu âm thanh WAV (binary), không phải JSON. Hãy lưu response thành file hoặc đưa vào audio player.

### Gọi bằng Windows PowerShell 5.1

PowerShell 5.1 cần gửi JSON dưới dạng byte UTF-8. Nếu gửi chuỗi trực tiếp, SEA-G2P có thể báo lỗi text is not valid UTF-8.

~~~powershell
$body = @{
    model = "vieneu"
    input = "Xin chào! Tôi đang thử nghiệm hệ thống đọc văn bản tiếng Việt bằng VieNeu TTS."
    voice = "Pham Tuyen"
    response_format = "wav"
} | ConvertTo-Json -Compress

$bytes = [System.Text.Encoding]::UTF8.GetBytes($body)

Invoke-WebRequest -Uri "http://127.0.0.1:8080/v1/audio/speech" -Method Post -ContentType "application/json; charset=utf-8" -Body $bytes -OutFile "$env:USERPROFILE\test-vieneu.wav"

Get-Item "$env:USERPROFILE\test-vieneu.wav" | Select-Object FullName, Length
~~~

Mở file test-vieneu.wav trong thư mục user profile để nghe thử.

## 5. Gọi API bằng JavaScript

Ví dụ dùng Fetch API trong ứng dụng web hoặc extension:

~~~javascript
async function synthesize(text) {
  const response = await fetch(
    "http://127.0.0.1:8080/v1/audio/speech",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "vieneu",
        input: text,
        voice: "Pham Tuyen",
        response_format: "wav"
      })
    }
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error("VieNeu TTS error " + response.status + ": " + message);
  }

  return await response.blob();
}

async function speak(text) {
  const wavBlob = await synthesize(text);
  const audioUrl = URL.createObjectURL(wavBlob);
  const audio = new Audio(audioUrl);

  audio.addEventListener("ended", () => {
    URL.revokeObjectURL(audioUrl);
  }, { once: true });

  await audio.play();
}

speak("Xin chào! Đây là thử nghiệm đọc tiếng Việt.");
~~~

Nếu phát nhiều đoạn liên tiếp, ứng dụng nên quản lý hàng đợi audio và thu hồi object URL sau khi phát xong.

## 6. Sử dụng nhiều voice

Các preset VieNeu được xuất vào thư mục:

~~~text
%USERPROFILE%\.lmstudio\models\pnnbao-ump\VieNeu-TTS-v3-Turbo\voices\
~~~

Mỗi voice có hai file tài nguyên:

- speaker.emb.txt: speaker embedding.
- ref_codes.txt: reference codes.

Ví dụ:

~~~text
voices/
├── pham_tuyen/
│   ├── speaker.emb.txt
│   └── ref_codes.txt
└── <voice_slug_khac>/
    ├── speaker.emb.txt
    └── ref_codes.txt
~~~

### Trạng thái hỗ trợ cần lưu ý

Cấu hình server hiện tại đặt hai file của Phạm Tuyên trong default_request_options:

- reference_codes_file
- speaker_embedding_file

Request mẫu có trường voice, nhưng việc gửi tên voice khác **chưa được xác minh là tự động đổi sang embedding và reference codes tương ứng** trong cấu hình hiện tại. Việc xuất đủ preset ra thư mục cũng chưa tự động đăng ký chúng thành voice động của API.

Để đổi voice mặc định theo cách đã có trong cấu hình, sửa đồng thời cả hai đường dẫn trong server.json sang cùng thư mục voice, ví dụ:

~~~json
"default_request_options": {
  "reference_codes_file": "C:/Users/PC/.lmstudio/models/pnnbao-ump/VieNeu-TTS-v3-Turbo/voices/<voice_slug>/ref_codes.txt",
  "speaker_embedding_file": "C:/Users/PC/.lmstudio/models/pnnbao-ump/VieNeu-TTS-v3-Turbo/voices/<voice_slug>/speaker.emb.txt"
}
~~~

Sau khi sửa, khởi động lại server. Không chỉ đổi một trong hai đường dẫn.

Muốn chọn voice linh hoạt theo từng request, cần bổ sung hoặc xác minh cơ chế truyền file voice theo request ở phía audio.cpp. Không nên giả định chỉ thay giá trị voice là đủ.

## 7. Tích hợp Chrome Extension và web

Kiến trúc sử dụng:

~~~text
YouTube subtitle / nội dung web
              |
              v
        Chrome Extension
              |
              | POST /v1/audio/speech
              v
       VieNeu TTS Local API
       http://127.0.0.1:8080
              |
              v
           WAV audio
              |
              v
          Audio Player
~~~

Các lưu ý khi tích hợp:

1. Máy người dùng phải đang chạy VieNeu TTS server.
2. Extension cần khai báo host permission phù hợp cho http://127.0.0.1:8080/*.
3. Cần kiểm tra cấu hình CORS của server khi gọi từ trang web hoặc extension. Nếu trình duyệt chặn request, phải cấu hình CORS ở server hoặc dùng cơ chế trung gian phù hợp; không thể khắc phục chỉ bằng JavaScript.
4. Không đưa API lên mạng công cộng nếu chưa thiết kế xác thực và giới hạn truy cập. Cấu hình hiện tại bind vào 127.0.0.1, chỉ phục vụ trên máy local.
5. API trả WAV hoàn chỉnh theo request; ví dụ trên chưa phải streaming audio từng đoạn.

## 8. Xử lý lỗi thường gặp

### text is not valid UTF-8

Với Windows PowerShell 5.1, chuyển JSON sang byte UTF-8 bằng:

~~~powershell
$bytes = [System.Text.Encoding]::UTF8.GetBytes($body)
~~~

Sau đó gửi -Body $bytes và Content-Type application/json; charset=utf-8.

### sea-g2p failed: phonemize...

Kiểm tra:

- File sea_g2p.bin trong thư mục model.
- File native sea_g2p_rs.dll cạnh audiocpp_server.exe.
- Hai đường dẫn vieneu_v3_turbo.g2p_dict_file và vieneu_v3_turbo.g2p_library trong session_options.
- Khởi động lại server sau khi sửa cấu hình.

### Không kết nối được 127.0.0.1:8080

- Kiểm tra cửa sổ PowerShell chạy server còn hoạt động không.
- Gọi lại /health.
- Kiểm tra port 8080 có bị chương trình khác sử dụng không.

### Không đổi được giọng

Kiểm tra hai đường dẫn reference_codes_file và speaker_embedding_file trong server.json. Theo cấu hình hiện tại, đây là voice mặc định; tham số voice chưa được xác minh có khả năng chuyển preset động.

### Tốc độ tổng hợp chậm

Server hiện dùng backend CPU. Thời gian tổng hợp phụ thuộc cấu hình máy, độ dài văn bản và model. Backend GPU cần runtime và cấu hình tương thích riêng.

---

## Tài liệu liên quan

- [Hướng dẫn cài đặt VieNeu TTS Local](./setup.md)
- [Script xuất voice presets](./scripts/export-vieneu-voices.ps1)



## 9. Đăng ký nhiều voice trực tiếp trong audio.cpp

Không cần Node.js wrapper. audio.cpp 0.9.6 hỗ trợ `voice_presets` trong cấu hình model. Script bên dưới tự quét thư mục `voices`, đăng ký các preset có đủ hai file `speaker.emb.txt` và `ref_codes.txt`, sao lưu cấu hình rồi khởi động audio.cpp.

### Chạy tự động

1. Dừng server audio.cpp đang chạy bằng `Ctrl+C`.
2. Mở PowerShell tại thư mục gốc repository `TTS-widget`.
3. Chạy:

~~~powershell
powershell -ExecutionPolicy Bypass -File ".\\tts-local\\scripts\\register-vieneu-voices.ps1"
~~~

4. Khi server khởi động xong, mở PowerShell thứ hai và kiểm tra:

~~~powershell
Invoke-RestMethod "http://127.0.0.1:8080/v1/audio/voices?model=vieneu" |
    ConvertTo-Json -Depth 5
~~~

Script chỉ đăng ký các thư mục voice có đủ cả embedding và reference codes. Mặc định chọn `pham_tuyen`; nếu thư mục đó không tồn tại, script chọn preset hợp lệ đầu tiên. Trước khi sửa, script tạo bản sao `server.json.YYYYMMDD-HHMMSS.bak`.

### Chỉ cập nhật cấu hình, không khởi động server

~~~powershell
powershell -ExecutionPolicy Bypass -File ".\\tts-local\\scripts\\register-vieneu-voices.ps1" -ConfigureOnly
~~~

Sau đó khởi động audio.cpp theo mục 1. Nếu cần khôi phục, chép file backup tương ứng đè lại `server.json`.

### Chọn voice khi tổng hợp

Dùng tên thư mục voice làm giá trị `voice`:

~~~json
{
  "model": "vieneu",
  "input": "Xin chào! Đây là thử nghiệm giọng đọc.",
  "voice": "pham_tuyen",
  "response_format": "wav"
}
~~~

Lưu ý: `GET /v1/audio/voices` của audio.cpp liệt kê tên voice preset đã cấu hình cùng các voice trong reference library (nếu có). Nó không liệt kê mọi voice nhúng sẵn trong GGUF.


## 10. Chạy VieNeu cùng Windows

Có thể đăng ký audio.cpp thành Windows Service bằng NSSM để server tự chạy nền khi Windows khởi động. Service chạy bằng tài khoản Windows hiện tại để có quyền đọc model trong thư mục user profile.

### Cài đặt

Mở PowerShell **Run as Administrator**, chuyển đến thư mục gốc repository rồi chạy:

~~~powershell
powershell -ExecutionPolicy Bypass -File ".\tts-local\scripts\install-vieneu-service.ps1"
~~~

Script sẽ tải NSSM 2.24 từ trang chính thức, lưu tại thư mục \`windows-service\`, yêu cầu mật khẩu tài khoản Windows hiện tại, đăng ký service \`VieNeuTTS\` ở chế độ Automatic và khởi động dịch vụ. Mật khẩu chỉ được dùng trong lúc cấu hình service, không ghi vào script.

Lưu ý: cần nhập mật khẩu tài khoản Windows thực tế, không phải mã PIN Windows Hello. Nếu tài khoản không có mật khẩu hoặc chính sách máy không cho phép service log on bằng tài khoản đó, không tiếp tục; cần chọn phương án chạy bằng Task Scheduler thay thế.

Trước khi cài, hãy dừng server audio.cpp đang chạy thủ công để tránh trùng cổng 8080.

### Quản lý dịch vụ

Chạy PowerShell bằng quyền Administrator:

~~~powershell
# Xem trạng thái
powershell -ExecutionPolicy Bypass -File ".\tts-local\scripts\manage-vieneu-service.ps1" -Action Status

# Khởi động
powershell -ExecutionPolicy Bypass -File ".\tts-local\scripts\manage-vieneu-service.ps1" -Action Start

# Dừng
powershell -ExecutionPolicy Bypass -File ".\tts-local\scripts\manage-vieneu-service.ps1" -Action Stop

# Khởi động lại
powershell -ExecutionPolicy Bypass -File ".\tts-local\scripts\manage-vieneu-service.ps1" -Action Restart
~~~

### Gỡ dịch vụ

~~~powershell
powershell -ExecutionPolicy Bypass -File ".\tts-local\scripts\uninstall-vieneu-service.ps1"
~~~

Lệnh gỡ chỉ xóa đăng ký Windows Service; giữ lại NSSM và log để tiện kiểm tra hoặc cài lại.

### Kiểm tra API và log

Sau khi service ở trạng thái Running, kiểm tra:

~~~powershell
Invoke-RestMethod "http://127.0.0.1:8080/health"
~~~

Log được lưu tại:

~~~text
%USERPROFILE%\.lmstudio\models\pnnbao-ump\VieNeu-TTS-v3-Turbo\windows-service\logs\
~~~

Service tự khởi động lại tiến trình nếu audio.cpp thoát bất thường. Nếu đổi đường dẫn model hoặc cấu hình service, hãy dừng service trước khi chỉnh sửa và khởi động lại sau đó.
