import os
import re
import sys

# Ensure UTF-8 printing
sys.stdout.reconfigure(encoding='utf-8')

admin_path = r"c:\Users\goura\Documents\HARSHCSCEMITRA\harsh-csc-frontend\public\admin.html"

def search_admin_html():
    if not os.path.exists(admin_path):
        print("admin.html not found.")
        return
        
    with open(admin_path, "r", encoding="utf-8", errors="ignore") as f:
        lines = f.readlines()
        
    targets = ["loadLicensesData", "renderLicensesTable", "renderTrialsTable", "trialsTableBody", "licensesTableBody"]
    for idx, line in enumerate(lines):
        for t in targets:
            if t in line:
                print(f"Line {idx+1} ({t}): {line.strip()[:160]}")
            
if __name__ == "__main__":
    search_admin_html()

