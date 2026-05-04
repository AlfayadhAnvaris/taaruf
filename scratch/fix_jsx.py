
import os

file_path = r'd:\taaruf\src\pages\UserDashboard.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Fix 1: Missing div after Preferences Panel (around line 1572)
# Look for line 1570-1572 pattern
for i in range(1560, 1580):
    if i < len(lines) and 'myExistingCv.poligami || \'Tidak Bersedia\'' in lines[i]:
        # Check if 1572 is the closing div and it's missing another one
        if '</div>' in lines[i+1] and 'RELIGIOUS UNDERSTANDING' in lines[i+4]:
             # Insert the missing </div> and fix indentation
             lines[i+2] = '                       </div>\n                    </div>\n'
             print(f"Fixed Preferences Panel div at line {i+2}")
             break

# Fix 2: Wrap the else branch of CV form in a fragment
# Look for line 1641: ) : (
for i in range(1630, 1650):
    if i < len(lines) and ') : (' in lines[i] and 'hasSubmittedCv && !isEditingCv' in lines[i-170]: # approximate
        if '<div' in lines[i+1] and '<>' not in lines[i+1]:
            lines[i+1] = '               <>\n' + lines[i+1]
            print(f"Added opening fragment at line {i+1}")
            # Now find the closing div of the form to add the closing fragment
            # The form div starts at 1642 (index i+1 in original)
            # The form ends at 1799
            for j in range(i+100, i+200):
                if j < len(lines) and '</div>' in lines[j] and ')}' in lines[j+1] and '</div>' in lines[j+2]:
                    # This is likely the end of the else branch
                    # 1807 was a stray div? No, let's see.
                    # 1805 closes 1802. 1806 closes 1801. 1807 closes 1642.
                    # So we should insert </> after 1807 or replace 1807 with it if it was stray.
                    # Looking at 1807: it was indented 15 spaces?
                    if '</div>' in lines[j] and ')}' in lines[j+1]:
                         lines[j] = lines[j] + '               </>\n'
                         print(f"Added closing fragment at line {j}")
                         break
            break

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(lines)
