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


## 9. Voice Manager API (khuyến nghị)

Repository có wrapper Node.js tại `server.js`. Wrapper quản lý audio.cpp, đọc danh sách preset từ thư mục `voices` và cho phép chọn voice bằng API. Không cần Python hoặc package npm bên ngoài.

### Yêu cầu và khởi động

- Cài Node.js 18 trở lên.
- Đảm bảo đã xuất các voice preset bằng script ở mục [setup.md](./setup.md).
- **Tắt audio.cpp server đang chạy thủ công ở port 8080 trước khi chạy wrapper.** Wrapper sẽ tự khởi động audio.cpp và quản lý tiến trình đó.
- Mở PowerShell tại thư mục repository:

~~~powershell
node .\tts-local\server.js
~~~

Mặc định:
- Wrapper/API: `http://127.0.0.1:8081`
- audio.cpp backend nội bộ: `http://127.0.0.1:8080`

Nếu model nằm ở đường dẫn khác, có thể đặt biến môi trường `VIENEU_MODEL_ROOT`, `VIENEU_RUNTIME_DIR`, `VIENEU_CONFIG` hoặc `VIENEU_VOICES_DIR` trước khi chạy.

### Danh sách voice

~~~http
GET http://127.0.0.1:8081/api/voices
~~~

Ví dụ cấu trúc phản hồi:

~~~json
{
  "model": "vieneu",
  "selected_voice": "pham_tuyen",
  "count": 2,
  "voices": [
    {
      "id": "pham_tuyen",
      "name": "Pham Tuyen",
      "available": true,
      "selected": true,
      "files": {
        "speaker_embedding": true,
        "reference_codes": true
      }
    }
  ]
}
~~~

Danh sách thực tế được quét trực tiếp từ ổ đĩa; voice thiếu một trong hai file sẽ có `available: false`.

### Chọn voice

~~~http
POST http://127.0.0.1:8081/api/voices/select
Content-Type: application/json
~~~

~~~json
{
  "voice": "pham_tuyen"
}
~~~

Wrapper cập nhật đồng bộ `speaker_embedding_file` và `reference_codes_file` trong `server.json`, sau đó khởi động lại audio.cpp để áp dụng voice. Phản hồi thành công:

~~~json
{
  "ok": true,
  "selected_voice": "pham_tuyen",
  "restarted": true
}
~~~

**Lưu ý:** chuyển voice làm audio.cpp khởi động lại và nạp model lại; không nên gọi đổi voice liên tục trong lúc đang tổng hợp âm thanh.

### Tổng hợp âm thanh qua wrapper

Các endpoint khác được proxy tới audio.cpp, vì vậy đổi URL từ port 8080 sang 8081:

~~~javascript
const response = await fetch("http://127.0.0.1:8081/v1/audio/speech", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "vieneu",
    input: "Xin chào! Đây là thử nghiệm chọn voice qua wrapper.",
    response_format: "wav"
  })
});
if (!response.ok) throw new Error(await response.text());
const wavBlob = await response.blob();
~~~

Trạng thái wrapper:

~~~http
GET http://127.0.0.1:8081/api/status
~~~

Wrapper chỉ bind vào `127.0.0.1`; không mở trực tiếp ra mạng công cộng.
