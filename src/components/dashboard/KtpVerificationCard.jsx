import React, { useState, useRef } from 'react';
import { BadgeCheck, Clock, Camera, AlertTriangle, Upload, RefreshCw, X as XIcon } from 'lucide-react';
import { supabase } from '../../supabase';

export default function KtpVerificationCard({ user, showAlert }) {
  const [ktpStatus, setKtpStatus] = useState(user.ktp_status || 'unverified');
  const [ktpUrl, setKtpUrl] = useState(user.ktp_url || null);
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) {
      showAlert('Format Tidak Didukung', 'Unggah file gambar (JPG, PNG, atau WebP).', 'error');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      showAlert('File Terlalu Besar', 'Ukuran maksimal file KTP adalah 5 MB.', 'error');
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const filePath = `ktp/${user.id}.${ext}`;
      const { error: storageError } = await supabase.storage
        .from('ktp-photos')
        .upload(filePath, file, { upsert: true, contentType: file.type });
      if (storageError) { showAlert('Upload Gagal', storageError.message, 'error'); setIsUploading(false); return; }
      const { data: { publicUrl } } = supabase.storage.from('ktp-photos').getPublicUrl(filePath);
      const { error: dbError } = await supabase.from('profiles').update({ ktp_url: publicUrl, ktp_status: 'pending' }).eq('id', user.id);
      if (dbError) { showAlert('Gagal Simpan', dbError.message, 'error'); setIsUploading(false); return; }
      user.ktp_url = publicUrl;
      user.ktp_status = 'pending';
      setKtpUrl(publicUrl);
      setKtpStatus('pending');
      setFile(null);
      setPreview(null);
      showAlert('Berhasil', 'Foto KTP berhasil dikirim. Tunggu verifikasi dari Admin.', 'success');
    } catch (err) {
      showAlert('Error', err.message, 'error');
    }
    setIsUploading(false);
  };

  const statusConfig = {
    unverified: { label: 'Belum Diverifikasi', color: 'var(--text-muted)', bg: 'rgba(0,0,0,0.05)', icon: <Camera size={14} /> },
    pending:    { label: 'Menunggu Verifikasi Admin', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: <Clock size={14} /> },
    verified:   { label: 'Terverifikasi ✓', color: '#22c55e', bg: 'rgba(34,197,94,0.1)', icon: <BadgeCheck size={14} /> },
    rejected:   { label: 'Ditolak — Unggah Ulang', color: 'var(--danger)', bg: 'rgba(239,68,68,0.1)', icon: <AlertTriangle size={14} /> },
  };
  const sc = statusConfig[ktpStatus] || statusConfig.unverified;

  return (
    <div className="card" style={{ padding: '1.75rem', marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ width: 36, height: 36, borderRadius: '5px', background: 'rgba(44,95,77,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
            <BadgeCheck size={18} />
          </div>
          <div>
            <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-main)' }}>Verifikasi Identitas (KTP)</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tingkatkan kepercayaan profil Anda</div>
          </div>
        </div>
        <span style={{ fontSize: '0.75rem', fontWeight: '700', padding: '0.3rem 0.75rem', borderRadius: '99px', background: sc.bg, color: sc.color, display: 'flex', alignItems: 'center', gap: '0.35rem', border: `1px solid ${sc.color}30` }}>
          {sc.icon} {sc.label}
        </span>
      </div>

      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: '1.6', marginBottom: '1.25rem', padding: '0.875rem', background: 'rgba(44,95,77,0.03)', borderRadius: '6px', border: '1px solid rgba(44,95,77,0.08)' }}>
        🪪 Unggah foto KTP Anda (tampak depan, jelas) untuk memverifikasi identitas. Data KTP hanya digunakan untuk keperluan verifikasi dan tidak dibagikan kepada siapapun.
      </p>

      {(preview || (ktpUrl && ktpStatus !== 'rejected')) && (
        <div style={{ marginBottom: '1.25rem', position: 'relative', borderRadius: '7px', overflow: 'hidden', border: '2px solid var(--border)' }}>
          <img src={preview || ktpUrl} alt="Foto KTP" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', display: 'block' }} />
          {ktpStatus === 'verified' && (
            <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', background: '#22c55e', color: 'white', borderRadius: '4px', padding: '0.3rem 0.75rem', fontSize: '0.75rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <BadgeCheck size={13} /> TERVERIFIKASI
            </div>
          )}
        </div>
      )}

      {(ktpStatus === 'unverified' || ktpStatus === 'rejected' || preview) && (
        <div>
          {!preview ? (
            <button type="button" onClick={() => fileInputRef.current?.click()}
              style={{ width: '100%', padding: '1.5rem', border: '2px dashed var(--border)', borderRadius: '7px', background: 'var(--bg-color)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', transition: 'border-color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <Upload size={28} color="var(--primary)" />
              <span style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '0.9rem' }}>Pilih Foto KTP</span>
              <span style={{ fontSize: '0.78rem' }}>JPG, PNG, atau WebP · Maks. 5 MB</span>
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="button" className="btn btn-outline" style={{ flex: 1, fontSize: '0.85rem' }} onClick={() => { setPreview(null); setFile(null); }}>
                <XIcon size={15} style={{ marginRight: '0.3rem' }} /> Ganti Foto
              </button>
              <button type="button" className="btn btn-primary" style={{ flex: 2, fontSize: '0.85rem' }} onClick={handleUpload} disabled={isUploading}>
                {isUploading
                  ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}><RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> Mengunggah...</span>
                  : <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}><Upload size={15} /> Kirim untuk Verifikasi</span>
                }
              </button>
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
        </div>
      )}

      {ktpStatus === 'pending' && !preview && (
        <div style={{ textAlign: 'center', padding: '0.75rem', background: 'rgba(245,158,11,0.06)', borderRadius: '6px', border: '1px solid rgba(245,158,11,0.2)' }}>
          <p style={{ color: '#f59e0b', fontSize: '0.875rem', margin: 0, fontWeight: '600' }}>
            ⏳ Foto KTP sedang ditinjau oleh Admin. Proses biasanya memakan waktu 1×24 jam.
          </p>
        </div>
      )}
    </div>
  );
}
