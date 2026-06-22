import os
import shutil
import re


nakal_dir = r"C:\Users\goura\Documents\eSign_Nakal_Downloads"
report_path = r"C:\Users\goura\Documents\eSign_Nakal_Downloads\verification_report.txt"

if not os.path.exists(report_path):
    print("Verification report not found!")
    exit(1)

mismatched_folders = []
with open(report_path, "r", encoding="utf-8") as f:
    lines = f.readlines()
    
# Parse mismatched folders
for line in lines:
    match = re.search(r'Folder:\s*(.+)', line)
    if match:
        folder_name = match.group(1).strip()
        if folder_name not in mismatched_folders:
            mismatched_folders.append(folder_name)

print(f"Found {len(mismatched_folders)} mismatched folders to remove.")

removed_count = 0
failed_count = 0

for folder in mismatched_folders:
    folder_path = os.path.join(nakal_dir, folder)
    if os.path.exists(folder_path):
        try:
            shutil.rmtree(folder_path)
            safe_name = folder.encode('ascii', errors='replace').decode('ascii')
            print(f"Removed: {safe_name}")
            removed_count += 1
        except Exception as e:
            safe_name = folder.encode('ascii', errors='replace').decode('ascii')
            print(f"Failed to remove {safe_name}: {str(e)}")
            failed_count += 1
    else:
        safe_name = folder.encode('ascii', errors='replace').decode('ascii')
        print(f"Folder already does not exist: {safe_name}")

print(f"\nRemoval completed. Successfully removed: {removed_count}, Failed: {failed_count}")
