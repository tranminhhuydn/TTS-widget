const assert = require("node:assert/strict");
require("../youtube-subtitle-parser.js");
const parser = globalThis.TTSYouTubeSubtitleParser;
const payload = {
  events: [
    { tStartMs: 0, dDurationMs: 3000, segs: [{ utf8: "Mở đầu bộ anime là hình ảnh hai nàng harem đang ngơ ngác khi nhìn thấy con" }] },
    { tStartMs: 2500, dDurationMs: 3500, segs: [{ utf8: "chim lạ đang bốc khói bay vụt qua bầu trời. Quay lại vài ngày trước, tại Nhật" }] },
    { tStartMs: 5800, dDurationMs: 3000, segs: [{ utf8: "Bản có bảy thiếu niên nổi tiếng khắp thế giới." }] }
  ]
};
const sentences = parser.toSentences(payload);
assert.equal(sentences.length, 2);
assert.equal(sentences[0].text, "Mở đầu bộ anime là hình ảnh hai nàng harem đang ngơ ngác khi nhìn thấy con chim lạ đang bốc khói bay vụt qua bầu trời.");
assert.equal(sentences[1].text, "Quay lại vài ngày trước, tại Nhật Bản có bảy thiếu niên nổi tiếng khắp thế giới.");
assert.ok(sentences[1].startTime > 2.5, "sentence start time should be interpolated within its source event");
assert.ok(sentences[1].endTime > sentences[1].startTime);
console.log("YouTube subtitle parser tests passed.");
