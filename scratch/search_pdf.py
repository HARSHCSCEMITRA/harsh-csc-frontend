import os

downloads_dir = r"C:\Users\goura\Downloads"
for f in os.listdir(downloads_dir):
    if "license" in f.lower() or "email" in f.lower():
        print(f, os.path.getsize(os.path.join(downloads_dir, f)))
