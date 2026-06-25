import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { 
  Star, Plus, Trash2, Edit3, Save, X, 
  CheckCircle, AlertCircle, Loader, Quote, 
  Eye, EyeOff, Search, ToggleRight, ToggleLeft, XCircle, Clock, User,
  ChevronLeft, ChevronRight
} from 'lucide-react';

const CARD_STYLE = {
  background: 'white',
  borderRadius: '12px',
  padding: '1.5rem',
  border: '1px solid #f1f5f9',
  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.02)',
  transition: 'all 0.3s'
};

const getPageNumbers = (currentPage, totalPages) => {
  const pages = [];
  const maxVisiblePages = 5;
  if (totalPages <= maxVisiblePages) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    pages.push(1);
    let start = Math.max(2, currentPage - 1);
    let end = Math.min(totalPages - 1, currentPage + 1);
    if (currentPage <= 2) {
      end = 4;
    } else if (currentPage >= totalPages - 1) {
      start = totalPages - 3;
    }
    if (start > 2) {
      pages.push('...');
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    if (end < totalPages - 1) {
      pages.push('...');
    }
    pages.push(totalPages);
  }
  return pages;
};

export default function AdminTestimonialsTab() {
  const { showAlert, showToast, setConfirmState } = useAppContext();
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedTesti, setSelectedTesti] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); 
  const [isMobile, setIsMobile] = useState(false);
  const [form, setForm] = useState({
    id: null,
    name: '',
    role: '',
    content: '',
    rating: 5,
    is_published: true
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchTestimonials();
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      showToast('Nama dan isi testimoni wajib diisi', 'error');
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
        showToast('Testimoni berhasil diperbarui', 'success');
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
        showToast('Testimoni baru berhasil ditambahkan', 'success');
      }
      setShowModal(false);
      fetchTestimonials();
    } catch (err) {
      console.error('Save error:', err);
      showToast('Gagal menyimpan testimoni.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setConfirmState({
      isOpen: true,
      title: 'Hapus Testimoni?',
      message: 'Apakah Anda yakin ingin menghapus testimoni ini secara permanen?',
      onConfirm: async () => {
        try {
          const { error } = await supabase.from('testimonials').delete().eq('id', id);
          if (error) throw error;
          showToast('Testimoni berhasil dihapus', 'success');
          fetchTestimonials();
        } catch {
          showToast('Gagal menghapus testimoni', 'error');
        } finally {
          setConfirmState(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const togglePublish = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from('testimonials')
        .update({ is_published: !currentStatus })
        .eq('id', id);
      if (error) throw error;
      fetchTestimonials();
      showToast('Status publikasi diperbarui', 'success');
    } catch {
      showToast('Gagal merubah status publikasi', 'error');
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

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filtered.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

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
          border-color: #cbd5e1;
          transform: translateX(4px);
        }
        .testi-compact-row-desktop {
          transition: all 0.2s ease;
        }
        .testi-compact-row-desktop:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
          border-color: #cbd5e1 !important;
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
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <select 
            className="form-control" 
            style={{ width: isMobile ? '100%' : '160px', borderRadius: '8px', background: 'white' }}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
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
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Desktop Table Header */}
          {!isMobile && (
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: '1.2fr 0.8fr 2fr 0.8fr 0.8fr 1.2fr',
              padding: '0.75rem 1.25rem',
              background: '#f8fafc',
              border: '1px solid #E4EDE8',
              borderRadius: '10px',
              marginBottom: '0.5rem',
              gap: '1rem',
              fontSize: '0.7rem',
              fontWeight: '800',
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              <div>Nama & Peran</div>
              <div>Rating</div>
              <div>Kesan/Testimoni</div>
              <div>Tanggal</div>
              <div>Status</div>
              <div style={{ textAlign: 'right' }}>Aksi</div>
            </div>
          )}

          {currentItems.map(item => {
            if (isMobile) {
              return (
                <div key={item.id} className="testi-compact-row">
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

            // Desktop View: Compact Row
            const isPublished = item.is_published;
            return (
              <div 
                key={item.id} 
                className="testi-compact-row-desktop"
                style={{ 
                  display: 'grid',
                  gridTemplateColumns: '1.2fr 0.8fr 2fr 0.8fr 0.8fr 1.2fr',
                  alignItems: 'center',
                  padding: '0.75rem 1.25rem',
                  background: 'white',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: '#E4EDE8',
                  borderRadius: '12px',
                  marginBottom: '0.5rem',
                  gap: '1rem',
                  opacity: isPublished ? 1 : 0.85
                }}
              >
                {/* 1. Nama & Peran */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <span style={{ fontWeight: '800', color: '#1e293b', fontSize: '0.85rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {item.name}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: '750', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {item.role || 'Kandidat'}
                    </span>
                  </div>
                </div>

                {/* 2. Rating */}
                <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star 
                      key={s} 
                      size={13} 
                      color={s <= item.rating ? '#D4AF37' : '#e2e8f0'} 
                      fill={s <= item.rating ? '#D4AF37' : 'transparent'} 
                    />
                  ))}
                  <span style={{ fontSize: '0.75rem', fontWeight: '850', color: '#475569', marginLeft: '4px' }}>
                    {item.rating}.0
                  </span>
                </div>

                {/* 3. Kesan/Testimoni (Truncated) */}
                <div 
                  onClick={() => setSelectedTesti(item)}
                  style={{ 
                    fontSize: '0.85rem', 
                    color: '#475569', 
                    fontWeight: '600',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    fontStyle: 'italic',
                    paddingRight: '1rem'
                  }}
                  title="Klik untuk detail ulasan"
                >
                  "{item.content}"
                </div>

                {/* 4. Tanggal */}
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={12} />
                  {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>

                {/* 5. Status Badge */}
                <div>
                  <span style={{
                    fontSize: '0.65rem',
                    fontWeight: '900',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    background: isPublished ? '#dcfce7' : '#fee2e2',
                    color: isPublished ? '#059669' : '#ef4444',
                    display: 'inline-block'
                  }}>
                    {isPublished ? 'PUBLIK' : 'DRAFT'}
                  </span>
                </div>

                {/* 6. Aksi */}
                <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                  <button 
                    onClick={() => togglePublish(item.id, item.is_published)}
                    style={{ 
                      background: isPublished ? 'rgba(5, 150, 105, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                      color: isPublished ? '#059669' : '#ef4444',
                      border: 'none',
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s'
                    }}
                    title={isPublished ? 'Set Draft' : 'Publikasikan'}
                  >
                    {isPublished ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
                  </button>

                  <button 
                    onClick={() => setSelectedTesti(item)}
                    style={{ 
                      background: '#f8fafc',
                      color: '#64748b',
                      border: '1px solid #e2e8f0',
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s'
                    }}
                    title="Lihat Detail"
                  >
                    <Eye size={15} />
                  </button>

                  <button 
                    onClick={() => openForm(item)}
                    style={{ 
                      background: '#f8fafc',
                      color: '#134E39',
                      border: '1px solid #e2e8f0',
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s'
                    }}
                    title="Edit"
                  >
                    <Edit3 size={15} />
                  </button>

                  <button 
                    onClick={() => handleDelete(item.id)}
                    style={{ 
                      background: '#fef2f2',
                      color: '#ef4444',
                      border: 'none',
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s'
                    }}
                    title="Hapus"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '2rem', flexWrap: 'wrap' }}>
              <button 
                disabled={currentPage === 1} 
                onClick={() => setCurrentPage(prev => prev - 1)}
                style={{ 
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: '38px', height: '38px', borderRadius: '8px', border: '1px solid #E4EDE8', 
                  background: 'white', color: currentPage === 1 ? '#cbd5e1' : '#134E39', 
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer', transition: 'all 0.2s' 
                }}
              >
                <ChevronLeft size={18} />
              </button>
              
              {getPageNumbers(currentPage, totalPages).map((page, idx) => {
                if (page === '...') {
                  return (
                    <span 
                      key={`dots-${idx}`} 
                      style={{ 
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: '38px', height: '38px', color: '#94a3b8', fontSize: '0.85rem', fontWeight: '800' 
                      }}
                    >
                      ...
                    </span>
                  );
                }
                const isActive = page === currentPage;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: '38px', height: '38px', borderRadius: '8px', 
                      border: isActive ? '1px solid #134E39' : '1px solid #E4EDE8',
                      background: isActive ? '#134E39' : 'white',
                      color: isActive ? 'white' : '#134E39',
                      fontWeight: '800', fontSize: '0.85rem',
                      cursor: 'pointer', transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => {
                      if (!isActive) {
                        e.currentTarget.style.background = '#f4f7f5';
                        e.currentTarget.style.borderColor = '#134E39';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'white';
                        e.currentTarget.style.borderColor = '#E4EDE8';
                      }
                    }}
                  >
                    {page}
                  </button>
                );
              })}

              <button 
                disabled={currentPage === totalPages} 
                onClick={() => setCurrentPage(prev => prev + 1)}
                style={{ 
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: '38px', height: '38px', borderRadius: '8px', border: '1px solid #E4EDE8', 
                  background: 'white', color: currentPage === totalPages ? '#cbd5e1' : '#134E39', 
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', transition: 'all 0.2s' 
                }}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedTesti && (
        <div 
          className="modal-overlay" 
          onClick={() => setSelectedTesti(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            animation: 'fadeIn 0.2s ease'
          }}
        >
           <div 
             className="modal-content" 
             onClick={e => e.stopPropagation()} 
             style={{ 
               maxWidth: '520px', 
               width: '100%', 
               padding: 0,
               background: 'white',
               borderRadius: '16px',
               overflow: 'hidden',
               boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
               border: '1px solid #f1f5f9',
               animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
             }}
           >
              <div style={{ padding: '2rem', background: '#f0fdf4', borderBottom: '1px solid #dcfce7', position: 'relative' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
                    <Quote size={20} color="#166534" />
                    <span style={{ fontSize: '0.75rem', fontWeight: '900', color: '#166534', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Detail Testimoni</span>
                 </div>
                 <h2 style={{ fontSize: '1.5rem', fontWeight: '950', color: '#134E39', margin: 0 }}>Ulasan Sukses Kandidat</h2>
                 <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>ID: #{selectedTesti.id.substring(0,8)}</p>
                 
                 <button 
                   onClick={() => setSelectedTesti(null)} 
                   style={{ 
                     position: 'absolute', top: '1.5rem', right: '1.5rem', 
                     background: 'rgba(22, 101, 52, 0.08)', border: 'none', 
                     width: 36, height: 36, borderRadius: '8px', 
                     display: 'flex', alignItems: 'center', justifyContent: 'center', 
                     color: '#166534', cursor: 'pointer', transition: 'background 0.2s' 
                   }}
                   onMouseEnter={e => e.currentTarget.style.background = 'rgba(22, 101, 52, 0.15)'}
                   onMouseLeave={e => e.currentTarget.style.background = 'rgba(22, 101, 52, 0.08)'}
                 >
                   <X size={20} />
                 </button>
              </div>

              <div style={{ padding: '2rem' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'rgba(19, 78, 57, 0.05)', color: '#134E39', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: '900', border: '1px solid rgba(19, 78, 57, 0.1)' }}>
                       {selectedTesti.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                       <div style={{ fontWeight: '950', color: '#1e293b', fontSize: '1.1rem' }}>{selectedTesti.name}</div>
                       <div style={{ color: '#64748b', fontWeight: '750', fontSize: '0.85rem', marginTop: '2px' }}>{selectedTesti.role || 'Kandidat'}</div>
                    </div>
                 </div>

                 <div style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                       <span style={{ fontSize: '0.7rem', fontWeight: '850', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Isi Ulasan & Rating</span>
                       <div style={{ display: 'flex', gap: '2px' }}>
                          {[1,2,3,4,5].map(v => <Star key={v} size={15} fill={v <= selectedTesti.rating ? '#D4AF37' : 'none'} color={v <= selectedTesti.rating ? '#D4AF37' : '#e2e8f0'} />)}
                       </div>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #f1f5f9', fontSize: '0.95rem', color: '#334155', lineHeight: 1.7, fontStyle: 'italic', fontWeight: '500' }}>
                       "{selectedTesti.content.replace(/^"+|"+$/g, '')}"
                    </div>
                 </div>

                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#64748b', fontWeight: '750' }}>
                       <Clock size={14} color="#94a3b8" /> {new Date(selectedTesti.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                    <span style={{ 
                      padding: '4px 10px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.05em',
                      background: selectedTesti.is_published ? '#dcfce7' : '#fee2e2', 
                      color: selectedTesti.is_published ? '#15803d' : '#ef4444' 
                    }}>
                       {selectedTesti.is_published ? 'PUBLIK' : 'DRAFT'}
                    </span>
                 </div>
              </div>

              <div style={{ padding: '1.5rem 2rem', background: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                 <button 
                   onClick={() => setSelectedTesti(null)}
                   style={{ 
                     background: 'white', color: '#475569', border: '1.5px solid #cbd5e1', 
                     padding: '0.75rem 1.5rem', borderRadius: '10px', fontWeight: '800', 
                     fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s' 
                   }}
                   onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                   onMouseLeave={e => e.currentTarget.style.background = 'white'}
                 >
                   Tutup
                 </button>
                 <button 
                   onClick={() => { togglePublish(selectedTesti.id, selectedTesti.is_published); setSelectedTesti(null); }}
                   style={{ 
                     background: selectedTesti.is_published ? '#ef4444' : '#134E39', 
                     color: 'white', border: 'none', 
                     padding: '0.75rem 1.5rem', borderRadius: '10px', fontWeight: '900', 
                     fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s',
                     boxShadow: selectedTesti.is_published ? '0 6px 16px rgba(239, 68, 68, 0.15)' : '0 6px 16px rgba(19, 78, 57, 0.15)'
                   }}
                   onMouseEnter={e => e.currentTarget.style.background = selectedTesti.is_published ? '#dc2626' : '#0e3a2a'}
                   onMouseLeave={e => e.currentTarget.style.background = selectedTesti.is_published ? '#ef4444' : '#134E39'}
                 >
                    {selectedTesti.is_published ? 'Set Draft' : 'Publikasikan'}
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* FORM MODAL (Add/Edit) */}
      {showModal && (
        <div 
          className="modal-overlay" 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            animation: 'fadeIn 0.2s ease'
          }} 
          onClick={() => setShowModal(false)}
        >
          <div 
            className="modal-content" 
            onClick={e => e.stopPropagation()} 
            style={{ 
              maxWidth: '520px', 
              width: '100%', 
              padding: 0,
              background: 'white',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              border: '1px solid #f1f5f9',
              animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <div style={{ padding: '2rem', background: '#f0fdf4', borderBottom: '1px solid #dcfce7', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
                <Quote size={20} color="#166534" />
                <span style={{ fontSize: '0.75rem', fontWeight: '900', color: '#166534', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Editor Testimoni</span>
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '950', color: '#134E39', margin: 0 }}>
                {form.id ? 'Edit Testimoni' : 'Testimoni Baru'}
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>
                Tuliskan ulasan keberhasilan taaruf atau pembelajaran akademi.
              </p>
              
              <button 
                onClick={() => setShowModal(false)} 
                style={{ 
                  position: 'absolute', top: '1.5rem', right: '1.5rem', 
                  background: 'rgba(22, 101, 52, 0.08)', border: 'none', 
                  width: 36, height: 36, borderRadius: '8px', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  color: '#166534', cursor: 'pointer', transition: 'background 0.2s' 
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(22, 101, 52, 0.15)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(22, 101, 52, 0.08)'}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSave} style={{ padding: '2rem' }}>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '8px' }}>Nama Lengkap</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={form.name || ''} 
                  onChange={e => setForm({...form, name: e.target.value})} 
                  placeholder="Contoh: Ihsanul Khair"
                  required
                  style={{ 
                    width: '100%', 
                    padding: '0.8rem 1rem', 
                    borderRadius: '10px', 
                    border: '1.5px solid #cbd5e1', 
                    fontSize: '0.9rem', 
                    fontWeight: '600', 
                    color: '#1e293b', 
                    outline: 'none',
                    background: 'white'
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = '#134E39'}
                  onBlur={e => e.currentTarget.style.borderColor = '#cbd5e1'}
                />
              </div>
              
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '8px' }}>Status / Peran</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={form.role || ''} 
                  onChange={e => setForm({...form, role: e.target.value})} 
                  placeholder="Contoh: Ikhwan, Menikah 2025"
                  style={{ 
                    width: '100%', 
                    padding: '0.8rem 1rem', 
                    borderRadius: '10px', 
                    border: '1.5px solid #cbd5e1', 
                    fontSize: '0.9rem', 
                    fontWeight: '600', 
                    color: '#1e293b', 
                    outline: 'none',
                    background: 'white'
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = '#134E39'}
                  onBlur={e => e.currentTarget.style.borderColor = '#cbd5e1'}
                />
              </div>
              
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '8px' }}>Isi Testimoni</label>
                <textarea 
                  className="form-control" 
                  rows={4} 
                  value={form.content || ''} 
                  onChange={e => setForm({...form, content: e.target.value})} 
                  placeholder="Ceritakan kisah sukses taaruf atau ulasan pembelajaran akademi di sini..."
                  required
                  style={{ 
                    width: '100%', 
                    padding: '0.8rem 1rem', 
                    borderRadius: '10px', 
                    border: '1.5px solid #cbd5e1', 
                    fontSize: '0.9rem', 
                    fontWeight: '500', 
                    color: '#1e293b', 
                    outline: 'none', 
                    resize: 'none',
                    fontFamily: 'inherit',
                    lineHeight: '1.6'
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = '#134E39'}
                  onBlur={e => e.currentTarget.style.borderColor = '#cbd5e1'}
                />
              </div>
              
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '8px' }}>Rating Testimoni</label>
                <div style={{ display: 'flex', gap: '8px', background: '#f8fafc', padding: '10px 14px', borderRadius: '10px', border: '1px solid #f1f5f9', width: 'fit-content' }}>
                  {[1,2,3,4,5].map(v => (
                    <button 
                      type="button"
                      key={v}
                      onClick={() => setForm({...form, rating: v})}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      <Star size={24} fill={v <= form.rating ? '#D4AF37' : 'none'} color={v <= form.rating ? '#D4AF37' : '#e2e8f0'} />
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #f1f5f9', marginBottom: '2rem' }}>
                <input 
                  type="checkbox" 
                  id="notif-pub"
                  checked={form.is_published} 
                  onChange={e => setForm({...form, is_published: e.target.checked})}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#134E39' }}
                />
                <label htmlFor="notif-pub" style={{ fontSize: '0.85rem', fontWeight: '750', color: '#334155', cursor: 'pointer', userSelect: 'none' }}>
                  Terbitkan Testimoni ini di Landing Page
                </label>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  style={{ 
                    flex: 1, background: 'white', color: '#475569', border: '1.5px solid #cbd5e1', 
                    padding: '0.85rem', borderRadius: '10px', fontWeight: '800', 
                    fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s' 
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'white'}
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  style={{ 
                    flex: 2, background: '#134E39', color: 'white', border: 'none', 
                    padding: '0.85rem', borderRadius: '10px', fontWeight: '900', 
                    fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s',
                    boxShadow: '0 8px 20px rgba(19, 78, 57, 0.15)'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#0e3a2a'}
                  onMouseLeave={e => e.currentTarget.style.background = '#134E39'}
                >
                  {saving ? <Loader className="spin" size={18} /> : <Save size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />} 
                  <span style={{ verticalAlign: 'middle' }}>Simpan Testimoni</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
