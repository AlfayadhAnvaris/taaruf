import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../../App';
import { CheckCircle, XCircle, Eye, ShieldCheck, MapPin, Briefcase, GraduationCap, Clock, User, MessageSquare, AlertCircle } from 'lucide-react';
import { supabase } from '../../supabase';

export default function AdminReviewTab() {
  const { cvs, setCvs, showAlert, addNotification } = useContext(AppContext);
  const [reviewingCv, setReviewingCv] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const pendingCvs = cvs.filter(cv => cv.status === 'pending');

  const handleApprove = async (id, alias, userId) => {
    try {
      const { error } = await supabase.from('cv_profiles').update({ status: 'approved' }).eq('id', id);
      if (error) throw error;
      
      setCvs(cvs.map(cv => cv.id === id ? { ...cv, status: 'approved' } : cv));
      showAlert('Disetujui', 'CV Berhasil Disetujui & Dipublikasikan', 'success');
      addNotification(`Alhamdulillah! CV Taaruf Anda (${alias}) telah disetujui ustadz dan kini aktif di galeri pencarian.`, userId);
      setReviewingCv(null);
    } catch (err) { 
      console.error(err);
      showAlert('Gagal', 'Gagal menyetujui CV.', 'error');
    }
  };

  const handleReject = async (id, alias, userId) => {
    try {
      const { error } = await supabase.from('cv_profiles').delete().eq('id', id);
      if (error) throw error;

      setCvs(cvs.filter(cv => cv.id !== id));
      showAlert('Ditolak', 'CV Berhasil Ditolak & Dihapus', 'success');
      addNotification(`Mohon maaf, CV Taaruf Anda (${alias}) belum dapat kami setujui saat ini. Silakan koreksi data Anda.`, userId);
      setReviewingCv(null);
    } catch (err) { 
      console.error(err);
      showAlert('Gagal', 'Gagal menolak CV.', 'error');
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      <style>{`
        .review-item {
          background: white;
          border-radius: 24px;
          padding: 1.25rem 1.5rem;
          border: 1px solid #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.5rem;
          transition: all 0.3s ease;
          margin-bottom: 1rem;
        }
        .review-item:hover {
          border-color: #134E39;
          transform: translateX(4px);
          box-shadow: 0 10px 30px rgba(19,78,57,0.05);
        }
        .cv-stat {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8rem;
          color: #64748b;
          font-weight: 600;
        }
        .modal-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }
        @media (max-width: 768px) {
          .review-item { flex-direction: column; align-items: flex-start; gap: 1rem; }
          .review-actions { width: 100%; }
          .review-actions button { width: 100%; }
          .modal-grid-2 { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="card" style={{ padding: '1.5rem', borderRadius: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h3 style={{ margin: 0, fontWeight: '950', color: '#134E39', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.25rem' }}>
              <ShieldCheck size={24} color="#134E39" /> Review CV Baru
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b', fontWeight: '500' }}>Terdapat {pendingCvs.length} CV yang menunggu verifikasi admin.</p>
          </div>
        </div>

        <div className="cv-list">
          {pendingCvs.length > 0 ? (
            pendingCvs.map(cv => (
              <div key={cv.id} className="review-item" onClick={() => setReviewingCv(cv)} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '16px', background: 'rgba(19,78,57,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: '#134E39', fontSize: '1.2rem', flexShrink: 0 }}>
                    {cv.alias?.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '800', fontSize: '1.05rem', color: '#1e293b' }}>{cv.alias}</span>
                      <span style={{ background: '#fefce8', color: '#a16207', padding: '2px 10px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: '900', textTransform: 'uppercase' }}>Menunggu Review</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                      <div className="cv-stat"><Clock size={14} /> {cv.age} thn</div>
                      <div className="cv-stat"><MapPin size={14} /> {cv.location?.split(',')[0]}</div>
                      <div className="cv-stat"><GraduationCap size={14} /> {cv.education}</div>
                    </div>
                  </div>
                </div>
                <div className="review-actions">
                  <button 
                    className="btn-review" 
                    onClick={(e) => { e.stopPropagation(); setReviewingCv(cv); }}
                    style={{ background: '#134E39', color: 'white', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '12px', fontWeight: '800', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
                  >
                    <Eye size={16} /> Review Detail
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '5rem 2rem', background: '#f8fafc', borderRadius: '24px', border: '1.5px dashed #e2e8f0' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', boxShadow: '0 10px 20px rgba(0,0,0,0.02)' }}>
                <CheckCircle size={40} color="#16a34a" />
              </div>
              <h3 style={{ fontWeight: '900', color: '#134E39', margin: '0 0 8px' }}>Semua CV Selesai Direview</h3>
              <p style={{ color: '#64748b', margin: 0, fontWeight: '500' }}>Alhamdulillah, saat ini tidak ada antrean CV yang perlu divalidasi.</p>
            </div>
          )}
        </div>

        {reviewingCv && (
          <div className="modal-overlay" onClick={() => setReviewingCv(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '650px', width: '95%', borderRadius: '32px', overflow: 'hidden' }}>
              <div style={{ padding: '2rem', background: '#134E39', color: 'white', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
                  <ShieldCheck size={20} color="#D4AF37" />
                  <span style={{ fontSize: '0.75rem', fontWeight: '900', color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Verifikasi CV Kandidat</span>
                </div>
                <h2 style={{ fontSize: '1.75rem', fontWeight: '950', margin: 0 }}>Review Data: {reviewingCv.alias}</h2>
                <button onClick={() => setReviewingCv(null)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'rgba(255,255,255,0.1)', border: 'none', width: 40, height: 40, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer' }}>
                  <XCircle size={24} />
                </button>
              </div>
              
              <div className="modal-body" style={{ padding: '2rem', textAlign: 'left', maxHeight: '65vh', overflowY: 'auto' }}>
                <div style={{ borderLeft: '4px solid #D4AF37', paddingLeft: '1rem', marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: '900', color: '#134E39', textTransform: 'uppercase', margin: 0 }}>Informasi Dasar</h4>
                </div>
                
                <div className="modal-grid-2" style={{ marginBottom: '2.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '10px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#134E39' }}><User size={20} /></div>
                    <div><div style={{ fontSize: '0.65rem', fontWeight: '800', color: '#94a3b8' }}>ALIAS</div><div style={{ fontWeight: '800' }}>{reviewingCv.alias}</div></div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '10px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#134E39' }}><Clock size={20} /></div>
                    <div><div style={{ fontSize: '0.65rem', fontWeight: '800', color: '#94a3b8' }}>USIA</div><div style={{ fontWeight: '800' }}>{reviewingCv.age} Tahun</div></div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '10px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#134E39' }}><MapPin size={20} /></div>
                    <div><div style={{ fontSize: '0.65rem', fontWeight: '800', color: '#94a3b8' }}>LOKASI</div><div style={{ fontWeight: '800' }}>{reviewingCv.location}</div></div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '10px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#134E39' }}><GraduationCap size={20} /></div>
                    <div><div style={{ fontSize: '0.65rem', fontWeight: '800', color: '#94a3b8' }}>PENDIDIKAN</div><div style={{ fontWeight: '800' }}>{reviewingCv.education}</div></div>
                  </div>
                </div>

                <div style={{ borderLeft: '4px solid #D4AF37', paddingLeft: '1rem', marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: '900', color: '#134E39', textTransform: 'uppercase', margin: 0 }}>Deskripsi Profil</h4>
                </div>
                
                <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '20px', border: '1px solid #f1f5f9', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: '#134E39' }}>
                    <MessageSquare size={16} />
                    <span style={{ fontSize: '0.75rem', fontWeight: '900', textTransform: 'uppercase' }}>Tentang Saya</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.95rem', color: '#1e293b', lineHeight: 1.6, fontWeight: '500' }}>{reviewingCv.about || 'Tidak ada deskripsi'}</p>
                </div>

                <div style={{ background: '#fffcf0', padding: '1.5rem', borderRadius: '20px', border: '1px solid #fde047', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: '#a16207' }}>
                    <AlertCircle size={16} />
                    <span style={{ fontSize: '0.75rem', fontWeight: '900', textTransform: 'uppercase' }}>Kriteria Pasangan</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.95rem', color: '#451a1a', lineHeight: 1.6, fontWeight: '500' }}>{reviewingCv.criteria || 'Tidak memberikan kriteria spesifik'}</p>
                </div>
              </div>

              <div style={{ padding: '2rem', display: 'flex', gap: '1rem', background: 'white', borderTop: '1px solid #f1f5f9' }}>
                <button 
                  onClick={() => handleReject(reviewingCv.id, reviewingCv.alias, reviewingCv.user_id)}
                  style={{ flex: 1, background: '#fef2f2', color: '#ef4444', border: 'none', padding: '1rem', borderRadius: '16px', fontWeight: '900', fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <XCircle size={20} /> Tolak CV
                </button>
                <button 
                  onClick={() => handleApprove(reviewingCv.id, reviewingCv.alias, reviewingCv.user_id)}
                  style={{ flex: 2, background: '#134E39', color: 'white', border: 'none', padding: '1rem', borderRadius: '16px', fontWeight: '900', fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 10px 20px rgba(19, 78, 57, 0.2)' }}
                >
                  <CheckCircle size={20} /> Setujui & Publish
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
