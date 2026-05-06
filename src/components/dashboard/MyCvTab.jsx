import React, { useState } from 'react';
import { 
  ChevronLeft, User, Settings, Eye, Clock, MapPin, Heart, Compass, 
  ShieldCheck, ShieldAlert, ArrowRight, Target, GraduationCap, Briefcase, CheckCircle, 
  X, Users, Sparkles, Award, Quote, BookOpen, Star, BadgeCheck, Bookmark, Plus
} from 'lucide-react';
import { supabase } from '../../supabase';
import { AppContext } from '../../App';

// ─── Shared design tokens ────────────────────────────────────────────────────
const C = {
  primary: '#134E39',   /* Hijau Tua */
  primaryLt: '#1a5d46',
  emerald: '#10B981',   /* Emerald accent */
  gold:    '#D4AF37',
  surface: '#F8FAFC',
  border:  '#E2E8F0',
  text:    '#1e293b',
  muted:   '#64748b',
  white:   '#FFFFFF',
};

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  .cv-root * { box-sizing: border-box; }

  .cv-root {
    font-family: 'Plus Jakarta Sans', sans-serif;
    color: ${C.text};
    width: 100%;
    min-height: 100%;
    display: flex;
    background: white;
  }

  .cv-split-container {
    display: flex;
    width: 100%;
    min-height: 100%;
  }

  /* ── LEFT PANEL ── */
  .cv-left-panel {
    flex: 0 0 320px;
    background: #F8FAFC;
    border-right: 1px solid ${C.border};
    padding: 2.5rem 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    min-height: 100%;
  }

  .cv-avatar-container {
    width: 130px; height: 130px;
    margin-bottom: 2rem;
  }
  .cv-avatar {
    width: 100%; height: 100%;
    border-radius: 48px;
    background: white;
    border: 1px solid rgba(19, 78, 57, 0.1);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.05);
  }

  .cv-name {
    font-size: 2.2rem;
    font-weight: 900; margin: 0; line-height: 1.1;
    color: ${C.primary};
    letter-spacing: -0.02em;
  }

  .cv-meta-v {
    display: flex; flex-direction: column; gap: 10px; margin: 2rem 0; width: 100%;
  }
  .cv-meta-v span { 
    display: flex; align-items: center; gap: 12px; 
    padding: 12px 18px; background: white; border-radius: 16px;
    border: 1px solid ${C.border}; font-weight: 700; color: ${C.primary}; font-size: 0.9rem;
  }

  .cv-vision-side {
    background: white; border-radius: 28px; padding: 2rem; 
    border: 1px solid ${C.border}; text-align: left; width: 100%;
    margin-top: auto;
  }
  .cv-vision-side label {
    display: block; font-size: 0.7rem; font-weight: 900; color: ${C.gold}; 
    text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 10px;
  }
  .cv-vision-side p {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 1.1rem; line-height: 1.6; color: ${C.text};
    font-weight: 700; font-style: italic; margin: 0;
  }

  /* ── RIGHT PANEL ── */
  .cv-right-panel {
    flex: 1;
    padding: 2.5rem;
    display: flex;
    flex-direction: column;
    gap: 2rem;
    background: white;
    min-height: 100%;
  }

  .cv-grid-full {
    display: grid; 
    grid-template-columns: repeat(4, 1fr); 
    gap: 1.5rem;
  }

  .cv-card-compact {
    background: white; padding: 1.25rem; border-radius: 24px;
    border: 1px solid ${C.border}; display: flex; flex-direction: column;
    height: 100%;
  }
  
  .cv-card-header-compact {
    display: flex; align-items: flex-start; gap: 12px; margin-bottom: 1.25rem;
  }
  .cv-card-header-compact i {
    width: 36px; height: 36px; border-radius: 12px; flex-shrink: 0;
    background: rgba(19,78,57,0.05); color: ${C.primary};
    display: flex; align-items: center; justify-content: center;
  }
  .cv-card-header-compact h4 { margin: 0; font-size: 0.95rem; line-height: 1.4; font-weight: 800; color: ${C.primary}; margin-top: 6px; }

  .cv-info-item-compact { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px dashed ${C.border}; }
  .cv-info-item-compact:last-child { margin-bottom: 0; padding-bottom: 0; border-bottom: none; }
  .cv-info-item-compact label { font-size: 0.65rem; font-weight: 800; color: ${C.muted}; text-transform: uppercase; letter-spacing: 0.05em; }
  .cv-info-item-compact span { font-size: 0.9rem; line-height: 1.4; font-weight: 800; color: ${C.text}; text-align: left; word-break: break-word; }

  .cv-screening-full {
    background: #F8FAFC; border-radius: 32px; padding: 2rem;
    border: 1px solid ${C.border};
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .cv-screening-full h3 { font-size: 1.25rem; font-weight: 900; color: ${C.primary}; margin-bottom: 1.5rem; display: flex; alignItems: center; gap: 12px; }

  .cv-q-grid-full {
    display: grid; 
    grid-template-columns: repeat(3, 1fr); 
    gap: 1.25rem;
    overflow-y: auto;
    padding-right: 8px;
  }
  .cv-q-grid-full::-webkit-scrollbar { width: 4px; }
  .cv-q-grid-full::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 10px; }

  .cv-q-item-compact {
    background: white; padding: 1.25rem; border-radius: 20px; border: 1px solid ${C.border};
  }
  .cv-q-item-compact label { display: block; font-size: 0.65rem; font-weight: 800; color: ${C.gold}; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.05em; }
  .cv-q-item-compact p { margin: 0; font-size: 0.9rem; line-height: 1.5; font-weight: 600; color: ${C.primary}; }

  .cv-btn-side {
    width: 100%; padding: 1rem; border-radius: 16px; font-weight: 800; font-size: 0.9rem;
    display: flex; align-items: center; justify-content: center; gap: 10px; cursor: pointer; transition: all 0.2s;
    margin-bottom: 10px;
  }
  .cv-btn-side-primary { background: ${C.primary}; color: white; border: none; }
  .cv-btn-side-outline { background: white; color: ${C.primary}; border: 2px solid ${C.border}; }
  
  @media (max-width: 1200px) {
    .cv-root { height: auto; overflow: visible; display: block; }
    .cv-split-container { flex-direction: column; height: auto; overflow: visible; }
    .cv-left-panel { flex: none; width: 100%; border-right: none; border-bottom: 1px solid ${C.border}; height: auto; padding: 2rem 1.5rem; overflow: visible; }
    .cv-vision-side { margin-top: 1.5rem; }
    .cv-right-panel { flex: none; width: 100%; height: auto; overflow: visible; padding: 1.5rem; gap: 1.5rem; }
    .cv-grid-full { grid-template-columns: repeat(2, 1fr); }
    .cv-q-grid-full { grid-template-columns: repeat(2, 1fr); overflow: visible; }
    .cv-screening-full { height: auto; overflow: visible; }
  }

  @media (max-width: 768px) {
    .cv-left-panel { padding: 1.5rem 1rem; }
    .cv-avatar-container { width: 90px; height: 90px; margin-bottom: 1rem; }
    .cv-avatar { border-radius: 30px; }
    .cv-name { font-size: 1.75rem; }
    .cv-meta-v { margin: 1.25rem 0; gap: 8px; }
    .cv-meta-v span { padding: 10px 14px; font-size: 0.8rem; border-radius: 14px; }
    .cv-vision-side { padding: 1.5rem; margin-top: 1rem; border-radius: 24px; }
    .cv-vision-side p { font-size: 1rem; }
    .cv-btn-side { padding: 0.8rem; font-size: 0.85rem; margin-bottom: 8px; border-radius: 12px; }
    
    .cv-right-panel { padding: 1rem; gap: 1rem; }
    .cv-card-compact { padding: 1.25rem; border-radius: 20px; }
    .cv-screening-full { padding: 1.5rem; border-radius: 24px; }
    .cv-q-item-compact { padding: 1rem; border-radius: 16px; }

    .cv-grid-full { grid-template-columns: 1fr; }
    .cv-q-grid-full { grid-template-columns: 1fr; }
  }

  .cv-info-block {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .cv-info-block label {
    font-size: 0.7rem;
    font-weight: 800;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .cv-info-block span {
    font-size: 1rem;
    font-weight: 700;
    color: #134E39;
    line-height: 1.4;
  }
`;

export default function MyCvTab({ 
  user, myExistingCv, isEditingCv, setIsEditingCv, hasSubmittedCv, 
  cvStep, setCvStep, myCv, setMyCv, isSubmittingCv, handleCvSubmit, 
  isPreviewingCv, setIsPreviewingCv, totalSteps, setPreviewDetail, setActiveTab,
  screeningAnswers, setScreeningAnswers,
  // New props for viewing other CVs
  targetCv = null,
  onAjukanTaaruf = null,
  onBack = null
}) {
  const { userReviews, setUserReviews, showAlert, bookmarks, setBookmarks, setReportModalState } = React.useContext(AppContext);
  const [fullViewItem, setFullViewItem] = useState(null);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [activeViewTab, setActiveViewTab] = useState('cv'); // 'cv', 'aqidah' or 'reviews'
  const [isTogglingBookmark, setIsTogglingBookmark] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const isViewingOther = !!targetCv;
  const displayCv = targetCv || myExistingCv;

  const set = (k, v) => setMyCv(p => ({ ...p, [k]: v }));
  const next = () => setCvStep(s => Math.min(s + 1, 7));
  const back = () => setCvStep(s => Math.max(s - 1, 1));

  const isBookmarked = bookmarks?.some(b => b.target_id === displayCv.user_id);

  const toggleBookmark = async () => {
    if (isTogglingBookmark) return;
    setIsTogglingBookmark(true);
    try {
      if (isBookmarked) {
        const { error } = await supabase.from('user_bookmarks').delete().eq('user_id', user.id).eq('target_id', displayCv.user_id);
        if (error) throw error;
        setBookmarks(bookmarks.filter(b => b.target_id !== displayCv.user_id));
      } else {
        const { data, error } = await supabase.from('user_bookmarks').insert({ user_id: user.id, target_id: displayCv.user_id }).select().single();
        if (error) throw error;
        setBookmarks([...bookmarks, data]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsTogglingBookmark(false);
    }
  };

  React.useEffect(() => {
    const styleId = 'cv-premium-styles';
    if (!document.getElementById(styleId)) {
      const styleEl = document.createElement('style');
      styleEl.id = styleId;
      styleEl.innerHTML = styles;
      document.head.appendChild(styleEl);
    }
  }, []);

  if ((hasSubmittedCv || isViewingOther) && !isEditingCv) {
    return (
      <div key="cv-view-root" className="cv-root-view">
        <style key="cv-style">{`
          .cv-root-view {
            background: #f8fafc; width: 100%; height: calc(100vh - 100px); 
            display: flex; alignItems: center; justifyContent: center; padding: 0 1rem;
            overflow: hidden;
          }
          
          .cv-full-container {
            display: flex; width: 100%; max-width: 1300px; 
            background: white; border-radius: 32px; overflow: hidden;
            border: 1px solid #f1f5f9; box-shadow: 0 10px 40px rgba(0,0,0,0.02);
            height: 100%;
          }
          .cv-side-id {
            width: 320px; flex-shrink: 0; background: white; border-right: 1px solid #f1f5f9;
            padding: 2.5rem 1.5rem; display: flex; flex-direction: column; align-items: center; text-align: center;
            overflow-y: auto; height: 100%;
          }
          .cv-side-id::-webkit-scrollbar { width: 5px; }
          .cv-side-id::-webkit-scrollbar-thumb { background: #f1f5f9; border-radius: 10px; }
          
          .cv-main-body {
            flex: 1; padding: 2.5rem; overflow-y: auto; height: 100%;
            background: #F8FAFC;
          }
          
          .cv-hero-badge {
            background: #134E39; color: white; padding: 6px 16px; border-radius: 99px;
            font-size: 0.7rem; font-weight: 900; letter-spacing: 0.1em; margin-bottom: 2rem;
            display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 4px 12px rgba(19,78,57,0.2);
          }
          
          .cv-stat-card-small {
            width: 100%; min-height: 48px; padding: 0.75rem 1rem; border-radius: 16px; border: 1px solid #f1f5f9;
            background: white; margin-bottom: 6px; display: flex; align-items: center; gap: 12px;
            font-weight: 800; color: #134E39; font-size: 0.85rem; transition: all 0.2s;
            text-align: left; box-shadow: 0 4px 15px rgba(0,0,0,0.02);
          }
          .cv-stat-card-small i {
            width: 32px; height: 32px; border-radius: 10px; background: rgba(19,78,57,0.05);
            display: flex; align-items: center; justify-content: center; color: #D4AF37;
            flex-shrink: 0;
          }
          
          .cv-grid-layout {
            display: grid; grid-template-columns: repeat(auto-fill, minmax(480px, 1fr)); gap: 2rem;
          }
          
          .cv-card-premium {
            background: white; border-radius: 28px; padding: 1.75rem;
            border: 1px solid #f1f5f9; box-shadow: 0 4px 20px rgba(0,0,0,0.02);
            position: relative; overflow: hidden;
          }
          
          .cv-q-box {
            background: #f8fafc; padding: 1.5rem; border-radius: 24px; border: 1px solid #f1f5f9;
          }
          
          @media (max-width: 1200px) {
            .cv-full-container { flex-direction: column; border-radius: 24px; width: auto; margin: 1rem; }
            .cv-side-id { 
              width: 100%; max-width: 380px; margin: 0 auto; height: auto; 
              position: static; border-right: none; border-bottom: 1px solid #f1f5f9; 
              padding: 2.5rem 1.5rem; 
            }
            .cv-main-body { padding: 2rem 1.5rem; }
            .cv-grid-layout { grid-template-columns: 1fr; gap: 1.25rem; }
            .cv-card-premium { padding: 1.75rem; border-radius: 24px; }
          }
          
          @media (max-width: 992px) {
            .cv-root-view { height: auto; padding: 1rem 0; overflow-y: auto; display: block; }
            .cv-full-container { height: auto; border-radius: 0; margin: 0; border: none; }
          }

          @media (max-width: 768px) {
            .cv-hero-badge { margin-bottom: 1rem; padding: 4px 12px; font-size: 0.6rem; }
            .cv-side-id h1 { font-size: 1.75rem !important; margin-bottom: 0.75rem !important; }
            .cv-side-id { padding: 1.5rem 1.25rem !important; }
            .cv-side-id .avatar-wrapper { width: 100px !important; height: 100px !important; margin-bottom: 1.5rem !important; }
            .cv-side-id .avatar-wrapper svg { width: 40px !important; }
            
            .cv-tab-btn { font-size: 0.8rem !important; gap: 6px !important; }
            
            .cv-tabs-scroll {
              gap: 1.5rem !important;
              padding: 0 1rem !important;
              top: 0 !important;
              background: #F8FAFC !important;
              margin-bottom: 1.5rem !important;
              overflow-x: auto !important;
              white-space: nowrap !important;
              -webkit-overflow-scrolling: touch !important;
            }
            .cv-tabs-scroll::-webkit-scrollbar { display: none; }
            
            .cv-side-id .cv-vision-box { height: auto !important; max-height: 200px; }
            .cv-card-premium { padding: 1.25rem !important; }
          }
          
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>
        
        <div className="cv-full-container">
           {/* 🏆 LEFT PANEL (IDENTITY) 🏆 */}
           <div className="cv-side-id">
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: '1.5rem' }}>
                {onBack ? (
                  <button 
                    onClick={onBack}
                    style={{ background: 'none', border: 'none', color: '#134E39', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', opacity: 0.7 }}
                  >
                    <ChevronLeft size={18} /> KEMBALI
                  </button>
                ) : <div />}
                
                {isViewingOther && (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      onClick={() => {
                        setReportModalState({
                          isOpen: true,
                          reportedUserId: displayCv.user_id,
                          reportedCvId: displayCv.id,
                          reportedAlias: displayCv.alias
                        });
                      }}
                      style={{ 
                        background: 'white', border: '1px solid #f1f5f9', 
                        width: '40px', height: '40px', borderRadius: '12px', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', 
                        color: '#94a3b8', boxShadow: '0 8px 15px rgba(0,0,0,0.02)', transition: 'all 0.2s'
                      }}
                      title="Laporkan Profil"
                      onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                      onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                    >
                      <ShieldAlert size={18} />
                    </button>

                    <button 
                      onClick={toggleBookmark}
                      disabled={isTogglingBookmark}
                      style={{ 
                        background: isBookmarked ? '#EF4444' : 'white', 
                        border: '1px solid ' + (isBookmarked ? '#EF4444' : '#f1f5f9'), 
                        width: '40px', height: '40px', borderRadius: '12px', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', 
                        color: isBookmarked ? 'white' : '#EF4444', 
                        boxShadow: '0 8px 15px rgba(239, 68, 68, 0.1)', transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        transform: isTogglingBookmark ? 'scale(0.9)' : 'scale(1)'
                      }}
                      title={isBookmarked ? "Hapus dari Bookmark" : "Simpan ke Bookmark"}
                    >
                      <Heart size={18} fill={isBookmarked ? 'white' : 'transparent'} />
                    </button>
                  </div>
                )}
              </div>
              
              <div className="avatar-wrapper" style={{ position: 'relative', marginBottom: '1rem', width: '120px', height: '120px', flexShrink: 0 }}>
                 <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'linear-gradient(135deg, #f8fafc 0%, #fff 100%)', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#134E39', boxShadow: '0 10px 20px rgba(0,0,0,0.05)' }}>
                    <User size={50} strokeWidth={1.5} />
                 </div>
              </div>
              
              <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: '900', color: '#134E39', margin: '0 0 1rem', lineHeight: 1.1, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{displayCv.alias}</h1>
              
              <div style={{ width: '100%', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                 <div className="cv-stat-card-small"><i><MapPin size={16} /></i> {displayCv.location}</div>
                 <div className="cv-stat-card-small"><i><Clock size={16} /></i> {displayCv.age} Tahun</div>
                 <div className="cv-stat-card-small"><i><Heart size={16} /></i> {displayCv.marital_status}</div>
              </div>

              <div className="cv-vision-box" style={{ background: 'white', padding: '1.5rem', borderRadius: '24px', border: '1px solid #f1f5f9', textAlign: 'left', width: '100%', position: 'relative', boxShadow: '0 10px 20px rgba(0,0,0,0.03)', height: '140px', overflow: 'hidden' }}>
                 <Quote size={30} style={{ position: 'absolute', top: '10px', right: '10px', opacity: 0.05, color: '#134E39' }} />
                 <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '900', color: '#D4AF37', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.1em' }}>Visi Pernikahan</label>
                 <p style={{ fontStyle: 'italic', fontSize: '0.95rem', lineHeight: 1.6, color: '#134E39', fontWeight: '600', margin: 0, position: 'relative', zIndex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>"{displayCv.about}"</p>
                 {displayCv.about?.length > 80 && (
                   <button 
                     onClick={() => setFullViewItem({ l: 'Visi Pernikahan', v: displayCv.about })}
                     style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(212,175,55,0.1)', border: 'none', width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.gold, zIndex: 2 }}
                   >
                     <Eye size={14} />
                   </button>
                 )}
              </div>

              <div style={{ marginTop: '2.5rem', width: '100%' }}>
                {!isViewingOther && !isPreviewingCv ? (
                  <button className="cv-btn-side cv-btn-side-primary" style={{ margin: 0, padding: '1rem', borderRadius: '16px', width: '100%' }} onClick={() => setIsPreviewingCv(true)}>
                    <Eye size={18} /> PRATINJAU PUBLIK
                  </button>
                ) : (
                  onAjukanTaaruf && displayCv.user_id !== user.id && (
                    <button className="cv-btn-side cv-btn-side-primary" style={{ margin: 0, padding: '1rem', borderRadius: '16px', background: '#134E39', width: '100%', boxShadow: '0 10px 20px rgba(19,78,57,0.2)' }} onClick={() => onAjukanTaaruf(displayCv)}>
                      <Heart size={18} /> AJUKAN TAARUF
                    </button>
                  )
                )}
              </div>
           </div>

           {/* 📄 RIGHT PANEL (CONTENT) 📄 */}
           <div className="cv-main-body">
               {/* 🧭 NAVIGATION TABS 🧭 */}
               <div className="cv-tabs-scroll" style={{ 
                 display: 'flex', 
                 gap: '2.5rem', 
                 borderBottom: '2px solid #f1f5f9', 
                 marginBottom: '2rem', 
                 position: 'sticky', 
                 top: '-3.5rem', 
                 background: 'white', 
                 zIndex: 10,
                 padding: '0 0.5rem'
               }}>
                  {[
                    { id: 'cv', label: 'PROFIL LENGKAP' },
                    { id: 'aqidah', label: 'PEMAHAMAN AGAMA', show: displayCv.screening_data || (!isViewingOther && user.aqidah1) },
                    { id: 'reviews', label: 'REVIEW & KESAN', badge: userReviews.filter(r => r.target_id === displayCv.user_id && r.is_active !== false).length }
                  ].map((tab) => (tab.show !== false && (
                    <button 
                      key={tab.id}
                      onClick={() => setActiveViewTab(tab.id)}
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        borderBottom: activeViewTab === tab.id ? `3px solid #134E39` : '3px solid transparent',
                        color: activeViewTab === tab.id ? '#134E39' : '#94a3b8', 
                        padding: '0.8rem 0', 
                        fontWeight: '900', 
                        cursor: 'pointer', 
                        fontSize: '0.8rem', 
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
                        letterSpacing: '0.08em',
                        marginBottom: '-2px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}
                    >
                      {tab.label}
                      {tab.id === 'reviews' && tab.badge > 0 && (
                        <span style={{ 
                          background: activeViewTab === 'reviews' ? '#134E39' : '#f1f5f9', 
                          color: activeViewTab === 'reviews' ? 'white' : '#64748b', 
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%', 
                          fontSize: '0.65rem', 
                          fontWeight: '900',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                            {tab.badge}
                        </span>
                      )}
                    </button>
                  )))}
               </div>

              {activeViewTab === 'cv' ? (
                <div className="cv-grid-layout" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', animation: 'fadeIn 0.4s ease' }}>
                 
                 {/* Card: Education & Job */}
                 <div className="cv-card-premium">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '2.5rem', color: '#134E39' }}>
                       <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(19,78,57,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <GraduationCap size={24} />
                       </div>
                       <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '900' }}>Pendidikan & Karir</h3>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                       <div className="cv-info-block"><label>Pendidikan Terakhir</label><span>{displayCv.education}</span></div>
                       <div className="cv-info-block"><label>Profesi Saat Ini</label><span>{displayCv.job}</span></div>
                       <div className="cv-info-block"><label>Estimasi Gaji</label><span>{displayCv.salary || '—'}</span></div>
                       <div className="cv-info-block"><label>Suku Bangsa</label><span>{displayCv.suku}</span></div>
                    </div>
                 </div>

                 {/* Card: Physical & Health */}
                 <div className="cv-card-premium">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '2.5rem', color: '#134E39' }}>
                       <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(19,78,57,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Target size={24} />
                       </div>
                       <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '900' }}>Fisik & Karakter</h3>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                       <div className="cv-info-block"><label>Tinggi / Berat</label><span>{displayCv.tinggi_berat}</span></div>
                       <div className="cv-info-block"><label>Kondisi Kesehatan</label><span>{displayCv.kesehatan || 'Normal'}</span></div>
                       <div className="cv-info-block"><label>Ketaatan Ibadah</label><span>{displayCv.worship}</span></div>
                       <div className="cv-info-block"><label>Pandangan Poligami</label><span>{displayCv.poligami || 'Tidak Bersedia'}</span></div>
                    </div>
                 </div>

                 {/* Card: Criteria (Full Width) */}
                 <div className="cv-card-premium" style={{ gridColumn: '1 / -1', height: '180px', position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '1.5rem' }}>
                       <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(212,175,55,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4AF37' }}>
                          <Compass size={20} />
                       </div>
                       <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '900', color: '#134E39' }}>Kriteria Pasangan Impian</h3>
                    </div>
                    <p style={{ 
                      fontSize: '1.05rem', lineHeight: 1.7, color: '#475569', fontWeight: '500', margin: 0, padding: '0 1rem',
                      display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                    }}>{displayCv.criteria}</p>
                    {displayCv.criteria?.length > 150 && (
                      <button 
                        onClick={() => setFullViewItem({ l: 'Kriteria Pasangan Impian', v: displayCv.criteria })}
                        style={{ position: 'absolute', bottom: '1.5rem', right: '1.5rem', background: C.primary, color: 'white', border: 'none', padding: '8px 16px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 10px 20px rgba(19,78,57,0.2)' }}
                      >
                        <Eye size={14} /> LIHAT SELENGKAPNYA
                      </button>
                    )}
                 </div>
              </div>
            ) : activeViewTab === 'aqidah' ? (
              <div style={{ animation: 'fadeIn 0.5s ease' }}>
                <div className="cv-card-premium" style={{ padding: '2.5rem', borderRadius: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '2.5rem' }}>
                        <div style={{ width: '56px', height: '56px', borderRadius: '18px', background: 'rgba(19,78,57,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <BookOpen size={28} color="#D4AF37" />
                        </div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '900', color: '#134E39' }}>Pemahaman Aqidah & Agama</h3>
                          <p style={{ margin: 0, color: '#64748b', fontSize: '0.8rem', fontWeight: '700', letterSpacing: '0.1em' }}>PRINSIP DASAR KANDIDAT</p>
                        </div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        {[
                          { l: '3 Landasan Utama', v: displayCv.screening_data?.aqidah1 || (isViewingOther ? null : user.aqidah1) },
                          { l: 'Makna Syahadat', v: displayCv.screening_data?.aqidah2 || (isViewingOther ? null : user.aqidah2) },
                          { l: 'Tujuan Penciptaan', v: displayCv.screening_data?.aqidah3 || (isViewingOther ? null : user.aqidah3) },
                          { l: 'Visi Pernikahan', v: displayCv.screening_data?.marriage_vision || (isViewingOther ? null : user.marriage_vision) },
                          { l: 'Tanggung Jawab Suami/Istri', v: displayCv.screening_data?.role_view || (isViewingOther ? null : user.role_view) },
                          { l: 'Pandangan Poligami', v: displayCv.screening_data?.polygamy_view || (isViewingOther ? null : user.polygamy_view) }
                        ].filter(q => q && q.v).map((q, idx) => (
                           <div key={idx} className="cv-q-box" style={{ background: '#f8fafc', border: '1px solid #f1f5f9', padding: '1.5rem', borderRadius: '24px', height: '160px', position: 'relative', overflow: 'hidden' }}>
                               <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '900', color: '#D4AF37', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.1em' }}>{q.l}</label>
                               <p style={{ 
                                 margin: 0, fontSize: '0.95rem', lineHeight: 1.6, color: '#1e293b', fontWeight: '500',
                                 display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                               }}>{q.v}</p>
                               {q.v?.length > 100 && (
                                 <button 
                                   onClick={() => setFullViewItem({ l: q.l, v: q.v })}
                                   style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'white', border: '1px solid #f1f5f9', width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.primary, boxShadow: '0 5px 15px rgba(0,0,0,0.05)' }}
                                 >
                                   <Eye size={14} />
                                 </button>
                               )}
                           </div>
                        ))}
                    </div>
                </div>
              </div>
            ) : (
              <div style={{ animation: 'fadeInUp 0.4s ease' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', marginBottom: '3.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '22px', background: 'linear-gradient(135deg, rgba(212,175,55,0.1) 0%, rgba(212,175,55,0.05) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.gold, border: '1px solid rgba(212,175,55,0.1)' }}>
                          <Star size={32} fill={C.gold} />
                        </div>
                        <div>
                          <h3 style={{ fontSize: '1.85rem', fontWeight: '900', color: C.primary, margin: 0, letterSpacing: '-0.02em' }}>Review & Kesan</h3>
                          <p style={{ margin: 0, color: C.muted, fontSize: '1rem', fontWeight: '500' }}>Pendapat jujur dari para kandidat lainnya</p>
                        </div>
                    </div>
                    {isViewingOther && (
                      <button 
                        onClick={() => setShowReviewModal(true)}
                        style={{ 
                          background: C.primary, color: 'white', border: 'none', 
                          padding: '0.85rem 1.5rem', borderRadius: '16px', 
                          fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: '10px',
                          boxShadow: '0 10px 20px rgba(19,78,57,0.15)',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                      >
                        <Plus size={18} /> BERIKAN KESAN
                      </button>
                    )}
                </div>

                <div style={{ display: 'block', width: '100%' }}>
                   {/* Form Section */}

                   {/* List Section */}
                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
                      {userReviews.filter(r => r.target_id === displayCv.user_id && r.is_active !== false).length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '6rem 3rem', background: 'white', borderRadius: '40px', border: '2px dashed #f1f5f9', gridColumn: '1 / -1' }}>
                           <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                              <Quote size={40} color="#cbd5e1" />
                           </div>
                           <h4 style={{ color: C.primary, fontWeight: '900', fontSize: '1.2rem', marginBottom: '0.5rem' }}>Belum Ada Kesan</h4>
                        </div>
                      ) : (
                        userReviews.filter(r => r.target_id === displayCv.user_id && r.is_active !== false).map(review => (
                          <div key={review.id} style={{ background: 'white', padding: '2.25rem', borderRadius: '32px', border: '1px solid #f1f5f9', boxShadow: '0 15px 35px rgba(0,0,0,0.02)', position: 'relative', transition: 'transform 0.3s ease' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                 <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'linear-gradient(135deg, #134E39 0%, #1a5d46 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: '900', color: 'white', boxShadow: '0 8px 15px rgba(19,78,57,0.15)' }}>
                                    {review.reviewer?.name?.charAt(0)}
                                 </div>
                                 <div>
                                    <span style={{ fontWeight: '900', color: C.primary, fontSize: '1.05rem', display: 'block' }}>{review.reviewer?.name}</span>
                                    <span style={{ fontSize: '0.75rem', color: C.muted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{new Date(review.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                 </div>
                              </div>
                              <div style={{ display: 'flex', gap: '4px', background: 'rgba(212,175,55,0.05)', padding: '6px 12px', borderRadius: '12px', border: '1px solid rgba(212,175,55,0.1)' }}>
                                {[1, 2, 3, 4, 5].map(s => <Star key={s} size={16} color={s <= review.rating ? C.gold : '#e2e8f0'} fill={s <= review.rating ? C.gold : 'transparent'} />)}
                              </div>
                            </div>
                            <div style={{ position: 'relative', paddingLeft: '1.5rem', borderLeft: '3px solid rgba(19,78,57,0.1)' }}>
                               <Quote size={24} style={{ position: 'absolute', top: '-15px', left: '-12px', opacity: 0.1, color: C.primary }} />
                               <p style={{ margin: 0, fontSize: '1.05rem', color: '#334155', lineHeight: 1.8, fontWeight: '500', fontStyle: 'italic' }}>"{review.comment}"</p>
                            </div>
                          </div>
                        ))
                      )}
                   </div>
                </div>
              </div>
            )}
           </div>
        </div>

        {/* 🔍 FULL VIEW MODAL 🔍 */}
        {fullViewItem && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }} onClick={() => setFullViewItem(null)}>
            <div style={{ background: 'white', padding: '3.5rem', borderRadius: '48px', maxWidth: '700px', width: '100%', maxHeight: '85vh', overflowY: 'auto', position: 'relative', boxShadow: '0 40px 100px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
              <button onClick={() => setFullViewItem(null)} style={{ position: 'absolute', top: '2rem', right: '2rem', background: '#f8fafc', border: 'none', width: '48px', height: '48px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                <X size={24} color={C.primary} />
              </button>
              <h3 style={{ fontSize: '0.75rem', fontWeight: '900', color: C.gold, marginBottom: '2rem', paddingRight: '4rem', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                {fullViewItem.l}
              </h3>
              <p style={{ fontSize: '1.15rem', lineHeight: 1.9, color: '#1e293b', whiteSpace: 'pre-wrap', fontWeight: '500' }}>
                {fullViewItem.v}
              </p>
            </div>
          </div>
        )}

        {/* 📝 CREATE REVIEW MODAL 📝 */}
        {showReviewModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }} onClick={() => setShowReviewModal(false)}>
            <div style={{ background: 'white', padding: '3rem', borderRadius: '48px', maxWidth: '540px', width: '100%', position: 'relative', boxShadow: '0 40px 100px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
               <button onClick={() => setShowReviewModal(false)} style={{ position: 'absolute', top: '2rem', right: '2rem', background: '#f8fafc', border: 'none', width: '44px', height: '44px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                 <X size={20} color={C.primary} />
               </button>
               
               <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '2.5rem' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '18px', background: 'rgba(19,78,57,0.05)', color: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Quote size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: '900', color: C.primary, margin: 0 }}>Berikan Kesan</h3>
                    <p style={{ margin: 0, color: C.muted, fontSize: '0.85rem', fontWeight: '600' }}>Sampaikan pendapat Anda untuk {displayCv.alias}</p>
                  </div>
               </div>

               <div style={{ marginBottom: '2rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: C.muted, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Seberapa berkesan profil ini?</label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                     {[1, 2, 3, 4, 5].map(s => (
                       <Star 
                         key={s} size={36} 
                         color={s <= newRating ? C.gold : '#f1f5f9'} 
                         fill={s <= newRating ? C.gold : 'transparent'}
                         style={{ cursor: 'pointer', transition: 'all 0.2s', transform: s <= newRating ? 'scale(1.1)' : 'scale(1)' }}
                         onClick={() => setNewRating(s)}
                       />
                     ))}
                  </div>
               </div>

               <div style={{ marginBottom: '2.5rem' }}>
                   <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '900', color: C.muted, marginBottom: '12px', textTransform: 'uppercase' }}>Tuliskan Kesan Anda</label>
                   <textarea 
                     placeholder="Apa yang membuat Anda tertarik dengan profil ini? Berikan kesan yang membangun..."
                     value={newComment}
                     onChange={e => setNewComment(e.target.value)}
                     style={{ 
                       width: '100%', padding: '1.5rem', borderRadius: '24px', border: '1.5px solid #f1f5f9', 
                       minHeight: '150px', fontSize: '1rem', outline: 'none', resize: 'none', 
                       background: '#F8FAFC', lineHeight: 1.7, color: C.text
                     }}
                   />
                </div>

               <button 
                 disabled={isSubmittingReview || !newComment.trim()}
                 onClick={async () => {
                   setIsSubmittingReview(true);
                   try {
                     const { data, error } = await supabase.from('user_reviews').insert({
                       reviewer_id: user.id,
                       target_id: displayCv.user_id,
                       rating: newRating,
                       comment: newComment.trim()
                     }).select('*, reviewer:reviewer_id(name)').single();

                     if (error) throw error;
                     setUserReviews([data, ...userReviews]);
                     setNewComment('');
                     setNewRating(5);
                     setShowReviewModal(false);
                     showAlert('Alhamdulillah', 'Review Anda telah berhasil disimpan.', 'success');
                   } catch (err) {
                     showAlert('Afwan', 'Terjadi kesalahan saat menyimpan review.', 'error');
                   } finally {
                     setIsSubmittingReview(false);
                   }
                 }}
                 style={{ width: '100%', background: C.primary, color: 'white', border: 'none', padding: '1.25rem', borderRadius: '20px', fontWeight: '900', fontSize: '1rem', cursor: 'pointer', boxShadow: '0 15px 30px rgba(19,78,57,0.15)', opacity: isSubmittingReview || !newComment.trim() ? 0.5 : 1 }}
               >
                 {isSubmittingReview ? 'MENGIRIM...' : 'KIRIM KESAN SEKARANG'}
               </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Wizard view
  return (
    <div key="cv-edit-root" className="cv-root" style={{ overflowY: 'auto' }}>
       <div style={{ padding: '4rem 5%', maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ marginBottom: '4rem', textAlign: 'center' }}>
             <h2 style={{ fontSize: '2.5rem', fontWeight: '900', color: C.primary }}>
               {cvStep < 7 ? `Langkah ${cvStep}: ${[
                  "Biodata Dasar", "Pendidikan & Pekerjaan", "Domisili & Status", 
                  "Fisik & Kesehatan", "Visi & Ibadah", "Kriteria Pasangan"
                ][cvStep-1]}` : 'Alhamdulillah'}
             </h2>
          </div>
          <div style={{ background: 'white', borderRadius: '40px', border: '1px solid #E2E8F0', padding: '4rem', boxShadow: '0 4px 15px rgba(0,0,0,0.01)' }}>
             <p style={{ textAlign: 'center', color: C.muted }}>Lengkapi data CV Anda untuk melanjutkan.</p>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4rem' }}>
                <button className="cv-btn-side cv-btn-side-outline" onClick={() => setIsEditingCv(false)}>BATAL</button>
                <button className="cv-btn-side cv-btn-side-primary" onClick={handleCvSubmit}>SIMPAN DATA</button>
             </div>
          </div>
       </div>
    </div>
  );
}