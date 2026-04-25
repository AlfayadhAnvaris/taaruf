import React, { useState, useContext } from 'react';
import { AppContext } from '../App';
import { supabase } from '../supabase';
import { Heart, User, Phone, MapPin, ChevronRight, ChevronLeft, CheckCircle, Loader, Users, Home, Shield, Sparkles, Briefcase, GraduationCap } from 'lucide-react';

const STEPS = [
  { id: 1, label: 'Genders', icon: <Users size={18} /> },
  { id: 2, label: 'Data Personal', icon: <Briefcase size={18} /> },
  { id: 3, label: 'Kontak', icon: <Phone size={18} /> },
  { id: 4, label: 'Domisili', icon: <MapPin size={18} /> },
  { id: 5, label: 'Selesai', icon: <CheckCircle size={18} /> },
];

export default function CompleteProfilePage({ onComplete }) {
  const { user, showAlert } = useContext(AppContext);

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Auto-skip jika ternyata role-nya Admin
  React.useEffect(() => {
    const isActuallyAdmin = user && (
      user.role?.toLowerCase() === 'admin' || 
      user.name?.toLowerCase() === 'admin' || 
      user.email?.toLowerCase().includes('admin')
    );
    if (isActuallyAdmin) {
      console.log('Admin detected in CompleteProfilePage, skipping...');
      onComplete();
    }
  }, [user, onComplete]);

  const [form, setForm] = useState({
    gender: '',
    phone_wa: '',
    wali_name: '',
    wali_phone: '',
    domisili_kota: '',
    domisili_provinsi: '',
    domisili_detail: '',
    pekerjaan: '',
    pendidikan_terakhir: '',
  });
  
  const [cities, setCities] = useState([]);
  const [isFetchingCities, setIsFetchingCities] = useState(false);

  const PROVINCE_MAP = {
    'Aceh': '11', 'Sumatera Utara': '12', 'Sumatera Barat': '13', 'Riau': '14', 'Kepulauan Riau': '21',
    'Jambi': '15', 'Bengkulu': '17', 'Sumatera Selatan': '16', 'Kepulauan Bangka Belitung': '19',
    'Lampung': '18', 'Banten': '36', 'DKI Jakarta': '31', 'Jawa Barat': '32', 'Jawa Tengah': '33',
    'DI Yogyakarta': '34', 'Jawa Timur': '35', 'Bali': '51', 'Nusa Tenggara Barat': '52',
    'Nusa Tenggara NTT': '53', 'Kalimantan Barat': '61', 'Kalimantan Tengah': '62', 'Kalimantan Selatan': '63',
    'Kalimantan Timur': '64', 'Kalimantan Utara': '65', 'Sulawesi Utara': '71', 'Gorontalo': '75',
    'Sulawesi Tengah': '72', 'Sulawesi Barat': '76', 'Sulawesi Selatan': '73', 'Sulawesi Tenggara': '74',
    'Maluku': '81', 'Maluku Utara': '82', 'Papua Barat': '92', 'Papua': '91', 'Papua Tengah': '93',
    'Papua Pegunungan': '95', 'Papua Selatan': '94', 'Papua Barat Daya': '96'
  };

  React.useEffect(() => {
    if (form.domisili_provinsi && PROVINCE_MAP[form.domisili_provinsi]) {
       const fetchCities = async () => {
          setIsFetchingCities(true);
          try {
             const res = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${PROVINCE_MAP[form.domisili_provinsi]}.json`);
             const data = await res.json();
             setCities(data || []);
          } catch (e) {
             console.error("Gagal mengambil data kota", e);
             setCities([]);
          }
          setIsFetchingCities(false);
       };
       fetchCities();
    } else {
       setCities([]);
    }
  }, [form.domisili_provinsi]);

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const isAkhwat = form.gender === 'akhwat';

  // ─── Validasi per step ─────────────────────────────────────────
  const validateStep = () => {
    if (step === 1) {
      if (!form.gender) {
        showAlert('Wajib Diisi', 'Silakan pilih jenis kelamin Anda.', 'error');
        return false;
      }
    }
    if (step === 2) {
      if (!form.pendidikan_terakhir.trim() || !form.pekerjaan.trim()) {
        showAlert('Wajib Diisi', 'Pendidikan dan Pekerjaan wajib diisi.', 'error');
        return false;
      }
    }
    if (step === 3) {
      if (!form.phone_wa.trim()) {
        showAlert('Wajib Diisi', 'Nomor WhatsApp aktif wajib diisi.', 'error');
        return false;
      }
      if (isAkhwat && !form.wali_phone.trim()) {
        showAlert('Wajib Diisi', 'Nomor WhatsApp Wali wajib diisi untuk Akhwat.', 'error');
        return false;
      }
    }
    if (step === 4) {
      if (!form.domisili_kota.trim() || !form.domisili_provinsi.trim()) {
        showAlert('Wajib Diisi', 'Kota dan Provinsi domisili wajib diisi.', 'error');
        return false;
      }
    }
    return true;
  };

  const next = () => {
    if (!validateStep()) return;
    setStep(s => s + 1);
  };

  const prev = () => setStep(s => s - 1);

  // ─── Submit ke Supabase ─────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validateStep()) return;
    setIsLoading(true);
    try {
      const payload = {
        gender: form.gender,
        phone_wa: form.phone_wa.trim(),
        wali_name: isAkhwat ? form.wali_name.trim() : null,
        wali_phone: isAkhwat ? form.wali_phone.trim() : null,
        domisili_kota: form.domisili_kota.trim(),
        domisili_provinsi: form.domisili_provinsi.trim(),
        domisili_detail: form.domisili_detail.trim() || null,
        pekerjaan: form.pekerjaan.trim(),
        pendidikan_terakhir: form.pendidikan_terakhir.trim(),
        profile_complete: true,
      };

      // Update juga user_metadata agar gender bisa diakses cepat
      await supabase.auth.updateUser({ data: { gender: form.gender } });

      const { error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', user.id);

      if (error) {
        showAlert('Gagal Menyimpan', 'Terjadi kesalahan: ' + error.message, 'error');
        setIsLoading(false);
        return;
      }

      setStep(4); // success screen
    } catch (err) {
      showAlert('Error', err.message, 'error');
    }
    setIsLoading(false);
  };

  // ─── Render ──────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-color)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '560px',
        background: 'var(--surface)',
        borderRadius: '24px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
        overflow: 'hidden',
        border: '1px solid var(--border)',
      }}>

        {/* ── Header ── */}
        <div style={{
          background: 'linear-gradient(135deg, var(--primary) 0%, #1a4d35 100%)',
          padding: '2rem 2.5rem 1.5rem',
          color: 'white',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <Heart size={28} style={{ color: 'var(--secondary)' }} />
            <span style={{ fontWeight: '700', fontSize: '1.1rem', opacity: 0.9 }}>Separuh Agama</span>
          </div>
          <h2 style={{ margin: '0 0 0.4rem', fontSize: '1.6rem', fontWeight: '800' }}>
            Lengkapi Profil Anda
          </h2>
          <p style={{ margin: 0, opacity: 0.8, fontSize: '0.95rem', lineHeight: '1.5' }}>
            Halo <strong>{user?.name}</strong>! Sebelum masuk ke platform, lengkapi data diri Anda terlebih dahulu.
          </p>
        </div>

        {/* ── Step Indicator ── */}
        {step < 5 && (
          <div style={{
            display: 'flex',
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-color)',
          }}>
            {STEPS.slice(0, 4).map((s, i) => {
              const isActive = step === s.id;
              const isDone = step > s.id;
              return (
                <div key={s.id} style={{
                  flex: 1,
                  padding: '0.875rem 0.5rem',
                  textAlign: 'center',
                  borderBottom: isActive ? '3px solid var(--primary)' : isDone ? '3px solid var(--success)' : '3px solid transparent',
                  transition: 'border-color 0.3s',
                }}>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.3rem',
                    color: isActive ? 'var(--primary)' : isDone ? 'var(--success)' : 'var(--text-muted)',
                    fontWeight: isActive ? '700' : '500',
                  }}>
                    {isDone ? <CheckCircle size={16} /> : s.icon}
                    <span style={{ fontSize: '0.7rem' }}>{s.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Body ── */}
        <div style={{ padding: '2rem 2.5rem' }}>

          {/* ════ STEP 1: Jenis Kelamin ════ */}
          {step === 1 && (
            <div style={{ animation: 'fadeIn 0.35s ease' }}>
              <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-main)', fontSize: '1.2rem' }}>
                Anda Ikhwan atau Akhwat?
              </h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.75rem', fontSize: '0.9rem', lineHeight: '1.6' }}>
                Jenis kelamin menentukan siapa yang dapat melihat profil Anda dan siapa yang bisa Anda lihat di platform ini.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[
                  {
                    value: 'ikhwan',
                    label: 'Ikhwan (Pria)',
                    sub: 'Dapat mencari dan mengajukan taaruf kepada Akhwat',
                    color: '#0ea5e9',
                    bg: 'rgba(14,165,233,0.06)',
                    icon: '👨',
                  },
                  {
                    value: 'akhwat',
                    label: 'Akhwat (Wanita)',
                    sub: 'Menerima pengajuan taaruf dari Ikhwan, dilindungi wali',
                    color: '#ec4899',
                    bg: 'rgba(236,72,153,0.06)',
                    icon: '👩',
                  },
                ].map(opt => {
                  const selected = form.gender === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => set('gender', opt.value)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '1.25rem 1.5rem',
                        borderRadius: '16px',
                        border: selected ? `2px solid ${opt.color}` : '2px solid var(--border)',
                        background: selected ? opt.bg : 'var(--surface)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s ease',
                        transform: selected ? 'scale(1.01)' : 'scale(1)',
                      }}
                    >
                      <div style={{
                        fontSize: '2.2rem',
                        width: '56px', height: '56px',
                        borderRadius: '14px',
                        background: opt.bg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        {opt.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '700', fontSize: '1rem', color: selected ? opt.color : 'var(--text-main)', marginBottom: '0.2rem' }}>
                          {opt.label}
                        </div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                          {opt.sub}
                        </div>
                      </div>
                      <div style={{
                        width: '22px', height: '22px', borderRadius: '50%',
                        border: selected ? `2px solid ${opt.color}` : '2px solid var(--border)',
                        background: selected ? opt.color : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        {selected && <CheckCircle size={14} color="white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ════ STEP 2: Data Personal ════ */}
          {step === 2 && (
            <div style={{ animation: 'fadeIn 0.35s ease' }}>
              <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-main)', fontSize: '1.2rem' }}>
                Latar Belakang
              </h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.75rem', fontSize: '0.9rem', lineHeight: '1.6' }}>
                Informasi ini membantu Admin dan calon pasangan mengenal latar belakang pendidikan dan kesibukan Anda saat ini.
              </p>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">
                  <GraduationCap size={14} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} />
                  Pendidikan Terakhir <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <select 
                  className="form-control" 
                  value={form.pendidikan_terakhir}
                  onChange={e => set('pendidikan_terakhir', e.target.value)}
                >
                  <option value="">-- Pilih Pendidikan --</option>
                  {['SD', 'SMP', 'SMA/SMK', 'Diploma (D1-D4)', 'Sarjana (S1)', 'Magister (S2)', 'Doktor (S3)', 'Pondok Pesantren'].map(edu => (
                    <option key={edu} value={edu}>{edu}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">
                  <Briefcase size={14} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} />
                  Pekerjaan Saat Ini <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Contoh: Karyawan Swasta, Freelance, Mahasiswa..."
                  value={form.pekerjaan}
                  onChange={e => set('pekerjaan', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* ════ STEP 3: Kontak ════ */}
          {step === 3 && (
            <div style={{ animation: 'fadeIn 0.35s ease' }}>
              <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-main)', fontSize: '1.2rem' }}>
                Informasi Kontak
              </h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.75rem', fontSize: '0.9rem', lineHeight: '1.6' }}>
                Nomor WhatsApp digunakan untuk komunikasi mediasi taaruf melalui Ustadz/Admin. Tidak ditampilkan ke publik.
              </p>

              {/* No WA Sendiri */}
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">
                  <Phone size={14} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} />
                  No. WhatsApp Aktif <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="tel"
                  className="form-control"
                  placeholder="Contoh: 0812-3456-7890"
                  value={form.phone_wa}
                  onChange={e => set('phone_wa', e.target.value)}
                />
              </div>

              {/* Kontak Wali — hanya muncul jika Akhwat */}
              {isAkhwat && (
                <div style={{
                  marginTop: '1.5rem',
                  padding: '1.5rem',
                  background: 'rgba(236,72,153,0.04)',
                  border: '1px solid rgba(236,72,153,0.15)',
                  borderRadius: '16px',
                  animation: 'fadeIn 0.3s ease',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <Shield size={18} color="#ec4899" />
                    <span style={{ fontWeight: '700', color: '#ec4899', fontSize: '0.95rem' }}>
                      Kontak Wali (Wajib untuk Akhwat)
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem', lineHeight: '1.5' }}>
                    Dalam proses taaruf syar'i, wali berperan penting. Kontak wali akan digunakan oleh Admin/Ustadz saat mediasi berlangsung.
                  </p>
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label className="form-label">
                      Nama Wali <span style={{ color: 'var(--text-muted)', fontWeight: '400' }}>(Opsional)</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Contoh: Bapak Ahmad"
                      value={form.wali_name}
                      onChange={e => set('wali_name', e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">
                      No. WhatsApp Wali <span style={{ color: 'var(--danger)' }}>*</span>
                    </label>
                    <input
                      type="tel"
                      className="form-control"
                      placeholder="Contoh: 0812-3456-7890"
                      value={form.wali_phone}
                      onChange={e => set('wali_phone', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ════ STEP 4: Domisili ════ */}
          {step === 4 && (
            <div style={{ animation: 'fadeIn 0.35s ease' }}>
              <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-main)', fontSize: '1.2rem' }}>
                Domisili
              </h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.75rem', fontSize: '0.9rem', lineHeight: '1.6' }}>
                Informasi domisili digunakan untuk membantu pencarian kandidat berdasarkan lokasi terdekat.
              </p>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">
                  Provinsi <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <select
                  className="form-control"
                  value={form.domisili_provinsi}
                  onChange={e => set('domisili_provinsi', e.target.value)}
                >
                  <option value="">-- Pilih Provinsi --</option>
                  {[
                    'Aceh','Sumatera Utara','Sumatera Barat','Riau','Kepulauan Riau',
                    'Jambi','Bengkulu','Sumatera Selatan','Kepulauan Bangka Belitung',
                    'Lampung','Banten','DKI Jakarta','Jawa Barat','Jawa Tengah',
                    'DI Yogyakarta','Jawa Timur','Bali','Nusa Tenggara Barat',
                    'Nusa Tenggara Timur','Kalimantan Barat','Kalimantan Tengah',
                    'Kalimantan Selatan','Kalimantan Timur','Kalimantan Utara',
                    'Sulawesi Utara','Gorontalo','Sulawesi Tengah','Sulawesi Barat',
                    'Sulawesi Selatan','Sulawesi Tenggara','Maluku','Maluku Utara',
                    'Papua Barat','Papua','Papua Tengah','Papua Pegunungan',
                    'Papua Selatan','Papua Barat Daya',
                  ].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">
                  Kota / Kabupaten <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <select
                  className="form-control"
                  value={form.domisili_kota}
                  onChange={e => set('domisili_kota', e.target.value)}
                  disabled={!form.domisili_provinsi || isFetchingCities}
                >
                  <option value="">{isFetchingCities ? 'Memuat data...' : '-- Pilih Kota/Kabupaten --'}</option>
                  {cities.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
                {!form.domisili_provinsi && <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Silakan pilih provinsi terlebih dahulu</small>}
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">
                  Keterangan Tambahan <span style={{ color: 'var(--text-muted)', fontWeight: '400' }}>(Opsional)</span>
                </label>
                <textarea
                  className="form-control"
                  placeholder="Contoh: Dekat Masjid Al-Azhar, area Cipete..."
                  style={{ minHeight: '80px', paddingTop: '10px' }}
                  value={form.domisili_detail}
                  onChange={e => set('domisili_detail', e.target.value)}
                />
                <small style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.3rem', display: 'block' }}>
                  *Info ini tidak ditampilkan ke publik
                </small>
              </div>
            </div>
          )}

          {/* ════ STEP 4: Success ════ */}
          {step === 5 && (
            <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease', padding: '1rem 0' }}>
              <div style={{
                width: '100px', height: '100px', borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(44,95,77,0.1), rgba(212,175,55,0.15))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1.5rem',
                border: '3px solid rgba(44,95,77,0.2)',
              }}>
                <Sparkles size={48} color="var(--secondary)" />
              </div>
              <h2 style={{ marginBottom: '0.5rem', color: 'var(--text-main)' }}>
                Alhamdulillah! 🎉
              </h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', lineHeight: '1.7' }}>
                Profil Anda berhasil dilengkapi.
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem', lineHeight: '1.6' }}>
                Sekarang Anda bisa mengeksplorasi platform, membuat CV Taaruf, dan memulai ikhtiar menjemput jodoh dengan cara yang syar'i dan penuh berkah.
              </p>
              <button
                className="btn btn-primary"
                style={{ width: '100%', padding: '1.1rem', fontSize: '1.05rem', borderRadius: '14px' }}
                onClick={onComplete}
              >
                <Home size={18} style={{ marginRight: '0.5rem' }} />
                Masuk ke Dashboard →
              </button>
            </div>
          )}

          {/* ── Navigation Buttons ── */}
          {step < 4 && (
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem' }}>
              {step > 1 && (
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={prev}
                  style={{ flex: 1 }}
                >
                  <ChevronLeft size={18} style={{ marginRight: '0.25rem' }} />
                  Kembali
                </button>
              )}

              {step < 3 ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={next}
                  style={{ flex: step > 1 ? 2 : 1, padding: '0.9rem' }}
                >
                  Selanjutnya
                  <ChevronRight size={18} style={{ marginLeft: '0.25rem' }} />
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  style={{ flex: 2, padding: '0.9rem', borderRadius: '12px' }}
                >
                  {isLoading ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
                      Menyimpan...
                    </span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <CheckCircle size={18} />
                      Simpan & Lanjutkan
                    </span>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
