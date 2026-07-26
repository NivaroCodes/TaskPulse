import os
import re

def clean_comments_in_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    ext = os.path.splitext(filepath)[1]
    
    if ext in ['.py']:
        content = re.sub(r'^[ \t]*#.*?\n', '', content, flags=re.MULTILINE)
        content = re.sub(r'[ \t]+#(?!([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b).*?$', '', content, flags=re.MULTILINE)
        
    elif ext in ['.ts', '.tsx', '.js', '.jsx']:
        content = re.sub(r'^[ \t]*//.*?\n', '', content, flags=re.MULTILINE)
        content = re.sub(r'[ \t]+//.*?$', '', content, flags=re.MULTILINE)
        content = re.sub(r'/\*[\s\S]*?\*/', '', content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

def main():
    base_dir = r"C:\Users\nivar\PycharmProjects\TaskPulse"
    
    for root, dirs, files in os.walk(base_dir):
        if 'node_modules' in root or '.venv' in root or '.git' in root or '.next' in root or 'dist' in root or 'alembic' in root:
            continue
            
        for file in files:
            if file.endswith(('.py', '.ts', '.tsx', '.js', '.jsx')):
                filepath = os.path.join(root, file)
                try:
                    clean_comments_in_file(filepath)
                except Exception as e:
                    print(f"Error processing {filepath}: {e}")

if __name__ == "__main__":
    main()
