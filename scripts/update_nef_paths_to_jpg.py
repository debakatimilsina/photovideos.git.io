#!/usr/bin/env python3
"""
Update `data2bImages.js` replacing Images/*.NEF/.nef paths with corresponding .jpg
only when the .jpg actually exists. Creates a timestamped backup before editing.
"""
import re
import os
import sys
import shutil
import datetime

FILE = 'data2bImages.js'
if not os.path.exists(FILE):
    print(f"Error: {FILE} not found in current directory: {os.getcwd()}", file=sys.stderr)
    sys.exit(2)

backup = f"{FILE}.bak.{int(datetime.datetime.now().timestamp())}"
shutil.copy(FILE, backup)
print(f"Backup created: {backup}")

with open(FILE, 'r', encoding='utf-8') as f:
    text = f.read()

# Match Images/<basename>.(NEF|nef) capturing the base (without extension)
pattern = re.compile(r'(Images/[^,`\s]+?)\.(NEF|nef)')

counter = [0]

def replace_match(m):
    base = m.group(1)
    jpg_path = f"{base}.jpg"
    # Also accept uppercase .JPG if present
    jpg_alt = f"{base}.JPG"
    if os.path.exists(jpg_path):
        counter[0] += 1
        return jpg_path
    elif os.path.exists(jpg_alt):
        counter[0] += 1
        return jpg_alt
    else:
        print(f"Warning: converted file not found for {m.group(0)} -> {jpg_path}", file=sys.stderr)
        return m.group(0)

new_text = pattern.sub(replace_match, text)

with open(FILE, 'w', encoding='utf-8') as f:
    f.write(new_text)

print(f"Done. Replacements made: {counter[0]}")
print(f"If any warnings appeared, run the conversion script and re-run this updater.")
