import os
import pypdfium2 as pdfium
import re
import urllib.request
import ssl
import time

nakal_dir = r"C:\Users\goura\Documents\eSign_Nakal_Downloads"

# SSL Context to bypass validation if required
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

results = []

def fetch_khata_from_url(url):
    try:
        req = urllib.request.Request(
            url, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
        )
        with urllib.request.urlopen(req, context=ctx, timeout=15) as response:
            html = response.read().decode('utf-8')
            # Look for: खाता संख्या नया :- 1006
            match = re.search(r"खाता\s+संख्या\s+नया\s*:-\s*(\d+)", html)
            if match:
                return match.group(1), None
            else:
                return None, "Label 'खाता संख्या नया' not found in HTML"
    except Exception as e:
        return None, str(e)

folders = [d for d in os.listdir(nakal_dir) if os.path.isdir(os.path.join(nakal_dir, d))]
mismatches = []
success_count = 0
failed_count = 0

print(f"Starting verification of {len(folders)} folders...")

for item in folders:
    if item.lower() == "new folder":
        continue
        
    path = os.path.join(nakal_dir, item)
    
    # Extract expected khata from folder name
    parts = item.split("_")
    if len(parts) < 2:
        continue
    
    khata_expected = None
    for part in parts:
        if part.isdigit():
            khata_expected = part
            break
            
    if not khata_expected:
        continue
        
    pdf_files = [f for f in os.listdir(path) if f.lower().endswith(".pdf")]
    for pdf_file in pdf_files:
        pdf_path = os.path.join(path, pdf_file)
        try:
            pdf = pdfium.PdfDocument(pdf_path)
            text = ""
            for page in pdf:
                text += page.get_textpage().get_text_bounded()
            pdf.close()
            
            # Find the QR URL in text
            # Clean up potential spacing/newlines in URL
            # Example: https://apnakhata.rajasthan.gov.in/qr.aspx?usn=3023938172100662928
            cleaned_text = re.sub(r'\s+', '', text)
            url_match = re.search(r'(https://apnakhata\.rajasthan\.gov\.in/qr\.aspx\?usn=\d+)', cleaned_text)
            
            if url_match:
                url = url_match.group(1)
                # Fetch details
                khata_actual, error = fetch_khata_from_url(url)
                if khata_actual:
                    if khata_actual != khata_expected:
                        mismatches.append({
                            "folder": item,
                            "file": pdf_file,
                            "expected": khata_expected,
                            "actual": khata_actual,
                            "status": "MISMATCH"
                        })
                    else:
                        success_count += 1
                else:
                    mismatches.append({
                        "folder": item,
                        "file": pdf_file,
                        "expected": khata_expected,
                        "actual": "FETCH_FAILED",
                        "status": f"Error: {error}"
                    })
                    failed_count += 1
            else:
                mismatches.append({
                    "folder": item,
                    "file": pdf_file,
                    "expected": khata_expected,
                    "actual": "NO_QR_URL_FOUND",
                    "status": "QR URL not found in PDF text"
                })
                failed_count += 1
                
        except Exception as e:
            mismatches.append({
                "folder": item,
                "file": pdf_file,
                "expected": khata_expected,
                "actual": "PDF_READ_ERROR",
                "status": str(e)
            })
            failed_count += 1
            
        # Polite sleep to avoid hammering the government server
        time.sleep(0.5)

print("\n--- VERIFICATION COMPLETED ---")
print(f"Successfully matched: {success_count}")
print(f"Failed to verify / error: {failed_count}")
print(f"Total Mismatches Found: {len([m for m in mismatches if m['actual'] != 'FETCH_FAILED' and m['actual'] != 'PDF_READ_ERROR' and m['actual'] != 'NO_QR_URL_FOUND' and m['status'] == 'MISMATCH'])}")

# Write detailed report to a file
report_path = r"C:\Users\goura\Documents\eSign_Nakal_Downloads\verification_report.txt"
with open(report_path, "w", encoding="utf-8") as f:
    f.write("=== E-SIGN NAKAL KHATA VERIFICATION REPORT ===\n\n")
    f.write(f"Matched successfully: {success_count}\n")
    f.write(f"Errors/Failed: {failed_count}\n\n")
    
    f.write("--- MISMATCHED KHATAS ---\n")
    mismatch_list = [m for m in mismatches if m["status"] == "MISMATCH"]
    if mismatch_list:
        for idx, m in enumerate(mismatch_list, 1):
            f.write(f"{idx}. Folder: {m['folder']}\n")
            f.write(f"   File: {m['file']}\n")
            f.write(f"   Expected Khata (from folder name): {m['expected']}\n")
            f.write(f"   Actual Khata (from PDF QR scan): {m['actual']}\n\n")
    else:
        f.write("None found.\n\n")
        
    f.write("--- ERRORS / VERIFICATION FAILED ---\n")
    error_list = [m for m in mismatches if m["status"] != "MISMATCH"]
    if error_list:
        for idx, m in enumerate(error_list, 1):
            f.write(f"{idx}. Folder: {m['folder']}\n")
            f.write(f"   File: {m['file']}\n")
            f.write(f"   Expected: {m['expected']}\n")
            f.write(f"   Issue: {m['status']}\n\n")
    else:
        f.write("None found.\n")

print(f"Report saved to: {report_path}")
