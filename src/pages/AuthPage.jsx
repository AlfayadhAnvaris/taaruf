import React, { useState } from 'react';
import { ShieldCheck, UserCircle, HeartHandshake } from 'lucide-react';

export default function AuthPage({ onLogin, onRegister, showAlert }) {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('user');
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // Only for register
  const [waliPhone, setWaliPhone] = useState(''); // Only for register, optional
  const [gender, setGender] = useState('ikhwan'); // Only for register

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLogin) {
      if (email.trim() === '' || password === '') {
        showAlert('Input Tidak Lengkap', 'Email/No HP dan Password harus diisi', 'error');
        return;
      }
      onLogin(email, password, role);
    } else {
      if (email.trim() === '' || password === '' || name.trim() === '') {
        showAlert('Input Tidak Lengkap', 'Data wajib (Nama, Email, Password) harus diisi', 'error');
        return;
      }
      // Simulate OTP verification here optionally
      showAlert('Berhasil', 'Kode OTP (Simulasi) telah dikirim. Memverifikasi...', 'success');
      onRegister(email, password, name, role, waliPhone, gender);
    }
  };

  return (
    <div className="auth-split-container">
      <div className="auth-sidebar">
        <div className="auth-sidebar-content">
          <div className="auth-logo">
            <HeartHandshake size={64} style={{ color: 'var(--secondary)' }} />
          </div>
          <h1>Taaruf Syar'i</h1>
          <p>Langkah awal ikhtiar menjemput jodoh idaman sesuai sunnah, dengan proses yang aman, terjaga, dan penuh keberkahan.</p>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-form-wrapper">
          <div className="auth-form-header">
            <h2>{isLogin ? 'Ahlan wa Sahlan' : 'Daftar Akun Baru'}</h2>
            <p>
              {isLogin ? 'Silakan masuk ke akun Anda' : 'Lengkapi data form berikut untuk mendaftar akun.'}
            </p>
          </div>

        <form onSubmit={handleSubmit}>
          <div className="role-selector" style={{ marginBottom: '1.5rem' }}>
            <button 
              type="button"
              className={`role-btn ${role === 'user' ? 'active' : ''}`}
              onClick={() => setRole('user')}
            >
              <UserCircle size={28} />
              Calon Taaruf
            </button>
            <button 
              type="button"
              className={`role-btn ${role === 'admin' ? 'active' : ''}`}
              onClick={() => setRole('admin')}
            >
              <ShieldCheck size={28} />
              Ustadz / Admin
            </button>
          </div>

          {!isLogin && (
            <>
              <div className="form-group" style={{ textAlign: 'left', marginBottom: '1rem' }}>
                <label className="form-label">Nama Lengkap (Sesuai KTP)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Nama Lengkap..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={!isLogin}
                />
                <small style={{ color: 'var(--primary)', fontSize: '0.8rem', marginTop: '0.2rem', display: 'block' }}>*Tenang, nama asli akan disembunyikan dalam pencarian</small>
              </div>
              <div className="form-group" style={{ textAlign: 'left', marginBottom: '1rem' }}>
                <label className="form-label">No Whatsapp Wali (Opsional)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Contoh: 081234..."
                  value={waliPhone}
                  onChange={(e) => setWaliPhone(e.target.value)}
                />
                <small style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>*Digunakan jika lanjut ke tahap mediasi Taaruf Syar'i</small>
              </div>
              {role === 'user' && (
                <div className="form-group" style={{ textAlign: 'left', marginBottom: '1rem' }}>
                  <label className="form-label">Jenis Kelamin</label>
                  <select 
                    className="form-control" 
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                  >
                    <option value="ikhwan">Ikhwan (Pria)</option>
                    <option value="akhwat">Akhwat (Wanita)</option>
                  </select>
                </div>
              )}
            </>
          )}

          <div className="form-group" style={{ textAlign: 'left', marginBottom: '1rem' }}>
            <label className="form-label">Email / No. HP Aktif</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Email atau nomor HP..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="form-control" 
              placeholder="Masukkan password..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1.2rem', fontSize: '1.1rem', marginBottom: '1.5rem', borderRadius: '12px' }}>
            {isLogin ? 'Masuk Sekarang' : 'Daftar & Verifikasi OTP'}
          </button>
        </form>

        <p style={{ color: 'var(--text-muted)' }}>
          {isLogin ? 'Belum punya akun? ' : 'Sudah punya akun? '}
          <button 
            type="button" 
            style={{ color: 'var(--secondary)', fontWeight: '700', background: 'none', padding: 0 }}
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? 'Buat Akun' : 'Login'}
          </button>
        </p>
      </div>
     </div>
    </div>
  );
}
