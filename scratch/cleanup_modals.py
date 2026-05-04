
import os

file_path = r'd:\taaruf\src\pages\UserDashboard.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Remove the nested one (2309-2324 approximately)
# And remove my first attempt at 1831
new_lines = []
skip = False
for i in range(len(lines)):
    if 'DETAIL PREVIEW MODAL (For Long Screening Data)' in lines[i]:
        skip = True
    if '🔍 PREVIEW DETAIL MODAL (Religious Screening) 🔍' in lines[i]:
        skip = True
    
    if not skip:
        new_lines.append(lines[i])
    
    if skip and '</div>' in lines[i] and ')}' in lines[i+1] and ('Styles Injection' in lines[i+2] or 'button' in lines[i+2]):
        skip = False
        # If it was the nested one, we might need to skip the closing )} properly.
        # But let's be simpler: skip until we hit the end comment if we had one.
    
    # Let's try a safer way: just remove those specific blocks by unique strings.

content = "".join(lines)

# Remove attempt 1
block1 = """      {/* 🔍 DETAIL PREVIEW MODAL (For Long Screening Data) 🔍 */}
      {previewDetail && (
        <div className="modal-overlay" style={{ zIndex: 10005, backdropFilter: 'blur(10px)', background: 'rgba(15, 23, 42, 0.4)' }} onClick={() => setPreviewDetail(null)}>
          <div className="modal-content animate-up" onClick={e => e.stopPropagation()} style={{ maxWidth: '650px', width: '90%', borderRadius: '40px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)' }}>
            <div style={{ background: '#134E39', padding: '2.5rem', color: 'white', position: 'relative' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '900', color: '#D4AF37', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '8px' }}>Detail Jawaban Screening</div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '900', margin: 0 }}>{previewDetail.title}</h3>
              <button onClick={() => setPreviewDetail(null)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'rgba(255,255,255,0.1)', border: 'none', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            <div style={{ padding: '3rem', background: 'white' }}>
              <div style={{ 
                fontSize: '1.1rem', color: '#1e293b', fontWeight: '600', lineHeight: 1.8, 
                fontStyle: 'italic', background: '#f8fafc', padding: '2.5rem', 
                borderRadius: '24px', border: '1px solid #f1f5f9' 
              }}>
                "{previewDetail.content}"
              </div>
              <button onClick={() => setPreviewDetail(null)} style={{ width: '100%', marginTop: '2.5rem', background: '#134E39', color: 'white', border: 'none', borderRadius: '16px', padding: '1.2rem', fontWeight: '900', cursor: 'pointer', boxShadow: '0 10px 20px rgba(19,78,57,0.1)' }}>
                TUTUP DETAIL
              </button>
            </div>
          </div>
        </div>
      )}"""

# Remove nested one
block2 = """             {/* 🔍 PREVIEW DETAIL MODAL (Religious Screening) 🔍 */}
             {previewDetail && (
               <div className="modal-overlay" onClick={() => setPreviewDetail(null)} style={{ zIndex: 1200 }}>
                 <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', width: '90%', padding: 0, borderRadius: '32px', overflow: 'hidden' }}>
                   <div style={{ background: '#134E39', color: 'white', padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '900' }}>{previewDetail.title}</h3>
                     <button onClick={() => setPreviewDetail(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', padding: '8px', borderRadius: '12px', color: 'white', cursor: 'pointer' }}><X size={20} /></button>
                   </div>
                   <div style={{ padding: '2rem' }}>
                     <div style={{ background: '#f8fafc', padding: '2rem', borderRadius: '24px', border: '1px solid #f1f5f9', color: '#334155', fontSize: '1rem', lineHeight: '1.8', whiteSpace: 'pre-wrap', fontWeight: '500' }}>
                       "{previewDetail.value}"
                     </div>
                     <button className="btn btn-primary" onClick={() => setPreviewDetail(null)} style={{ width: '100%', marginTop: '2rem', background: '#134E39' }}>Selesai Membaca</button>
                   </div>
                 </div>
               </div>
             )}"""

content = content.replace(block1, "")
content = content.replace(block1.replace('\n', '\r\n'), "")
content = content.replace(block2, "")
content = content.replace(block2.replace('\n', '\r\n'), "")

# Final Clean Insert at the very end
final_insert = """
      {/* 🔍 GLOBAL DETAIL PREVIEW MODAL 🔍 */}
      {previewDetail && (
        <div className="modal-overlay" style={{ zIndex: 20000, backdropFilter: 'blur(10px)', background: 'rgba(15, 23, 42, 0.4)' }} onClick={() => setPreviewDetail(null)}>
          <div className="modal-content animate-up" onClick={e => e.stopPropagation()} style={{ maxWidth: '650px', width: '90%', borderRadius: '40px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)' }}>
            <div style={{ background: '#134E39', padding: '2.5rem', color: 'white', position: 'relative' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '900', color: '#D4AF37', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '8px' }}>Detail Informasi</div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '900', margin: 0 }}>{previewDetail.title}</h3>
              <button onClick={() => setPreviewDetail(null)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'rgba(255,255,255,0.1)', border: 'none', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            <div style={{ padding: '3rem', background: 'white' }}>
              <div style={{ 
                fontSize: '1.1rem', color: '#1e293b', fontWeight: '600', lineHeight: 1.8, 
                fontStyle: 'italic', background: '#f8fafc', padding: '2.5rem', 
                borderRadius: '24px', border: '1px solid #f1f5f9' 
              }}>
                "{previewDetail.content || previewDetail.value}"
              </div>
              <button onClick={() => setPreviewDetail(null)} style={{ width: '100%', marginTop: '2.5rem', background: '#134E39', color: 'white', border: 'none', borderRadius: '16px', padding: '1.2rem', fontWeight: '900', cursor: 'pointer', boxShadow: '0 10px 20px rgba(19,78,57,0.1)' }}>
                TUTUP
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}"""

content = content.replace("    </div>\n  );\n}", final_insert)
content = content.replace("    </div>\r\n  );\r\n}", final_insert.replace('\n', '\r\n'))

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Cleaned up and consolidated PreviewDetailModal.")
