import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Users, Phone, Shield, MapPin, Edit3, Save, X as XIcon, BadgeCheck, Clock, AlertTriangle, Briefcase, GraduationCap, ShieldCheck, Sparkles, Heart, ArrowRight, Settings, Lock, ArrowLeft } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import ChangePasswordCard from './ChangePasswordCard';

const Field = ({ label, value, icon }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1rem 0', borderBottom: '1px solid #F1F5F9' }}>
    <div style={{ width: 40, height: 40, borderRadius: '8px', background: 'rgba(19,78,57,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#134E39', flexShrink: 0 }}>
      {icon}
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: '0.72rem', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '1rem', fontWeight: 600, color: value ? '#1C2B22' : '#CBD5E1', fontStyle: value ? 'normal' : 'italic' }}>
        {value || 'Belum diisi'}
      </div>
    </div>
  </div>
);

const InputField = ({ label, fieldKey, type = 'text', placeholder, value, onChange }) => (
  <div style={{ marginBottom: '1.25rem' }}>
    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: '#134E39', marginBottom: '8px' }}>{label}</label>
    <input 
      type={type} 
      placeholder={placeholder} 
      value={value || ''} 
      onChange={e => onChange(fieldKey, e.target.value)} 
      style={{ width: '100%', padding: '1rem 1.25rem', borderRadius: '10px', border: '1px solid #E4EDE8', fontSize: '1rem', outline: 'none', transition: 'border-color 0.2s', color: '#1C2B22' }}
      onFocus={e => e.target.style.borderColor = '#134E39'}
      onBlur={e => e.target.style.borderColor = '#E4EDE8'}
    />
  </div>
);

