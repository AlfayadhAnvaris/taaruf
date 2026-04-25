import React, { useState, useRef, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, HeartHandshake, Mail, ArrowLeft, CheckCircle, Loader, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { supabase } from '../supabase';
import { AppContext } from '../App';

// ============================================================
// Komponen Input OTP (6 digit)
// ============================================================
function OTPInput({ value, onChange, disabled }) {
  const inputs = useRef([]);

  const handleChange = (i, e) => {
    const val = e.target.value.replace(/\D/g, '').slice(-1);
    const arr = (value || '      ').split('');
    arr[i] = val || ' ';
    const next = arr.join('');
    onChange(next.trimEnd());
    if (val && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace') {
      const arr = (value || '').split('');
      if (!arr[i] && i > 0) {
        inputs.current[i - 1]?.focus();
      } else {
        arr[i] = '';
        onChange(arr.join(''));
      }
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) {
      onChange(pasted);
      const focusIdx = Math.min(pasted.length, 5);
      inputs.current[focusIdx]?.focus();
    }
    e.preventDefault();
  };

  return (
    <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', marginBottom: '2rem' }}>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const digit = (value || '')[i] || '';
        const isFilled = digit !== '' && digit !== ' ';
        return (
          <input
            key={i}
            ref={(el) => (inputs.current[i] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            disabled={disabled}
            style={{
              width: '52px',
              height: '60px',
              textAlign: 'center',
              fontSize: '1.6rem',
              fontWeight: '700',
              border: isFilled ? '2px solid var(--primary)' : '2px solid var(--border)',
              borderRadius: '12px',
              background: isFilled ? 'rgba(44,95,77,0.06)' : 'var(--bg-color)',
              color: 'var(--text-main)',
              outline: 'none',
              transition: 'border-color 0.2s, background 0.2s',
              cursor: disabled ? 'not-allowed' : 'text',
            }}
          />
        );
      })}
    </div>
  );
}

