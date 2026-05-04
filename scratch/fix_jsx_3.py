
import os, re

file_path = r'd:\taaruf\src\pages\UserDashboard.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Fix 1: Remove stray </>
for i in range(len(lines)):
    if '</>' in lines[i] and 'form-group' in lines[i-1]:
        print(f"Removing stray tag at line {i+1}")
        lines[i] = "" # Remove the line

# Fix 2: Add closing fragment at the end of the else branch
# The end of the else branch is before the last 3 closing brackets of the block
for i in range(len(lines)-1, 1800, -1):
    if ')}' in lines[i] and '</div>' in lines[i-1] and ')}' in lines[i-2] and '</div>' in lines[i-3]:
        # This is the end of the my_cv block
        # We need to insert </> before the ternary closing )}
        # Wait, the structure is:
        # div (1453)
        #   ternary (1471)
        #     if: div (1472)
        #     else: <> ... </>  <-- WE NEED THIS
        #   /ternary
        # /div
        
        # Let's find:
        # </div> (closes 1801's div) -- NO, 1801 is just a block
        # </div> (closes 1642's div)
        # </div> (closes 1453's div)
        pass

# Let's just search for the specific penutup pattern
found = False
for i in range(len(lines)-1, 1700, -1):
    if '</div>' in lines[i] and ')}' in lines[i+1] and '</div>' in lines[i+2] and ')}' in lines[i+3]:
        # i is 1810 (approximately)
        # lines[i] is </div> (closes 1642)
        # We want to insert </> AFTER lines[i] or BEFORE it?
        # The else branch started AFTER the : ( (1641)
        # It should end before the ) (1811)
        print(f"Found end of ternary at line {i+1}")
        lines[i] = lines[i] + '               </>\n'
        found = True
        break

if not found:
    print("Could not find end of ternary pattern.")

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines([l for l in lines if l]) # Filter out empty lines
