"use client";
import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Star, Quote, User, ChevronDown, Plus, 
  MessageSquare, Award, TrendingUp, BarChart3
} from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';

const C = {
  primary: '#134E39',
  gold: '#D4AF37',
  surface: '#F8FAFC',
  border: '#E2E8F0',
  text: '#1e293b',
  muted: '#64748b',
};

export default function ReviewKesanPage({ userId }) {
  const router = useRouter();
  const { user, userReviews, setUserReviews, cvs, showToast, getAcademyBadge } = useAppContext();

  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'highest', 'lowest'
  const [showForm, setShowForm] = useState(false);

  const targetCv = cvs.find(cv => cv.user_id === userId);
  const isOwnProfile = user?.id === userId;

  const reviews = useMemo(() => {
    let filtered = (userReviews || []).filter(r => r.target_id === userId && r.is_active !== false);
    switch (sortBy) {
      case 'oldest': return filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      case 'highest': return filtered.sort((a, b) => b.rating - a.rating);
      case 'lowest': return filtered.sort((a, b) => a.rating - b.rating);
      default: return filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
  }, [userReviews, userId, sortBy]);

  const stats = useMemo(() => {
    if (reviews.length === 0) return { avg: 0, total: 0, dist: [0, 0, 0, 0, 0] };
    const avg = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
    const dist = [1, 2, 3, 4, 5].map(s => reviews.filter(r => r.rating === s).length);
    return { avg, total: reviews.length, dist };
  }, [reviews]);

  const badge = getAcademyBadge ? getAcademyBadge(userId) : null;

  const handleSubmitReview = async () => {
    if (!newComment.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.from('user_reviews').insert({
        reviewer_id: user.id,
        target_id: userId,
        rating: newRating,
        comment: newComment.trim()
      }).select('*, reviewer:reviewer_id(name)').single();

      if (error) throw error;
      setUserReviews([data, ...userReviews]);
      setNewComment('');
      setNewRating(5);
      setShowForm(false);
      showToast('Review & Kesan Anda berhasil disimpan.', 'success');
    } catch {
      showToast('Gagal menyimpan review. Silakan coba lagi.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#FAFCFB' }}>
      <style>{`
        .review-page {
          max-width: 860px;
          margin: 0 auto;
          padding: 2.5rem 5%;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .review-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: none;
          border: none;
          color: ${C.primary};
          font-weight: 800;
          font-size: 0.85rem;
          cursor: pointer;
          padding: 0.6rem 0;
          margin-bottom: 2rem;
          transition: opacity 0.2s;
        }
        .review-back-btn:hover { opacity: 0.7; }
        .review-hero {
          background: linear-gradient(135deg, ${C.primary} 0%, #1a5d46 100%);
          border-radius: 24px;
          padding: 2.5rem;
          color: white;
          margin-bottom: 2rem;
          position: relative;
          overflow: hidden;
        }
        .review-hero::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -20%;
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(212,175,55,0.12) 0%, transparent 70%);
          border-radius: 50%;
        }
        .review-hero-content {
          position: relative;
          z-index: 1;
        }
        .review-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1.25rem;
          margin-bottom: 2rem;
        }
        .review-stat-card {
          background: white;
          border: 1px solid #f1f5f9;
          border-radius: 16px;
          padding: 1.5rem;
          text-align: center;
          transition: all 0.3s;
        }
        .review-stat-card:hover {
          border-color: rgba(19,78,57,0.12);
          box-shadow: 0 8px 30px rgba(19,78,57,0.04);
          transform: translateY(-2px);
        }
        .review-card {
          background: white;
          border: 1px solid #f1f5f9;
          border-radius: 20px;
          padding: 1.75rem;
          margin-bottom: 1.25rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .review-card:hover {
          border-color: rgba(212,175,55,0.2);
          box-shadow: 0 12px 40px rgba(19,78,57,0.04);
        }
        .review-form-card {
          background: white;
          border: 2px solid rgba(212,175,55,0.2);
          border-radius: 24px;
          padding: 2.5rem;
          margin-bottom: 2rem;
          box-shadow: 0 8px 30px rgba(212,175,55,0.06);
        }
        .review-textarea {
          width: 100%;
          padding: 1.25rem;
          border-radius: 14px;
          border: 1.5px solid #f1f5f9;
          min-height: 140px;
          font-size: 0.95rem;
          outline: none;
          resize: none;
          background: ${C.surface};
          line-height: 1.7;
          color: ${C.text};
          font-family: 'Plus Jakarta Sans', sans-serif;
          transition: border-color 0.2s;
        }
        .review-textarea:focus { border-color: ${C.primary}; }
        .review-submit-btn {
          width: 100%;
          background: ${C.primary};
          color: white;
          border: none;
          padding: 1.1rem;
          border-radius: 16px;
          font-weight: 900;
          font-size: 0.95rem;
          cursor: pointer;
          box-shadow: 0 12px 30px rgba(19,78,57,0.15);
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .review-submit-btn:hover:not(:disabled) {
          background: #1a5d46;
          transform: translateY(-2px);
          box-shadow: 0 16px 40px rgba(19,78,57,0.2);
        }
        .review-submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .review-sort-select {
          padding: 0.6rem 2rem 0.6rem 1rem;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
          font-size: 0.8rem;
          font-weight: 700;
          color: ${C.primary};
          background: white;
          cursor: pointer;
          outline: none;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23134E39' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 0.7rem center;
        }
        .review-add-btn {
          background: ${C.primary};
          color: white;
          border: none;
          padding: 0.65rem 1.25rem;
          border-radius: 12px;
          font-weight: 800;
          font-size: 0.8rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
          box-shadow: 0 6px 20px rgba(19,78,57,0.15);
        }
        .review-add-btn:hover {
          background: #1a5d46;
          transform: translateY(-1px);
        }
        .rating-dist-bar {
          height: 8px;
          background: #f1f5f9;
          border-radius: 99px;
          flex: 1;
          overflow: hidden;
        }
        .rating-dist-fill {
          height: 100%;
          border-radius: 99px;
          background: ${C.gold};
          transition: width 0.5s ease;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .review-animate {
          animation: fadeInUp 0.4s ease forwards;
        }
        @media (max-width: 640px) {
          .review-page { padding: 1.5rem 4%; }
          .review-hero { padding: 2rem 1.5rem; border-radius: 18px; }
          .review-form-card { padding: 1.75rem; }
          .review-card { padding: 1.25rem; }
        }
      `}</style>

      <div className="review-page">
        {/* Back Button */}
        <button className="review-back-btn" onClick={() => router.back()}>
          <ArrowLeft size={18} /> KEMBALI
        </button>

        {/* Hero Header */}
        <div className="review-hero review-animate">
          <div className="review-hero-content">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '1rem' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '16px',
                background: 'rgba(255,255,255,0.12)',
                border: '2px solid rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.5rem', fontWeight: '950', color: 'white',
                overflow: 'hidden'
              }}>
                {targetCv?.foto_url ? (
                  <img src={targetCv.foto_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  targetCv?.alias?.charAt(0)?.toUpperCase() || <User size={28} />
                )}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <h1 style={{ margin: 0, fontSize: 'clamp(1.3rem, 4vw, 1.75rem)', fontWeight: '950' }}>
                    {targetCv?.alias || 'Kandidat'}
                  </h1>
                  {badge && (
                    <span style={{
                      background: 'rgba(212,175,55,0.2)', color: '#D4AF37',
                      padding: '3px 10px', borderRadius: '6px',
                      fontSize: '0.65rem', fontWeight: '900', textTransform: 'uppercase',
                      border: '1px solid rgba(212,175,55,0.3)'
                    }}>
                      {badge.label}
                    </span>
                  )}
                </div>
                <p style={{ margin: 0, opacity: 0.7, fontSize: '0.85rem', fontWeight: '600' }}>
                  {targetCv?.domisili_kota && targetCv?.domisili_provinsi
                    ? `${targetCv.domisili_kota}, ${targetCv.domisili_provinsi}`
                    : 'Indonesia'
                  }
                  {targetCv?.age ? ` · ${targetCv.age} Tahun` : ''}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Star size={18} fill="#D4AF37" color="#D4AF37" />
              <span style={{ fontSize: '0.75rem', fontWeight: '700', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Review & Kesan Kandidat
              </span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="review-stats-grid review-animate" style={{ animationDelay: '0.1s' }}>
          <div className="review-stat-card">
            <div style={{ width: 48, height: 48, borderRadius: '14px', background: 'rgba(212,175,55,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem', color: C.gold }}>
              <Star size={24} fill={C.gold} />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '950', color: C.primary, lineHeight: 1 }}>
              {stats.avg ? stats.avg.toFixed(1) : '—'}
            </div>
            <div style={{ fontSize: '0.72rem', fontWeight: '700', color: C.muted, marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Rata-rata Rating
            </div>
          </div>

          <div className="review-stat-card">
            <div style={{ width: 48, height: 48, borderRadius: '14px', background: 'rgba(19,78,57,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem', color: C.primary }}>
              <MessageSquare size={24} />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '950', color: C.primary, lineHeight: 1 }}>
              {stats.total}
            </div>
            <div style={{ fontSize: '0.72rem', fontWeight: '700', color: C.muted, marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Review
            </div>
          </div>

          <div className="review-stat-card">
            <div style={{ padding: '0.5rem 0' }}>
              {[5, 4, 3, 2, 1].map(s => {
                const count = stats.dist[s - 1];
                const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
                return (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: '800', color: C.muted, width: '12px', textAlign: 'right' }}>{s}</span>
                    <Star size={10} fill={C.gold} color={C.gold} />
                    <div className="rating-dist-bar">
                      <div className="rating-dist-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <span style={{ fontSize: '0.65rem', fontWeight: '700', color: C.muted, width: '18px' }}>{count}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ fontSize: '0.72rem', fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Distribusi Rating
            </div>
          </div>
        </div>

        {/* Toolbar: Sort + Add */}
        <div className="review-animate" style={{ 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
          marginBottom: '1.5rem', animationDelay: '0.15s',
          flexWrap: 'wrap', gap: '0.75rem'
        }}>
          <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '900', color: C.primary }}>
            Semua Kesan ({reviews.length})
          </h2>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <select 
              value={sortBy} 
              onChange={e => setSortBy(e.target.value)} 
              className="review-sort-select"
            >
              <option value="newest">Terbaru</option>
              <option value="oldest">Terlama</option>
              <option value="highest">Rating Tertinggi</option>
              <option value="lowest">Rating Terendah</option>
            </select>
            {!isOwnProfile && (
              <button className="review-add-btn" onClick={() => setShowForm(!showForm)}>
                <Plus size={16} /> Berikan Kesan
              </button>
            )}
          </div>
        </div>

        {/* Submit Form (Conditionally visible) */}
        {showForm && !isOwnProfile && (
          <div className="review-form-card review-animate">
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '2rem' }}>
              <div style={{
                width: 52, height: 52, borderRadius: '14px',
                background: `rgba(19,78,57,0.06)`, color: C.primary,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Quote size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: C.primary, margin: 0 }}>
                  Berikan Kesan Anda
                </h3>
                <p style={{ margin: 0, color: C.muted, fontSize: '0.8rem', fontWeight: '600' }}>
                  Sampaikan pendapat jujur Anda untuk {targetCv?.alias || 'Kandidat'}
                </p>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '800', color: C.muted, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Seberapa berkesan profil ini?
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                {[1, 2, 3, 4, 5].map(s => (
                  <Star
                    key={s} size={36}
                    color={s <= newRating ? C.gold : '#e2e8f0'}
                    fill={s <= newRating ? C.gold : 'transparent'}
                    style={{ 
                      cursor: 'pointer', transition: 'all 0.2s', 
                      transform: s <= newRating ? 'scale(1.12)' : 'scale(1)',
                      filter: s <= newRating ? 'drop-shadow(0 2px 8px rgba(212,175,55,0.3))' : 'none'
                    }}
                    onClick={() => setNewRating(s)}
                  />
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '1.75rem' }}>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '800', color: C.muted, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Tuliskan Kesan Anda
              </label>
              <textarea
                className="review-textarea"
                placeholder="Apa yang membuat Anda tertarik dengan profil ini? Berikan kesan yang membangun..."
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
              />
            </div>

            <button
              className="review-submit-btn"
              disabled={isSubmitting || !newComment.trim()}
              onClick={handleSubmitReview}
            >
              {isSubmitting ? 'MENGIRIM...' : (<><Quote size={16} /> KIRIM KESAN SEKARANG</>)}
            </button>
          </div>
        )}

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <div className="review-animate" style={{
            textAlign: 'center', padding: '5rem 2rem',
            background: 'white', borderRadius: '24px',
            border: '2px dashed #e2e8f0', animationDelay: '0.2s'
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: C.surface, display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.5rem', border: '1px solid #f1f5f9'
            }}>
              <Quote size={32} color="#cbd5e1" />
            </div>
            <h3 style={{ color: C.primary, fontWeight: '900', fontSize: '1.15rem', margin: '0 0 0.5rem' }}>
              Belum Ada Kesan
            </h3>
            <p style={{ margin: 0, color: C.muted, fontSize: '0.88rem', fontWeight: '500', maxWidth: '380px', marginInline: 'auto', lineHeight: 1.6 }}>
              {isOwnProfile 
                ? 'Belum ada kandidat yang memberikan kesan untuk profil Anda.'
                : 'Jadilah yang pertama memberikan kesan untuk kandidat ini.'
              }
            </p>
          </div>
        ) : (
          <div>
            {reviews.map((review, idx) => (
              <div 
                key={review.id} 
                className="review-card review-animate"
                style={{ animationDelay: `${0.2 + idx * 0.05}s` }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: '12px',
                      background: `linear-gradient(135deg, ${C.primary} 0%, #1a5d46 100%)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.95rem', fontWeight: '900', color: 'white', flexShrink: 0
                    }}>
                      {review.reviewer?.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <span style={{ fontWeight: '800', color: C.primary, fontSize: '0.95rem', display: 'block' }}>
                        {review.reviewer?.name || 'Anonim'}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: C.muted, fontWeight: '600' }}>
                        {new Date(review.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  <div style={{
                    display: 'flex', gap: '3px',
                    background: 'rgba(212,175,55,0.06)', padding: '5px 10px',
                    borderRadius: '8px', border: '1px solid rgba(212,175,55,0.12)'
                  }}>
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} size={13} color={s <= review.rating ? C.gold : '#e2e8f0'} fill={s <= review.rating ? C.gold : 'transparent'} />
                    ))}
                  </div>
                </div>
                <div style={{
                  padding: '1rem 1.25rem', background: C.surface,
                  borderRadius: '12px', border: '1px solid #f1f5f9'
                }}>
                  <p style={{
                    margin: 0, fontSize: '0.9rem', color: '#334155',
                    lineHeight: 1.75, fontWeight: '500', fontStyle: 'italic'
                  }}>
                    &ldquo;{review.comment}&rdquo;
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