const ReligiousCard = ({ label, value, icon, onDetailClick }) => {
  const isLong = value && value.length > 80;
  const preview = value ? (isLong ? value.substring(0, 77) + '...' : value) : 'Belum diisi';

  return (
    <div 
      onClick={() => value && onDetailClick && onDetailClick({ title: label, value, icon })}
      style={{ 
        background: 'white', border: '1px solid #E4EDE8', borderRadius: '14px', padding: '1.75rem',
        cursor: value ? 'pointer' : 'default', transition: 'all 0.2s ease',
        display: 'flex', flexDirection: 'column', height: '180px', position: 'relative'
      }}
      onMouseEnter={e => { if(value) { e.currentTarget.style.borderColor = '#134E39'; } }}
      onMouseLeave={e => { if(value) { e.currentTarget.style.borderColor = '#E4EDE8'; } }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
        <div style={{ width: 36, height: 36, borderRadius: '8px', background: 'rgba(19,78,57,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#134E39' }}>{icon}</div>
        <span style={{ fontSize: '0.75rem', fontWeight: '900', color: '#134E39', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      </div>
      <p style={{ fontSize: '0.9rem', color: value ? '#475569' : '#94A3B8', fontStyle: value ? 'normal' : 'italic', margin: 0, lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{preview}</p>
      <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end' }}><ArrowRight size={14} color="#D4AF37" /></div>
    </div>
  );
};

export default function AccountTab() {
  const router = useRouter();
  const { user, setUser, showAlert, handleLogout } = useAppContext();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeDetail, setActiveDetail] = useState(null); 
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
    aqidah1: user.aqidah1 || '',
    aqidah2: user.aqidah2 || '',
    aqidah3: user.aqidah3 || '',
    aqidah4: user.aqidah4 || '',
    marriage_vision: user.marriage_vision || '',
    polygamy_view: user.polygamy_view || '',
    role_view: user.role_view || '',
  });

  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [isFetchingCities, setIsFetchingCities] = useState(false);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('edit') === 'true') {
      setIsEditing(true);
      if (window.location.hash === '#religious') {
        setTimeout(() => {
          const el = document.getElementById('religious-section');
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 500);
      }
    }
  }, []);

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
    (form.name?.trim() || '') !== '' && 
    (form.phone_wa?.trim() || '') !== '' && 
    (form.domisili_provinsi?.trim() || '') !== '' && 
    (form.domisili_kota?.trim() || '') !== '' &&
    (form.aqidah1?.trim() || '') !== '' &&
    (form.aqidah2?.trim() || '') !== '' &&
    (form.aqidah3?.trim() || '') !== '' &&
    (form.aqidah4?.trim() || '') !== '' &&
    (form.marriage_vision?.trim() || '') !== '' &&
    (form.role_view?.trim() || '') !== '' &&
    (!isAkhwat || ((form.wali_name?.trim() || '') !== '' && (form.wali_phone?.trim() || '') !== '' && (form.polygamy_view?.trim() || '') !== ''));

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) { showAlert('Wajib Diisi', 'Nama tidak boleh kosong.', 'error'); return; }
    if (!form.phone_wa.trim()) { showAlert('Wajib Diisi', 'Nomor WhatsApp wajib diisi.', 'error'); return; }
    if (!form.domisili_provinsi.trim() || !form.domisili_kota.trim()) { showAlert('Wajib Diisi', 'Domisili wajib dilengkapi.', 'error'); return; }
    
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
      profile_complete: isProfileComplete,
      aqidah1: form.aqidah1 || null,
      aqidah2: form.aqidah2 || null,
      aqidah3: form.aqidah3 || null,
      aqidah4: form.aqidah4 || null,
      marriage_vision: form.marriage_vision || null,
      polygamy_view: form.polygamy_view || null,
      role_view: form.role_view || null
    }).eq('id', user.id);
    setIsSaving(false);
    if (error) { showAlert('Gagal Menyimpan', error.message, 'error'); return; }
    
    setUser({
      ...user,
      name: form.name.trim(),
      profile_complete: isProfileComplete,
      phone_wa: form.phone_wa.trim(),
      wali_phone: form.wali_phone.trim(),
      wali_name: form.wali_name.trim(),
      domisili_kota: form.domisili_kota.trim(),
      domisili_provinsi: form.domisili_provinsi.trim(),
      domisili_detail: form.domisili_detail.trim(),
      pekerjaan: form.pekerjaan.trim(),
      pendidikan_terakhir: form.pendidikan_terakhir.trim(),
      gender: form.gender,
      aqidah1: form.aqidah1,
      aqidah2: form.aqidah2,
      aqidah3: form.aqidah3,
      aqidah4: form.aqidah4,
      marriage_vision: form.marriage_vision,
      polygamy_view: form.polygamy_view,
      role_view: form.role_view
    });

    showAlert('Berhasil', 'Profil berhasil diperbarui', 'success');
    setIsEditing(false);
  };



  return (
    <div className="account-tab-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'transparent', animation: 'fadeIn 0.5s ease' }}>
      
      {/* ⚪️ HERO HEADER (GRAY) ⚪️ */}
      <div style={{ 
        background: 'transparent', 
        padding: '1.5rem 0 2.5rem', color: '#1e293b', position: 'relative', overflow: 'hidden' 
      }}>
        <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(212,175,55,0.1) 0%, transparent 70%)', borderRadius: '50%' }}></div>
        
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '100%', margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'white', border: '1px solid #E2E8F0', color: '#10B981', fontSize: '0.75rem', fontWeight: '900', letterSpacing: '0.15em', textTransform: 'uppercase', padding: '8px 18px', borderRadius: '99px', marginBottom: '1.5rem' }}>
            <Settings size={14} /> MANAJEMEN AKUN & KEAMANAN
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
               <div style={{ 
                  width: '120px', height: '120px', borderRadius: '16px', 
                  background: 'white', color: '#134E39', border: '1px solid #E4EDE8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  fontSize: '3.5rem', fontWeight: '900' 
               }}>
                 {user.name.charAt(0).toUpperCase()}
               </div>
               <div>
                  <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: '900', margin: 0, color: '#134E39' }}>{user.name}</h1>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                    <span style={{ 
                      background: isAkhwat ? 'rgba(236,72,153,0.15)' : 'rgba(14,165,233,0.15)', 
                      color: isAkhwat ? '#ec4899' : '#0ea5e9', 
                      padding: '4px 14px', borderRadius: '99px', fontSize: '0.8rem', fontWeight: '800'
                    }}>
                      {user.gender?.toUpperCase() || 'BELUM DIISI'}
                    </span>
                    <span style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 14px', borderRadius: '99px', fontSize: '0.8rem', fontWeight: '600', color: 'white' }}>{user.email}</span>
                  </div>
               </div>
            </div>
            {!isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                style={{ background: '#D4AF37', color: '#134E39', border: 'none', padding: '1rem 2rem', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Edit3 size={18} /> EDIT PROFIL
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ⚪️ CONTENT AREA ⚪️ */}
      <div style={{ padding: '1.5rem 0', flex: 1 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          {!isProfileComplete && (
            <div style={{ background: '#FFF7ED', border: '1px solid #FFEDD5', borderRadius: '16px', padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: 60, height: 60, background: '#F97316', color: 'white', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <AlertTriangle size={32} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '900', color: '#9A3412' }}>Biodata Belum Lengkap!</h4>
                <p style={{ margin: '4px 0 0', color: '#C2410C', opacity: 0.8, fontSize: '0.95rem' }}>Silakan lengkapi seluruh data termasuk pemahaman agama untuk dapat mengakses fitur Cari Pasangan dan My CV.</p>
              </div>
            </div>
          )}

          {!isEditing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {/* Basic Section */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                <div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                    <div style={{ width: 3, height: 18, background: '#D4AF37', borderRadius: '2px' }}></div>
                    <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, color: '#134E39', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Informasi Dasar</h4>
                  </div>
                  <div style={{ background: 'white', padding: '0.5rem 1.25rem', borderRadius: '16px', border: '1px solid #E4EDE8' }}>
                    <Field label="Nama Lengkap" value={user.name} icon={<User size={18} />} />
                    <Field label="Pendidikan" value={user.pendidikan_terakhir} icon={<GraduationCap size={18} />} />
                    <Field label="Pekerjaan" value={user.pekerjaan} icon={<Briefcase size={18} />} />
                    <Field label="Nomor WhatsApp" value={user.phone_wa} icon={<Phone size={18} />} />
                  </div>
                </div>

                <div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                    <div style={{ width: 3, height: 18, background: '#D4AF37', borderRadius: '2px' }}></div>
                    <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, color: '#134E39', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Domisili & Wali</h4>
                  </div>
                  <div style={{ background: 'white', padding: '0.5rem 1.25rem', borderRadius: '16px', border: '1px solid #E4EDE8' }}>
                    <Field label="Provinsi" value={user.domisili_provinsi} icon={<MapPin size={18} />} />
                    <Field label="Kota / Kabupaten" value={user.domisili_kota} icon={<MapPin size={18} />} />
                    {isAkhwat && (
                      <>
                        <Field label="Nama Wali" value={user.wali_name} icon={<Users size={18} />} />
                        <Field label="WhatsApp Wali" value={user.wali_phone} icon={<Phone size={18} />} />
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Religious Section */}
              <div id="religious-section">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' }}>
                  <div style={{ width: 3, height: 18, background: '#D4AF37', borderRadius: '2px' }}></div>
                  <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, color: '#134E39', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Pemahaman Agama & Aqidah</h4>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                  <ReligiousCard label="3 Landasan Utama" value={user.aqidah1} icon={<ShieldCheck size={18} />} onDetailClick={setActiveDetail} />
                  <ReligiousCard label="Makna Syahadat" value={user.aqidah2} icon={<ShieldCheck size={18} />} onDetailClick={setActiveDetail} />
                  <ReligiousCard label="Tujuan Penciptaan" value={user.aqidah3} icon={<ShieldCheck size={18} />} onDetailClick={setActiveDetail} />
                  <ReligiousCard label="Rukun Iman" value={user.aqidah4} icon={<ShieldCheck size={18} />} onDetailClick={setActiveDetail} />
                  <ReligiousCard label="Visi Pernikahan" value={user.marriage_vision} icon={<Sparkles size={18} />} onDetailClick={setActiveDetail} />
                  <ReligiousCard label={isAkhwat ? 'Hak & Ketaatan Istri' : 'Tanggung Jawab Suami'} value={user.role_view} icon={<Heart size={18} />} onDetailClick={setActiveDetail} />
                  {isAkhwat && <ReligiousCard label="Pandangan Poligami" value={user.polygamy_view} icon={<Users size={18} />} onDetailClick={setActiveDetail} />}
                </div>
              </div>

              {/* Security */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center', marginTop: '1.5rem' }}>
                <ChangePasswordCard showAlert={showAlert} />
                <button 
                  onClick={() => showAlert('Keamanan', 'Silakan hubungi Admin untuk proses penghapusan akun secara aman.', 'error')}
                  style={{ background: 'transparent', color: '#EF4444', border: '2px solid #EF4444', padding: '1rem', width: '220px', borderRadius: '10px', fontWeight: '900', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.9rem', textAlign: 'center' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  HAPUS AKUN
                </button>
                <button 
                  onClick={handleLogout}
                  style={{ background: '#EF4444', color: 'white', border: 'none', padding: '1rem', width: '220px', borderRadius: '10px', fontWeight: '900', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.9rem', textAlign: 'center' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#DC2626'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#EF4444'; }}
                >
                  KELUAR AKUN
                </button>
              </div>
            </div>
          ) : (
            /* 📝 EDIT FORM 📝 */
            <div style={{ background: 'white', padding: '2rem', borderRadius: '20px', border: '1px solid #E4EDE8' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '1rem' }}>
                 <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '900', color: '#134E39' }}>Edit Profil Anda</h2>
                 <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={() => {
                      setForm({
                        name: user.name || '', phone_wa: user.phone_wa || '', wali_name: user.wali_name || '', wali_phone: user.wali_phone || user.waliPhone || '',
                        domisili_provinsi: user.domisili_provinsi || '', domisili_kota: user.domisili_kota || '', domisili_detail: user.domisili_detail || '',
                        gender: user.gender || '', pekerjaan: user.pekerjaan || '', pendidikan_terakhir: user.pendidikan_terakhir || '',
                        aqidah1: user.aqidah1 || '', aqidah2: user.aqidah2 || '', aqidah3: user.aqidah3 || '', aqidah4: user.aqidah4 || '',
                        marriage_vision: user.marriage_vision || '', polygamy_view: user.polygamy_view || '', role_view: user.role_view || ''
                      });
                      setIsEditing(false);
                    }} style={{ background: '#F1F5F9', color: '#64748B', border: 'none', padding: '0.8rem 2rem', borderRadius: '10px', fontWeight: '800', cursor: 'pointer' }}>BATAL</button>
                    <button onClick={handleSave} disabled={isSaving} style={{ background: '#134E39', color: 'white', border: 'none', padding: '0.8rem 2rem', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Save size={18} /> {isSaving ? 'MENYIMPAN...' : 'SIMPAN PERUBAHAN'}
                    </button>
                 </div>
               </div>

               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
                 <div>
                   <h5 style={{ fontSize: '0.8rem', fontWeight: 900, color: '#D4AF37', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.1em' }}>Data Pribadi</h5>
                   <InputField label="Nama Lengkap" fieldKey="name" placeholder="Nama sesuai KTP" value={form.name} onChange={set} />
                   <div style={{ marginBottom: '1.25rem' }}>
                     <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: '#134E39', marginBottom: '8px' }}>Pendidikan Terakhir</label>
                     <select value={form.pendidikan_terakhir || ''} onChange={e => set('pendidikan_terakhir', e.target.value)} style={{ width: '100%', padding: '1rem 1.25rem', borderRadius: '10px', border: '1px solid #E4EDE8', fontSize: '1rem', outline: 'none', color: '#1C2B22' }}>
                       <option value="">-- Pilih Pendidikan --</option>
                       {['SD', 'SMP', 'SMA/SMK', 'Diploma', 'Sarjana (S1)', 'Magister (S2)', 'Doktor (S3)', 'Pondok Pesantren'].map(edu => <option key={edu} value={edu}>{edu}</option>)}
                     </select>
                   </div>
                   <InputField label="Pekerjaan" fieldKey="pekerjaan" placeholder="Contoh: Pengusaha..." value={form.pekerjaan} onChange={set} />
                   <InputField label="No. WhatsApp" fieldKey="phone_wa" placeholder="0812..." value={form.phone_wa} onChange={set} />
                   
                   <h5 style={{ fontSize: '0.8rem', fontWeight: 900, color: '#D4AF37', textTransform: 'uppercase', marginBottom: '1rem', marginTop: '1.5rem', letterSpacing: '0.1em' }}>Domisili</h5>
                   <div style={{ marginBottom: '1.25rem' }}>
                     <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: '#134E39', marginBottom: '8px' }}>Provinsi</label>
                     <select value={form.domisili_provinsi || ''} onChange={e => { set('domisili_provinsi', e.target.value); set('domisili_kota', ''); }} style={{ width: '100%', padding: '1rem 1.25rem', borderRadius: '10px', border: '1px solid #E4EDE8', fontSize: '1rem', outline: 'none' }}>
                       <option value="">-- Pilih Provinsi --</option>
                       {provinces.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                     </select>
                   </div>
                   <div style={{ marginBottom: '1.25rem' }}>
                     <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: '#134E39', marginBottom: '8px' }}>Kota / Kabupaten</label>
                     <select value={form.domisili_kota || ''} onChange={e => set('domisili_kota', e.target.value)} disabled={!form.domisili_provinsi || isFetchingCities} style={{ width: '100%', padding: '1rem 1.25rem', borderRadius: '10px', border: '1px solid #E4EDE8', fontSize: '1rem', outline: 'none' }}>
                       <option value="">{isFetchingCities ? 'Memuat...' : '-- Pilih Kota --'}</option>
                       {cities.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                     </select>
                   </div>
                    {isAkhwat && (
                      <div style={{ marginTop: '1.5rem', background: '#FFF7ED', padding: '1.25rem', borderRadius: '12px', border: '1px solid #FFEDD5' }}>
                        <h5 style={{ fontSize: '0.8rem', fontWeight: 900, color: '#C2410C', textTransform: 'uppercase', marginBottom: '1rem' }}>Kontak Wali (Wajib)</h5>
                        <InputField label="Nama Wali" fieldKey="wali_name" value={form.wali_name} onChange={set} />
                        <InputField label="WhatsApp Wali" fieldKey="wali_phone" value={form.wali_phone} onChange={set} />
                        <div style={{ marginBottom: '1rem' }}>
                          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: '#134E39', marginBottom: '8px' }}>Pandangan Poligami</label>
                          <textarea value={form.polygamy_view || ''} onChange={e => set('polygamy_view', e.target.value)} style={{ width: '100%', minHeight: '80px', padding: '1rem', borderRadius: '10px', border: '1px solid #E4EDE8', outline: 'none' }} placeholder="Tuliskan pandangan Anda..." />
                        </div>
                      </div>
                    )}
                 </div>

                 <div>
                    <h5 id="religious-section" style={{ fontSize: '0.8rem', fontWeight: 900, color: '#D4AF37', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.1em' }}>Pemahaman Agama</h5>
                    {[
                      { key: 'aqidah1', label: '1. Sebutkan 3 Landasan Utama?' },
                      { key: 'aqidah2', label: '2. Apa Makna Kalimat Syahadat?' },
                      { key: 'aqidah3', label: '3. Tujuan Manusia Diciptakan?' },
                      { key: 'aqidah4', label: '4. Sebutkan Rukun Iman?' },
                      { key: 'marriage_vision', label: '5. Visi Pernikahan Anda?' },
                      { key: 'role_view', label: isAkhwat ? '6. Hak & Ketaatan Istri?' : '6. Tanggung Jawab Suami?' }
                    ].map(f => (
                      <div key={f.key} style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: '#134E39', marginBottom: '8px' }}>{f.label}</label>
                        <textarea value={form[f.key] || ''} onChange={e => set(f.key, e.target.value)} style={{ width: '100%', minHeight: '120px', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid #E4EDE8', fontSize: '1rem', outline: 'none', lineHeight: 1.6 }} placeholder="Jelaskan secara detail..." />
                      </div>
                    ))}
                 </div>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Detail */}
      {activeDetail && (
        <div 
          style={{ 
            position: 'fixed', inset: 0, 
            background: 'rgba(15, 23, 42, 0.3)', 
            backdropFilter: 'blur(12px)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            zIndex: 10001, padding: '1.5rem',
            animation: 'fadeIn 0.2s ease'
          }} 
          onClick={() => setActiveDetail(null)}
        >
           <div 
             style={{ 
               background: '#ffffff', width: '100%', maxWidth: '600px', 
               borderRadius: '24px', padding: '2.5rem', position: 'relative', 
               border: '1px solid #E4EDE8', 
               boxShadow: '0 20px 40px rgba(19, 78, 57, 0.03)',
               animation: 'scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' 
             }} 
             onClick={e => e.stopPropagation()}
           >
              <button 
                onClick={() => setActiveDetail(null)} 
                style={{ 
                  position: 'absolute', top: '1.5rem', right: '1.5rem', 
                  background: '#F8FAF9', border: '1px solid #E4EDE8', 
                  width: '36px', height: '36px', borderRadius: '10px', 
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#64748B', transition: 'all 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#134E39'; e.currentTarget.style.color = '#134E39'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#E4EDE8'; e.currentTarget.style.color = '#64748B'; }}
              >
                <XIcon size={18} />
              </button>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '1.75rem' }}>
                 <div style={{ width: 48, height: 48, borderRadius: '12px', background: 'rgba(19,78,57,0.06)', color: '#134E39', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(19,78,57,0.1)' }}>
                   {activeDetail.icon}
                 </div>
                 <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '900', color: '#134E39', letterSpacing: '-0.02em' }}>
                   {activeDetail.title}
                 </h3>
              </div>
              
              <div style={{ 
                background: '#F8FAF9', padding: '1.75rem', borderRadius: '16px', 
                border: '1px solid #E4EDE8', borderLeft: '4px solid #134E39',
                fontSize: '1rem', lineHeight: '1.8', color: '#334155', 
                whiteSpace: 'pre-wrap', maxHeight: '60vh', overflowY: 'auto'
              }}>
                {activeDetail.value}
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
