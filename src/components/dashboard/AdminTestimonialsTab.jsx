import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { 
  Star, Plus, Trash2, Edit3, Save, X, 
  CheckCircle, AlertCircle, Loader, Quote, 
  Eye, EyeOff, Search 
} from 'lucide-react';

const CARD_STYLE = {
  background: 'white',
  borderRadius: '20px',
  padding: '1.5rem',
  border: '1px solid #f1f5f9',
  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.02)'
};

export default function AdminTestimonialsTab({ showAlert }) {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, published, draft
  const [form, setForm] = useState({
    id: null,
    name: '',
    role: '',
    content: '',
    rating: 5,
    is_published: true
  });

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setTestimonials(data || []);
    } catch (err) {
      console.error('Error fetching testimonials:', err);
      // Fallback dummy data if table doesn't exist yet to avoid crash during first run
      if (err.code === '42P01') {
        setTestimonials([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.content) {
      showAlert('Nama dan isi testimoni wajib diisi', 'error');
      return;
    }

    setSaving(true);
    try {
      if (form.id) {
        // Update
        const { error } = await supabase
          .from('testimonials')
          .update({
            name: form.name,
            role: form.role,
            content: form.content,
            rating: form.rating,
            is_published: form.is_published
          })
          .eq('id', form.id);
        if (error) throw error;
        showAlert('Testimoni berhasil diperbarui', 'success');
      } else {
        // Insert
        const { error } = await supabase
          .from('testimonials')
          .insert([{
            name: form.name,
            role: form.role,
            content: form.content,
            rating: form.rating,
            is_published: form.is_published
          }]);
        if (error) throw error;
        showAlert('Testimoni baru berhasil ditambahkan', 'success');
      }
      setShowModal(false);
      fetchTestimonials();
    } catch (err) {
      console.error('Save error:', err);
      showAlert('Gagal menyimpan testimoni. Pastikan tabel database tersedia.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus testimoni ini?')) return;
    try {
      const { error } = await supabase.from('testimonials').delete().eq('id', id);
      if (error) throw error;
      showAlert('Testimoni berhasil dihapus', 'success');
      fetchTestimonials();
    } catch (err) {
      showAlert('Gagal menghapus testimoni', 'error');
    }
  };

  const togglePublish = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from('testimonials')
        .update({ is_published: !currentStatus })
        .eq('id', id);
      if (error) throw error;
      fetchTestimonials();
    } catch (err) {
      showAlert('Gagal merubah status publikasi', 'error');
    }
  };

  const openForm = (testi = null) => {
    if (testi) {
      setForm({ ...testi });
    } else {
      setForm({ id: null, name: '', role: 'Kandidat', content: '', rating: 5, is_published: true });
    }
    setShowModal(true);
  };

  const filtered = testimonials.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                          (statusFilter === 'published' && t.is_published) || 
                          (statusFilter === 'draft' && !t.is_published);
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', flex: 1 }}>
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder="Cari nama atau isi..." 
              className="form-control" 
              style={{ paddingLeft: '2.5rem', borderRadius: '12px', background: 'white' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="form-control" 
            style={{ width: '160px', borderRadius: '12px', background: 'white' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Semua Status</option>
            <option value="published">Hanya Publik</option>
            <option value="draft">Hanya Draft</option>
          </select>
        </div>
        <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => openForm()}>
          <Plus size={18} /> Tambah Testimoni
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
          <Loader size={40} className="spin" color="var(--primary)" />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ ...CARD_STYLE, textAlign: 'center', padding: '4rem 2rem' }}>
          <Quote size={48} color="#f1f5f9" style={{ margin: '0 auto 1.5rem' }} />
          <p style={{ color: '#64748b', fontWeight: '600' }}>Belum ada testimoni yang sesuai pencarian.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {filtered.map(item => (
            <div key={item.id} style={CARD_STYLE}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} fill={i < item.rating ? '#D4AF37' : 'none'} color={i < item.rating ? '#D4AF37' : '#e2e8f0'} />
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => togglePublish(item.id, item.is_published)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: item.is_published ? 'var(--primary)' : '#94a3b8' }}
                    title={item.is_published ? 'Publik' : 'Draft'}
                  >
                    {item.is_published ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                  <button 
                    onClick={() => openForm(item)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                  >
                    <Edit3 size={18} />
                  </button>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: '1.6', fontStyle: 'italic', marginBottom: '1.5rem' }}>
                "{item.content}"
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(44,95,77,0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' }}>
                  {item.name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontWeight: '800', fontSize: '0.9rem', color: '#1A2E25' }}>{item.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600' }}>{item.role || 'Kandidat'}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL FORM */}
      {showModal && (
        <div className="modal-overlay" style={{ zIndex: 3000 }} onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', width: '90%' }}>
            <div className="modal-header info" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0 }}>{form.id ? 'Edit Testimoni' : 'Testimoni Baru'}</h3>
              <X size={20} style={{ cursor: 'pointer' }} onClick={() => setShowModal(false)} />
            </div>
            <form onSubmit={handleSave} style={{ padding: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Nama Lengkap</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={form.name} 
                  onChange={e => setForm({...form, name: e.target.value})} 
                  placeholder="Contoh: Hamba Allah"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Status/Role</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={form.role} 
                  onChange={e => setForm({...form, role: e.target.value})} 
                  placeholder="Contoh: Akhwat, Menikah 2025"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Isi Testimoni</label>
                <textarea 
                  className="form-control" 
                  rows={4} 
                  value={form.content} 
                  onChange={e => setForm({...form, content: e.target.value})} 
                  placeholder="Ceritakan pengalaman sukses atau kepuasan menggunakan platform..."
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Rating</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[1,2,3,4,5].map(v => (
                    <button 
                      type="button"
                      key={v}
                      onClick={() => setForm({...form, rating: v})}
                      style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      <Star size={24} fill={v <= form.rating ? '#D4AF37' : 'none'} color={v <= form.rating ? '#D4AF37' : '#e2e8f0'} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input 
                  type="checkbox" 
                  id="notif-pub"
                  checked={form.is_published} 
                  onChange={e => setForm({...form, is_published: e.target.checked})} 
                />
                <label htmlFor="notif-pub" style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1e293b', cursor: 'pointer' }}>
                  Publikasikan di Landing Page
                </label>
              </div>
              <div className="modal-footer" style={{ padding: 0, marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={saving}>
                  {saving ? <Loader className="spin" size={18} /> : <Save size={18} />} Simpan Testimoni
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
