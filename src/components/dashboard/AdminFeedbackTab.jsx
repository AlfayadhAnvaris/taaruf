import React, { useState, useEffect, useContext } from 'react';
import { MessageSquare, Star, Clock, Filter, Trash2, PieChart as PieChartIcon } from 'lucide-react';
import { supabase } from '../../supabase';
import { AppContext } from '../../App';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export default function AdminFeedbackTab({ showAlert }) {
  const { setConfirmState } = useContext(AppContext);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('site_feedback')
        .select('*, profiles(name, email)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFeedback(data || []);
    } catch (err) {
      console.error('Error fetching feedback:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = (id) => {
    setConfirmState({
      isOpen: true,
      title: 'Hapus Masukan?',
      message: 'Apakah Anda yakin ingin menghapus data ini secara permanen?',
      onConfirm: async () => {
        try {
          const { error } = await supabase.from('site_feedback').delete().eq('id', id);
          if (error) throw error;
          setFeedback(prev => prev.filter(f => f.id !== id));
          showAlert('Berhasil', 'Data telah dihapus.', 'success');
        } catch (err) {
          showAlert('Error', 'Gagal menghapus data.', 'error');
        } finally {
          setConfirmState(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const filteredFeedback = feedback.filter(f => filter === 'all' || f.category === filter);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem' }}>Memuat data masukan...</div>;
  }

  // Calculate Category Stats
  const categories = ['umum', 'akademi', 'match', 'bug'];
  const catStats = categories.map(cat => ({
    name: cat.charAt(0).toUpperCase() + cat.slice(1),
    value: feedback.filter(f => f.category === cat).length,
    color: cat === 'bug' ? '#ef4444' : (cat === 'match' ? '#134E39' : (cat === 'akademi' ? '#D4AF37' : '#94a3b8'))
  })).filter(d => d.value > 0);

  const avgRating = feedback.length > 0 
    ? (feedback.reduce((acc, curr) => acc + (curr.rating || 0), 0) / feedback.length).toFixed(1)
    : 0;

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      {/* 📊 Summary Analytics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1.5rem', display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <div style={{ flex: '1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
              <div style={{ background: 'rgba(19,78,57,0.05)', color: '#134E39', padding: '10px', borderRadius: '12px' }}>
                <PieChartIcon size={20} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '900', color: '#1e293b' }}>Statistik Masukan</h3>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
               <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '16px', flex: 1, border: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>Rating Avg</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#134E39' }}>{avgRating} <Star size={14} fill="#D4AF37" color="#D4AF37" /></div>
               </div>
               <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '16px', flex: 1, border: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>Total</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#1e293b' }}>{feedback.length}</div>
               </div>
            </div>
          </div>
          <div style={{ width: '120px', height: '100px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={catStats} cx="50%" cy="50%" innerRadius={30} outerRadius={45} paddingAngle={5} dataKey="value" stroke="none">
                  {catStats.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} cornerRadius={4} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h3 style={{ margin: 0, fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MessageSquare size={20} color="#134E39" /> Saran & Masukan Situs
          </h3>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Filter size={16} color="#94a3b8" />
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              style={{ padding: '0.5rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', fontSize: '0.85rem', outline: 'none' }}
            >
              <option value="all">Semua Kategori</option>
              <option value="umum">Umum</option>
              <option value="akademi">Akademi</option>
              <option value="match">Matchmaking</option>
              <option value="bug">Bug</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {filteredFeedback.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
              <MessageSquare size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
              <p>Belum ada masukan untuk kategori ini.</p>
            </div>
          ) : filteredFeedback.map(item => (
            <div key={item.id} style={{ padding: '1.5rem', borderRadius: '16px', background: '#f8fafc', border: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'white', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#134E39' }}>
                    {item.profiles?.name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '0.9rem' }}>{item.profiles?.name || 'User Terhapus'}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{item.profiles?.email}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '2px', color: '#D4AF37', marginBottom: '0.25rem' }}>
                    {[1, 2, 3, 4, 5].map(s => <Star key={s} size={12} fill={item.rating >= s ? '#D4AF37' : 'none'} color={item.rating >= s ? '#D4AF37' : '#e2e8f0'} />)}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                    <Clock size={10} /> {new Date(item.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
              <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', marginBottom: '1rem', border: '1px solid #f1f5f9', fontSize: '0.9rem' }}>{item.content}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', padding: '4px 10px', borderRadius: '99px', background: item.category === 'bug' ? '#fee2e2' : 'rgba(19,78,57,0.1)', color: item.category === 'bug' ? '#dc2626' : '#134E39' }}>{item.category}</span>
                <button onClick={() => deleteItem(item.id)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Trash2 size={14} /> Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