// ============================================================
// Komponen Utama AuthPage
// ============================================================
export default function AuthPage({ initialIsLogin = true, showAlert }) {
  const navigate = useNavigate();
  const { user } = useContext(AppContext);
  const [isLogin, setIsLogin] = useState(initialIsLogin);
  const [step, setStep] = useState('form');

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');

  // OTP state
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Sync isLogin with prop if it changes
  useEffect(() => {
    setIsLogin(initialIsLogin);
  }, [initialIsLogin]);

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) navigate('/app');
  }, [user, navigate]);

  // Countdown resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      showAlert('Input Tidak Lengkap', 'Nama, Email, dan Password wajib diisi.', 'error');
      return;
    }
    setIsLoading(true);
    try {
      // 1. Cek apakah email sudah terdaftar di tabel profiles
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', email)
        .maybeSingle();

      if (existingUser) {
        showAlert('Email Sudah Terdaftar', 'Alamat email ini sudah memiliki akun. Silakan gunakan fitur Login.', 'error');
        setIsLoading(false);
        return;
      }

      // 2. Registrasi langsung (OTP Dinonaktifkan untuk testing)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name }
        }
      });

      if (error) {
        showAlert('Gagal Registrasi', error.message, 'error');
      } else {
        const userId = data.user?.id;
        if (userId) {
          // Buat profil di tabel profiles
          await supabase.from('profiles').upsert({ 
            id: userId, 
            name, 
            email, 
            role: 'user', 
            profile_complete: false 
          }, { onConflict: 'id' });
        }
        setStep('success');
        showAlert('Registrasi Berhasil', 'Akun berhasil dibuat.', 'success');
      }
    } catch (err) {
      showAlert('Error Sistem', err.message, 'error');
    }
    setIsLoading(false);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const code = otpCode.replace(/\s/g, '');
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
      if (error) {
        showAlert('Kode Salah', error.message, 'error');
        setOtpCode('');
      } else {
        const userId = data.user?.id;
        await supabase.auth.updateUser({ password, data: { name } });
        if (userId) {
          await supabase.from('profiles').upsert({ id: userId, name, email, role: 'user', profile_complete: false }, { onConflict: 'id' });
        }
        setStep('success');
      }
    } catch (err) {
      showAlert('Error Sistem', err.message, 'error');
    }
    setIsLoading(false);
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
    setIsLoading(false);
    if (!error) { setCountdown(60); setOtpCode(''); showAlert('OTP Dikirim', 'Kode OTP baru telah dikirim.', 'info'); }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      showAlert('Gagal Masuk', 'Email atau Password salah.', 'error');
    }
    setIsLoading(false);
  };

  return (
    <div className="auth-split-container">
      <div className="auth-sidebar">
        <div className="auth-sidebar-content">
          <Link to="/" className="auth-logo"><img src="/assets/logo.svg" alt="Separuh Agama" style={{ width: '80px' }} /></Link>
          <h1>Separuh Agama</h1>
          <p>Langkah awal ikhtiar menjemput jodoh idaman sesuai sunnah.</p>
          {!isLogin && (
            <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {['Daftar Akun', 'Lengkapi Profil', 'Siap Berikhtiar'].map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700 }}>{i + 1}</div>
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>{s}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-form-wrapper">
          {(isLogin || step === 'form') && (
            <>
              <Link to="/" className="btn-back" style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
                <ArrowLeft size={16} /> Kembali ke Beranda
              </Link>
              <div className="auth-form-header">
                <h2>{isLogin ? 'Ahlan wa Sahlan' : 'Daftar Akun Baru'}</h2>
                <p>{isLogin ? 'Silakan masuk ke akun Anda' : 'Lengkapi data verifikasi email Anda'}</p>
              </div>

              <form onSubmit={isLogin ? handleLoginSubmit : handleRegisterSubmit}>
                {!isLogin && (
                  <div className="form-group">
                    <label className="form-label">Nama Lengkap</label>
                    <input type="text" className="form-control" value={name} onChange={e => setName(e.target.value)} required />
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPassword ? 'text' : 'password'} className="form-control" value={password} onChange={e => setPassword(e.target.value)} required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8' }}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1.2rem', borderRadius: '12px' }} disabled={isLoading}>
                  {isLoading ? 'Memproses...' : (isLogin ? 'Masuk Sekarang' : 'Daftar Sekarang')}
                </button>
              </form>
              <p style={{ textAlign: 'center', marginTop: '1.5rem', color: '#64748b' }}>
                {isLogin ? 'Belum punya akun? ' : 'Sudah punya akun? '}
                <button onClick={() => { setIsLogin(!isLogin); navigate(isLogin ? '/daftar' : '/login'); }} style={{ color: 'var(--secondary)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>
                  {isLogin ? 'Daftar di sini' : 'Login di sini'}
                </button>
              </p>
            </>
          )}

          {!isLogin && step === 'otp' && (
            <div style={{ textAlign: 'center' }}>
               <h2 style={{ marginBottom: '1rem' }}>Cek Email Anda</h2>
               <p style={{ marginBottom: '2rem' }}>Kode OTP dikirim ke <strong>{email}</strong></p>
               <OTPInput value={otpCode} onChange={setOtpCode} disabled={isLoading} />
               <button onClick={handleVerifyOtp} className="btn btn-primary" style={{ width: '100%', padding: '1.2rem', borderRadius: '12px' }} disabled={isLoading || otpCode.length < 6}>
                 {isLoading ? 'Verifikasi...' : 'Verifikasi & Buat Akun'}
               </button>
            </div>
          )}

          {!isLogin && step === 'success' && (
            <div style={{ textAlign: 'center' }}>
               <div style={{ width: 80, height: 80, background: 'rgba(44,95,77,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}><CheckCircle size={40} color="var(--primary)" /></div>
               <h2>Alhamdulillah! 🎉</h2>
               <p>Registrasi berhasil. Silakan login ke akun Anda.</p>
               <button onClick={() => { setIsLogin(true); setStep('form'); navigate('/login'); }} className="btn btn-primary" style={{ width: '100%', marginTop: '2rem' }}>Login Sekarang</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
