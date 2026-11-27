from pathlib import Path
from openpyxl import load_workbook
import json
import unicodedata
import traceback

ROOT = Path("tts-subtitle-youtobe-chrome-extension")
SOURCE = ROOT / "tu_dien_phien_am_phat_giao_tay_tang.xlsx"
OUTPUT = ROOT / "tudien-phien-am-phat-giao-tay-tang.json"
SHEET_NAME = "Tự điển tổng hợp"
PRONUNCIATION_HEADER = "Cách đọc gần tiếng Việt"

def norm(value):
    return unicodedata.normalize("NFC", str(value or "")).strip().casefold()

def main():
    if not SOURCE.exists():
        raise FileNotFoundError(f"Không tìm thấy file Excel: {SOURCE}")
    wb = load_workbook(SOURCE, read_only=True, data_only=True)
    print("WORKBOOK SHEETS:", repr(wb.sheetnames))
    sheet_name = next((name for name in wb.sheetnames if norm(name) == norm(SHEET_NAME)), None)
    if sheet_name is None:
        for name in wb.sheetnames:
            ws = wb[name]
            print("SHEET DIAGNOSTIC:", repr(name), "dimensions=", ws.max_row, ws.max_column)
            for idx, row in enumerate(ws.iter_rows(min_row=1, max_row=min(ws.max_row or 1, 12), values_only=True), 1):
                print(f"ROW {idx}:", repr(row))
        raise RuntimeError(f"Không tìm thấy sheet {SHEET_NAME!r}; xem WORKBOOK SHEETS và SHEET DIAGNOSTIC phía trên")
    ws = wb[sheet_name]
    print("TARGET SHEET:", repr(sheet_name), "dimensions=", ws.max_row, ws.max_column)

    # Header không nhất thiết nằm ở dòng đầu; dò 30 dòng đầu và chọn dòng có tên cột phiên âm.
    header_row_num = None
    headers = None
    pron_idx = None
    for row_num, row in enumerate(ws.iter_rows(min_row=1, max_row=min(ws.max_row or 1, 30), values_only=True), 1):
        values = [str(v).strip() if v is not None else "" for v in row]
        print(f"HEADER SCAN ROW {row_num}:", repr(values))
        found = next((i for i, value in enumerate(values) if norm(value) == norm(PRONUNCIATION_HEADER)), None)
        if found is not None:
            header_row_num, headers, pron_idx = row_num, values, found
            break
    if header_row_num is None:
        raise RuntimeError(f"Không tìm thấy header {PRONUNCIATION_HEADER!r} trong 30 dòng đầu của sheet {sheet_name!r}")

    print("DETECTED HEADER ROW:", header_row_num)
    print("DETECTED HEADERS:", repr(headers))
    # Cột thuật ngữ: ưu tiên header có từ khóa rõ nghĩa; nếu không có thì dừng để tránh map nhầm cột.
    preferred = ("thuật ngữ", "từ gốc", "từ", "term", "tạng", "sanskrit", "tibetan")
    candidates = [i for i, h in enumerate(headers) if i != pron_idx and h.strip()]
    key_idx = next((i for token in preferred for i in candidates if token in norm(headers[i])), None)
    if key_idx is None:
        raise RuntimeError("Chưa xác định được cột thuật ngữ gốc an toàn. Headers=" + repr(headers))

    entries = {}
    duplicates = 0
    for row in ws.iter_rows(min_row=header_row_num + 1, values_only=True):
        if key_idx >= len(row) or pron_idx >= len(row):
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

    if not entries:
        raise RuntimeError(f"Không có mục từ nào được trích xuất. key={headers[key_idx]!r}, pronunciation={headers[pron_idx]!r}")
    payload = {
        "source": SOURCE.name,
        "sheet": sheet_name,
        "header_row": header_row_num,
        "key_column": headers[key_idx],
        "pronunciation_column": headers[pron_idx],
        "count": len(entries),
        "entries": entries,
    }
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + "\\n", encoding="utf-8")
    print(f"SUCCESS: {len(entries)} entries; duplicate keys overwritten: {duplicates}; key column: {headers[key_idx]!r}")

if __name__ == "__main__":
    try:
        main()
    except Exception:
        traceback.print_exc()
        raise
