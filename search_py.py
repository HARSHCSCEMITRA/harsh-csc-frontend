import os
import sys

# Ensure UTF-8 printing
sys.stdout.reconfigure(encoding='utf-8')

pb_path = r"C:\Users\goura\Documents\SOFTWARE HARSH CSC EMITRA\BACKUP_GOLD_v8.2.1\Source_Scripts\automation_app.py"

def print_gold_lines():
    with open(pb_path, "r", encoding="utf-8", errors="ignore") as f:
        lines = f.readlines()
    
    # Print lines 170 to 240
    print("=== BACKUP GOLD automation_app.py Lines 170 to 240 ===")
    for idx in range(169, min(240, len(lines))):
        print(f"{idx+1}: {lines[idx].strip()}")

if __name__ == "__main__":
    print_gold_lines()
