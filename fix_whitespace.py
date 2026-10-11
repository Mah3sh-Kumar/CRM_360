import os
import re

files_to_check = ['m:/CRM_KIMI/src/App.tsx']

dirs = ['m:/CRM_KIMI/src/pages', 'm:/CRM_KIMI/src/pages/details']
for d in dirs:
    if os.path.exists(d):
        for f in os.listdir(d):
            if f.endswith('.tsx'):
                files_to_check.append(os.path.join(d, f))

for path in files_to_check:
    if not os.path.exists(path): continue
    
    with open(path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # 1. Remove sub="..."
    content = re.sub(r'\s*sub="[^"]*"', '', content)
    
    # 2. Remove sub={`...`}
    content = re.sub(r'\s*sub=\{`[^`]*`\}', '', content)
    
    # 3. Fix whitespace classes
    content = re.sub(r'\bspace-y-6\b', 'space-y-4', content)
    content = re.sub(r'\bspace-y-5\b', 'space-y-4', content)
    content = re.sub(r'\bp-6\b', 'p-4', content)
    content = re.sub(r'\bp-5\b', 'p-4', content)
    
    with open(path, 'w', encoding='utf-8') as file:
        file.write(content)

print("Text removed and whitespace fixed in all files!")
