import os

crashed_dir = r"C:\Users\goura\.gemini\antigravity-ide\brain\2bff84a0-3966-41d1-bdea-c516fd457506"
env_files = [".env", ".env.local", ".env.production.local"]

def check_crashed_envs():
    for f in env_files:
        path = os.path.join(crashed_dir, f)
        if os.path.exists(path):
            print(f"\n--- Keys in crashed {f} ---")
            with open(path, "r", encoding="utf-8", errors="ignore") as file:
                for line in file:
                    line = line.strip()
                    if line and not line.startswith("#"):
                        parts = line.split("=", 1)
                        if len(parts) == 2:
                            key = parts[0].strip()
                            val = parts[1].strip()
                            print(f"  {key}: length={len(val)}, starts_with={val[:5]}...")
        else:
            print(f"\nCrashed {f} not found.")

if __name__ == "__main__":
    check_crashed_envs()
