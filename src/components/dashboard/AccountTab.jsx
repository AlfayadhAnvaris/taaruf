import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, Users, Phone, Shield, MapPin, Edit3, Save, X as XIcon, 
  BadgeCheck, Clock, AlertTriangle, Briefcase, GraduationCap, 
  ShieldCheck, Sparkles, Heart, ArrowRight, Settings, Lock, ArrowLeft, LogOut, Trash2
} from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import ChangePasswordCard from './ChangePasswordCard';

const C = {
  primary: '#134E39',
  gold: '#D4AF37',
  surface: '#F8FAFC',
  border: '#E2E8F0',
  text: '#1e293b',
  muted: '#64748b',
};

const Field = ({ label, value, icon }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1rem 0', borderBottom: '1px solid #F1F5F9' }}>
    <div style={{ width: 36, height: 36, borderRadius: '8px', background: 'rgba(19,78,57,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#134E39', flexShrink: 0 }}>
      {icon}
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: '0.7rem', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>{label}</div>
      <div style={{ fontSize: '0.92rem', fontWeight: 600, color: value ? '#1C2B22' : '#CBD5E1', fontStyle: value ? 'normal' : 'italic' }}>
        {value || 'Belum diisi'}
      </div>
    </div>
  </div>
);

const InputField = ({ label, fieldKey, type = 'text', placeholder, value, onChange }) => (
  <div style={{ marginBottom: '1.25rem' }}>
    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: '#134E39', marginBottom: '8px' }}>{label}</label>
    <input 
      type={type} 
      placeholder={placeholder} 
      value={value || ''} 
      onChange={e => onChange(fieldKey, e.target.value)} 
      style={{ width: '100%', padding: '0.85rem 1.15rem', borderRadius: '10px', border: '1px solid #E4EDE8', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s', color: '#1C2B22', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
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
        background: 'white', border: '1px solid #E4EDE8', borderRadius: '14px', padding: '1.5rem',
        cursor: value ? 'pointer' : 'default', transition: 'all 0.2s ease',
        display: 'flex', flexDirection: 'column', height: '170px', position: 'relative'
      }}
      onMouseEnter={e => { if(value) { e.currentTarget.style.borderColor = '#134E39'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(19,78,57,0.02)'; } }}
      onMouseLeave={e => { if(value) { e.currentTarget.style.borderColor = '#E4EDE8'; e.currentTarget.style.boxShadow = 'none'; } }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.85rem' }}>
        <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(19,78,57,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#134E39' }}>{icon}</div>
        <span style={{ fontSize: '0.72rem', fontWeight: '900', color: '#134E39', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      </div>
      <p style={{ fontSize: '0.85rem', color: value ? '#475569' : '#94A3B8', fontStyle: value ? 'normal' : 'italic', margin: 0, lineHeight: 1.65, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{preview}</p>
      {value && <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end' }}><ArrowRight size={14} color="#D4AF37" /></div>}
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
    <div className="account-tab-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', background: '#F8FAF9', animation: 'fadeIn 0.5s ease', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      
      {/* ⚪️ STYLISH OUTER WRAPPER (Full Screen Layout) ⚪️ */}
      <div style={{ width: '100%', padding: '2rem 2.5rem', display: 'flex', flexDirection: 'column', gap: '1.75rem', flex: 1 }}>
        
        {/* Header Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'white', border: '1px solid #E2E8F0', color: '#10B981', fontSize: '0.68rem', fontWeight: '900', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '6px 14px', borderRadius: '99px', marginBottom: '0.5rem' }}>
              <Settings size={12} /> Pengaturan Akun
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '950', color: '#134E39', margin: 0 }}>Biodata & Keamanan</h1>
          </div>
          
          {!isEditing && (
            <button 
              onClick={() => setIsEditing(true)}
              style={{ background: '#134E39', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', boxShadow: '0 4px 12px rgba(19, 78, 57, 0.12)' }}
            >
              <Edit3 size={16} /> Edit Profil
            </button>
          )}
        </div>

        {/* Warning Alert if Profile Incomplete */}
        {!isProfileComplete && (
          <div style={{ background: '#FFF7ED', border: '1px solid #FFEDD5', borderRadius: '14px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertTriangle size={20} color="#F97316" style={{ flexShrink: 0 }} />
            <p style={{ margin: 0, color: '#C2410C', fontSize: '0.85rem', fontWeight: '600', lineHeight: 1.5 }}>
              Biodata Belum Lengkap! Silakan lengkapi seluruh data termasuk pemahaman agama untuk dapat mengakses fitur Cari Pasangan dan My CV.
            </p>
          </div>
        )}

        {/* Split 2-Column Panel */}
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'stretch' }}>
          
          {/* 🏆 LEFT COLUMN: PROFILE CARD 🏆 */}
          <div style={{ width: '310px', flexShrink: 0, background: 'white', border: '1px solid #f1f5f9', borderRadius: '20px', padding: '2rem 1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', alignSelf: 'start' }}>
            <div style={{ 
              width: '90px', height: '90px', borderRadius: '50%', 
              background: 'linear-gradient(135deg, #134E39 0%, #1a5d46 100%)', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              fontSize: '2.5rem', fontWeight: '950', marginBottom: '1.25rem',
              boxShadow: '0 8px 20px rgba(19, 78, 57, 0.15)'
            }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            
            <h2 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#134E39', margin: '0 0 0.5rem', textTransform: 'capitalize' }}>{user.name}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', marginBottom: '1.5rem', alignItems: 'center' }}>
              <span style={{ 
                background: isAkhwat ? 'rgba(236,72,153,0.1)' : 'rgba(14,165,233,0.1)', 
                color: isAkhwat ? '#ec4899' : '#0ea5e9', 
                padding: '3px 12px', borderRadius: '99px', fontSize: '0.72rem', fontWeight: '800',
                textTransform: 'uppercase', letterSpacing: '0.05em'
              }}>
                {user.gender || 'Belum Diatur'}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '600' }}>{user.email}</span>
            </div>

            {/* Profile Complete Status */}
            <div style={{ width: '100%', background: '#F8FAF9', padding: '1rem', borderRadius: '12px', border: '1px solid #E4EDE8', marginBottom: '2rem', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#64748B' }}>STATUS BIODATA</span>
                <span style={{ fontSize: '0.72rem', fontWeight: '900', color: isProfileComplete ? '#10B981' : '#F97316' }}>
                  {isProfileComplete ? 'LENGKAP' : 'BELUM LENGKAP'}
                </span>
              </div>
              <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{ width: isProfileComplete ? '100%' : '50%', height: '100%', background: isProfileComplete ? '#10B981' : '#F97316', transition: 'width 0.3s' }} />
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', borderTop: '1px solid #F1F5F9', paddingTop: '1.5rem' }}>
              <ChangePasswordCard />
              <button 
                onClick={handleLogout}
                style={{ background: 'transparent', color: '#EF4444', border: '1px solid #FCA5A5', padding: '0.75rem', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                <LogOut size={14} /> KELUAR AKUN
              </button>
              <button 
                onClick={() => showAlert('Keamanan', 'Silakan hubungi Admin untuk proses penghapusan akun secara aman.', 'error')}
                style={{ background: 'transparent', color: '#64748B', border: 'none', padding: '0.5rem', cursor: 'pointer', fontSize: '0.72rem', fontWeight: '700', textDecoration: 'underline' }}
              >
                Hapus Akun Anda
              </button>
            </div>
          </div>

          {/* 📝 RIGHT COLUMN: CONTENT DETAILS / EDITING FORM 📝 */}
          <div style={{ flex: 1, minWidth: '320px' }}>
            {!isEditing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                {/* 1. Informasi Dasar & Domisili */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                  <div style={{ background: 'white', padding: '1.25rem 1.5rem', borderRadius: '18px', border: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
                      <div style={{ width: 3, height: 14, background: '#D4AF37', borderRadius: '2px' }}></div>
                      <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: '900', color: '#134E39', letterSpacing: '0.05em' }}>INFORMASI DASAR</h3>
                    </div>
                    <Field label="Nama Lengkap" value={user.name} icon={<User size={16} />} />
                    <Field label="Pendidikan" value={user.pendidikan_terakhir} icon={<GraduationCap size={16} />} />
                    <Field label="Pekerjaan" value={user.pekerjaan} icon={<Briefcase size={16} />} />
                    <Field label="Nomor WhatsApp" value={user.phone_wa} icon={<Phone size={16} />} />
                  </div>

                  <div style={{ background: 'white', padding: '1.25rem 1.5rem', borderRadius: '18px', border: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
                      <div style={{ width: 3, height: 14, background: '#D4AF37', borderRadius: '2px' }}></div>
                      <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: '900', color: '#134E39', letterSpacing: '0.05em' }}>DOMISILI & WALI</h3>
                    </div>
                    <Field label="Provinsi" value={user.domisili_provinsi} icon={<MapPin size={16} />} />
                    <Field label="Kota / Kabupaten" value={user.domisili_kota} icon={<MapPin size={16} />} />
                    {isAkhwat && (
                      <>
                        <Field label="Nama Wali" value={user.wali_name} icon={<Users size={16} />} />
                        <Field label="WhatsApp Wali" value={user.wali_phone} icon={<Phone size={16} />} />
                      </>
                    )}
                  </div>
                </div>

                {/* 2. Pemahaman Agama & Aqidah */}
                <div id="religious-section" style={{ background: 'white', padding: '1.5rem 1.75rem', borderRadius: '18px', border: '1px solid #E4EDE8' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.75rem' }}>
                    <div style={{ width: 3, height: 14, background: '#D4AF37', borderRadius: '2px' }}></div>
                    <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: '900', color: '#134E39', letterSpacing: '0.05em' }}>PEMAHAMAN AGAMA & AQIDAH</h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {(() => {
                      const items = [
                        { label: "3 Landasan Utama", value: user.aqidah1, icon: <ShieldCheck size={16} /> },
                        { label: "Makna Syahadat", value: user.aqidah2, icon: <ShieldCheck size={16} /> },
                        { label: "Tujuan Penciptaan", value: user.aqidah3, icon: <ShieldCheck size={16} /> },
                        { label: "Rukun Iman", value: user.aqidah4, icon: <ShieldCheck size={16} /> },
                        { label: "Visi Pernikahan", value: user.marriage_vision, icon: <Sparkles size={16} /> },
                        { label: isAkhwat ? 'Hak & Ketaatan Istri' : 'Tanggung Jawab Suami', value: user.role_view, icon: <Heart size={16} /> },
                        ...(isAkhwat ? [{ label: "Pandangan Poligami", value: user.polygamy_view, icon: <Users size={16} /> }] : [])
                      ];

                      const leftCol = items.filter((_, i) => i % 2 === 0);
                      const rightCol = items.filter((_, i) => i % 2 !== 0);

                      return (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {leftCol.map((item, idx) => (
                              <div key={idx} style={{ paddingBottom: '0.85rem', borderBottom: idx === leftCol.length - 1 ? 'none' : '1px solid #F1F5F9' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                  <span style={{ color: '#134E39', display: 'flex', alignItems: 'center' }}>{item.icon}</span>
                                  <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{item.label}</span>
                                </div>
                                <p style={{ margin: 0, fontSize: '0.88rem', color: '#475569', lineHeight: '1.6', paddingLeft: '24px', whiteSpace: 'pre-wrap' }}>
                                  {item.value || 'Belum diisi'}
                                </p>
                              </div>
                            ))}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {rightCol.map((item, idx) => (
                              <div key={idx} style={{ paddingBottom: '0.85rem', borderBottom: idx === rightCol.length - 1 ? 'none' : '1px solid #F1F5F9' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                  <span style={{ color: '#134E39', display: 'flex', alignItems: 'center' }}>{item.icon}</span>
                                  <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{item.label}</span>
                                </div>
                                <p style={{ margin: 0, fontSize: '0.88rem', color: '#475569', lineHeight: '1.6', paddingLeft: '24px', whiteSpace: 'pre-wrap' }}>
                                  {item.value || 'Belum diisi'}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            ) : (
              /* 📝 EDIT FORM (Sleek card design with grouped grids) 📝 */
              <div style={{ background: 'white', padding: '1.75rem 2rem', borderRadius: '20px', border: '1px solid #E4EDE8', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '1rem' }}>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '950', color: '#134E39' }}>Edit Profil</h2>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => {
                        setForm({
                          name: user.name || '', phone_wa: user.phone_wa || '', wali_name: user.wali_name || '', wali_phone: user.wali_phone || user.waliPhone || '',
                          domisili_provinsi: user.domisili_provinsi || '', domisili_kota: user.domisili_kota || '', domisili_detail: user.domisili_detail || '',
                          gender: user.gender || '', pekerjaan: user.pekerjaan || '', pendidikan_terakhir: user.pendidikan_terakhir || '',
                          aqidah1: user.aqidah1 || '', aqidah2: user.aqidah2 || '', aqidah3: user.aqidah3 || '', aqidah4: user.aqidah4 || '',
                          marriage_vision: user.marriage_vision || '', polygamy_view: user.polygamy_view || '', role_view: user.role_view || ''
                        });
                        setIsEditing(false);
                      }} 
                      style={{ background: '#F1F5F9', color: '#64748B', border: 'none', padding: '0.5rem 1.25rem', borderRadius: '8px', fontWeight: '800', cursor: 'pointer', fontSize: '0.8rem' }}
                    >
                      Batal
                    </button>
                    <button 
                      onClick={handleSave} 
                      disabled={isSaving} 
                      style={{ background: '#134E39', color: 'white', border: 'none', padding: '0.5rem 1.25rem', borderRadius: '8px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
                    >
                      <Save size={14} /> {isSaving ? 'Menyimpan...' : 'Simpan'}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  {/* Card 1: Data Diri */}
                  <div>
                    <h4 style={{ fontSize: '0.78rem', fontWeight: '900', color: '#D4AF37', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.05em' }}>1. Data Pribadi & Kontak</h4>
                    <InputField label="Nama Lengkap *" fieldKey="name" placeholder="Nama sesuai KTP" value={form.name} onChange={set} />
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: '#134E39', marginBottom: '8px' }}>Pendidikan Terakhir *</label>
                        <select value={form.pendidikan_terakhir || ''} onChange={e => set('pendidikan_terakhir', e.target.value)} style={{ width: '100%', padding: '0.85rem 1.15rem', borderRadius: '10px', border: '1px solid #E4EDE8', fontSize: '0.95rem', outline: 'none', color: '#1C2B22', background: 'white' }}>
                          <option value="">-- Pilih Pendidikan --</option>
                          {['SD', 'SMP', 'SMA/SMK', 'Diploma', 'Sarjana (S1)', 'Magister (S2)', 'Doktor (S3)', 'Pondok Pesantren'].map(edu => <option key={edu} value={edu}>{edu}</option>)}
                        </select>
                      </div>
                      <InputField label="Pekerjaan *" fieldKey="pekerjaan" placeholder="Contoh: Pengusaha..." value={form.pekerjaan} onChange={set} />
                    </div>

                    <InputField label="No. WhatsApp (Aktif) *" fieldKey="phone_wa" placeholder="0812..." value={form.phone_wa} onChange={set} />
                  </div>

                  {/* Card 2: Domisili & Wali */}
                  <div>
                    <h4 style={{ fontSize: '0.78rem', fontWeight: '900', color: '#D4AF37', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.05em' }}>2. Tempat Tinggal & Wali</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: '#134E39', marginBottom: '8px' }}>Provinsi *</label>
                        <select value={form.domisili_provinsi || ''} onChange={e => { set('domisili_provinsi', e.target.value); set('domisili_kota', ''); }} style={{ width: '100%', padding: '0.85rem 1.15rem', borderRadius: '10px', border: '1px solid #E4EDE8', fontSize: '0.95rem', outline: 'none', background: 'white' }}>
                          <option value="">-- Pilih Provinsi --</option>
                          {provinces.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                        </select>
                      </div>
                      <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: '#134E39', marginBottom: '8px' }}>Kota / Kabupaten *</label>
                        <select value={form.domisili_kota || ''} onChange={e => set('domisili_kota', e.target.value)} disabled={!form.domisili_provinsi || isFetchingCities} style={{ width: '100%', padding: '0.85rem 1.15rem', borderRadius: '10px', border: '1px solid #E4EDE8', fontSize: '0.95rem', outline: 'none', background: 'white' }}>
                          <option value="">{isFetchingCities ? 'Memuat...' : '-- Pilih Kota --'}</option>
                          {cities.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                      </div>
                    </div>

                    {isAkhwat && (
                      <div style={{ marginTop: '0.5rem', background: '#FFF7ED', padding: '1.25rem', borderRadius: '14px', border: '1px solid #FFEDD5', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <h5 style={{ fontSize: '0.78rem', fontWeight: 900, color: '#C2410C', textTransform: 'uppercase', margin: '0 0 0.5rem' }}>Kontak Wali & Pandangan Poligami</h5>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                          <InputField label="Nama Wali *" fieldKey="wali_name" placeholder="Nama wali syar'i" value={form.wali_name} onChange={set} />
                          <InputField label="WhatsApp Wali *" fieldKey="wali_phone" placeholder="08..." value={form.wali_phone} onChange={set} />
                        </div>
                        <div style={{ marginBottom: '0.5rem' }}>
                          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: '#134E39', marginBottom: '8px' }}>Pandangan Terhadap Poligami *</label>
                          <textarea value={form.polygamy_view || ''} onChange={e => set('polygamy_view', e.target.value)} style={{ width: '100%', minHeight: '80px', padding: '0.85rem', borderRadius: '10px', border: '1px solid #E4EDE8', outline: 'none', fontSize: '0.95rem', fontFamily: 'inherit', resize: 'none' }} placeholder="Tuliskan pendapat atau kriteria poligami bagi Anda..." />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card 3: Pemahaman Agama */}
                  <div>
                    <h4 style={{ fontSize: '0.78rem', fontWeight: '900', color: '#D4AF37', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.05em' }}>3. Pemahaman Agama & Aqidah</h4>
                    {[
                      { key: 'aqidah1', label: '1. Sebutkan 3 Landasan Utama? *' },
                      { key: 'aqidah2', label: '2. Apa Makna Kalimat Syahadat? *' },
                      { key: 'aqidah3', label: '3. Apa Tujuan Manusia Diciptakan? *' },
                      { key: 'aqidah4', label: '4. Sebutkan Rukun Iman? *' },
                      { key: 'marriage_vision', label: '5. Apa Visi Pernikahan Anda? *' },
                      { key: 'role_view', label: isAkhwat ? '6. Jelaskan Pandangan Hak & Ketaatan Istri? *' : '6. Jelaskan Pandangan Tanggung Jawab Suami? *' }
                    ].map(f => (
                      <div key={f.key} style={{ marginBottom: '1.25rem' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: '#134E39', marginBottom: '8px' }}>{f.label}</label>
                        <textarea value={form[f.key] || ''} onChange={e => set(f.key, e.target.value)} style={{ width: '100%', minHeight: '100px', padding: '0.85rem 1.15rem', borderRadius: '12px', border: '1px solid #E4EDE8', fontSize: '0.95rem', outline: 'none', lineHeight: 1.6, resize: 'none', fontFamily: 'inherit' }} placeholder="Tulis jawaban pemahaman Anda secara syar'i..." />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

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
               background: '#ffffff', width: '100%', maxWidth: '580px', 
               borderRadius: '24px', padding: '2.25rem', position: 'relative', 
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
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '1.5rem' }}>
                 <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'rgba(19,78,57,0.06)', color: '#134E39', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(19,78,57,0.1)' }}>
                   {activeDetail.icon}
                 </div>
                 <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '900', color: '#134E39', letterSpacing: '-0.02em' }}>
                   {activeDetail.title}
                 </h3>
              </div>
              
              <div style={{ 
                background: '#F8FAF9', padding: '1.5rem', borderRadius: '16px', 
                border: '1px solid #E4EDE8', borderLeft: '4px solid #134E39',
                fontSize: '0.95rem', lineHeight: '1.8', color: '#334155', 
                whiteSpace: 'pre-wrap', maxHeight: '55vh', overflowY: 'auto'
              }}>
                {activeDetail.value}
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
