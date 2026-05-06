import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, Download, Share2, ShieldCheck, CheckCircle, GraduationCap, Star, ChevronLeft, Loader2, Settings, Sparkles } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function CertificateTab({ user, activeClass, allClasses = [] }) {
  const certRef = useRef();
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownloadPDF = async () => {
    if (!certRef.current) return;
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(certRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      // Center vertically if height is less than A4 page height
      let yOffset = 0;
      const pageHeight = pdf.internal.pageSize.getHeight();
      if (pdfHeight < pageHeight) {
        yOffset = (pageHeight - pdfHeight) / 2;
      }
      
      pdf.addImage(imgData, 'PNG', 0, yOffset, pdfWidth, pdfHeight);
      pdf.save(`Sertifikat_${user.name.replace(/\s+/g, '_')}_${displayClass.title.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Terjadi kesalahan saat membuat PDF.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Logic to find completed classes if none selected
  const completedClasses = (allClasses || []).filter(cls => {
    const clsLessons = (cls.modules || []).flatMap(m => m.items || []);
    return clsLessons.length > 0 && clsLessons.every(l => l.done);
  });

  // Use selected class or first completed one
  const displayClass = activeClass || completedClasses[0];

  if (!displayClass) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'white', animation: 'fadeIn 0.5s ease' }}>
        {/* ⚪️ HERO HEADER (LIGHT) ⚪️ */}
        <div style={{ 
          background: 'white', 
          padding: '5rem 5%', color: '#1e293b', position: 'relative', overflow: 'hidden' 
        }}>
          <div style={{ position: 'relative', zIndex: 1, maxWidth: '100%', margin: '0 auto' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'white', border: '1px solid #E2E8F0', color: '#10B981', fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.15em', textTransform: 'uppercase', padding: '8px 18px', borderRadius: '99px', marginBottom: '1.5rem' }}>
              <Award size={14} /> PENCAPAIAN AKADEMIK
            </div>
            <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: '900', margin: 0, lineHeight: 1.1, color: '#134E39' }}>
              Sertifikat <span style={{ color: '#D4AF37' }}>Kelulusan</span>
            </h1>
          </div>
        </div>

        <div style={{ padding: '5rem 5%', flex: 1, display: 'flex', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', padding: '5rem 3rem', background: 'white', borderRadius: '20px', border: '1px solid #E2E8F0', maxWidth: '600px', boxShadow: '0 20px 40px rgba(0,0,0,0.02)' }}>
            <div style={{ width: '100px', height: '100px', borderRadius: '16px', background: 'rgba(19,78,57,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2.5rem' }}>
              <Award size={54} color="#134E39" strokeWidth={1.5} />
            </div>
            <h3 style={{ fontSize: '1.75rem', fontWeight: '900', color: '#134E39', marginBottom: '1rem' }}>Sertifikat Belum Siap</h3>
            <p style={{ color: '#64748B', maxWidth: '450px', margin: '0 auto 3rem', lineHeight: '1.7', fontSize: '1.1rem', fontWeight: 500 }}>
              Afwan, sepertinya Anda belum menyelesaikan seluruh materi di kelas pilihan. Selesaikan kurikulum Anda untuk mendapatkan sertifikat resmi.
            </p>
            <button 
              onClick={() => navigate('/app/materi/daftar-kelas')} 
              style={{ background: '#134E39', color: 'white', border: 'none', padding: '1.25rem 3rem', borderRadius: '10px', fontWeight: '900', fontSize: '1rem', cursor: 'pointer', boxShadow: '0 10px 20px rgba(19,78,57,0.2)', transition: 'all 0.3s' }}
            >
              JELAJAHI DAFTAR KELAS
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'white', animation: 'fadeIn 0.5s ease' }}>
      
      {/* ⚪️ HERO HEADER (LIGHT) ⚪️ */}
      <div style={{ 
        background: 'white', 
        padding: '5rem 5%', color: '#1e293b', position: 'relative', overflow: 'hidden' 
      }}>
        
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '100%', margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'white', border: '1px solid #E2E8F0', color: '#10B981', fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.15em', textTransform: 'uppercase', padding: '8px 18px', borderRadius: '99px', marginBottom: '1.5rem' }}>
            <Award size={14} /> PENCAPAIAN AKADEMIK
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '2rem' }}>
            <div>
              <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: '900', margin: 0, lineHeight: 1.1, color: '#134E39' }}>
                Sertifikat <span style={{ color: '#D4AF37' }}>Kelulusan</span>
              </h1>
              <p style={{ fontSize: '1.25rem', color: '#64748b', marginTop: '1.25rem', maxWidth: '700px', lineHeight: 1.7, fontWeight: 500 }}>
                Alhamdulillah, selamat atas pencapaian Anda dalam menyelesaikan kelas <strong>{displayClass.title}</strong>.
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                onClick={() => navigate('/app/materi/dashboard')}
                style={{ background: 'white', border: '1.5px solid #E2E8F0', padding: '1rem 1.8rem', borderRadius: '10px', color: '#134E39', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
              >
                <ChevronLeft size={20} /> KEMBALI
              </button>
              <button 
                onClick={handleDownloadPDF} 
                disabled={isGenerating}
                style={{ background: '#134E39', color: 'white', border: 'none', padding: '1rem 2.5rem', borderRadius: '10px', fontWeight: '900', cursor: isGenerating ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 10px 25px rgba(19,78,57,0.2)' }}
              >
                {isGenerating ? <Loader2 size={20} className="spin" /> : <Download size={20} />}
                {isGenerating ? 'MENYIAPKAN...' : 'UNDUH PDF'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ⚪️ CONTENT AREA ⚪️ */}
      <div style={{ padding: '5rem 5%', flex: 1 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'center' }}>
          
          <div 
            id="certificate-print-area"
            ref={certRef}
            style={{
              width: '100%',
              maxWidth: '1000px',
              aspectRatio: '1.414/1',
              background: '#fff',
              position: 'relative',
              padding: '60px',
              boxShadow: '0 40px 100px rgba(0,0,0,0.05)',
              borderRadius: '8px',
              overflow: 'hidden',
              border: '1px solid #E2E8F0',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              animation: 'scaleUp 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}
          >
            {/* Elegant Frame */}
            <div style={{ position: 'absolute', inset: '20px', border: '2px solid #D4AF37', zIndex: 1 }} />
            <div style={{ position: 'absolute', inset: '30px', border: '6px double #D4AF37', zIndex: 1 }} />
            
            {/* High-end Ornaments */}
            <div style={{ position: 'absolute', top: '30px', left: '30px', width: '80px', height: '80px', borderTop: '4px solid #D4AF37', borderLeft: '4px solid #D4AF37', zIndex: 2 }}></div>
            <div style={{ position: 'absolute', top: '30px', right: '30px', width: '80px', height: '80px', borderTop: '4px solid #D4AF37', borderRight: '4px solid #D4AF37', zIndex: 2 }}></div>
            <div style={{ position: 'absolute', bottom: '30px', left: '30px', width: '80px', height: '80px', borderBottom: '4px solid #D4AF37', borderLeft: '4px solid #D4AF37', zIndex: 2 }}></div>
            <div style={{ position: 'absolute', bottom: '30px', right: '30px', width: '80px', height: '80px', borderBottom: '4px solid #D4AF37', borderRight: '4px solid #D4AF37', zIndex: 2 }}></div>

            {/* Content Container */}
            <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', marginBottom: '15px' }}>
                 <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#134E39', letterSpacing: '0.15em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    SEPARUH AGAMA <span style={{ color: '#D4AF37' }}>ACADEMY</span>
                 </div>
                 <div style={{ fontSize: '0.55rem', fontWeight: '800', color: '#64748B', letterSpacing: '0.3em', borderTop: '1px solid #134E39', paddingTop: '6px' }}>PLATFORM PERSIAPAN PERNIKAHAN ISLAMI</div>
              </div>

              <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '3.5rem', color: '#134E39', margin: '15px 0', letterSpacing: '0.02em', fontWeight: '900' }}>Sertifikat Kelulusan</h1>
              <div style={{ width: '100px', height: '3px', background: '#D4AF37', margin: '5px auto 15px' }} />
              
              <p style={{ fontSize: '1rem', color: '#64748B', margin: '0 0 5px', fontStyle: 'italic', fontWeight: 500 }}>Dengan bangga dipersembahkan kepada:</p>
              <h2 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#134E39', margin: '10px 0', textTransform: 'uppercase', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{user.name}</h2>
              
              <div style={{ width: '50%', height: '1px', background: 'rgba(19, 78, 57, 0.15)', margin: '15px 0' }} />
              
              <p style={{ fontSize: '1rem', color: '#64748B', maxWidth: '80%', lineHeight: '1.6', margin: '10px 0', fontWeight: 500 }}>
                Atas dedikasi dan keberhasilannya dalam menyelesaikan seluruh rangkaian materi, <br />
                penugasan, serta kuis pada program kelas intensif:
              </p>
              
              <div style={{ padding: '15px 40px', background: '#134E39', borderRadius: '8px', margin: '15px 0', boxShadow: '0 10px 20px rgba(19,78,57,0.2)' }}>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#D4AF37', margin: 0, letterSpacing: '0.05em' }}>{displayClass.title.toUpperCase()}</h3>
              </div>

              {/* Signature Section */}
              <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '750px', alignItems: 'flex-end' }}>
                <div style={{ textAlign: 'center', width: '200px' }}>
                   <div style={{ fontWeight: '800', fontSize: '1rem', color: '#134E39', marginBottom: '25px' }}>{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                   <div style={{ borderTop: '2px solid #134E39', paddingTop: '10px', fontSize: '0.7rem', fontWeight: '900', color: '#64748B', letterSpacing: '0.1em' }}>TANGGAL KELULUSAN</div>
                </div>

                <div style={{ position: 'relative', width: '100px', height: '100px' }}>
                   <div style={{ 
                     width: '100%', height: '100%', borderRadius: '50%', background: 'linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)',
                     boxShadow: '0 15px 30px rgba(212,175,55,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
                     border: '3px solid white'
                   }}>
                      <GraduationCap size={45} color="white" />
                   </div>
                   <div style={{ position: 'absolute', bottom: -10, left: '50%', transform: 'translateX(-50%)', background: '#134E39', color: '#D4AF37', padding: '4px 14px', borderRadius: '10px', fontSize: '0.6rem', fontWeight: '900', whiteSpace: 'nowrap', border: '2px solid #D4AF37', boxShadow: '0 5px 15px rgba(0,0,0,0.2)' }}>VERIFIED PLATFORM</div>
                </div>

                <div style={{ textAlign: 'center', width: '200px' }}>
                   <div style={{ fontSize: '1rem', fontWeight: '900', fontStyle: 'italic', marginBottom: '25px', color: '#134E39', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Tim Separuh Agama</div>
                   <div style={{ borderTop: '2px solid #134E39', paddingTop: '10px', fontSize: '0.7rem', fontWeight: '900', color: '#64748B', letterSpacing: '0.1em' }}>DIREKTUR AKADEMI</div>
                </div>
              </div>
            </div>

            {/* Background Decorative */}
            <div style={{ position: 'absolute', top: '15%', right: '10%', opacity: 0.03 }}><Star size={150} color="#D4AF37" /></div>
            <div style={{ position: 'absolute', bottom: '20%', left: '5%', opacity: 0.03 }}><Sparkles size={200} color="#D4AF37" /></div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
