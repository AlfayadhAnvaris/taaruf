import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Phone, Shield, Save, X as XIcon, ShieldCheck, Mail, Briefcase, Lock, ArrowLeft, Plus, Pencil, Trash2, MessageCircle, ToggleLeft, ToggleRight, Headphones, ExternalLink } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import ChangePasswordCard from './ChangePasswordCard';

export default function AdminAccountTab() {
  const router = useRouter();
  const { user, setUser, showAlert, handleLogout, showToast, csContacts, setCsContacts, setConfirmState } = useAppContext();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    name: user.name || '',
    phone_wa: user.phone_wa || '',
    role_title: user.role_title || 'Administrator',
  });

  // CS Management States
  const [csLoading, setCsLoading] = useState(false);
  const [csForm, setCsForm] = useState({ name: '', phone_number: '', label: 'Umum' });
  const [editingCsId, setEditingCsId] = useState(null);
  const [showCsForm, setShowCsForm] = useState(false);
  const [csSaving, setCsSaving] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const setCsField = (k, v) => setCsForm(p => ({ ...p, [k]: v }));

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
      setUser({
        ...user,
        name: form.name.trim(),
        phone_wa: form.phone_wa.trim(),
        role_title: form.role_title.trim()
      });
      
      showToast('Profil Admin berhasil diperbarui.', 'success');
      setIsEditing(false);
    } catch (err) {
      showAlert('Gagal Menyimpan', err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // CS CRUD Functions
  const handleSaveCs = async () => {
    if (!csForm.name.trim() || !csForm.phone_number.trim()) {
      showAlert('Wajib Diisi', 'Nama dan nomor WhatsApp CS wajib diisi.', 'error');
      return;
    }
    setCsSaving(true);
    try {
      if (editingCsId) {
        // Update
        const { error } = await supabase.from('cs_contacts')
          .update({ name: csForm.name.trim(), phone_number: csForm.phone_number.trim(), label: csForm.label.trim() || 'Umum' })
          .eq('id', editingCsId);
        if (error) throw error;
        setCsContacts(prev => prev.map(c => c.id === editingCsId ? { ...c, name: csForm.name.trim(), phone_number: csForm.phone_number.trim(), label: csForm.label.trim() || 'Umum' } : c));
        showToast('Data CS berhasil diperbarui.', 'success');
      } else {
        // Insert
        const { data, error } = await supabase.from('cs_contacts')
          .insert({ name: csForm.name.trim(), phone_number: csForm.phone_number.trim(), label: csForm.label.trim() || 'Umum' })
          .select();
        if (error) throw error;
        if (data && data[0]) setCsContacts(prev => [...prev, data[0]]);
        showToast('CS baru berhasil ditambahkan.', 'success');
      }
      resetCsForm();
    } catch (err) {
      showAlert('Gagal', err.message, 'error');
    } finally {
      setCsSaving(false);
    }
  };

  const handleEditCs = (cs) => {
    setCsForm({ name: cs.name, phone_number: cs.phone_number, label: cs.label || 'Umum' });
    setEditingCsId(cs.id);
    setShowCsForm(true);
  };

  const handleDeleteCs = (cs) => {
    setConfirmState({
      isOpen: true,
      title: 'Hapus Kontak CS?',
      message: `Apakah Anda yakin ingin menghapus CS "${cs.name}"? Tindakan ini tidak dapat dibatalkan.`,
      onConfirm: async () => {
        try {
          const { error } = await supabase.from('cs_contacts').delete().eq('id', cs.id);
          if (error) throw error;
          setCsContacts(prev => prev.filter(c => c.id !== cs.id));
          showToast('Kontak CS berhasil dihapus.', 'success');
        } catch (err) {
          showAlert('Gagal', err.message, 'error');
        }
      }
    });
  };

  const handleToggleCsActive = async (cs) => {
    try {
      const { error } = await supabase.from('cs_contacts')
        .update({ is_active: !cs.is_active })
        .eq('id', cs.id);
      if (error) throw error;
      setCsContacts(prev => prev.map(c => c.id === cs.id ? { ...c, is_active: !cs.is_active } : c));
      showToast(`CS "${cs.name}" ${cs.is_active ? 'dinonaktifkan' : 'diaktifkan'}.`, 'success');
    } catch (err) {
      showAlert('Gagal', err.message, 'error');
    }
  };

  const resetCsForm = () => {
    setCsForm({ name: '', phone_number: '', label: 'Umum' });
    setEditingCsId(null);
    setShowCsForm(false);
  };

  const formatWaLink = (phone, msg = '') => {
    const cleaned = phone.replace(/[^0-9]/g, '');
    return `https://wa.me/${cleaned}${msg ? `?text=${encodeURIComponent(msg)}` : ''}`;
  };

  const Field = ({ label, value, icon, sub }) => (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1.25rem 0', borderBottom: '1px solid #f1f5f9' }}>
      <div style={{ width: 44, height: 44, borderRadius: '10px', background: 'rgba(19, 78, 57, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#134E39', flexShrink: 0 }}>
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

  const labelOptions = ['Umum', 'Akademi', 'Taaruf', 'Teknis', 'Keuangan'];

  return (
    <div className="admin-account-container" style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', animation: 'fadeIn 0.5s ease', paddingTop: '1rem', paddingBottom: '2rem' }}>
      <style>{`
        .admin-account-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 2rem;
          align-items: start;
        }
        @media (max-width: 1024px) {
          .admin-account-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 768px) {
          .admin-account-container {
            padding: 0 1rem;
          }
          .card {
            padding: 1.5rem !important;
            border-radius: 16px !important;
          }
        }
        .cs-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          border-radius: 12px;
          border: 1px solid #f1f5f9;
          background: #fafbfc;
          transition: all 0.2s;
        }
        .cs-item:hover {
          border-color: #e2e8f0;
          background: #f8fafc;
          box-shadow: 0 2px 8px rgba(0,0,0,0.03);
        }
        .cs-toggle-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
        }
        .cs-toggle-btn:hover {
          background: rgba(19,78,57,0.06);
        }
        .cs-action-btn {
          background: none;
          border: 1px solid #e2e8f0;
          cursor: pointer;
          padding: 6px;
          border-radius: 8px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
        }
        .cs-action-btn:hover {
          background: #f1f5f9;
        }
        .cs-action-btn.danger:hover {
          background: #fee2e2;
          border-color: #fecaca;
          color: #ef4444;
        }
        .cs-badge {
          padding: 2px 8px;
          border-radius: 6px;
          font-size: 0.65rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
      `}</style>
      <div className="admin-account-grid">
        
        {/* Profile Card */}
        <div className="card" style={{ padding: '2rem', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
               <ShieldCheck size={24} color="#134E39" /> Identitas Admin
            </h3>
            {!isEditing ? (
              <button 
                onClick={() => setIsEditing(true)}
                style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                Edit Profil
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => setIsEditing(false)}
                  style={{ padding: '0.5rem 1rem', borderRadius: '8px', background: '#fff', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer' }}
                >
                  Batal
                </button>
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', background: '#134E39', color: 'white', border: 'none', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer' }}
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
                  value={form.name || ''} onChange={e => set('name', e.target.value)} 
                  style={{ borderRadius: '10px', padding: '1rem', fontSize: '0.95rem' }} 
                />
              </div>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>Jabatan/Gelar (Display)</label>
                <input 
                  type="text" className="form-control" 
                  value={form.role_title || ''} onChange={e => set('role_title', e.target.value)} 
                  style={{ borderRadius: '10px', padding: '1rem', fontSize: '0.95rem' }} 
                />
              </div>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>Nomor WhatsApp</label>
                <input 
                  type="text" className="form-control" 
                  value={form.phone_wa || ''} onChange={e => set('phone_wa', e.target.value)} 
                  style={{ borderRadius: '10px', padding: '1rem', fontSize: '0.95rem' }} 
                />
              </div>
            </div>
          )}
        </div>

        {/* Security / Password Column */}
        <div>
          <ChangePasswordCard user={user} showAlert={showAlert} />
          
          <button 
            onClick={handleLogout}
            style={{ marginTop: '1.5rem', background: '#EF4444', color: 'white', border: 'none', padding: '1rem', width: '100%', borderRadius: '10px', fontWeight: '900', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.9rem', textAlign: 'center' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#DC2626'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#EF4444'; }}
          >
            KELUAR AKUN
          </button>
          
          <div className="card" style={{ marginTop: '1.5rem', padding: '2rem', borderRadius: '16px', background: 'rgba(19,78,57,0.02)', border: '1px dashed rgba(19,78,57,0.2)' }}>
            <h4 style={{ margin: '0 0 0.5rem', fontSize: '1rem', fontWeight: '800', color: '#134E39', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lock size={18} /> Keamanan Sistem
            </h4>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', lineHeight: '1.5' }}>
              Selalu jaga kerahasiaan password Anda. Pastikan untuk mengganti password secara berkala untuk menjaga keamanan data pendaftar Separuh Agama.
            </p>
          </div>
        </div>

      </div>

      {/* ====================================== */}
      {/* CS (Customer Service) Management Card */}
      {/* ====================================== */}
      <div className="card" style={{ 
        marginTop: '2rem', padding: '2rem', borderRadius: '16px', 
        background: 'white', border: '1px solid #f1f5f9'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Headphones size={24} color="#134E39" /> Kelola Customer Service
          </h3>
          <button 
            onClick={() => { resetCsForm(); setShowCsForm(true); }}
            style={{ 
              padding: '0.5rem 1.25rem', borderRadius: '10px', 
              background: '#134E39', color: 'white', border: 'none', 
              fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer', 
              display: 'flex', alignItems: 'center', gap: '6px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#1a6349'}
            onMouseLeave={e => e.currentTarget.style.background = '#134E39'}
          >
            <Plus size={16} /> Tambah CS
          </button>
        </div>

        <p style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: '1.6', marginBottom: '1.5rem' }}>
          Kelola daftar kontak Customer Service yang bisa dihubungi user via WhatsApp. Nomor CS aktif akan ditampilkan kepada user yang membutuhkan bantuan.
        </p>

        {/* Add/Edit CS Form */}
        {showCsForm && (
          <div style={{ 
            background: '#f8faf9', border: '1px solid #e4ede8', borderRadius: '14px', 
            padding: '1.5rem', marginBottom: '1.5rem', animation: 'fadeIn 0.3s ease'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '800', color: '#134E39' }}>
                {editingCsId ? 'Edit Kontak CS' : 'Tambah Kontak CS Baru'}
              </h4>
              <button onClick={resetCsForm} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                <XIcon size={18} color="#94a3b8" />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'block' }}>Nama CS *</label>
                <input 
                  type="text" className="form-control" placeholder="contoh: Admin Fatimah"
                  value={csForm.name} onChange={e => setCsField('name', e.target.value)}
                  style={{ borderRadius: '10px', padding: '0.85rem', fontSize: '0.85rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'block' }}>Nomor WhatsApp *</label>
                <input 
                  type="text" className="form-control" placeholder="6281234567890"
                  value={csForm.phone_number} onChange={e => setCsField('phone_number', e.target.value)}
                  style={{ borderRadius: '10px', padding: '0.85rem', fontSize: '0.85rem' }}
                />
              </div>
            </div>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.7rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'block' }}>Label / Divisi</label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {labelOptions.map(opt => (
                  <button
                    key={opt}
                    onClick={() => setCsField('label', opt)}
                    style={{
                      padding: '0.45rem 0.9rem', borderRadius: '8px',
                      border: csForm.label === opt ? '1.5px solid #134E39' : '1px solid #e2e8f0',
                      background: csForm.label === opt ? 'rgba(19,78,57,0.08)' : 'white',
                      color: csForm.label === opt ? '#134E39' : '#64748b',
                      fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={resetCsForm} style={{ 
                padding: '0.6rem 1.25rem', borderRadius: '8px', background: 'white', 
                border: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer' 
              }}>
                Batal
              </button>
              <button onClick={handleSaveCs} disabled={csSaving} style={{ 
                padding: '0.6rem 1.5rem', borderRadius: '8px', background: '#134E39', 
                color: 'white', border: 'none', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer',
                opacity: csSaving ? 0.7 : 1
              }}>
                {csSaving ? 'Menyimpan...' : (editingCsId ? 'Perbarui' : 'Simpan')}
              </button>
            </div>
          </div>
        )}

        {/* CS List */}
        {csContacts.length === 0 ? (
          <div style={{ 
            textAlign: 'center', padding: '3rem 1.5rem', 
            border: '2px dashed #e2e8f0', borderRadius: '14px', background: '#fafbfc' 
          }}>
            <Headphones size={40} color="#cbd5e1" style={{ marginBottom: '1rem' }} />
            <p style={{ fontSize: '0.9rem', fontWeight: '700', color: '#94a3b8', margin: '0 0 0.5rem' }}>Belum ada kontak CS</p>
            <p style={{ fontSize: '0.75rem', color: '#cbd5e1', margin: 0 }}>Klik tombol "Tambah CS" untuk menambahkan kontak baru.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {csContacts.map(cs => (
              <div key={cs.id} className="cs-item" style={{ opacity: cs.is_active ? 1 : 0.55 }}>
                {/* Avatar */}
                <div style={{ 
                  width: 44, height: 44, borderRadius: '12px', flexShrink: 0,
                  background: cs.is_active ? 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)' : '#cbd5e1',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                  fontSize: '1.1rem', fontWeight: '900'
                }}>
                  {cs.name.charAt(0).toUpperCase()}
                </div>
                
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: '800', color: '#1e293b' }}>{cs.name}</span>
                    <span className="cs-badge" style={{ 
                      background: cs.label === 'Akademi' ? 'rgba(19,78,57,0.08)' : cs.label === 'Taaruf' ? 'rgba(212,175,55,0.1)' : 'rgba(100,116,139,0.08)',
                      color: cs.label === 'Akademi' ? '#134E39' : cs.label === 'Taaruf' ? '#b8860b' : '#64748b'
                    }}>
                      {cs.label}
                    </span>
                    {!cs.is_active && (
                      <span className="cs-badge" style={{ background: '#fee2e2', color: '#ef4444' }}>Nonaktif</span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>
                    <Phone size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                    {cs.phone_number}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                  <button className="cs-toggle-btn" onClick={() => handleToggleCsActive(cs)} title={cs.is_active ? 'Nonaktifkan' : 'Aktifkan'}>
                    {cs.is_active ? <ToggleRight size={24} color="#25D366" /> : <ToggleLeft size={24} color="#cbd5e1" />}
                  </button>
                  <a 
                    href={formatWaLink(cs.phone_number)} target="_blank" rel="noreferrer"
                    className="cs-action-btn" title="Buka WhatsApp" style={{ color: '#25D366' }}
                  >
                    <MessageCircle size={15} />
                  </a>
                  <button className="cs-action-btn" onClick={() => handleEditCs(cs)} title="Edit">
                    <Pencil size={14} color="#64748b" />
                  </button>
                  <button className="cs-action-btn danger" onClick={() => handleDeleteCs(cs)} title="Hapus">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
