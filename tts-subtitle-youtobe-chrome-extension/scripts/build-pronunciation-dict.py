from pathlib import Path
from openpyxl import load_workbook
import json

root = Path("tts-subtitle-youtobe-chrome-extension")
source = root / "tu_dien_phien_am_phat_giao_tay_tang.xlsx"
wb = load_workbook(source, read_only=True, data_only=True)
if "Tự điển tổng hợp" not in wb.sheetnames:
    raise SystemExit("Không tìm thấy sheet 'Tự điển tổng hợp'")
ws = wb["Tự điển tổng hợp"]
rows = ws.iter_rows(values_only=True)
headers = next(rows)
headers = [str(v).strip() if v is not None else "" for v in headers]
pron_idx = next((i for i, h in enumerate(headers) if h == "Cách đọc gần tiếng Việt"), None)
if pron_idx is None:
    raise SystemExit("Không tìm thấy cột 'Cách đọc gần tiếng Việt'")
# Chọn cột thuật ngữ đầu tiên có tên, khác cột phiên âm.
key_idx = next((i for i, h in enumerate(headers) if i != pron_idx and h), None)
if key_idx is None:
    raise SystemExit("Không xác định được cột thuật ngữ gốc")
entries = {}
duplicates = 0
for row in rows:
    if not row or key_idx >= len(row) or pron_idx >= len(row):
        continue
    key, pronunciation = row[key_idx], row[pron_idx]
    if key is None or pronunciation is None:
        continue
    key, pronunciation = str(key).strip(), str(pronunciation).strip()
    if not key or not pronunciation:
        continue
    if key in entries:
        duplicates += 1
    entries[key] = pronunciation
payload = {
    "source": source.name,
    "sheet": "Tự điển tổng hợp",
    "key_column": headers[key_idx],
    "pronunciation_column": "Cách đọc gần tiếng Việt",
    "count": len(entries),
    "entries": entries
}
(root / "tudien-phien-am-phat-giao-tay-tang.json").write_text(
    json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + "\n",
    encoding="utf-8"
)
print(f"Generated {len(entries)} entries; duplicate keys overwritten: {duplicates}; key column: {headers[key_idx]}")
