"use client";
import React, { useState } from 'react';
import { ShieldAlert, X, AlertTriangle } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';

export default function ReportModal() {
  const { 
    user, 
    reportModalState, 
    setReportModalState, 
    showAlert 
  } = useAppContext();

  const [reason, setReason] = useState('Ketidakjujuran');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!reportModalState || !reportModalState.isOpen) return null;

  const handleClose = () => {
    setReason('Ketidakjujuran');
    setDetails('');
    setReportModalState({
      isOpen: false,
      reportedUserId: null,
      reportedCvId: null,
      reportedAlias: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      showAlert('Gagal', 'Anda harus masuk log terlebih dahulu untuk melaporkan.', 'error');
      return;
    }

    if (!details.trim()) {
      showAlert('Peringatan', 'Harap isi detail penjelasan laporan Anda.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('user_reports').insert({
        reporter_id: user.id,
        reported_user_id: reportModalState.reportedUserId,
        reported_cv_id: reportModalState.reportedCvId,
        reason: reason,
        details: details,
        status: 'pending',
        created_at: new Date().toISOString()
      });

      if (error) throw error;

      showAlert('Berhasil', 'Laporan Anda telah dikirim dan akan ditinjau oleh Asatidzah / Admin.', 'success');
      handleClose();
    } catch (err) {
      console.error('Error submitting report:', err);
      showAlert('Gagal', 'Gagal mengirim laporan: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="modal-overlay" 
      onClick={handleClose} 
      style={{ 
        position: 'fixed', 
        inset: 0, 
        zIndex: 9999, 
        background: 'rgba(15, 23, 42, 0.6)', 
        backdropFilter: 'blur(8px)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '1.5rem',
        animation: 'fadeIn 0.2s ease'
      }}
    >
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ 
          background: 'white', 
          borderRadius: '16px', 
          width: '100%', 
          maxWidth: '500px', 
          overflow: 'hidden', 
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', 
          animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          border: '1px solid #f1f5f9'
        }}
      >
        {/* Header */}
        <div style={{ padding: '1.5rem 2rem', background: '#fff1f2', borderBottom: '1px solid #fee2e2', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
            <ShieldAlert size={22} color="#ef4444" />
            <span style={{ fontSize: '0.75rem', fontWeight: '900', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Laporkan Pelanggaran</span>
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '950', color: '#134E39', margin: 0 }}>Laporkan Kandidat: {reportModalState.reportedAlias || 'Kandidat'}</h3>
          
          <button 
            onClick={handleClose} 
            style={{ 
              position: 'absolute', 
              top: '1.25rem', 
              right: '1.25rem', 
              background: 'rgba(239, 68, 68, 0.08)', 
              border: 'none', 
              width: '36px', 
              height: '36px', 
              borderRadius: '8px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: '#ef4444', 
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', gap: '10px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem' }}>
            <AlertTriangle size={18} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#b45309', fontWeight: '600', lineHeight: 1.5 }}>
              Demi menjaga kebaikan komunitas taaruf syar'i, harap laporkan ketidakjujuran, perilaku kasar, penyalahgunaan foto, atau tindakan penipuan. Laporan palsu dapat berakibat pada penutupan akun Anda.
            </p>
          </div>

          {/* Alasan */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '8px' }}>Alasan Pelaporan</label>
            <select 
              value={reason} 
              onChange={(e) => setReason(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '0.8rem 1rem', 
                borderRadius: '10px', 
                border: '1.5px solid #cbd5e1', 
                background: 'white', 
                fontSize: '0.9rem', 
                fontWeight: '600', 
                color: '#1e293b', 
                outline: 'none', 
                cursor: 'pointer',
                transition: 'border-color 0.2s'
              }}
              onFocus={e => e.currentTarget.style.borderColor = '#134E39'}
              onBlur={e => e.currentTarget.style.borderColor = '#cbd5e1'}
            >
              <option value="Ketidakjujuran">Ketidakjujuran (Keterangan CV palsu)</option>
              <option value="Perilaku Tidak Sopan">Perilaku Tidak Sopan / Kasar</option>
              <option value="Foto/Profil Tidak Pantas">Foto atau Profil Tidak Pantas / Syar'i</option>
              <option value="Penipuan">Penipuan / Spam / Modus</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>

          {/* Detail Penjelasan */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '8px' }}>Detail Penjelasan</label>
            <textarea 
              value={details} 
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Jelaskan secara rinci tindakan pelanggaran yang dilakukan oleh kandidat ini..."
              rows={4}
              style={{ 
                width: '100%', 
                padding: '0.8rem 1rem', 
                borderRadius: '10px', 
                border: '1.5px solid #cbd5e1', 
                fontSize: '0.9rem', 
                fontWeight: '500', 
                color: '#1e293b', 
                outline: 'none', 
                resize: 'none',
                transition: 'border-color 0.2s',
                fontFamily: 'inherit'
              }}
              onFocus={e => e.currentTarget.style.borderColor = '#134E39'}
              onBlur={e => e.currentTarget.style.borderColor = '#cbd5e1'}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              style={{ 
                flex: 1, 
                background: '#f1f5f9', 
                color: '#475569', 
                border: 'none', 
                padding: '0.9rem', 
                borderRadius: '12px', 
                fontWeight: '800', 
                fontSize: '0.95rem', 
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
              onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
            >
              Batal
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              style={{ 
                flex: 2, 
                background: '#ef4444', 
                color: 'white', 
                border: 'none', 
                padding: '0.9rem', 
                borderRadius: '12px', 
                fontWeight: '900', 
                fontSize: '0.95rem', 
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1,
                transition: 'background 0.2s',
                boxShadow: '0 8px 20px rgba(239, 68, 68, 0.2)'
              }}
              onMouseEnter={e => { if(!isSubmitting) e.currentTarget.style.background = '#dc2626'; }}
              onMouseLeave={e => { if(!isSubmitting) e.currentTarget.style.background = '#ef4444'; }}
            >
              {isSubmitting ? 'Mengirim...' : 'Kirim Laporan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
