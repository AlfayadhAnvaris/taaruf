import React, { useState } from 'react';
import { supabase } from '../supabase';
import { KeyRound, Eye, EyeOff, X, Loader, CheckCircle, ShieldCheck } from 'lucide-react';

export default function ChangePasswordModal({ onClose, showAlert }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);

  const strengthScore = (() => {
    let s = 0;
    if (newPassword.length >= 8) s++;
    if (/[A-Z]/.test(newPassword)) s++;
    if (/[0-9]/.test(newPassword)) s++;
    if (/[^A-Za-z0-9]/.test(newPassword)) s++;
    return s;
  })();

  const strengthLabel = ['', 'Lemah', 'Cukup', 'Kuat', 'Sangat Kuat'][strengthScore];
  const strengthColor = ['', '#ef4444', '#f59e0b', '#22c55e', '#16a34a'][strengthScore];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentPassword) { showAlert('Wajib Diisi', 'Masukkan password saat ini.', 'error'); return; }
    if (newPassword.length < 8) { showAlert('Password Lemah', 'Password baru minimal 8 karakter.', 'error'); return; }
    if (newPassword !== confirmPassword) { showAlert('Tidak Cocok', 'Konfirmasi password tidak sesuai.', 'error'); return; }
    if (newPassword === currentPassword) { showAlert('Sama', 'Password baru tidak boleh sama dengan password lama.', 'error'); return; }

    setIsLoading(true);
    try {
      // 1. Verifikasi password lama dengan cara re-login
      const { data: sessionData } = await supabase.auth.getSession();
      const email = sessionData?.session?.user?.email;
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
      if (signInError) {
        showAlert('Password Salah', 'Password saat ini yang Anda masukkan tidak benar.', 'error');
        setIsLoading(false);
        return;
      }

      // 2. Update ke password baru
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) {
        showAlert('Gagal', updateError.message, 'error');
        setIsLoading(false);
        return;
      }

      setDone(true);
    } catch (err) {
      showAlert('Error', err.message, 'error');
    }
    setIsLoading(false);
  };

  const inputStyle = (show, setter) => ({
    wrapper: { position: 'relative' },
    input: { paddingRight: '3rem' },
    btn: {
      position: 'absolute', right: '0.875rem', top: '50%',
      transform: 'translateY(-50%)', background: 'none',
      border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0,
    },
  });

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '460px',
          background: 'var(--surface)',
          borderRadius: '24px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.25)',
          overflow: 'hidden',
          animation: 'fadeIn 0.25s ease',
          border: '1px solid var(--border)',
        }}
      >
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, var(--primary) 0%, #1a4d35 100%)',
          padding: '1.5rem 1.75rem',
          color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: '12px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <KeyRound size={20} />
            </div>
            <div>
              <div style={{ fontWeight: '800', fontSize: '1.1rem' }}>Ganti Password</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Keamanan akun Anda</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '8px', padding: '0.4rem', cursor: 'pointer', color: 'white', display: 'flex' }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.75rem' }}>
          {done ? (
            /* Success State */
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', border: '2px solid rgba(34,197,94,0.2)' }}>
                <ShieldCheck size={40} color="#22c55e" />
              </div>
              <h3 style={{ marginBottom: '0.5rem' }}>Password Berhasil Diubah</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '1.75rem' }}>
                Password akun Anda telah berhasil diperbarui. Gunakan password baru saat login berikutnya.
              </p>
              <button className="btn btn-primary" style={{ width: '100%', padding: '0.9rem' }} onClick={onClose}>
                Tutup
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Current Password */}
              <div className="form-group" style={{ marginBottom: '1rem', textAlign: 'left' }}>
                <label className="form-label">Password Saat Ini</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    className="form-control"
                    placeholder="Masukkan password lama..."
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    style={{ paddingRight: '3rem' }}
                    required
                  />
                  <button type="button" onClick={() => setShowCurrent(!showCurrent)} style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}>
                    {showCurrent ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <div style={{ height: '1px', background: 'var(--border)', margin: '1.25rem 0' }} />

              {/* New Password */}
              <div className="form-group" style={{ marginBottom: '0.75rem', textAlign: 'left' }}>
                <label className="form-label">Password Baru</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showNew ? 'text' : 'password'}
                    className="form-control"
                    placeholder="Minimal 8 karakter..."
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    style={{ paddingRight: '3rem' }}
                    required
                  />
                  <button type="button" onClick={() => setShowNew(!showNew)} style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}>
                    {showNew ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>

                {/* Strength Meter */}
                {newPassword.length > 0 && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '0.3rem' }}>
                      {[1,2,3,4].map(i => (
                        <div key={i} style={{ flex: 1, height: '4px', borderRadius: '99px', background: i <= strengthScore ? strengthColor : 'var(--border)', transition: 'background 0.3s' }} />
                      ))}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: strengthColor, fontWeight: '600' }}>{strengthLabel}</div>
                  </div>
                )}
              </div>

              {/* Tips */}
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem', padding: '0.75rem', background: 'rgba(44,95,77,0.04)', borderRadius: '10px', lineHeight: '1.6' }}>
                💡 Password kuat: min. 8 karakter, huruf besar, angka, & simbol
              </div>

              {/* Confirm Password */}
              <div className="form-group" style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
                <label className="form-label">Konfirmasi Password Baru</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    className="form-control"
                    placeholder="Ulangi password baru..."
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    style={{ paddingRight: '3rem', borderColor: confirmPassword && confirmPassword !== newPassword ? 'var(--danger)' : undefined }}
                    required
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}>
                    {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {confirmPassword && confirmPassword !== newPassword && (
                  <small style={{ color: 'var(--danger)', marginTop: '0.25rem', display: 'block' }}>Password tidak cocok</small>
                )}
                {confirmPassword && confirmPassword === newPassword && newPassword.length >= 8 && (
                  <small style={{ color: '#22c55e', marginTop: '0.25rem', display: 'block', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <CheckCircle size={13} /> Password cocok
                  </small>
                )}
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={onClose}>
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 2, padding: '0.9rem' }}
                  disabled={isLoading || (confirmPassword && confirmPassword !== newPassword)}
                >
                  {isLoading ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <Loader size={17} style={{ animation: 'spin 1s linear infinite' }} /> Memproses...
                    </span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <KeyRound size={17} /> Ganti Password
                    </span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
