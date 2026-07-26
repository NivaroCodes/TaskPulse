import os
import shutil

src_dir = r"C:\Users\nivar\.gemini\antigravity\scratch\taskboard-frontend"
dst_dir = r"C:\Users\nivar\PycharmProjects\TaskPulse\frontend"

exclude_dirs = {"node_modules", ".git", ".idea", ".venv", "dist"}
exclude_files = {".env", ".env.local"}

print("Cleaning destination directory...")
if os.path.exists(dst_dir):
    for item in os.listdir(dst_dir):
        item_path = os.path.join(dst_dir, item)
        if item in exclude_dirs or item in exclude_files:
            continue
        if os.path.isdir(item_path):
            shutil.rmtree(item_path)
        else:
            os.remove(item_path)

print("Copying files from source to destination...")
for root, dirs, files in os.walk(src_dir):
    dirs[:] = [d for d in dirs if d not in exclude_dirs]
    
    rel_path = os.path.relpath(root, src_dir)
    dest_root = dst_dir if rel_path == "." else os.path.join(dst_dir, rel_path)
    
    if not os.path.exists(dest_root):
        os.makedirs(dest_root)
        
    for file in files:
        if file in exclude_files:
            continue
        src_file = os.path.join(root, file)
        dst_file = os.path.join(dest_root, file)
        shutil.copy2(src_file, dst_file)

print("Creating new .env file...")
env_content = """VITE_CLERK_PUBLISHABLE_KEY=pk_test_YWRlcXVhdGUtcmluZ3RhaWwtOTUuY2xlcmsuYWNjb3VudHMuZGV2JA
VITE_API_BASE_URL=http://localhost:8000
"""
with open(os.path.join(dst_dir, ".env"), "w", encoding="utf-8") as f:
    f.write(env_content)

print("Migration completed successfully!")
