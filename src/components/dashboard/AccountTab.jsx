import React, { useState } from 'react';
import { User, Users, Phone, Shield, MapPin, Edit3, Save, X as XIcon, BadgeCheck, Clock, AlertTriangle } from 'lucide-react';
import { supabase } from '../../supabase';
import ChangePasswordCard from './ChangePasswordCard';

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
  });

  const isAkhwat = user.gender === 'akhwat';
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
    }).eq('id', user.id);
    setIsSaving(false);
    if (error) { showAlert('Gagal Menyimpan', error.message, 'error'); return; }
    user.name = form.name.trim();
    user.phone_wa = form.phone_wa.trim();
    user.wali_phone = form.wali_phone.trim();
    user.wali_name = form.wali_name.trim();
    user.domisili_kota = form.domisili_kota.trim();
    user.domisili_provinsi = form.domisili_provinsi.trim();
    user.domisili_detail = form.domisili_detail.trim();
    showAlert('Berhasil', 'Profil berhasil diperbarui.', 'success');
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
    });
    setIsEditing(false);
  };

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

  const InputField = ({ label, fieldKey, type = 'text', placeholder }) => (
    <div className="form-group" style={{ marginBottom: '1rem' }}>
      <label className="form-label">{label}</label>
      <input type={type} className="form-control" placeholder={placeholder} value={form[fieldKey]} onChange={e => set(fieldKey, e.target.value)} />
    </div>
  );

  return (
    <div style={{ maxWidth: '660px', margin: '0 auto', animation: 'fadeIn 0.4s ease' }}>
      {/* Header Card */}
      <div className="card" style={{ marginBottom: '1.25rem', padding: '1.75rem', textAlign: 'center' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), #1a4d35)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '2rem', fontWeight: 'bold', boxShadow: '0 8px 24px rgba(44,95,77,0.3)' }}>
          {(form.name || user.name).charAt(0).toUpperCase()}
        </div>
        <h3 style={{ margin: '0 0 0.4rem', fontSize: '1.3rem' }}>{form.name || user.name}</h3>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <BadgeCheck size={13} /> Akun Aktif
          </span>
          <span className="badge" style={{ background: isAkhwat ? 'rgba(236,72,153,0.1)' : 'rgba(14,165,233,0.1)', color: isAkhwat ? '#ec4899' : '#0ea5e9', border: `1px solid ${isAkhwat ? 'rgba(236,72,153,0.2)' : 'rgba(14,165,233,0.2)'}` }}>
            {isAkhwat ? '👩 Akhwat' : '👨 Ikhwan'}
          </span>
        </div>
      </div>

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
            <Field label="Jenis Kelamin" value={user.gender === 'ikhwan' ? 'Ikhwan (Pria)' : 'Akhwat (Wanita)'} icon={<Users size={16} />} />
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
            <InputField label="Nama Lengkap" fieldKey="name" placeholder="Nama Anda..." />
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Email <span style={{ color: 'var(--text-muted)', fontWeight: '400' }}>(tidak bisa diubah)</span></label>
              <input type="email" className="form-control" value={user.email} disabled style={{ opacity: 0.6 }} />
            </div>
            <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '1.25rem 0 0.75rem' }}>— Kontak</div>
            <InputField label="No. WhatsApp Aktif" fieldKey="phone_wa" type="tel" placeholder="Contoh: 0812-3456-7890" />
            {isAkhwat && (
              <div style={{ padding: '1.25rem', background: 'rgba(236,72,153,0.04)', border: '1px solid rgba(236,72,153,0.15)', borderRadius: '14px', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: '#ec4899', fontWeight: '700', fontSize: '0.875rem' }}>
                  <Shield size={15} /> Kontak Wali
                </div>
                <InputField label="Nama Wali" fieldKey="wali_name" placeholder="Contoh: Bapak Ahmad" />
                <InputField label="No. WhatsApp Wali" fieldKey="wali_phone" type="tel" placeholder="Contoh: 0812-3456-7890" />
              </div>
            )}
            <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '1.25rem 0 0.75rem' }}>— Domisili</div>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Provinsi</label>
              <select className="form-control" value={form.domisili_provinsi} onChange={e => set('domisili_provinsi', e.target.value)}>
                <option value="">-- Pilih Provinsi --</option>
                {['Aceh','Sumatera Utara','Sumatera Barat','Riau','Kepulauan Riau','Jambi','Bengkulu','Sumatera Selatan','Kepulauan Bangka Belitung','Lampung','Banten','DKI Jakarta','Jawa Barat','Jawa Tengah','DI Yogyakarta','Jawa Timur','Bali','Nusa Tenggara Barat','Nusa Tenggara Timur','Kalimantan Barat','Kalimantan Tengah','Kalimantan Selatan','Kalimantan Timur','Kalimantan Utara','Sulawesi Utara','Gorontalo','Sulawesi Tengah','Sulawesi Barat','Sulawesi Selatan','Sulawesi Tenggara','Maluku','Maluku Utara','Papua Barat','Papua','Papua Tengah','Papua Pegunungan','Papua Selatan','Papua Barat Daya'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <InputField label="Kota / Kabupaten" fieldKey="domisili_kota" placeholder="Contoh: Jakarta Selatan" />
            <InputField label="Keterangan Tambahan (Opsional)" fieldKey="domisili_detail" placeholder="Contoh: Dekat Masjid Al-Azhar..." />
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
