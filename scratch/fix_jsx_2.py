
import os

file_path = r'd:\taaruf\src\pages\UserDashboard.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: Remove stray </> at line 1744 area
# Exact pattern from view_file:
# 1743:                           <div className="form-group"><label className="form-label">Pekerjaan</label><input type="text" className="form-control" value={myCv.job} onChange={e => setMyCv({ ...myCv, job: e.target.value })} placeholder="Misal: Software Engineer" /></div>
# 1744:                </>
# 1745:                           <div className="form-group"><label className="form-label">Estimasi Penghasilan per Bulan</label><input type="text" className="form-control" value={myCv.salary} onChange={e => setMyCv({ ...myCv, salary: e.target.value })} placeholder="Misal: 5-10 Juta" /></div>

bad_pattern = '               </>\n                           <div className="form-group"><label className="form-label">Estimasi Penghasilan per Bulan'
good_pattern = '                           <div className="form-group"><label className="form-label">Estimasi Penghasilan per Bulan'

if bad_pattern in content:
    content = content.replace(bad_pattern, good_pattern)
    print("Removed stray tag.")
else:
    # Try with \r\n just in case
    bad_pattern_rn = bad_pattern.replace('\n', '\r\n')
    if bad_pattern_rn in content:
        content = content.replace(bad_pattern_rn, good_pattern)
        print("Removed stray tag (CRLF).")

# Fix 2: Add correct closing fragment before line 1810
# Pattern:
# 1807:               <button className="btn btn-primary" onClick={handleCvSubmit} style={{ padding: '0.8rem 2.5rem', background: '#134E39' }}>{cvStep < totalSteps ? 'SELANJUTNYA →' : 'SIMPAN DATA CV'}</button>
# 1808:            </div>
# 1809:          )}
# 1810:       </div>
# 1811:    )}

# Actually let's look at 1805-1815 again from view_file:
# 1808:                    </div>
# 1809:                  )}
# 1810:               </div>
# 1811:            )}

end_pattern = '                    </div>\n                  )}\n               </div>\n            )}'
new_end = '                    </div>\n                  )}\n               </>\n            )}'

if end_pattern in content:
    content = content.replace(end_pattern, new_end)
    print("Fixed closing tag.")
else:
    end_pattern_rn = end_pattern.replace('\n', '\r\n')
    if end_pattern_rn in content:
        content = content.replace(end_pattern_rn, new_end.replace('\n', '\r\n'))
        print("Fixed closing tag (CRLF).")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
