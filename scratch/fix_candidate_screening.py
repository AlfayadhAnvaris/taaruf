
import os

file_path = r'd:\taaruf\src\pages\UserDashboard.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: Candidate View Polygamy (remove gender check and add detail logic)
old_pol_view = """                        {viewingCv.gender === 'akhwat' && viewingCv.screening_data.polygamy_view && (
                          <div style={{ 
                            background: '#134E39', padding: '2rem', borderRadius: '32px', color: 'white', 
                            display: 'flex', flexDirection: 'column', height: '200px',
                            gridColumn: 'span 2',
                            boxShadow: '0 10px 30px rgba(19, 78, 57, 0.1)'
                          }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: '900', color: '#D4AF37', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.08em' }}>PANDANGAN POLIGAMI</div>
                            <div style={{ fontSize: '1rem', color: 'white', fontWeight: '600', lineHeight: 1.7, fontStyle: 'italic', flex: 1 }}>
                              "{viewingCv.screening_data.polygamy_view.length > 120 ? viewingCv.screening_data.polygamy_view.substring(0, 117) + '...' : viewingCv.screening_data.polygamy_view}"
                            </div>
                          </div>
                        )}"""

new_pol_view = """                        {viewingCv.screening_data.polygamy_view && (
                          <div style={{ 
                            background: '#134E39', padding: '2rem', borderRadius: '32px', color: 'white', 
                            display: 'flex', flexDirection: 'column', height: '200px',
                            gridColumn: 'span 2',
                            boxShadow: '0 10px 30px rgba(19, 78, 57, 0.1)',
                            cursor: viewingCv.screening_data.polygamy_view.length > 120 ? 'pointer' : 'default'
                          }} onClick={() => {
                            if (viewingCv.screening_data.polygamy_view.length > 120) {
                              setPreviewDetail({ title: 'Pandangan Poligami', content: viewingCv.screening_data.polygamy_view });
                            }
                          }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: '900', color: '#D4AF37', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.08em' }}>PANDANGAN POLIGAMI</div>
                            <div style={{ fontSize: '1rem', color: 'white', fontWeight: '600', lineHeight: 1.7, fontStyle: 'italic', flex: 1 }}>
                              "{viewingCv.screening_data.polygamy_view.length > 120 ? viewingCv.screening_data.polygamy_view.substring(0, 117) + '...' : viewingCv.screening_data.polygamy_view}"
                            </div>
                            {viewingCv.screening_data.polygamy_view.length > 120 && (
                              <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '6px', color: '#D4AF37', fontSize: '0.75rem', fontWeight: '800' }}>
                                LIHAT DETAIL <ArrowRight size={14} />
                              </div>
                            )}
                          </div>
                        )}"""

if old_pol_view in content:
    content = content.replace(old_pol_view, new_pol_view)
    print("Fixed Candidate Polygamy View.")
else:
    # Try normalized version
    content = content.replace(old_pol_view.replace('\n', '\r\n'), new_pol_view.replace('\n', '\r\n'))
    print("Fixed Candidate Polygamy View (CRLF).")

# Fix 2: Add onClick to other screening cards in candidate view
# Find the map block
map_start = "].map((item, idx) => {"
map_end = "return ("

# This is harder with simple replace. Let's use a more targeted replace for the return block.
old_return_block = """                           return (
                            <div key={idx} style={{ 
                              background: 'white', padding: '2rem', borderRadius: '32px', border: '1px solid #f1f5f9', 
                              display: 'flex', flexDirection: 'column', height: '200px',
                              gridColumn: (idx === 4) ? 'span 2' : 'span 1',
                              boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
                            }}>"""

new_return_block = """                           return (
                            <div key={idx} style={{ 
                              background: 'white', padding: '2rem', borderRadius: '32px', border: '1px solid #f1f5f9', 
                              display: 'flex', flexDirection: 'column', height: '200px',
                              gridColumn: (idx === 4) ? 'span 2' : 'span 1',
                              boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                              cursor: isLong ? 'pointer' : 'default'
                            }} onClick={() => {
                              if (isLong) {
                                setPreviewDetail({ title: item.q, content: item.a });
                              }
                            }}>"""

content = content.replace(old_return_block, new_return_block)
content = content.replace(old_return_block.replace('\n', '\r\n'), new_return_block.replace('\n', '\r\n'))

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
