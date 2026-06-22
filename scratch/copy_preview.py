import os
import shutil
import glob

downloads_dir = "C:/Users/goura/Downloads"
target_dir = "c:/Users/goura/Documents/HARSHCSCEMITRA/harsh-csc-frontend"

files = glob.glob(os.path.join(downloads_dir, "*Harsh*Bikaner*.pdf"))
print("Matching files:", files)
if files:
    src = files[0]
    dst = os.path.join(target_dir, "preview.pdf")
    shutil.copy(src, dst)
    print(f"Copied {src} to {dst}")
else:
    print("No matching files found!")
