import React, { useContext, useState } from 'react';
import { AppContext } from '../../App';
import { CheckCircle, XCircle, Eye } from 'lucide-react';
import { supabase } from '../../supabase';

export default function AdminReviewTab() {
  const { cvs, setCvs, showAlert, addNotification } = useContext(AppContext);
  const [reviewingCv, setReviewingCv] = useState(null);

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
    <div className="card" style={{ animation: 'fadeIn 0.5s ease' }}>
      <div className="card-header">
        <h3 className="card-title">Review CV Masuk</h3>
      </div>
      <div className="cv-list">
        {pendingCvs.length > 0 ? (
          pendingCvs.map(cv => (
            <div key={cv.id} className="cv-item">
              <div className="cv-info">
                <h4>{cv.alias} <span className="badge badge-warning">Pending</span></h4>
                <p>{cv.age} thn • {cv.location} • {cv.education} • {cv.job}</p>
                {cv.about && <p style={{ marginTop: '0.5rem', fontStyle: 'italic' }}>"{cv.about}"</p>}
              </div>
              <div className="cv-actions" style={{ display: 'flex', flexDirection: 'column' }}>
                <button className="btn btn-primary" onClick={() => setReviewingCv(cv)}>
                  <Eye size={16} /> Buka & Review
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <CheckCircle size={48} color="var(--success)" />
            <h3 style={{ marginTop: '1rem' }}>Semua CV telah direview</h3>
            <p>Belum ada CV baru yang masuk.</p>
          </div>
        )}
      </div>

      {reviewingCv && (
        <div className="modal-overlay" onClick={() => setReviewingCv(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', width: '95%' }}>
            <div className="modal-header info" style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ margin: 0 }}>Review Detail CV Admin</h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Cek kesesuaian data sebelum diapprove ke publik.</p>
            </div>
            
            <div className="modal-body" style={{ padding: '2rem 1.5rem', textAlign: 'left', maxHeight: '60vh', overflowY: 'auto' }}>
              <h4 style={{ color: 'var(--primary)', marginBottom: '1rem', borderBottom: '2px solid var(--border)', paddingBottom: '0.5rem' }}>Informasi Dasar</h4>
              <p><strong>Alias/Nama Samaran:</strong> {reviewingCv.alias}</p>
              <p><strong>Usia:</strong> {reviewingCv.age} Tahun</p>
              <p><strong>Lokasi:</strong> {reviewingCv.location}</p>
              <p><strong>Pendidikan Terakhir:</strong> {reviewingCv.education}</p>
              <p><strong>Pekerjaan Saat Ini:</strong> {reviewingCv.job}</p>

              <h4 style={{ color: 'var(--primary)', marginBottom: '1rem', marginTop: '1.5rem', borderBottom: '2px solid var(--border)', paddingBottom: '0.5rem' }}>Deskripsi Profil</h4>
              <p><strong>Tentang Saya:</strong><br/>{reviewingCv.about || 'Tidak ada deskripsi'}</p>
              <p style={{ marginTop: '1rem' }}><strong>Kriteria Pasangan:</strong><br/>{reviewingCv.criteria || 'Tidak memberikan kriteria spesifik'}</p>
              {reviewingCv.hobi && <p style={{ marginTop: '1rem' }}><strong>Hobi:</strong><br/>{reviewingCv.hobi}</p>}
            </div>

            <div className="modal-footer" style={{ justifyContent: 'space-between', padding: '1.5rem' }}>
              <button className="btn btn-outline" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => handleReject(reviewingCv.id, reviewingCv.alias, reviewingCv.user_id)}>
                <XCircle size={18} /> Tolak CV
              </button>
              <button className="btn btn-success" onClick={() => handleApprove(reviewingCv.id, reviewingCv.alias, reviewingCv.user_id)}>
                <CheckCircle size={18} /> Setujui & Publish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
