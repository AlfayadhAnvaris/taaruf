import React, { useState } from 'react';
import { MessageSquare, Send, CheckCircle2, Star, AlertCircle } from 'lucide-react';
import { supabase } from '../../supabase';

export default function FeedbackTab({ user, showAlert }) {
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('umum');
  const [rating, setRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('site_feedback').insert([{
        user_id: user.id,
        content: content.trim(),
        category,
        rating,
        created_at: new Date().toISOString()
      }]);

      if (error) throw error;

      setIsSuccess(true);
      setContent('');
      showAlert('Terima Kasih', 'Saran dan masukan Anda sangat berarti bagi perkembangan Mawaddah.', 'success');
    } catch (err) {
      console.error('Error submitting feedback:', err);
      showAlert('Gagal Mengirim', 'Terjadi kesalahan saat mengirim masukan. Pastikan tabel site_feedback sudah ada.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center', padding: '3rem', animation: 'fadeInUp 0.6s ease' }}>
        <div style={{ width: '80px', height: '80px', background: '#f0fdf4', color: '#166534', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
          <CheckCircle2 size={40} />
        </div>
        <h2 style={{ color: '#134E39', fontWeight: '900', marginBottom: '1rem' }}>Masukan Terkirim!</h2>
        <p style={{ color: '#64748b', lineHeight: 1.6, marginBottom: '2rem' }}>
          Jazakumullahu Khairan atas waktu Anda. Saran dan masukan Anda akan kami tinjau untuk meningkatkan pelayanan Mawaddah agar lebih baik lagi.
        </p>
        <button className="btn btn-primary" onClick={() => setIsSuccess(false)}>Kirim Masukan Lainnya</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', animation: 'fadeIn 0.4s ease' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: '900', color: '#134E39', marginBottom: '0.5rem' }}>Saran & Masukan</h2>
        <p style={{ color: '#64748b' }}>Bantu kami menjadi lebih baik dalam melayani proses taaruf Anda.</p>
      </div>

      <div className="card" style={{ padding: '2.5rem' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#134E39', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>
              Kategori Masukan
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
              {[
                { id: 'umum', label: 'Umum', icon: <MessageSquare size={16}/> },
                { id: 'akademi', label: 'Akademi', icon: <Star size={16}/> },
                { id: 'match', label: 'Taaruf Match', icon: <AlertCircle size={16}/> },
                { id: 'bug', label: 'Lapor Bug', icon: <AlertCircle size={16}/> },
              ].map(cat => (
                <div 
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  style={{ 
                    padding: '1rem', borderRadius: '16px', border: '2px solid', 
                    borderColor: category === cat.id ? '#134E39' : '#f1f5f9',
                    background: category === cat.id ? 'rgba(19,78,57,0.05)' : 'white',
                    cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.75rem'
                  }}
                >
                  <div style={{ color: category === cat.id ? '#134E39' : '#94a3b8' }}>{cat.icon}</div>
                  <span style={{ fontWeight: '700', fontSize: '0.9rem', color: category === cat.id ? '#134E39' : '#64748b' }}>{cat.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#134E39', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>
              Tingkat Kepuasan (Rating)
            </label>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: rating >= star ? '#D4AF37' : '#e2e8f0', transition: 'transform 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <Star size={32} fill={rating >= star ? '#D4AF37' : 'none'} />
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#134E39', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>
              Apa yang bisa kami tingkatkan?
            </label>
            <textarea 
              required
              placeholder="Tuliskan saran, masukan, atau kendala yang Anda alami..."
              style={{ width: '100%', minHeight: '150px', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0', fontSize: '1rem', lineHeight: '1.6', outline: 'none', transition: 'border-color 0.2s' }}
              value={content}
              onChange={e => setContent(e.target.value)}
              onFocus={e => e.target.style.borderColor = '#134E39'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting || !content.trim()}
            style={{ 
              width: '100%', background: '#134E39', color: 'white', border: 'none', 
              padding: '1.25rem', borderRadius: '16px', fontWeight: '900', fontSize: '1rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
              cursor: (isSubmitting || !content.trim()) ? 'not-allowed' : 'pointer',
              opacity: (isSubmitting || !content.trim()) ? 0.7 : 1,
              boxShadow: '0 10px 20px rgba(19,78,57,0.2)'
            }}
          >
            {isSubmitting ? 'MENGIRIM...' : <><Send size={18} /> KIRIM MASUKAN</>}
          </button>
        </form>
      </div>

      <div style={{ marginTop: '2.5rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(19,78,57,0.1)', color: '#134E39', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <MessageSquare size={20} />
        </div>
        <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
          Kontribusi Anda membantu kami mewujudkan platform taaruf yang lebih baik, aman, dan syar'i. Syukran wa jazakumullahu khairan.
        </p>
      </div>
    </div>
  );
}
