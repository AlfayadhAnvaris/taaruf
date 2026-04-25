import React, { useState } from 'react';
import { User, Users, Phone, Shield, MapPin, Edit3, Save, X as XIcon, BadgeCheck, Clock, AlertTriangle, Briefcase, GraduationCap } from 'lucide-react';
import { supabase } from '../../supabase';
import ChangePasswordCard from './ChangePasswordCard';

const Field = ({ label, value, icon }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.875rem 0', borderBottom: '1px solid var(--border)' }}>
    <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(44,95,77,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
      {icon}
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: '0.72rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>{label}</div>
      <div style={{ fontSize: '0.95rem', color: value ? 'var(--text-main)' : 'var(--text-muted)', fontStyle: value ? 'normal' : 'italic' }}>
        {value || 'Belum diisi'}
      </div>
    </div>
  </div>
);

const InputField = ({ label, fieldKey, type = 'text', placeholder, value, onChange }) => (
  <div className="form-group" style={{ marginBottom: '1rem' }}>
    <label className="form-label">{label}</label>
    <input type={type} className="form-control" placeholder={placeholder} value={value} onChange={e => onChange(fieldKey, e.target.value)} />
  </div>
);

export default function AccountTab({ user, showAlert }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    name: user.name || '',
    phone_wa: user.phone_wa || '',
    wali_name: user.wali_name || '',
    wali_phone: user.wali_phone || user.waliPhone || '',
    domisili_provinsi: user.domisili_provinsi || '',
    domisili_kota: user.domisili_kota || '',
    domisili_detail: user.domisili_detail || '',
    gender: user.gender || '',
    pekerjaan: user.pekerjaan || '',
    pendidikan_terakhir: user.pendidikan_terakhir || '',
  });

  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [isFetchingCities, setIsFetchingCities] = useState(false);

  React.useEffect(() => {
    fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json')
      .then(r => r.json())
      .then(data => setProvinces(data || []))
      .catch(e => console.error("Gagal ambil provinsi", e));
  }, []);

  React.useEffect(() => {
    if (form.domisili_provinsi) {
       const provId = provinces.find(p => p.name === form.domisili_provinsi)?.id;
       if (provId) {
          const fetchCities = async () => {
             setIsFetchingCities(true);
             try {
                const res = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${provId}.json`);
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
    } else {
       setCities([]);
    }
  }, [form.domisili_provinsi, provinces]);
  
  const isAkhwat = user.gender === 'akhwat';
  
  const isProfileComplete = 
    form.name.trim() !== '' && 
    form.phone_wa.trim() !== '' && 
    form.domisili_provinsi.trim() !== '' && 
    form.domisili_kota.trim() !== '' &&
    (!isAkhwat || (form.wali_name.trim() !== '' && form.wali_phone.trim() !== ''));

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) { showAlert('Wajib Diisi', 'Nama tidak boleh kosong.', 'error'); return; }
    setIsSaving(true);
    const { error } = await supabase.from('profiles').update({
      name: form.name.trim(),
      phone_wa: form.phone_wa.trim() || null,
      wali_name: isAkhwat ? (form.wali_name.trim() || null) : null,
      wali_phone: isAkhwat ? (form.wali_phone.trim() || null) : null,
      domisili_provinsi: form.domisili_provinsi.trim() || null,
      domisili_kota: form.domisili_kota.trim() || null,
      domisili_detail: form.domisili_detail.trim() || null,
      gender: form.gender || null,
      pekerjaan: form.pekerjaan.trim() || null,
      pendidikan_terakhir: form.pendidikan_terakhir.trim() || null,
      profile_complete: isProfileComplete
    }).eq('id', user.id);
    setIsSaving(false);
    if (error) { showAlert('Gagal Menyimpan', error.message, 'error'); return; }
    user.name = form.name.trim();
    user.profile_complete = isProfileComplete;
    user.phone_wa = form.phone_wa.trim();
    user.wali_phone = form.wali_phone.trim();
    user.wali_name = form.wali_name.trim();
    user.domisili_kota = form.domisili_kota.trim();
    user.domisili_provinsi = form.domisili_provinsi.trim();
    user.domisili_detail = form.domisili_detail.trim();
    user.pekerjaan = form.pekerjaan.trim();
    user.pendidikan_terakhir = form.pendidikan_terakhir.trim();
    user.gender = form.gender;
    showAlert('Berhasil', 'Profil berhasil diperbarui, silahkan tunggu verifikasi dari admin untuk mendapatkan badge', 'success');
    setIsEditing(false);
  };

  const handleCancel = () => {
    setForm({
      name: user.name || '',
      phone_wa: user.phone_wa || '',
      wali_name: user.wali_name || '',
      wali_phone: user.wali_phone || user.waliPhone || '',
      domisili_provinsi: user.domisili_provinsi || '',
      domisili_kota: user.domisili_kota || '',
      domisili_detail: user.domisili_detail || '',
      pekerjaan: user.pekerjaan || '',
      pendidikan_terakhir: user.pendidikan_terakhir || '',
    });
    setIsEditing(false);
  };



  return (
    <div style={{ maxWidth: '660px', margin: '0 auto', animation: 'fadeIn 0.4s ease' }}>
      {/* Header Card */}
      <div className="card" style={{ marginBottom: '1.25rem', padding: '1.75rem', textAlign: 'center' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), #1a4d35)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '2rem', fontWeight: 'bold', boxShadow: '0 8px 24px rgba(44,95,77,0.3)' }}>
          {(form.name || user.name).charAt(0).toUpperCase()}
        </div>
        <h3 style={{ margin: '0 0 0.4rem', fontSize: '1.3rem' }}>{form.name || user.name}</h3>
        <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
          {!user.gender ? (
            <span className="badge" style={{ background: 'rgba(148,163,184,0.1)', color: '#64748b', border: '1px solid rgba(148,163,184,0.2)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              Belum Diisi
            </span>
          ) : (
            <span className="badge" style={{ background: isAkhwat ? 'rgba(236,72,153,0.1)' : 'rgba(14,165,233,0.1)', color: isAkhwat ? '#ec4899' : '#0ea5e9', border: `1px solid ${isAkhwat ? 'rgba(236,72,153,0.2)' : 'rgba(14,165,233,0.2)'}`, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              {isAkhwat ? ' Akhwat' : ' Ikhwan'}
            </span>
          )}
          {user.is_verified && (
            <span className="badge" style={{ background: '#dbeafe', color: '#1d4ed8', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '800' }}>
              <Shield size={13} /> TERVERIFIKASI
            </span>
          )}
        </div>
      </div>

      {/* Verification Status Panel */}
      <div className="card animate-up" style={{ 
        marginBottom: '1.5rem', 
        padding: '1.5rem', 
        background: user.is_verified ? 'rgba(16, 185, 129, 0.05)' : (user.verification_status === 'pending' ? 'rgba(245, 158, 11, 0.05)' : 'white'),
        border: user.is_verified ? '1px solid rgba(16, 185, 129, 0.2)' : (user.verification_status === 'pending' ? '1px solid rgba(245, 158, 11, 0.2)' : '1px solid #f1f5f9'),
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ 
            width: '48px', height: '48px', borderRadius: '14px', 
            background: user.is_verified ? '#10b981' : (user.verification_status === 'pending' ? '#f59e0b' : '#f1f5f9'), 
            color: user.is_verified || user.verification_status === 'pending' ? 'white' : '#94a3b8', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: user.is_verified ? '0 8px 15px rgba(16, 185, 129, 0.2)' : 'none'
          }}>
             {user.is_verified ? <BadgeCheck size={28} /> : (user.verification_status === 'pending' ? <Clock size={28} /> : <Shield size={28} />)}
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: '900', color: '#1e293b' }}>
              {user.is_verified ? 'Identitas Terverifikasi' : (user.verification_status === 'pending' ? 'Menunggu Verifikasi' : 'Identitas Belum Diverifikasi')}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
              {user.is_verified ? 'Akun Anda telah diakui sebagai kandidat asli.' : (user.verification_status === 'pending' ? 'Admin sedang meninjau dokumen identitas Anda.' : 'Verifikasi KTP untuk meningkatkan kepercayaan calon pasangan.')}
            </div>
          </div>
        </div>
        
        {!user.is_verified && user.verification_status !== 'pending' && (
          <button 
            className="btn btn-primary" 
            onClick={async () => {
              if (!isProfileComplete) {
                showAlert('Profil Belum Lengkap', 'Silakan lengkapi biodata (WA & Domisili) terlebih dahulu sebelum mengajukan verifikasi.', 'error');
                return;
              }
              const { error } = await supabase.from('profiles').update({ verification_status: 'pending' }).eq('id', user.id);
              if (error) showAlert('Gagal', error.message, 'error');
              else {
                user.verification_status = 'pending';
                showAlert('Berhasil Diajukan', 'Permintaan verifikasi telah dikirim ke Admin. Harap tunggu 1x24 jam.', 'success');
                window.location.reload(); 
              }
            }}
            style={{ fontSize: '0.8rem', padding: '0.6rem 1.25rem', whiteSpace: 'nowrap' }}
          >
            Ajukan Sekarang
          </button>
        )}
        
        {user.is_verified && (
          <div style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: '900', background: 'rgba(16, 185, 129, 0.1)', padding: '6px 12px', borderRadius: '10px' }}>
            VERIFIED
          </div>
        )}
      </div>

      {/* Profile Completion Warning (Moved inside if not verified) */}
      {!isProfileComplete && !user.is_verified && (
        <div className="animate-up" style={{ 
          background: 'rgba(239, 68, 68, 0.05)', 
          border: '1px solid rgba(239, 68, 68, 0.2)', 
          borderRadius: '24px', 
          padding: '1.5rem', 
          marginBottom: '1.5rem',
          display: 'flex',
          gap: '1rem',
          alignItems: 'center'
        }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--danger)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
             <AlertTriangle size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '800', color: '#b91c1c', fontSize: '0.95rem', marginBottom: '0.2rem' }}>Profil Belum Lengkap!</div>
            <div style={{ fontSize: '0.85rem', color: '#7f1d1d', opacity: 0.8, lineHeight: 1.5 }}>
              Harap segera lengkapi biodata Anda (WhatsApp & Domisili) agar admin dapat memverifikasi akun Anda dengan cepat.
            </div>
          </div>
          {!isEditing && (
            <button className="btn btn-primary" style={{ background: 'var(--danger)', padding: '0.5rem 1rem', fontSize: '0.8rem' }} onClick={() => setIsEditing(true)}>Lengkapi</button>
          )}
        </div>
      )}

      {/* Info Card / Edit Form */}
      <div className="card" style={{ padding: '1.75rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-main)' }}>Informasi Profil</h4>
          {!isEditing ? (
            <button className="btn btn-outline" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }} onClick={() => setIsEditing(true)}>
              <Edit3 size={15} /> Edit Profil
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-outline" style={{ fontSize: '0.85rem', padding: '0.5rem 0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={handleCancel}>
                <XIcon size={15} /> Batal
              </button>
              <button className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }} onClick={handleSave} disabled={isSaving}>
                <Save size={15} /> {isSaving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          )}
        </div>

        {!isEditing ? (
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem', marginTop: '0.25rem' }}>— Data Akun</div>
            <Field label="Email" value={user.email} icon={<User size={16} />} />
            <Field 
              label="Jenis Kelamin" 
              value={!user.gender ? null : (user.gender === 'ikhwan' ? 'Ikhwan (Pria)' : 'Akhwat (Wanita)')} 
              icon={<Users size={16} />} 
            />
            <Field label="Pendidikan Terakhir" value={user.pendidikan_terakhir} icon={<GraduationCap size={16} />} />
            <Field label="Pekerjaan" value={user.pekerjaan} icon={<Briefcase size={16} />} />
            <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem', marginTop: '1.25rem' }}>— Kontak</div>
            <Field label="No. WhatsApp" value={user.phone_wa} icon={<Phone size={16} />} />
            {isAkhwat && (
              <>
                <Field label="Nama Wali" value={user.wali_name} icon={<Shield size={16} />} />
                <Field label="No. WhatsApp Wali" value={user.wali_phone || user.waliPhone} icon={<Phone size={16} />} />
              </>
            )}
            <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem', marginTop: '1.25rem' }}>— Domisili</div>
            <Field label="Provinsi" value={user.domisili_provinsi} icon={<MapPin size={16} />} />
            <Field label="Kota / Kabupaten" value={user.domisili_kota} icon={<MapPin size={16} />} />
            <Field label="Keterangan Tambahan" value={user.domisili_detail} icon={<MapPin size={16} />} />
          </div>
        ) : (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>— Data Diri</div>
            <InputField label="Nama Lengkap" fieldKey="name" placeholder="Nama Anda..." value={form.name} onChange={set} />
            
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">Pendidikan Terakhir</label>
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

            <InputField label="Pekerjaan Saat Ini" fieldKey="pekerjaan" placeholder="Contoh: Karyawan Swasta, Freelance..." value={form.pekerjaan} onChange={set} />
            
            <div className="form-group" style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <label className="form-label" style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Jenis Kelamin
              </label>
              <select 
                className="form-control" 
                value={form.gender || ''} 
                onChange={e => set('gender', e.target.value)}
                style={{ width: '100%', padding: '0.8rem', borderRadius: '10px', border: '1px solid #cbd5e1', background: 'white', fontSize: '1rem', fontWeight: '600' }}
              >
                <option value="">-- Pilih Jenis Kelamin --</option>
                <option value="ikhwan"> Ikhwan (Pria)</option>
                <option value="akhwat"> Akhwat (Wanita)</option>
              </select>
              <small style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '0.4rem', display: 'block' }}>Pilih sesuai kartu identitas Anda</small>
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Email <span style={{ color: 'var(--text-muted)', fontWeight: '400' }}>(tidak bisa diubah)</span></label>
              <input type="email" className="form-control" value={user.email} disabled style={{ opacity: 0.6 }} />
            </div>
            <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '1.25rem 0 0.75rem' }}>— Kontak</div>
            <InputField label="No. WhatsApp Aktif" fieldKey="phone_wa" type="tel" placeholder="Contoh: 0812-3456-7890" value={form.phone_wa} onChange={set} />
            {isAkhwat && (
              <div style={{ padding: '1.25rem', background: 'rgba(236,72,153,0.04)', border: '1px solid rgba(236,72,153,0.15)', borderRadius: '14px', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: '#ec4899', fontWeight: '700', fontSize: '0.875rem' }}>
                  <Shield size={15} /> Kontak Wali
                </div>
                <InputField label="Nama Wali" fieldKey="wali_name" placeholder="Contoh: Bapak Ahmad" value={form.wali_name} onChange={set} />
                <InputField label="No. WhatsApp Wali" fieldKey="wali_phone" type="tel" placeholder="Contoh: 0812-3456-7890" value={form.wali_phone} onChange={set} />
              </div>
            )}
            <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '1.25rem 0 0.75rem' }}>— Domisili</div>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Provinsi</label>
              <select className="form-control" value={form.domisili_provinsi} onChange={e => { set('domisili_provinsi', e.target.value); set('domisili_kota', ''); }}>
                <option value="">-- Pilih Provinsi --</option>
                {provinces.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Kota / Kabupaten</label>
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
            </div>
            <InputField label="Keterangan Tambahan (Opsional)" fieldKey="domisili_detail" placeholder="Contoh: Dekat Masjid Al-Azhar..." value={form.domisili_detail} onChange={set} />
          </div>
        )}
      </div>

      <ChangePasswordCard showAlert={showAlert} />

      {/* Danger Zone */}
      <div className="card" style={{ padding: '1.25rem 1.75rem', border: '1px solid rgba(239,68,68,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--danger)' }}>Hapus Akun</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Hubungi Admin untuk menghapus akun Anda.</div>
          </div>
          <button className="btn btn-outline" style={{ color: 'var(--danger)', borderColor: 'var(--danger)', fontSize: '0.85rem' }} onClick={() => showAlert('Keamanan', 'Untuk menghapus akun, silakan hubungi Admin/Ustadz secara langsung demi alasan keamanan dan kerahasiaan data.', 'error')}>
            Hapus Akun
          </button>
        </div>
      </div>
    </div>
  );
}
