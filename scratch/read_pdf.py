import pypdf
import sys

# Reconfigure stdout to use utf-8 just in case
sys.stdout.reconfigure(encoding='utf-8')

reader = pypdf.PdfReader(r"C:\Users\goura\Downloads\license key email.pdf")
text_content = []
for idx, page in enumerate(reader.pages):
    text_content.append(f"\n--- Page {idx+1} ---\n")
    text_content.append(page.extract_text())

with open("scratch/pdf_text.txt", "w", encoding="utf-8") as f:
    f.write("".join(text_content))

print("PDF text written to scratch/pdf_text.txt")
