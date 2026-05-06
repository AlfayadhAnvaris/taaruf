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
    <div style={{ flexShrink: 0, width: isOpen ? '100%' : 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {!isOpen && (
          <button 
            style={{ 
              background: 'transparent', 
              color: '#134E39', 
              border: '2px solid #134E39', 
              padding: '1rem', 
              width: '100%',
              maxWidth: '240px',
              borderRadius: '9px', 
              fontWeight: '900', 
              cursor: 'pointer', 
              transition: 'all 0.2s',
              fontSize: '0.9rem',
              textAlign: 'center'
            }} 
            onClick={() => { setIsOpen(true); setDone(false); }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(19,78,57,0.05)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            GANTI PASSWORD
          </button>
        )}
      </div>

      {isOpen && (
        <div className="card" style={{ 
          marginTop: '1.25rem', 
          padding: '2.5rem', 
          boxShadow: '0 20px 40px rgba(0,0,0,0.02)',
          animation: 'fadeIn 0.3s ease' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '2rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: '6px', background: 'rgba(19,78,57,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#134E39' }}>
              <KeyRound size={20} />
            </div>
            <div>
              <div style={{ fontWeight: '900', fontSize: '1.2rem', color: '#134E39' }}>Perbarui Password</div>
              <div style={{ fontSize: '0.85rem', color: '#64748B' }}>Pastikan akun Anda tetap aman dengan password yang kuat.</div>
            </div>
          </div>

          {done ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <CheckCircle size={56} color="#22c55e" style={{ marginBottom: '1rem' }} />
              <p style={{ fontWeight: '900', color: '#134E39', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Berhasil Diperbarui!</p>
              <p style={{ color: '#64748B', fontSize: '0.9rem', marginBottom: '2rem' }}>Gunakan password baru saat login berikutnya.</p>
              <button 
                style={{ background: '#134E39', color: 'white', border: 'none', padding: '1rem 3rem', borderRadius: '8px', fontWeight: '900', cursor: 'pointer' }}
                onClick={() => { setIsOpen(false); setDone(false); }}
              >
                Selesai
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: '#134E39', marginBottom: '8px' }}>Password Saat Ini</label>
                <PwInput value={current} onChange={setCurrent} show={showC} setShow={setShowC} placeholder="Masukkan password lama..." />
              </div>
              
              <div style={{ height: '1px', background: '#F1F5F9', margin: '2rem 0' }} />
              
              <div className="form-group" style={{ marginBottom: '1rem', textAlign: 'left' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: '#134E39', marginBottom: '8px' }}>Password Baru</label>
                <PwInput value={newPw} onChange={setNewPw} show={showN} setShow={setShowN} placeholder="Minimal 8 karakter..." />
                {newPw.length > 0 && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '0.4rem' }}>
                      {[1,2,3,4].map(i => (
                        <div key={i} style={{ flex: 1, height: '5px', borderRadius: '99px', background: i <= strength ? strengthColor : '#E2E8F0', transition: 'background 0.3s' }} />
                      ))}
                    </div>
                    <small style={{ color: strengthColor, fontWeight: '800', fontSize: '0.75rem', textTransform: 'uppercase' }}>{strengthLabel}</small>
                  </div>
                )}
              </div>

              <div style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '1.5rem', padding: '1rem', background: '#F8FAF9', borderRadius: '6px', border: '1px solid #E4EDE8' }}>
                💡 Tips: Gunakan kombinasi huruf besar, angka, dan simbol untuk keamanan maksimal.
              </div>

              <div className="form-group" style={{ marginBottom: '2rem', textAlign: 'left' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: '#134E39', marginBottom: '8px' }}>Konfirmasi Password Baru</label>
                <PwInput value={confirm} onChange={setConfirm} show={showF} setShow={setShowF} placeholder="Ulangi password baru..." />
                {confirm && confirm !== newPw && <small style={{ color: '#EF4444', marginTop: '0.5rem', display: 'block', fontWeight: 600 }}>Password tidak cocok</small>}
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" style={{ flex: 1, background: 'transparent', color: '#64748B', border: '1px solid #E2E8F0', padding: '1.1rem', borderRadius: '9px', fontWeight: '800', cursor: 'pointer' }} onClick={() => setIsOpen(false)}>Batal</button>
                <button type="submit" style={{ flex: 2, background: '#134E39', color: 'white', border: 'none', padding: '1.1rem', borderRadius: '9px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }} disabled={saving || (confirm && confirm !== newPw)}>
                  {saving
                    ? <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} />
                    : <KeyRound size={18} />
                  }
                  {saving ? 'MEMPROSES...' : 'GANTI PASSWORD'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
