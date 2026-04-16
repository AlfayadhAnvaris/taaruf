import React, { useState } from 'react';
import { CheckCircle, RefreshCw, KeyRound, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../supabase';

function PwInput({ value, onChange, show, setShow, placeholder }) {
  return (
    <div style={{ position: 'relative' }}>
      <input type={show ? 'text' : 'password'} className="form-control" placeholder={placeholder}
        value={value} onChange={e => onChange(e.target.value)} style={{ paddingRight: '3rem' }} />
      <button type="button" onClick={() => setShow(!show)}
        style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, display: 'flex' }}>
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

export default function ChangePasswordCard({ showAlert }) {
  const [isOpen, setIsOpen] = useState(false);
  const [current, setCurrent] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showC, setShowC] = useState(false);
  const [showN, setShowN] = useState(false);
  const [showF, setShowF] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const strength = (() => {
    let s = 0;
    if (newPw.length >= 8) s++;
    if (/[A-Z]/.test(newPw)) s++;
    if (/[0-9]/.test(newPw)) s++;
    if (/[^A-Za-z0-9]/.test(newPw)) s++;
    return s;
  })();
  const strengthLabel = ['', 'Lemah', 'Cukup', 'Kuat', 'Sangat Kuat'][strength];
  const strengthColor = ['', '#ef4444', '#f59e0b', '#22c55e', '#16a34a'][strength];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!current) { showAlert('Wajib Diisi', 'Masukkan password saat ini.', 'error'); return; }
    if (newPw.length < 8) { showAlert('Password Lemah', 'Password baru minimal 8 karakter.', 'error'); return; }
    if (newPw !== confirm) { showAlert('Tidak Cocok', 'Konfirmasi password tidak sesuai.', 'error'); return; }
    if (newPw === current) { showAlert('Sama', 'Password baru tidak boleh sama dengan yang lama.', 'error'); return; }
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email: session.user.email, password: current });
      if (signInErr) { showAlert('Password Salah', 'Password saat ini tidak benar.', 'error'); setSaving(false); return; }
      const { error: updateErr } = await supabase.auth.updateUser({ password: newPw });
      if (updateErr) { showAlert('Gagal', updateErr.message, 'error'); setSaving(false); return; }
      setDone(true); setCurrent(''); setNewPw(''); setConfirm('');
    } catch (err) { showAlert('Error', err.message, 'error'); }
    setSaving(false);
  };

  return (
    <div className="card" style={{ padding: '1.5rem 1.75rem', marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(44,95,77,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
            <KeyRound size={17} />
          </div>
          <div>
            <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-main)' }}>Ganti Password</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Perbarui keamanan akun Anda</div>
          </div>
        </div>
        {!isOpen && (
          <button className="btn btn-outline" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }} onClick={() => { setIsOpen(true); setDone(false); }}>
            Ubah Password
          </button>
        )}
      </div>

      {isOpen && (
        <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)', animation: 'fadeIn 0.3s ease' }}>
          {done ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <CheckCircle size={48} color="#22c55e" style={{ marginBottom: '0.75rem' }} />
              <p style={{ fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.25rem' }}>Password Berhasil Diubah!</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>Gunakan password baru saat login berikutnya.</p>
              <button className="btn btn-outline" style={{ fontSize: '0.85rem' }} onClick={() => { setIsOpen(false); setDone(false); }}>Tutup</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: '1rem', textAlign: 'left' }}>
                <label className="form-label">Password Saat Ini</label>
                <PwInput value={current} onChange={setCurrent} show={showC} setShow={setShowC} placeholder="Masukkan password lama..." />
              </div>
              <div style={{ height: '1px', background: 'var(--border)', margin: '1.1rem 0' }} />
              <div className="form-group" style={{ marginBottom: '0.6rem', textAlign: 'left' }}>
                <label className="form-label">Password Baru</label>
                <PwInput value={newPw} onChange={setNewPw} show={showN} setShow={setShowN} placeholder="Minimal 8 karakter..." />
                {newPw.length > 0 && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '3px', marginBottom: '0.25rem' }}>
                      {[1,2,3,4].map(i => (
                        <div key={i} style={{ flex: 1, height: '4px', borderRadius: '99px', background: i <= strength ? strengthColor : 'var(--border)', transition: 'background 0.3s' }} />
                      ))}
                    </div>
                    <small style={{ color: strengthColor, fontWeight: '600' }}>{strengthLabel}</small>
                  </div>
                )}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.875rem', padding: '0.6rem 0.875rem', background: 'rgba(44,95,77,0.04)', borderRadius: '8px' }}>
                💡 Min. 8 karakter, huruf besar, angka, dan simbol untuk password yang kuat.
              </div>
              <div className="form-group" style={{ marginBottom: '1.25rem', textAlign: 'left' }}>
                <label className="form-label">Konfirmasi Password Baru</label>
                <PwInput value={confirm} onChange={setConfirm} show={showF} setShow={setShowF} placeholder="Ulangi password baru..." />
                {confirm && confirm !== newPw && <small style={{ color: 'var(--danger)', marginTop: '0.25rem', display: 'block' }}>Password tidak cocok</small>}
                {confirm && confirm === newPw && newPw.length >= 8 && <small style={{ color: '#22c55e', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><CheckCircle size={12} /> Cocok</small>}
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1, fontSize: '0.875rem' }} onClick={() => setIsOpen(false)}>Batal</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2, fontSize: '0.875rem' }} disabled={saving || (confirm && confirm !== newPw)}>
                  {saving
                    ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}><RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> Memproses...</span>
                    : <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}><KeyRound size={15} /> Ganti Password</span>
                  }
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
