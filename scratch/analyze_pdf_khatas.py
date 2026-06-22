import os
import pypdfium2 as pdfium
import re

nakal_dir = r"C:\Users\goura\Documents\eSign_Nakal_Downloads"

results = []

for item in os.listdir(nakal_dir):
    path = os.path.join(nakal_dir, item)
    if not os.path.isdir(path):
        continue
    if item.lower() == "new folder":
        continue
        
    # Extract expected khata from folder name
    # Format is: owner_khata_village
    parts = item.split("_")
    if len(parts) < 2:
        continue
    
    # Let's find the numeric part in the middle
    khata_expected = None
    for part in parts:
        if part.isdigit():
            khata_expected = part
            break
            
    if not khata_expected:
        continue
        
    # Find PDF files in the directory
    pdf_files = [f for f in os.listdir(path) if f.lower().endswith(".pdf")]
    for pdf_file in pdf_files:
        pdf_path = os.path.join(path, pdf_file)
        try:
            pdf = pdfium.PdfDocument(pdf_path)
            text = ""
            for page in pdf:
                text += page.get_textpage().get_text_bounded()
            pdf.close()
            
            # Find the new khata number line
            # "ùĭćĭ ĝŃƥĭ ċĒĭ €§"
            match = re.search(r"ùĭćĭ\s+ĝŃƥĭ\s+ċĒĭ\s+€§\s*([^\n\r]+)", text)
            new_khata_raw = match.group(1).strip() if match else "NOT FOUND"
            
            # Let's also look for old khata just in case
            match_old = re.search(r"ùĭćĭ\s+ĝŃƥĭ\s+čĲēĭċĭ\s+€§\s*([^\n\r]+)", text)
            old_khata_raw = match_old.group(1).strip() if match_old else "NOT FOUND"
            
            results.append({
                "folder": item,
                "khata_expected": khata_expected,
                "new_khata_raw": new_khata_raw,
                "old_khata_raw": old_khata_raw,
                "file": pdf_file
            })
        except Exception as e:
            results.append({
                "folder": item,
                "khata_expected": khata_expected,
                "new_khata_raw": f"ERROR: {str(e)}",
                "old_khata_raw": "ERROR",
                "file": pdf_file
            })

# Print results safely
for res in results:
    safe_folder = res["folder"].encode("ascii", errors="replace").decode("ascii")
    print(f"Folder: {safe_folder} | Expected: {res['khata_expected']} | New Raw: {res['new_khata_raw']} | Old Raw: {res['old_khata_raw']}")
