import React, { useState } from 'react';
import { MessageSquare, Send, CheckCircle2, Star, AlertCircle, Sparkles, Heart, Quote, Info, ChevronRight } from 'lucide-react';
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
      showAlert('Terima Kasih', 'Saran dan masukan Anda sangat berarti bagi perkembangan Separuh Agama.', 'success');
    } catch (err) {
      console.error('Error submitting feedback:', err);
      showAlert('Gagal Mengirim', 'Terjadi kesalahan saat mengirim masukan.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '60vh', background: 'white', animation: 'fadeIn 0.5s ease', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: '1.5rem' }}>
          <div style={{ width: '80px', height: '80px', background: 'rgba(19,78,57,0.05)', color: '#134E39', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', boxShadow: '0 10px 25px rgba(0,0,0,0.02)' }}>
            <CheckCircle2 size={40} />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '900', color: '#134E39', marginBottom: '0.75rem' }}>Masukan Diterima</h2>
          <p style={{ color: '#64748b', marginBottom: '2rem', fontWeight: '500', fontSize: '0.95rem' }}>Terima kasih atas partisipasi Anda.</p>
          <button 
            onClick={() => setIsSuccess(false)}
            style={{ background: '#134E39', color: 'white', border: 'none', padding: '0.8rem 2rem', borderRadius: '8px', fontWeight: '800', cursor: 'pointer', fontSize: '0.9rem' }}
          >
            KEMBALI
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100%', width: '100%', background: 'white', 
      animation: 'fadeIn 0.5s ease', padding: '1.5rem 2rem'
    }}>
      {/* HEADER CONSISTENCY */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#134E39', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
          Saran & <span style={{ color: '#D4AF37' }}>Masukan</span>
        </h1>
        <p style={{ fontSize: '0.95rem', color: '#64748b', fontWeight: '500', margin: 0 }}>
          Bantu kami mewujudkan platform taaruf yang lebih baik, aman, dan syar'i.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* TOP ROW: CATEGORY & RATING GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          
          {/* CATEGORY SECTION */}
          <div style={{ background: '#F8FAF9', padding: '1.75rem', borderRadius: '12px', border: '1px solid #F1F5F9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#134E39', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MessageSquare size={16} />
              </div>
              <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '900', color: '#134E39', letterSpacing: '0.02em' }}>PILIH KATEGORI</h3>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              {[
                { id: 'umum', label: 'Umum', desc: 'Saran general' },
                { id: 'akademi', label: 'Akademi', desc: 'Materi Belajar' },
                { id: 'match', label: 'Match', desc: 'Fitur Cari' },
                { id: 'bug', label: 'Technical', desc: 'Error/Bug' },
              ].map(cat => (
                <button 
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  style={{ 
                    padding: '1rem', borderRadius: '8px', border: '2px solid', 
                    borderColor: category === cat.id ? '#134E39' : '#FFFFFF',
                    background: category === cat.id ? '#FFFFFF' : '#FFFFFF',
                    color: category === cat.id ? '#134E39' : '#64748b',
                    cursor: 'pointer', transition: 'all 0.3s ease',
                    textAlign: 'left', position: 'relative',
                    boxShadow: category === cat.id ? '0 8px 15px rgba(19,78,57,0.06)' : '0 2px 8px rgba(0,0,0,0.01)'
                  }}
                >
                  <div style={{ fontWeight: '900', fontSize: '0.9rem', marginBottom: '2px', color: category === cat.id ? '#134E39' : '#475569' }}>{cat.label}</div>
                  <div style={{ fontSize: '0.7rem', fontWeight: '600', color: category === cat.id ? '#10B981' : '#94a3b8' }}>{cat.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* RATING SECTION */}
          <div style={{ background: '#FFFCF5', padding: '1.75rem', borderRadius: '12px', border: '1px solid #FFF1CC', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.75rem' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#D4AF37', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Star size={16} fill="white" />
              </div>
              <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '900', color: '#134E39', letterSpacing: '0.02em' }}>TINGKAT KEPUASAN</h3>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '1.25rem', borderRadius: '10px', border: '1px solid #FFF1CC' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', transition: 'all 0.2s', padding: 0 }}
                  >
                    <Star 
                      size={32} 
                      fill={rating >= star ? '#D4AF37' : 'none'} 
                      color={rating >= star ? '#D4AF37' : '#E2E8F0'} 
                      strokeWidth={1.5}
                    />
                  </button>
                ))}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1rem', fontWeight: '950', color: '#134E39' }}>{rating}/5</div>
                <div style={{ fontSize: '0.7rem', fontWeight: '800', color: '#D4AF37', textTransform: 'uppercase' }}>
                  {rating === 5 ? 'Luar Biasa' : rating === 4 ? 'Puas' : rating === 3 ? 'Baik' : rating === 2 ? 'Cukup' : 'Kurang'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: TEXTAREA */}
        <div style={{ position: 'relative' }}>
          <div style={{ background: '#F8FAFC', padding: '2rem', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#134E39', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Send size={14} />
              </div>
              <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '900', color: '#134E39', letterSpacing: '0.02em' }}>PESAN & MASUKAN ANDA</h3>
            </div>
            
            <textarea 
              required
              placeholder="Tuliskan saran atau kendala Anda di sini..."
              style={{ 
                width: '100%', minHeight: '160px', padding: '1.25rem', borderRadius: '10px', 
                border: '2px solid #E2E8F0', fontSize: '1rem', lineHeight: '1.6', outline: 'none', 
                resize: 'none', color: '#1e293b', background: 'white',
                fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600,
                transition: 'all 0.3s ease'
              }}
              onFocus={e => { e.target.style.borderColor = '#134E39'; }}
              onBlur={e => { e.target.style.borderColor = '#E2E8F0'; }}
              value={content}
              onChange={e => setContent(e.target.value)}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button 
                type="submit" 
                disabled={isSubmitting || !content.trim()}
                style={{ 
                  background: '#134E39', color: 'white', border: 'none', 
                  padding: '1rem 3rem', borderRadius: '8px', fontWeight: '950', fontSize: '1rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  cursor: (isSubmitting || !content.trim()) ? 'not-allowed' : 'pointer',
                  opacity: (isSubmitting || !content.trim()) ? 0.7 : 1,
                  transition: 'all 0.3s',
                  boxShadow: '0 10px 20px rgba(19,78,57,0.1)'
                }}
              >
                {isSubmitting ? 'MENGIRIM...' : <><Send size={18} /> KIRIM SEKARANG</>}
              </button>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
}
