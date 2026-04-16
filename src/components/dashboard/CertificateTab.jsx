import React, { useRef } from 'react';
import { Award, Download, Share2, ShieldCheck, CheckCircle, GraduationCap } from 'lucide-react';

export default function CertificateTab({ user, activeClass }) {
  const certRef = useRef();

  // Jika tidak ada kelas yang dipilih (kasus langka), berikan pesan
  if (!activeClass) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <Award size={64} color="var(--border)" style={{ marginBottom: '1rem' }} />
        <p style={{ color: 'var(--text-muted)' }}>Silakan selesaikan kelas terlebih dahulu untuk melihat sertifikat.</p>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease', padding: '1rem', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '900', margin: 0 }}>Sertifikat Kelulusan</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>Alhamdulillah, selamat atas pencapaian Anda dalam menuntut ilmu.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={handlePrint} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.7rem 1.5rem', background: '#D4AF37', border: 'none' }}>
            <Download size={18} /> Cetak / Simpan PDF
          </button>
        </div>
      </div>

      {/* CERTIFICATE DESIGN (Premium Aesthetic) */}
      <div 
        id="certificate-print-area"
        ref={certRef}
        style={{
          width: '100%',
          aspectRatio: '1.414/1', // A4 Landscape ratio
          background: 'white',
          position: 'relative',
          padding: '40px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
          borderRadius: '4px',
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
          animation: 'fadeInUp 0.6s ease'
        }}
      >
        {/* Border Frame */}
        <div style={{
          position: 'absolute', inset: '20px',
          border: '2px solid #D4AF37',
          zIndex: 1
        }} />
        <div style={{
          position: 'absolute', inset: '30px',
          border: '10px solid transparent',
          borderImageSource: 'linear-gradient(135deg, #D4AF37 0%, #F9E29C 50%, #B8860B 100%)',
          borderImageSlice: 1,
          zIndex: 1
        }} />

        {/* Decorative Watermark */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          fontSize: '30rem', fontWeight: '900', color: 'rgba(212,175,55,0.03)',
          zIndex: 0, pointerEvents: 'none', userSelect: 'none'
        }}>
          M
        </div>

        {/* Certificate Content */}
        <div style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '40px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
             <img src="/logo.png" alt="Mawaddah" style={{ height: '50px' }} onError={(e) => e.target.style.display='none'} />
             <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#1a4d35', letterSpacing: '0.1em' }}>MAWADDAH <span style={{ color: '#D4AF37' }}>MATCH</span></div>
                <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#64748b', letterSpacing: '0.2em' }}>AKADEMI PERSIAPAN PERNIKAHAN</div>
             </div>
          </div>

          <h1 style={{ fontFamily: 'serif', fontSize: '3.5rem', color: '#1a1a1a', margin: '15px 0', letterSpacing: '0.05em', fontWeight: '400' }}>SERTIFIKAT <span style={{ fontWeight: '800' }}>KELULUSAN</span></h1>
          
          <div style={{ width: '100px', height: '2px', background: '#D4AF37', margin: '10px auto' }} />
          
          <p style={{ fontSize: '1.1rem', color: '#64748b', margin: '20px 0 10px', fontWeight: '500' }}>Diberikan dengan hormat kepada:</p>
          
          <h2 style={{ fontSize: '2.8rem', fontWeight: '900', color: '#1a4d35', margin: '10px 0', textTransform: 'uppercase', textDecoration: 'underline', textDecorationColor: '#D4AF37' }}>{user.name}</h2>
          
          <p style={{ fontSize: '1rem', color: '#64748b', maxWidth: '700px', lineHeight: '1.6', margin: '20px 0' }}>
            Telah menyelesaikan seluruh rangkaian materi, kuis, dan evaluasi dengan hasil <strong style={{ color: '#1a4d35' }}>Sangat Memuaskan</strong> pada program:
          </p>
          
          <div style={{ padding: '15px 30px', background: 'rgba(26,77,53,0.05)', borderRadius: '12px', border: '1px solid rgba(26,77,53,0.1)' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#1a4d35', margin: 0 }}>{activeClass.title.toUpperCase()}</h3>
          </div>

          <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '800px', alignItems: 'flex-end' }}>
            <div style={{ textAlign: 'center', width: '200px' }}>
               <div style={{ fontWeight: '800', fontSize: '0.9rem', marginBottom: '30px' }}>{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
               <div style={{ borderTop: '1px solid #1a4d35', paddingTop: '8px', fontSize: '0.8rem', fontWeight: '700' }}>Tanggal Kelulusan</div>
            </div>

            {/* Seal */}
            <div style={{ position: 'relative', width: '120px', height: '120px' }}>
               <div style={{ 
                 width: '100%', height: '100%', borderRadius: '50%', background: 'linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)',
                 boxShadow: '0 8px 16px rgba(212,175,55,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'
               }}>
                  <div style={{ border: '2px dashed rgba(255,255,255,0.3)', position: 'absolute', inset: '5px', borderRadius: '50%' }} />
                  < GraduationCap size={44} color="white" />
               </div>
               <div style={{ position: 'absolute', bottom: -5, left: '50%', transform: 'translateX(-50%)', background: '#1a4d35', color: 'white', padding: '2px 10px', borderRadius: '4px', fontSize: '0.6rem', fontWeight: '900', whiteSpace: 'nowrap' }}>TERVERIFIKASI</div>
            </div>

            <div style={{ textAlign: 'center', width: '200px' }}>
               <div style={{ fontSize: '0.9rem', fontWeight: 'bold', fontStyle: 'italic', marginBottom: '30px', color: '#64748b' }}>E-Signature Official</div>
               <div style={{ borderTop: '1px solid #1a4d35', paddingTop: '8px', fontSize: '0.8rem', fontWeight: '700' }}>Tim Akademik Mawaddah</div>
            </div>
          </div>
        </div>

        {/* Decorative Corners */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: 100, height: 100, borderTop: '20px solid #D4AF37', borderLeft: '20px solid #D4AF37', zIndex: 1 }} />
        <div style={{ position: 'absolute', bottom: 0, right: 0, width: 100, height: 100, borderBottom: '20px solid #D4AF37', borderRight: '20px solid #D4AF37', zIndex: 1 }} />
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #certificate-print-area, #certificate-print-area * { visibility: visible; }
          #certificate-print-area { 
            position: fixed; left: 0; top: 0; width: 100vw; height: 100vh; 
            padding: 0; margin: 0; box-shadow: none; border: none;
          }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
