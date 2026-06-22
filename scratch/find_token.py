import os

home_dir = r"C:\Users\goura"
for root, dirs, files in os.walk(home_dir):
    # Skip directories to avoid long traversal
    if any(p in root for p in ["AppData", "Downloads", "Documents", "Pictures", "Music", "Videos", "Saved Games", "Contacts", "Searches", "Links", ".git", "node_modules"]):
        continue
    for f in files:
        if "access-token" in f or "supabase" in f:
            print(os.path.join(root, f))
