import React, { useState, useEffect, useContext } from 'react';
import { MessageSquare, Star, Clock, User, Filter, Trash2 } from 'lucide-react';
import { supabase } from '../../supabase';
import { AppContext } from '../../App';

export default function AdminFeedbackTab({ showAlert }) {
  const { setConfirmState } = useContext(AppContext);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('site_feedback')
        .select('*, profiles(name, email)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFeedback(data || []);
    } catch (err) {
      console.error('Error fetching feedback:', err);
      showAlert('Error', 'Gagal mengambil data masukan.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const deleteFeedback = (id) => {
    setConfirmState({
      isOpen: true,
      title: 'Hapus Masukan?',
      message: 'Apakah Anda yakin ingin menghapus masukan ini secara permanen?',
      onConfirm: async () => {
        try {
          const { error } = await supabase.from('site_feedback').delete().eq('id', id);
          if (error) throw error;
          setFeedback(prev => prev.filter(f => f.id !== id));
          showAlert('Berhasil', 'Masukan telah dihapus.', 'success');
        } catch (err) {
          showAlert('Error', 'Gagal menghapus masukan.', 'error');
        } finally {
          setConfirmState(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const filteredFeedback = feedback.filter(f => filter === 'all' || f.category === filter);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem' }}>Memuat masukan...</div>;
  }

  return (
    <div className="card" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h3 style={{ margin: 0, fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <MessageSquare size={20} color="var(--primary)" /> Masukan Pengguna
        </h3>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Filter size={16} color="var(--text-muted)" />
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            style={{ padding: '0.5rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', fontSize: '0.85rem' }}
          >
            <option value="all">Semua Kategori</option>
            <option value="umum">Umum</option>
            <option value="akademi">Akademi</option>
            <option value="match">Matchmaking</option>
            <option value="bug">Bug</option>
          </select>
        </div>
      </div>

      {filteredFeedback.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <MessageSquare size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
          <p>Belum ada masukan untuk kategori ini.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {filteredFeedback.map(item => (
            <div key={item.id} style={{ padding: '1.5rem', borderRadius: '16px', background: '#f8fafc', border: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'white', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'var(--primary)' }}>
                    {item.profiles?.name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '0.9rem' }}>{item.profiles?.name || 'User Terhapus'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.profiles?.email}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '2px', color: '#D4AF37', marginBottom: '0.25rem' }}>
                    {[1, 2, 3, 4, 5].map(s => <Star key={s} size={12} fill={item.rating >= s ? '#D4AF37' : 'none'} />)}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                    <Clock size={10} /> {new Date(item.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
              
              <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', marginBottom: '1rem', border: '1px solid #f1f5f9', fontSize: '0.9rem', lineHeight: '1.6' }}>
                {item.content}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ 
                  fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', 
                  padding: '4px 10px', borderRadius: '99px',
                  background: item.category === 'bug' ? '#fee2e2' : 'rgba(19,78,57,0.1)',
                  color: item.category === 'bug' ? '#dc2626' : '#134E39'
                }}>
                  {item.category}
                </span>
                
                <button 
                  onClick={() => deleteFeedback(item.id)}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#dc2626'}
                  onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                >
                  <Trash2 size={14} /> Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
