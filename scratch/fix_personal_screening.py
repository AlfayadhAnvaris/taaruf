
import os

file_path = r'd:\taaruf\src\pages\UserDashboard.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: Add onClick to Personal Screening cards
old_personal_return = """                               <div key={idx} style={{ 
                                 background: 'white', padding: '2rem', borderRadius: '32px', border: '1px solid #f1f5f9', 
                                 display: 'flex', flexDirection: 'column', height: '200px',
                                 gridColumn: (idx === 4) ? 'span 2' : 'span 1',
                                 boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
                               }}>"""

new_personal_return = """                               <div key={idx} style={{ 
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

content = content.replace(old_personal_return, new_personal_return)
content = content.replace(old_personal_return.replace('\n', '\r\n'), new_personal_return.replace('\n', '\r\n'))

# Fix 2: Add onClick to Personal Polygamy View
old_personal_poly = """                               cursor: myExistingCv.screening_data.polygamy_view.length > 120 ? 'pointer' : 'default'
                             }}>"""

new_personal_poly = """                               cursor: myExistingCv.screening_data.polygamy_view.length > 120 ? 'pointer' : 'default'
                             }} onClick={() => {
                               if (myExistingCv.screening_data.polygamy_view.length > 120) {
                                 setPreviewDetail({ title: 'Pandangan Poligami', content: myExistingCv.screening_data.polygamy_view });
                               }
                             }}>"""

content = content.replace(old_personal_poly, new_personal_poly)
content = content.replace(old_personal_poly.replace('\n', '\r\n'), new_personal_poly.replace('\n', '\r\n'))

# Fix 3: Add PreviewDetailModal at the bottom (before Styles Injection)
modal_code = """
      {/* 🔍 DETAIL PREVIEW MODAL (For Long Screening Data) 🔍 */}
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
      )}

      {/* Styles Injection */}"""

if "{/* Styles Injection */}" in content:
    content = content.replace("{/* Styles Injection */}", modal_code)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
