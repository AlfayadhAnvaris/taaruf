import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, Download, Share2, ShieldCheck, CheckCircle, GraduationCap, Star, ChevronLeft, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function CertificateTab({ user, activeClass, allClasses = [] }) {
  const certRef = useRef();
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);

  // Logic to find completed classes if none selected
  const completedClasses = (allClasses || []).filter(cls => {
    const clsLessons = (cls.modules || []).flatMap(m => m.items || []);
    return clsLessons.length > 0 && clsLessons.every(l => l.done);
  });

  // Use selected class or first completed one
  const displayClass = activeClass || completedClasses[0];

  if (!displayClass) {
    return (
      <div style={{ textAlign: 'center', padding: 'clamp(2rem, 10vh, 6rem) 2rem', background: 'white', borderRadius: '32px', border: '1px solid #f1f5f9', margin: '2rem' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(19,78,57,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
          <Award size={40} color="#134E39" />
        </div>
        <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#134E39', marginBottom: '1rem' }}>Sertifikat Belum Siap</h3>
        <p style={{ color: '#64748b', maxWidth: '400px', margin: '0 auto', lineHeight: '1.6' }}>
          Silakan selesaikan seluruh materi di kelas pilihan Anda untuk dapat melihat dan mengunduh sertifikat kelulusan.
        </p>
        <button onClick={() => navigate('/app/materi/daftar-kelas')} style={{ marginTop: '2rem', padding: '1rem 2.5rem', background: '#134E39', color: 'white', border: 'none', borderRadius: '16px', fontWeight: '800', cursor: 'pointer' }}>
          Jelajahi DAFTAR Kelas
        </button>
      </div>
    );
  }

  const handleDownloadPDF = async () => {
    if (!certRef.current) return;
    setIsGenerating(true);
    
    try {
      const canvas = await html2canvas(certRef.current, {
        scale: 3, // High quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = 297; // A4 landscape width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Sertifikat_${displayClass.title.replace(/\s+/g, '_')}_${user.name.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error('PDF Generation Error:', error);
      alert('Gagal mengunduh sertifikat. Silakan coba lagi.');
    } finally {
      setIsGenerating(false);
    }
  };


  return (
    <div style={{ animation: 'fadeIn 0.5s ease', padding: '1rem', maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header Actions */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', background: 'white', padding: '1rem 1.5rem', borderRadius: '20px', border: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <button onClick={() => navigate('/app/materi/dashboard')} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.6rem', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Kembali">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#134E39', margin: 0 }}>Sertifikat Kelulusan</h2>
            <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.2rem 0 0' }}>Alhamdulillah, selamat atas pencapaian Anda.</p>
          </div>
        </div>
        <button 
          onClick={handleDownloadPDF} 
          disabled={isGenerating}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '8px', 
            padding: '0.7rem 1.5rem', background: isGenerating ? '#94a3b8' : '#134E39', 
            color: 'white', border: 'none', borderRadius: '12px', 
            fontWeight: '800', cursor: isGenerating ? 'not-allowed' : 'pointer', transition: 'all 0.3s',
            fontSize: '0.9rem'
          }}
        >
          {isGenerating ? <Loader2 size={16} className="spin" /> : <Download size={16} />}
          {isGenerating ? 'Menyiapkan...' : 'Unduh Sertifikat PDF'}
        </button>
      </div>

      {/* CERTIFICATE DESIGN (Optimized for Screen & Print) */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: '2rem' }}>
        <div 
          id="certificate-print-area"
          ref={certRef}
          style={{
            width: '100%',
            maxWidth: '900px',
            aspectRatio: '1.414/1',
            background: '#fff',
            position: 'relative',
            padding: '40px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
            borderRadius: '4px',
            overflow: 'hidden',
            border: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}
        >
          {/* Border Frame */}
          <div style={{ position: 'absolute', inset: '15px', border: '1px solid #D4AF37', zIndex: 1 }} />
          <div style={{ position: 'absolute', inset: '22px', border: '4px double #D4AF37', zIndex: 1 }} />
          
          {/* Corner Ornaments */}
          {[
            { top: '22px', left: '22px', borderTop: '30px solid #D4AF37', borderLeft: '30px solid #D4AF37' },
            { top: '22px', right: '22px', borderTop: '30px solid #D4AF37', borderRight: '30px solid #D4AF37' },
            { bottom: '22px', left: '22px', borderBottom: '30px solid #D4AF37', borderLeft: '30px solid #D4AF37' },
            { bottom: '22px', right: '22px', borderBottom: '30px solid #D4AF37', borderRight: '30px solid #D4AF37' }
          ].map((style, i) => (
            <div key={i} style={{ position: 'absolute', width: '40px', height: '40px', zIndex: 2, ...style }} />
          ))}

          {/* Content */}
          <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', marginBottom: '15px' }}>
               <img src="/assets/logo.svg" alt="Separuh Agama" style={{ height: '50px' }} />
               <div style={{ borderTop: '2px solid #134E39', paddingTop: '5px' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#134E39', letterSpacing: '0.1em' }}>Separuh Agama <span style={{ color: '#D4AF37' }}>ACADEMY</span></div>
                  <div style={{ fontSize: '0.5rem', fontWeight: '800', color: '#64748b', letterSpacing: '0.2em' }}>PLATFORM PERSIAPAN PERNIKAHAN ISLAMI</div>
               </div>
            </div>

            <h1 style={{ fontFamily: 'serif', fontSize: '3rem', color: '#134E39', margin: '10px 0', letterSpacing: '0.05em', fontWeight: '700' }}>SERTIFIKAT KELULUSAN</h1>
            <div style={{ width: '80px', height: '2px', background: '#D4AF37', margin: '5px auto 15px' }} />
            
            <p style={{ fontSize: '0.9rem', color: '#475569', margin: '0 0 5px', fontStyle: 'italic' }}>Diberikan kepada:</p>
            <h2 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#134E39', margin: '5px 0', textTransform: 'uppercase' }}>{user.name}</h2>
            
            <div style={{ width: '50%', height: '1px', background: 'rgba(19, 78, 57, 0.1)', margin: '10px 0' }} />
            
            <p style={{ fontSize: '0.9rem', color: '#475569', maxWidth: '80%', lineHeight: '1.5', margin: '5px 0' }}>
              Atas keberhasilannya dalam menyelesaikan seluruh rangkaian materi dan kuis pada program kelas:
            </p>
            
            <div style={{ padding: '12px 30px', background: '#134E39', borderRadius: '12px', margin: '10px 0' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#D4AF37', margin: 0 }}>{displayClass.title.toUpperCase()}</h3>
            </div>

            {/* Footer */}
            <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '700px', alignItems: 'flex-end' }}>
              <div style={{ textAlign: 'center', width: '180px' }}>
                 <div style={{ fontWeight: '800', fontSize: '0.85rem', color: '#134E39', marginBottom: '25px' }}>{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                 <div style={{ borderTop: '1px solid #134E39', paddingTop: '8px', fontSize: '0.7rem', fontWeight: '700', color: '#64748b' }}>TANGGAL KELULUSAN</div>
              </div>

              <div style={{ position: 'relative', width: '100px', height: '100px' }}>
                 <div style={{ 
                   width: '100%', height: '100%', borderRadius: '50%', background: 'linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)',
                   boxShadow: '0 10px 20px rgba(212,175,55,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
                   border: '3px solid white'
                 }}>
                    < GraduationCap size={40} color="white" />
                 </div>
                 <div style={{ position: 'absolute', bottom: -5, left: '50%', transform: 'translateX(-50%)', background: '#134E39', color: '#D4AF37', padding: '2px 10px', borderRadius: '20px', fontSize: '0.6rem', fontWeight: '900', whiteSpace: 'nowrap', border: '1px solid #D4AF37' }}>VERIFIED</div>
              </div>

              <div style={{ textAlign: 'center', width: '180px' }}>
                 <div style={{ fontSize: '0.85rem', fontWeight: 'bold', fontStyle: 'italic', marginBottom: '25px', color: '#134E39' }}>Tim Separuh Agama Academy</div>
                 <div style={{ borderTop: '1px solid #134E39', paddingTop: '8px', fontSize: '0.7rem', fontWeight: '700', color: '#64748b' }}>DIREKTUR AKADEMI</div>
              </div>
            </div>
          </div>

          {/* Decorative Elements */}
          <div style={{ position: 'absolute', top: '20%', right: '15%', opacity: 0.05 }}><Star size={80} color="#D4AF37" /></div>
          <div style={{ position: 'absolute', bottom: '25%', left: '10%', opacity: 0.05 }}><Star size={100} color="#D4AF37" /></div>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #certificate-print-area, #certificate-print-area * { visibility: visible; }
          #certificate-print-area { 
            position: fixed; left: 0; top: 0; width: 100vw; height: 100vh; 
            padding: 0; margin: 0; box-shadow: none; border: none;
          }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}
