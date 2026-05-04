import React, { useState } from 'react';
import { User, Phone, Shield, Save, X as XIcon, ShieldCheck, Mail, Briefcase, Lock } from 'lucide-react';
import { supabase } from '../../supabase';
import ChangePasswordCard from './ChangePasswordCard';

export default function AdminAccountTab({ user, showAlert }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    name: user.name || '',
    phone_wa: user.phone_wa || '',
    role_title: user.role_title || 'Administrator',
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) { showAlert('Wajib Diisi', 'Nama tidak boleh kosong.', 'error'); return; }
    setIsSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({
        name: form.name.trim(),
        phone_wa: form.phone_wa.trim() || null,
        role_title: form.role_title.trim() || 'Administrator',
      }).eq('id', user.id);

      if (error) throw error;
      
      // Update object local (untuk UI instan)
      user.name = form.name.trim();
      user.phone_wa = form.phone_wa.trim();
      user.role_title = form.role_title.trim();
      
      showAlert('Berhasil', 'Profil Admin berhasil diperbarui.', 'success');
      setIsEditing(false);
    } catch (err) {
      showAlert('Gagal Menyimpan', err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const Field = ({ label, value, icon, sub }) => (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1.25rem 0', borderBottom: '1px solid #f1f5f9' }}>
      <div style={{ width: 44, height: 44, borderRadius: '14px', background: 'rgba(19, 78, 57, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#134E39', flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>{label}</div>
        <div style={{ fontSize: '1rem', fontWeight: '700', color: '#1e293b' }}>
          {value || 'Belum diisi'}
        </div>
        {sub && <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>{sub}</div>}
      </div>
    </div>
  );

  return (
    <div className="admin-account-container" style={{ maxWidth: '800px', margin: '0 auto', animation: 'fadeIn 0.5s ease' }}>
      <style>{`
        .admin-account-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }
        @media (max-width: 768px) {
          .admin-account-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
          .admin-account-container {
            padding: 0 1rem;
          }
          .card {
            padding: 1.5rem !important;
            border-radius: 24px !important;
          }
        }
      `}</style>
      <div className="admin-account-grid">
        
        {/* Profile Card */}
        <div className="card" style={{ padding: '2rem', borderRadius: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
               <ShieldCheck size={24} color="#134E39" /> Identitas Admin
            </h3>
            {!isEditing ? (
              <button 
                onClick={() => setIsEditing(true)}
                style={{ padding: '0.5rem 1.25rem', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                Edit Profil
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => setIsEditing(false)}
                  style={{ padding: '0.5rem 1rem', borderRadius: '12px', background: '#fff', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer' }}
                >
                  Batal
                </button>
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  style={{ padding: '0.5rem 1.25rem', borderRadius: '12px', background: '#134E39', color: 'white', border: 'none', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer' }}
                >
                  {isSaving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            )}
          </div>

          {!isEditing ? (
            <div style={{ animation: 'fadeIn 0.3s' }}>
              <Field Icon={User} label="Nama Lengkap" value={user.name} icon={<User size={20}/>} />
              <Field Icon={Shield} label="Jabatan/Gelar" value={user.role_title || 'Administrator'} icon={<Briefcase size={20}/>} sub="Tampil sebagai titel di portal mediasi" />
              <Field Icon={Phone} label="Nomor WhatsApp" value={user.phone_wa} icon={<Phone size={20}/>} sub="Digunakan untuk mempermudah koordinasi" />
              <Field Icon={Mail} label="Email Terdaftar" value={user.email} icon={<Mail size={20}/>} sub="Email utama akses login (Read-only)" />
            </div>
          ) : (
            <div style={{ animation: 'fadeIn 0.3s' }}>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>Nama Lengkap</label>
                <input 
                  type="text" className="form-control" 
                  value={form.name} onChange={e => set('name', e.target.value)} 
                  style={{ borderRadius: '14px', padding: '1rem', fontSize: '0.95rem' }} 
                />
              </div>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>Jabatan/Gelar (Display)</label>
                <input 
                  type="text" className="form-control" 
                  value={form.role_title} onChange={e => set('role_title', e.target.value)} 
                  style={{ borderRadius: '14px', padding: '1rem', fontSize: '0.95rem' }} 
                />
              </div>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>Nomor WhatsApp</label>
                <input 
                  type="text" className="form-control" 
                  value={form.phone_wa} onChange={e => set('phone_wa', e.target.value)} 
                  style={{ borderRadius: '14px', padding: '1rem', fontSize: '0.95rem' }} 
                />
              </div>
            </div>
          )}
        </div>

        {/* Security / Password Column */}
        <div>
          <ChangePasswordCard user={user} showAlert={showAlert} />
          
          <div className="card" style={{ marginTop: '1.5rem', padding: '2rem', borderRadius: '32px', background: 'rgba(19,78,57,0.02)', border: '1px dashed rgba(19,78,57,0.2)' }}>
            <h4 style={{ margin: '0 0 0.5rem', fontSize: '1rem', fontWeight: '800', color: '#134E39', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lock size={18} /> Keamanan Sistem
            </h4>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', lineHeight: '1.5' }}>
              Selalu jaga kerahasiaan password Anda. Pastikan untuk mengganti password secara berkala untuk menjaga keamanan data pendaftar Separuh Agama.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
