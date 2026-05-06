import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { 
  Star, Plus, Trash2, Edit3, Save, X, 
  CheckCircle, AlertCircle, Loader, Quote, 
  Eye, EyeOff, Search, ToggleRight, ToggleLeft, XCircle, Clock, User
} from 'lucide-react';

const CARD_STYLE = {
  background: 'white',
  borderRadius: '12px',
  padding: '1.5rem',
  border: '1px solid #f1f5f9',
  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.02)',
  transition: 'all 0.3s'
};

export default function AdminTestimonialsTab({ showAlert }) {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedTesti, setSelectedTesti] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); 
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
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
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
      if (err.code === '42P01') setTestimonials([]);
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
      showAlert('Gagal menyimpan testimoni.', 'error');
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
      <style>{`
        .testi-compact-row {
          padding: 1rem;
          border-radius: 12px;
          background: white;
          border: 1px solid #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.75rem;
          position: relative;
          transition: all 0.2s;
        }
        .testi-compact-row:hover {
          border-color: #134E39;
          transform: translateX(4px);
        }
        .action-icon-btn {
          width: 38px;
          height: 38px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1.5px solid #f1f5f9;
          background: white;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s;
        }
        .action-icon-btn:hover {
          background: #134E39;
          color: white;
          border-color: #134E39;
        }
        .reviewer-info-text-mobile {
          max-width: 140px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isMobile ? '1.5rem' : '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', flex: 1 }}>
          <div style={{ position: 'relative', width: isMobile ? '100%' : '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder="Cari nama atau isi..." 
              className="form-control" 
              style={{ paddingLeft: '2.5rem', borderRadius: '8px', background: 'white' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="form-control" 
            style={{ width: isMobile ? '100%' : '160px', borderRadius: '8px', background: 'white' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Semua Status</option>
            <option value="published">Hanya Publik</option>
            <option value="draft">Hanya Draft</option>
          </select>
        </div>
        <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', width: isMobile ? '100%' : 'auto', justifyContent: 'center' }} onClick={() => openForm()}>
          <Plus size={18} /> Tambah Testimoni
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
          <Loader size={40} className="spin" color="#134E39" />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ ...CARD_STYLE, textAlign: 'center', padding: '4rem 2rem' }}>
          <Quote size={48} color="#f1f5f9" style={{ margin: '0 auto 1.5rem' }} />
          <p style={{ color: '#64748b', fontWeight: '600' }}>Belum ada testimoni.</p>
        </div>
      ) : (
        <div style={{ 
          display: isMobile ? 'flex' : 'grid', 
          flexDirection: isMobile ? 'column' : 'unset',
          gridTemplateColumns: isMobile ? 'unset' : 'repeat(auto-fill, minmax(320px, 1fr))', 
          gap: isMobile ? '0' : '1.5rem' 
        }}>
          {filtered.map(item => {
            if (isMobile) {
              return (
                <div key={item.id} className="testi-compact-row">
                   {!item.is_published && <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', background: '#ef4444', borderTopLeftRadius: '8px', borderBottomLeftRadius: '8px' }} />}
                   <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: item.is_published ? 'rgba(19,78,57,0.05)' : '#fee2e2', color: item.is_published ? '#134E39' : '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '1rem', flexShrink: 0 }}>
                        {item.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="reviewer-info-text-mobile">
                         <div style={{ fontSize: '0.55rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>Nama</div>
                         <div style={{ fontWeight: '800', color: '#1e293b', fontSize: '0.9rem' }}>{item.name}</div>
                      </div>
                   </div>

                   <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <button 
                        className="action-icon-btn"
                        onClick={() => togglePublish(item.id, item.is_published)}
                        style={{ 
                          background: item.is_published ? 'rgba(19, 78, 57, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: item.is_published ? '#134E39' : '#ef4444',
                          border: 'none'
                        }}
                      >
                        {item.is_published ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                      </button>

                      <button className="action-icon-btn" onClick={() => setSelectedTesti(item)}>
                        <Eye size={18} />
                      </button>

                      <button className="action-icon-btn" onClick={() => openForm(item)}>
                        <Edit3 size={18} />
                      </button>
                      
                      <button className="action-icon-btn" onClick={() => handleDelete(item.id)} style={{ color: '#ef4444', borderColor: '#fee2e2' }}>
                        <Trash2 size={18} />
                      </button>
                   </div>
                </div>
              );
            }

            // Desktop Card View
            return (
              <div key={item.id} style={CARD_STYLE} className="testi-card-hover">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} fill={i < item.rating ? '#D4AF37' : 'none'} color={i < item.rating ? '#D4AF37' : '#e2e8f0'} />
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => togglePublish(item.id, item.is_published)}
                      className="action-icon-btn"
                      title={item.is_published ? 'Publik' : 'Draft'}
                      style={{ background: item.is_published ? 'rgba(19, 78, 57, 0.1)' : 'transparent', color: item.is_published ? '#134E39' : '#94a3b8' }}
                    >
                      {item.is_published ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                    </button>
                    <button onClick={() => openForm(item)} className="action-icon-btn" title="Edit">
                      <Edit3 size={18} />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="action-icon-btn" style={{ color: '#ef4444' }} title="Hapus">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <div style={{ position: 'relative' }}>
                  <p style={{ 
                    fontSize: '0.9rem', color: '#475569', lineHeight: '1.6', 
                    fontStyle: 'italic', marginBottom: '1.5rem', 
                    height: '45px', overflow: 'hidden', textOverflow: 'ellipsis', 
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' 
                  }}>
                    "{item.content}"
                  </p>
                  <button 
                    onClick={() => setSelectedTesti(item)}
                    style={{ 
                      display: 'block', margin: '-1rem 0 1rem', background: 'none', 
                      border: 'none', color: '#134E39', fontWeight: '800', 
                      fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline'
                    }}
                  >
                    Lihat Selengkapnya
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: 'rgba(19,78,57,0.08)', color: '#134E39', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '1.1rem' }}>
                    {item.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '0.95rem', color: '#134E39' }}>{item.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600' }}>{item.role || 'Kandidat'}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DETAIL MODAL (Mobile) */}
      {selectedTesti && (
        <div className="modal-overlay" onClick={() => setSelectedTesti(null)}>
           <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', width: '95%', padding: 0 }}>
              <div style={{ background: '#134E39', color: 'white', padding: '1.5rem', borderTopLeftRadius: '12px', borderTopRightRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <div>
                    <h3 style={{ fontSize: '1.1rem', margin: 0, fontWeight: '900' }}>Detail Testimoni</h3>
                    <p style={{ margin: '4px 0 0', fontSize: '0.75rem', opacity: 0.8 }}>ID: #{selectedTesti.id.substring(0,8)}</p>
                 </div>
                 <button onClick={() => setSelectedTesti(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', padding: '8px', borderRadius: '8px', color: 'white', cursor: 'pointer' }}><XCircle size={20} /></button>
              </div>

              <div style={{ padding: '2rem' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '12px', background: 'rgba(19,78,57,0.05)', color: '#134E39', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: '900' }}>
                       {selectedTesti.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                       <div style={{ fontWeight: '900', color: '#1e293b', fontSize: '1.1rem' }}>{selectedTesti.name}</div>
                       <div style={{ color: '#64748b', fontWeight: '600', fontSize: '0.85rem' }}>{selectedTesti.role || 'Kandidat'}</div>
                    </div>
                 </div>

                 <div style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                       <div style={{ fontSize: '0.7rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Isi Testimoni & Rating</div>
                       <div style={{ display: 'flex', gap: '4px' }}>
                          {[1,2,3,4,5].map(v => <Star key={v} size={16} fill={v <= selectedTesti.rating ? '#D4AF37' : 'none'} color={v <= selectedTesti.rating ? '#D4AF37' : '#e2e8f0'} />)}
                       </div>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #f1f5f9', fontSize: '1rem', color: '#334155', lineHeight: 1.7, fontStyle: 'italic' }}>
                       "{selectedTesti.content}"
                    </div>
                 </div>

                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#f8fafc', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700' }}>
                       <Clock size={14} /> {new Date(selectedTesti.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                    <div style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '900', textTransform: 'uppercase', background: selectedTesti.is_published ? '#dcfce7' : '#fee2e2', color: selectedTesti.is_published ? '#166534' : '#991b1b' }}>
                       {selectedTesti.is_published ? 'PUBLIK' : 'DRAFT'}
                    </div>
                 </div>
              </div>

              <div style={{ padding: '1.5rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                 <button className="btn btn-outline" onClick={() => setSelectedTesti(null)} style={{ borderRadius: '8px' }}>Tutup</button>
                 <button className="btn btn-primary" onClick={() => { togglePublish(selectedTesti.id, selectedTesti.is_published); setSelectedTesti(null); }} style={{ borderRadius: '8px' }}>
                    {selectedTesti.is_published ? 'Set Draft' : 'Publikasikan'}
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* FORM MODAL (Add/Edit) */}
      {showModal && (
        <div className="modal-overlay" style={{ zIndex: 3000 }} onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', width: '90%', padding: 0 }}>
            <div style={{ background: '#134E39', color: 'white', padding: '1.5rem', borderTopLeftRadius: '12px', borderTopRightRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '900' }}>{form.id ? 'Edit Testimoni' : 'Testimoni Baru'}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', padding: '8px', borderRadius: '8px', color: 'white', cursor: 'pointer' }}><XCircle size={20} /></button>
            </div>
            <form onSubmit={handleSave} style={{ padding: '2rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: '800', color: '#134E39' }}>Nama Lengkap</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={form.name} 
                  onChange={e => setForm({...form, name: e.target.value})} 
                  placeholder="Contoh: Hamba Allah"
                  required
                  style={{ borderRadius: '8px', padding: '0.8rem' }}
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: '800', color: '#134E39' }}>Status/Role</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={form.role} 
                  onChange={e => setForm({...form, role: e.target.value})} 
                  placeholder="Contoh: Akhwat, Menikah 2025"
                  style={{ borderRadius: '8px', padding: '0.8rem' }}
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: '800', color: '#134E39' }}>Isi Testimoni</label>
                <textarea 
                  className="form-control" 
                  rows={4} 
                  value={form.content} 
                  onChange={e => setForm({...form, content: e.target.value})} 
                  placeholder="Ceritakan pengalaman sukses..."
                  required
                  style={{ borderRadius: '12px', padding: '1rem', lineHeight: '1.6' }}
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: '800', color: '#134E39' }}>Rating</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {[1,2,3,4,5].map(v => (
                    <button 
                      type="button"
                      key={v}
                      onClick={() => setForm({...form, rating: v})}
                      style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      <Star size={28} fill={v <= form.rating ? '#D4AF37' : 'none'} color={v <= form.rating ? '#D4AF37' : '#e2e8f0'} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                <input 
                  type="checkbox" 
                  id="notif-pub"
                  checked={form.is_published} 
                  onChange={e => setForm({...form, is_published: e.target.checked})}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="notif-pub" style={{ fontSize: '0.85rem', fontWeight: '700', color: '#134E39', cursor: 'pointer' }}>
                  Publikasikan di Landing Page
                </label>
              </div>
              <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1, padding: '0.8rem', borderRadius: '8px' }} onClick={() => setShowModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2, padding: '0.8rem', borderRadius: '8px' }} disabled={saving}>
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
