import React, { useState, useRef, useEffect } from 'react';
import { ShieldCheck, HeartHandshake, Mail, ArrowLeft, CheckCircle, Loader, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { supabase } from '../supabase';

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
export default function AuthPage({ onLogin, onRegister, showAlert }) {
  const [isLogin, setIsLogin] = useState(true);

  // Step: 'form' | 'otp' | 'success'
  const [step, setStep] = useState('form');

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [waliPhone, setWaliPhone] = useState('');
  const [gender, setGender] = useState('ikhwan');

  // OTP state
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Countdown resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  // ============================================================
  // STEP 1: Submit form → kirim OTP ke email
  // ============================================================
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      showAlert('Input Tidak Lengkap', 'Nama, Email, dan Password wajib diisi.', 'error');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showAlert('Email Tidak Valid', 'Masukkan alamat email yang valid.', 'error');
      return;
    }
    if (password.length < 6) {
      showAlert('Password Terlalu Pendek', 'Password minimal 6 karakter.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      // Kirim OTP 6-digit ke email via Supabase magic link / OTP
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          data: { name, gender, wali_phone: waliPhone },
        },
      });

      if (error) {
        showAlert('Gagal Kirim OTP', 'Gagal mengirim kode verifikasi: ' + error.message, 'error');
        setIsLoading(false);
        return;
      }

      setStep('otp');
      setCountdown(60);
    } catch (err) {
      showAlert('Error Sistem', 'Terjadi kesalahan: ' + err.message, 'error');
    }
    setIsLoading(false);
  };

  // ============================================================
  // STEP 2: Verifikasi kode OTP dari email
  // ============================================================
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const code = otpCode.replace(/\s/g, '');
    if (code.length < 6) {
      showAlert('OTP Belum Lengkap', 'Masukkan 6 digit kode OTP dari email Anda.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'email',
      });

      if (error) {
        showAlert(
          'Kode Salah / Kadaluarsa',
          'Kode OTP tidak valid atau sudah habis masa berlakunya. Silakan kirim ulang.',
          'error'
        );
        setOtpCode('');
        setIsLoading(false);
        return;
      }

      // OTP valid → update password & metadata, simpan profil
      const userId = data.user?.id;

      // Update password user yang baru terverifikasi
      const { error: updateError } = await supabase.auth.updateUser({
        password,
        data: { name, gender, wali_phone: waliPhone },
      });
      if (updateError) {
        console.warn('Gagal set password:', updateError.message);
      }

      // Upsert profil ke tabel profiles
      if (userId) {
        const { error: profileError } = await supabase.from('profiles').upsert(
          {
            id: userId,
            name,
            email,
            role: 'user',
            gender,
            wali_phone: waliPhone,
          },
          { onConflict: 'id', ignoreDuplicates: false }
        );
        if (profileError) {
          console.warn('Profil gagal disimpan:', profileError.message);
        }
      }

      setStep('success');
    } catch (err) {
      showAlert('Error Sistem', 'Terjadi kesalahan saat verifikasi: ' + err.message, 'error');
    }
    setIsLoading(false);
  };

  // ============================================================
  // Kirim ulang OTP
  // ============================================================
  const handleResendOtp = async () => {
    if (countdown > 0) return;
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    setIsLoading(false);
    if (error) {
      showAlert('Gagal Kirim Ulang', error.message, 'error');
    } else {
      setCountdown(60);
      setOtpCode('');
      showAlert('OTP Dikirim', 'Kode OTP baru telah dikirim ke email Anda.', 'info');
    }
  };

  // ============================================================
  // Login biasa
  // ============================================================
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      showAlert('Input Tidak Lengkap', 'Email dan Password harus diisi.', 'error');
      return;
    }
    onLogin(email, password);
  };

  const resetToForm = () => {
    setStep('form');
    setOtpCode('');
    setIsLoading(false);
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="auth-split-container">

      {/* ===== SIDEBAR KIRI ===== */}
      <div className="auth-sidebar">
        <div className="auth-sidebar-content">
          <div className="auth-logo">
            <HeartHandshake size={64} style={{ color: 'var(--secondary)' }} />
          </div>
          <h1>Taaruf Syar'i</h1>
          <p>
            Langkah awal ikhtiar menjemput jodoh idaman sesuai sunnah, dengan proses yang aman,
            terjaga, dan penuh keberkahan.
          </p>

          {/* Step indicator saat registrasi */}
          {!isLogin && (
            <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { label: 'Isi Data Diri', done: step !== 'form' },
                { label: 'Verifikasi Email (OTP)', done: step === 'success' },
                { label: 'Akun Aktif', done: step === 'success' },
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                      background: s.done ? 'var(--secondary)' : 'rgba(255,255,255,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '2px solid rgba(255,255,255,0.4)',
                      fontSize: '0.8rem', fontWeight: '700', color: 'white',
                    }}
                  >
                    {s.done ? '✓' : i + 1}
                  </div>
                  <span
                    style={{
                      color: s.done ? 'var(--secondary)' : 'rgba(255,255,255,0.7)',
                      fontSize: '0.9rem',
                      fontWeight: s.done ? '600' : '400',
                    }}
                  >
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ===== FORM KANAN ===== */}
      <div className="auth-form-side">
        <div className="auth-form-wrapper">

          {/* ======== STEP: FORM (Login & Register) ======== */}
          {(isLogin || step === 'form') && (
            <>
              <div className="auth-form-header">
                <h2>{isLogin ? 'Ahlan wa Sahlan' : 'Daftar Akun Baru'}</h2>
                <p>
                  {isLogin
                    ? 'Silakan masuk ke akun Anda'
                    : 'Lengkapi data berikut. Kode verifikasi akan dikirim ke email Anda.'}
                </p>
              </div>

              <form onSubmit={isLogin ? handleLoginSubmit : handleRegisterSubmit}>
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
                        required
                      />
                      <small style={{ color: 'var(--primary)', fontSize: '0.8rem', marginTop: '0.2rem', display: 'block' }}>
                        *Nama asli akan disembunyikan dalam pencarian kandidat
                      </small>
                    </div>

                    <div className="form-group" style={{ textAlign: 'left', marginBottom: '1rem' }}>
                      <label className="form-label">No WhatsApp Wali (Opsional)</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Contoh: 081234..."
                        value={waliPhone}
                        onChange={(e) => setWaliPhone(e.target.value)}
                      />
                      <small style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        *Digunakan saat mediasi Taaruf Syar'i
                      </small>
                    </div>

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
                  </>
                )}

                <div className="form-group" style={{ textAlign: 'left', marginBottom: '1rem' }}>
                  <label className="form-label">
                    <Mail size={13} style={{ marginRight: '0.3rem', verticalAlign: 'middle' }} />
                    Alamat Email Aktif
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="email@contoh.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  {!isLogin && (
                    <small style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      *Kode OTP 6 digit akan dikirim ke email ini
                    </small>
                  )}
                </div>

                <div className="form-group" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
                  <label className="form-label">Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-control"
                      placeholder="Minimal 6 karakter..."
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      style={{ paddingRight: '3rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0,
                      }}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '1.2rem', fontSize: '1.05rem', marginBottom: '1.5rem', borderRadius: '12px' }}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
                      Mengirim OTP...
                    </span>
                  ) : isLogin ? (
                    'Masuk Sekarang'
                  ) : (
                    <>
                      <Mail size={18} /> Kirim Kode OTP ke Email
                    </>
                  )}
                </button>
              </form>

              <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>
                {isLogin ? 'Belum punya akun? ' : 'Sudah punya akun? '}
                <button
                  type="button"
                  style={{ color: 'var(--secondary)', fontWeight: '700', background: 'none', padding: 0, border: 'none', cursor: 'pointer' }}
                  onClick={() => { setIsLogin(!isLogin); setStep('form'); setOtpCode(''); setPassword(''); }}
                >
                  {isLogin ? 'Buat Akun' : 'Login di sini'}
                </button>
              </p>
            </>
          )}

          {/* ======== STEP: OTP ======== */}
          {!isLogin && step === 'otp' && (
            <div style={{ animation: 'fadeIn 0.4s ease' }}>
              <button
                onClick={resetToForm}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--primary)', display: 'flex', alignItems: 'center',
                  gap: '0.4rem', marginBottom: '2rem', padding: 0, fontWeight: '600',
                }}
              >
                <ArrowLeft size={18} /> Kembali ke Form
              </button>

              <div className="auth-form-header" style={{ textAlign: 'center' }}>
                {/* Icon email animasi */}
                <div style={{
                  width: '80px', height: '80px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(44,95,77,0.1), rgba(212,175,55,0.1))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 1.5rem',
                  border: '2px solid rgba(44,95,77,0.15)',
                }}>
                  <Mail size={36} color="var(--primary)" />
                </div>
                <h2>Cek Email Anda</h2>
                <p style={{ lineHeight: '1.7' }}>
                  Kami telah mengirim kode OTP 6 digit ke<br />
                  <strong style={{ color: 'var(--primary)', fontSize: '1rem' }}>{email}</strong>
                </p>
              </div>

              <form onSubmit={handleVerifyOtp}>
                <OTPInput value={otpCode} onChange={setOtpCode} disabled={isLoading} />

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    width: '100%', padding: '1.2rem', fontSize: '1.05rem',
                    marginBottom: '1rem', borderRadius: '12px',
                    opacity: otpCode.replace(/\s/g, '').length < 6 ? 0.6 : 1,
                  }}
                  disabled={isLoading || otpCode.replace(/\s/g, '').length < 6}
                >
                  {isLoading ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
                      Memverifikasi...
                    </span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <ShieldCheck size={20} /> Verifikasi & Buat Akun
                    </span>
                  )}
                </button>
              </form>

              {/* Resend countdown */}
              <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                {countdown > 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    Kirim ulang dalam{' '}
                    <strong style={{ color: 'var(--primary)' }}>{countdown}s</strong>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isLoading}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--secondary)', fontWeight: '700', fontSize: '0.95rem',
                      display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                    }}
                  >
                    <RefreshCw size={16} /> Kirim Ulang OTP
                  </button>
                )}
              </div>

              {/* Tips */}
              <div style={{
                marginTop: '1.5rem', padding: '1rem',
                borderRadius: '12px', background: 'rgba(44,95,77,0.04)',
                border: '1px solid rgba(44,95,77,0.12)',
                fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.6',
              }}>
                <strong>💡 Tips:</strong> Cek folder <em>Spam / Junk</em> jika email tidak masuk ke inbox.
                Kode berlaku selama <strong>10 menit</strong>. Anda bisa paste langsung kode dari email.
              </div>
            </div>
          )}

          {/* ======== STEP: SUCCESS ======== */}
          {!isLogin && step === 'success' && (
            <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease', padding: '1rem 0' }}>
              <div style={{
                width: '96px', height: '96px', borderRadius: '50%',
                background: 'rgba(42, 157, 143, 0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1.5rem',
                border: '3px solid rgba(42, 157, 143, 0.25)',
              }}>
                <CheckCircle size={52} color="var(--success)" />
              </div>
              <h2 style={{ marginBottom: '0.5rem' }}>Alhamdulillah! 🎉</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                Email Anda berhasil diverifikasi dan akun telah aktif.
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                Silakan login menggunakan email dan password yang Anda daftarkan.
              </p>
              <button
                className="btn btn-primary"
                style={{ width: '100%', padding: '1.2rem', fontSize: '1.05rem', borderRadius: '12px' }}
                onClick={() => {
                  setIsLogin(true);
                  setStep('form');
                  setOtpCode('');
                  setPassword('');
                  setName('');
                  setWaliPhone('');
                }}
              >
                Login Sekarang →
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
