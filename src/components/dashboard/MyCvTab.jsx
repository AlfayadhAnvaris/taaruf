import React, { useState } from 'react';
import { 
  ChevronLeft, ChevronDown, User, Settings, Eye, Clock, MapPin, Heart, Compass, 
  ShieldCheck, ShieldAlert, ArrowRight, Target, GraduationCap, Briefcase, CheckCircle, 
  X, Users, Sparkles, Award, Quote, BookOpen, Star, BadgeCheck, Bookmark, Plus, FileText,
  Camera, HeartHandshake, Smile, Users2, Shield, EyeOff, Info, Loader2, UploadCloud
} from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';

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

const EMPTY_ARRAY = [];

export default function MyCvTab({ 
  user, myExistingCv, isEditingCv, setIsEditingCv, hasSubmittedCv, 
  cvStep, setCvStep, myCv, setMyCv, isSubmittingCv, handleCvSubmit, 
  targetCv = null,
  onBack = null,
  provinces = EMPTY_ARRAY
}) {
  const { userReviews, setUserReviews, showAlert, showToast, bookmarks, setBookmarks, setReportModalState, academyLevels, getAcademyBadge, getBadgeCount } = useAppContext();
  const [fullViewItem, setFullViewItem] = useState(null);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [activeViewTab, setActiveViewTab] = useState('profil_fisik'); // 'profil_fisik', 'latar_belakang', 'agama_nikah', 'kriteria'
  const [isTogglingBookmark, setIsTogglingBookmark] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showReviewsListModal, setShowReviewsListModal] = useState(false);
  
  // Section-based editing
  const [activeEditSection, setActiveEditSection] = useState(null);
  const [cities, setCities] = useState([]);
  const [isFetchingCities, setIsFetchingCities] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      showAlert('Format Tidak Valid', 'Mohon unggah file berupa gambar (JPG/PNG/WEBP).', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showAlert('File Terlalu Besar', 'Maksimal ukuran foto adalah 5MB.', 'error');
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id || 'unknown'}_${Date.now()}.${fileExt}`;
      const filePath = `profiles/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('cv-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('cv-photos')
        .getPublicUrl(filePath);

      set('foto_url', data.publicUrl);
      showToast('Foto berhasil diunggah.', 'success');
    } catch (error) {
      console.error('Error uploading photo:', error);
      showAlert('Gagal Mengunggah', 'Terjadi kesalahan saat mengunggah foto. Pastikan bucket "cv-photos" sudah dibuat.', 'error');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const isViewingOther = !!targetCv;
  const displayCv = targetCv || myExistingCv;

  // Sync cities list for Province select
  React.useEffect(() => {
    if (myCv?.domisili_provinsi && provinces?.length > 0) {
       const provId = provinces.find(p => p.name === myCv.domisili_provinsi)?.id;
       if (provId) {
          setIsFetchingCities(true);
          fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${provId}.json`)
             .then(r => r.json())
             .then(data => setCities(data || []))
             .catch(e => {
                 console.error("Gagal mengambil data kota", e);
                 setCities([]);
              })
             .finally(() => setIsFetchingCities(false));
       } else {
          setCities([]);
       }
    } else {
       setCities([]);
    }
  }, [myCv?.domisili_provinsi, provinces]);

  const set = (k, v) => setMyCv(p => ({ ...p, [k]: v }));

  const isBookmarked = bookmarks?.some(b => b.target_id === displayCv?.user_id);

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

  // Sections definitions
  const sections = [
    { id: 1, name: 'PROFIL', fields: ['alias', 'gender', 'age', 'domisili_provinsi', 'domisili_kota', 'address', 'marital_status', 'suku'] },
    { id: 2, name: 'FOTO', fields: ['foto_url'] },
    { id: 3, name: 'GAMBARAN FISIK', fields: ['tinggi_badan', 'berat_badan', 'ciri_fisik', 'kesehatan'] },
    { id: 4, name: 'GAMBARAN DIRI', fields: ['karakter_positif', 'karakter_negatif', 'hobi', 'hal_disukai', 'hal_benci'] },
    { id: 5, name: 'GAMBARAN KELUARGA', fields: ['kondisi_keluarga', 'pekerjaan_ortu', 'anak_ke_dari'] },
    { id: 6, name: 'PENDIDIKAN', fields: ['education', 'riwayat_pendidikan'] },
    { id: 7, name: 'PENGALAMAN', fields: ['job', 'salary', 'pengalaman_kerja'] },
    { id: 8, name: 'IBADAH', fields: ['worship_wajib', 'worship_sunnah', 'baca_quran', 'kajian'] },
    { id: 9, name: 'PERSIAPAN PERNIKAHAN', fields: ['marriage_vision', 'role_view', 'target_menikah', 'rencana_nafkah', 'poligami'] },
    { id: 10, name: 'HARAPAN', fields: ['harapan_pasangan'] },
    { id: 11, name: 'KRITERIA FISIK', fields: ['kriteria_fisik'] },
    { id: 12, name: 'KRITERIA NON FISIK', fields: ['kriteria_non_fisik'] }
  ];

  // Helper to check if a specific section is filled
  const getSectionStatus = (secId) => {
    const sec = sections.find(s => s.id === secId);
    if (!sec) return false;
    
    // Alias must be set, gender must be set, age must be set
    // For general fields, they must be truthy strings/numbers
    return sec.fields.every(field => {
      const val = myCv[field];
      if (val === undefined || val === null || val === '') return false;
      return true;
    });
  };

  const handleSectionSave = async () => {
    try {
      // Validate Profil first
      if (activeEditSection === 1) {
        if (!myCv.alias || !myCv.gender || !myCv.age || !myCv.domisili_provinsi || !myCv.domisili_kota || !myCv.marital_status || !myCv.suku) {
          showToast('Harap isi semua kolom bertanda bintang (*).', 'error');
          return;
        }
      }
      
      // Auto save to DB silently
      await handleCvSubmit(true);
      showToast(`Data bagian ${sections.find(s => s.id === activeEditSection).name} berhasil disimpan.`, 'success');
      setActiveEditSection(null);
    } catch (err) {
      console.error('Save failed:', err);
      showToast(err?.message || 'Gagal menyimpan data ke database. Cek koneksi Anda.', 'error');
    }
  };

  // Read-only profile view rendering
  if ((hasSubmittedCv || isViewingOther) && !isEditingCv) {
    return (
      <div key="cv-view-root" className="cv-root-view">
        <style key="cv-style">{`
          .cv-root-view {
            background: #f8fafc; width: 100%; height: 100%; 
            display: flex; flex-direction: column; align-items: stretch; padding: 0;
            overflow-x: hidden; overflow-y: hidden;
          }
          
          .cv-full-container {
            display: flex; width: 100%; 
            flex: 1; min-height: 0; gap: 1.25rem;
            padding: 1.25rem 2rem;
          }
          .cv-side-id {
            width: 280px; flex-shrink: 0; background: white; 
            padding: 1.5rem 1.25rem; display: flex; flex-direction: column; align-items: center; text-align: center;
            height: 100%; max-height: 100%; overflow-y: auto; align-self: stretch;
            border-radius: 24px; border: 1px solid #f1f5f9; box-shadow: none;
          }
          .cv-side-id::-webkit-scrollbar { width: 4px; }
          .cv-side-id::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
          
          .cv-main-body {
            flex: 1; padding: 0 0.5rem 1rem 0.5rem; overflow-y: auto; height: 100%;
            scrollbar-width: thin;
            scrollbar-color: #e2e8f0 transparent;
          }
          .cv-main-body::-webkit-scrollbar { width: 6px; }
          .cv-main-body::-webkit-scrollbar-track { background: transparent; }
          .cv-main-body::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
          .cv-main-body::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
          
          .cv-hero-badge {
            background: #134E39; color: white; padding: 6px 16px; border-radius: 99px;
            font-size: 0.7rem; font-weight: 900; letter-spacing: 0.1em; margin-bottom: 1rem;
            display: inline-flex; align-items: center; gap: 6px; box-shadow: none;
          }
          
          .cv-stat-card-small {
            width: 100%; min-height: 44px; padding: 0.5rem 0.85rem; border-radius: 12px; border: 1px solid rgba(19, 78, 57, 0.05);
            background: rgba(19, 78, 57, 0.02); margin-bottom: 8px; display: flex; align-items: center; gap: 12px;
            font-weight: 700; color: #134E39; font-size: 0.8rem; transition: all 0.2s;
            text-align: left; box-shadow: none;
          }
          .cv-stat-card-small i {
            width: 32px; height: 32px; border-radius: 8px; background: rgba(19,78,57,0.05);
            display: flex; align-items: center; justify-content: center; color: #D4AF37;
            flex-shrink: 0;
          }
          
          .cv-grid-layout {
            display: grid; grid-template-columns: repeat(auto-fill, minmax(420px, 1fr)); gap: 1.25rem;
          }
          
          .cv-card-premium {
            background: white; border-radius: 24px; border: 1px solid #f1f5f9; padding: 1.75rem;
            box-shadow: 0 10px 25px rgba(0,0,0,0.01);
            position: relative; overflow: hidden;
            display: flex; flex-direction: column; height: 100%;
          }
          
          .cv-card-title {
            display: flex; align-items: center; gap: 14px; margin-bottom: 1.25rem;
          }
          
          .cv-card-icon {
            width: 48px; height: 48px; border-radius: 12px; background: rgba(19,78,57,0.05);
            display: flex; align-items: center; justify-content: center; flex-shrink: 0;
          }
          
          .cv-card-title h3 {
            font-size: 1.25rem; font-weight: 900; color: #134E39; margin: 0;
          }
          
          .cv-info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
            gap: 1.25rem 1rem;
          }
          
          .cv-info-field {
            display: flex; flex-direction: column; gap: 4px;
          }
          
          .cv-info-field label {
            font-size: 0.75rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;
          }
          
          .cv-info-field span {
            font-size: 0.95rem; font-weight: 600; color: #1e293b;
          }
          
          .cv-q-box {
            background: white; padding: 1rem 1.25rem; border-radius: 16px; border: 1px solid #e2e8f0;
            box-shadow: none; transition: all 0.2s;
            text-align: left;
          }
          .cv-q-box:hover {
            box-shadow: none;
            transform: translateY(-2px);
          }
          
          .cv-tabs-dropdown-wrapper {
            display: none;
          }
          .cv-back-bar-mobile {
            display: none;
          }
          @media (max-width: 768px) {
            .cv-back-bar-mobile {
              display: flex !important;
              padding: 0.75rem 1rem;
              border-bottom: 1px solid rgba(226, 232, 240, 0.6);
              background: white;
              align-items: center;
              flex-shrink: 0;
            }
          }
          
          @media (max-width: 1200px) {
            .cv-full-container { flex-direction: column; border-radius: 24px; width: auto; margin: 1rem; padding: 0; }
            .cv-side-id { 
              width: 100%; max-width: 380px; margin: 0 auto; height: auto; 
              position: static; border-right: none; border-bottom: 1px solid #f1f5f9; 
              padding: 2.5rem 1.5rem; 
            }
            .cv-main-body { padding: 2rem 1.5rem; }
            .cv-grid-layout { grid-template-columns: 1fr; gap: 1.25rem; }
            .cv-card-premium { padding: 1.75rem; border-radius: 12px; }
          }
          
          @media (max-width: 992px) {
            .cv-root-view { height: auto; padding: 0; overflow-y: auto; display: block; }
            .cv-full-container { height: auto; border-radius: 0; margin: 0; border: none; padding: 0; }
          }

          @media (max-width: 768px) {
            .cv-hero-badge { margin-bottom: 1rem; padding: 4px 12px; font-size: 0.6rem; }
            .cv-side-id h1 { font-size: 1.75rem !important; margin-bottom: 0.75rem !important; }
            .cv-side-id { 
              padding: 1rem 0.75rem !important; 
              max-width: none !important;
              border: none !important;
              box-shadow: none !important;
              border-radius: 0 !important;
              background: transparent !important;
            }
            .cv-side-id .avatar-wrapper { width: 100px !important; height: 100px !important; margin-bottom: 1.5rem !important; }
            .cv-side-id .avatar-wrapper svg { width: 40px !important; }
            
            .cv-tab-btn { font-size: 0.8rem !important; gap: 6px !important; }
            
            .cv-tabs-dropdown-wrapper {
              display: block !important;
              width: 100%; 
              padding: 0.5rem 1rem; 
              margin-bottom: 1rem;
              flex-shrink: 0;
            }
            .cv-tabs-scroll {
              display: none !important;
            }
            
            .cv-side-id .cv-vision-box { height: auto !important; max-height: 200px; }
            .cv-main-body { padding: 1rem 0.75rem !important; }
            .cv-card-premium { padding: 1.25rem 0.75rem !important; }
          }
          
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>
        
        {onBack && (
          <div className="cv-back-bar-mobile">
            <button 
              onClick={onBack}
              style={{ 
                background: '#f8fafc', 
                border: '1px solid #e2e8f0', 
                color: '#134E39', 
                fontWeight: '800', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px', 
                cursor: 'pointer', 
                fontSize: '0.75rem', 
                padding: '6px 14px', 
                borderRadius: '6px', 
                transition: 'all 0.2s ease',
                letterSpacing: '0.05em',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#f1f5f9';
                e.currentTarget.style.borderColor = '#cbd5e1';
                e.currentTarget.style.transform = 'translateX(-2px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#f8fafc';
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.transform = 'none';
              }}
            >
              <ChevronLeft size={14} /> KEMBALI
            </button>
          </div>
        )}
        
        {/* Dropdown Tab Navigation for Mobile */}
        <div className="cv-tabs-dropdown-wrapper">
          <div style={{ position: 'relative', width: '100%' }}>
            <select 
              value={activeViewTab || ''} 
              onChange={(e) => setActiveViewTab(e.target.value)}
              style={{
                width: '100%',
                padding: '0.8rem 2.5rem 0.8rem 1rem',
                border: '2px solid #E2E8F0',
                borderRadius: '12px',
                fontSize: '0.85rem',
                fontWeight: '900',
                color: '#134E39',
                background: 'white',
                outline: 'none',
                appearance: 'none',
                cursor: 'pointer',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
              }}
            >
              <option value="profil_fisik">PROFIL & FISIK</option>
              <option value="latar_belakang">LATAR BELAKANG</option>
              <option value="agama_nikah">AGAMA & PERNIKAHAN</option>
              <option value="kriteria">KRITERIA PASANGAN</option>
            </select>
            <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#134E39', display: 'flex', alignItems: 'center' }}>
              <ChevronDown size={18} />
            </div>
          </div>
        </div>

        {/* Scroll Tab Navigation for Desktop */}
        <div className="cv-tabs-scroll" style={{ 
          display: 'grid', 
          gridTemplateColumns: '170px 1fr 170px',
          alignItems: 'center',
          borderBottom: '1.5px solid rgba(226, 232, 240, 0.8)', 
          marginBottom: '0', 
          width: '100%',
          padding: '0.25rem 1.25rem',
          background: 'white',
          flexShrink: 0
        }}>
          {/* Left Column: Back button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
            {onBack && (
              <button 
                onClick={onBack}
                style={{ 
                  background: '#f8fafc', 
                  border: '1px solid #e2e8f0', 
                  color: '#134E39', 
                  fontWeight: '800', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  cursor: 'pointer', 
                  fontSize: '0.75rem', 
                  padding: '6px 14px', 
                  borderRadius: '6px', 
                  transition: 'all 0.2s ease',
                  letterSpacing: '0.05em',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#f1f5f9';
                  e.currentTarget.style.borderColor = '#cbd5e1';
                  e.currentTarget.style.transform = 'translateX(-2px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = '#f8fafc';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                <ChevronLeft size={14} /> KEMBALI
              </button>
            )}
          </div>

          {/* Center Column: Tabs */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem' }}>
             {[
               { id: 'profil_fisik', label: 'PROFIL & FISIK' },
               { id: 'latar_belakang', label: 'LATAR BELAKANG' },
               { id: 'agama_nikah', label: 'AGAMA & PERNIKAHAN' },
               { id: 'kriteria', label: 'KRITERIA PASANGAN' }
             ].map((tab) => (
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
                   height: '100%',
                   gap: '10px'
                 }}
               >
                 {tab.label}
               </button>
             ))}
          </div>

          {/* Right Column: Empty spacer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}></div>
        </div>

        <div className="cv-full-container">
            {/* 🏆 LEFT PANEL (IDENTITY CARD) 🏆 */}
            <div className="cv-side-id">
              {isViewingOther && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%', alignItems: 'center', marginBottom: '1.5rem' }}>
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
                        width: '40px', height: '40px', borderRadius: '6px', 
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
                        width: '40px', height: '40px', borderRadius: '6px', 
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
                </div>
              )}
              
              <div className="avatar-wrapper" style={{ position: 'relative', marginBottom: '1.5rem', width: '120px', height: '120px', flexShrink: 0 }}>
                 {displayCv?.foto_url ? (
                   <img 
                     src={displayCv.foto_url} 
                     alt={displayCv.alias} 
                     style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: `3px solid ${C.primary}`, boxShadow: '0 10px 20px rgba(19,78,57,0.15)' }} 
                   />
                 ) : (
                   <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'linear-gradient(135deg, #f8fafc 0%, #fff 100%)', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#134E39', boxShadow: '0 10px 20px rgba(0,0,0,0.05)' }}>
                      <User size={50} strokeWidth={1.5} />
                   </div>
                 )}
              </div>
              
              <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: '900', color: '#134E39', margin: '0 0 0.5rem', lineHeight: 1.1, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{displayCv?.alias}</h1>
              
              {(() => {
                const badgeCount = getBadgeCount ? getBadgeCount(displayCv?.user_id) : (academyLevels?.[String(displayCv?.user_id)] || 0);
                const badge = getAcademyBadge ? getAcademyBadge(badgeCount, 14) : null;
                if (!badge) return null;
                return (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: `${badge.color}15`,
                    color: badge.color,
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontSize: '0.72rem',
                    fontWeight: '900',
                    border: `1px solid ${badge.color}30`,
                    marginBottom: '1rem',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    letterSpacing: '0.01em'
                  }} title={badge.label}>
                    {badge.icon}
                    <span>{badge.label}</span>
                  </div>
                );
              })()}

              <div style={{ width: '100%', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                 <div className="cv-stat-card-small"><i><MapPin size={16} /></i> {displayCv?.location}</div>
                 <div className="cv-stat-card-small"><i><Clock size={16} /></i> {displayCv?.age} Tahun</div>
                 <div className="cv-stat-card-small"><i><Heart size={16} /></i> {displayCv?.marital_status}</div>
                 {displayCv?.suku && (
                   <div className="cv-stat-card-small"><i><User size={16} /></i> Suku {displayCv.suku}</div>
                 )}
                 {displayCv?.education && (
                   <div className="cv-stat-card-small"><i><GraduationCap size={16} /></i> Pendidikan {displayCv.education}</div>
                 )}
              </div>

               {!isViewingOther && (
                 <button 
                   onClick={() => setIsEditingCv(true)}
                   style={{ 
                     width: '100%', padding: '1rem', borderRadius: '12px', background: '#134E39', 
                     color: 'white', border: 'none', fontWeight: '900', fontSize: '0.8rem', 
                     cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                     marginBottom: '1.25rem', boxShadow: '0 10px 20px rgba(19,78,57,0.15)', transition: 'all 0.3s'
                   }}
                   onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                   onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                 >
                   <Settings size={16} /> EDIT PROFIL CV
                 </button>
               )}
            </div>

            {/* 📄 RIGHT PANEL (DETAILED CONTENTS BY TABS) 📄 */}
            <div className="cv-main-body">
              {activeViewTab === 'profil_fisik' && (
                <div className="cv-grid-layout" style={{ alignItems: 'start', animation: 'fadeIn 0.35s ease' }}>
                  {/* Card: 1. Profil */}
                  <div className="cv-card-premium">
                    <div className="cv-card-title">
                       <div className="cv-card-icon"><User size={22} color="#134E39" /></div>
                       <h3>Profil Dasar</h3>
                    </div>
                    <div className="cv-info-grid">
                       <div className="cv-info-field">
                         <label>Jenis Kelamin</label>
                         <span style={{ textTransform: 'capitalize' }}>{displayCv?.gender || '—'}</span>
                       </div>
                       <div className="cv-info-field">
                         <label>Suku Bangsa</label>
                         <span>{displayCv?.suku || '—'}</span>
                       </div>
                       <div className="cv-info-field">
                         <label>Provinsi Domisili</label>
                         <span>{displayCv?.domisili_provinsi || '—'}</span>
                       </div>
                       <div className="cv-info-field">
                         <label>Kota Domisili</label>
                         <span>{displayCv?.domisili_kota || '—'}</span>
                       </div>
                       <div className="cv-info-field" style={{ gridColumn: '1 / -1' }}>
                         <label>Alamat Lengkap</label>
                         <span style={{ fontSize: '0.9rem', lineHeight: '1.5', fontWeight: '500' }}>{displayCv?.address || '—'}</span>
                       </div>
                    </div>
                  </div>

                  {/* Card: 3. Gambaran Fisik */}
                  <div className="cv-card-premium">
                    <div className="cv-card-title">
                       <div className="cv-card-icon"><Target size={22} color="#134E39" /></div>
                       <h3>Gambaran Fisik</h3>
                    </div>
                    <div className="cv-info-grid">
                       <div className="cv-info-field">
                         <label>Tinggi Badan</label>
                         <span>{displayCv?.tinggi_badan ? `${displayCv.tinggi_badan} cm` : displayCv?.tinggi_berat?.split('/')?.[0]?.trim() || '—'}</span>
                       </div>
                       <div className="cv-info-field">
                         <label>Berat Badan</label>
                         <span>{displayCv?.berat_badan ? `${displayCv.berat_badan} kg` : displayCv?.tinggi_berat?.split('/')?.[1]?.trim() || '—'}</span>
                       </div>
                       <div className="cv-info-field">
                         <label>Kondisi Kesehatan</label>
                         <span>{displayCv?.kesehatan || 'Sehat'}</span>
                       </div>
                       <div className="cv-info-field">
                         <label>Bentuk Fisik & Ciri Khas</label>
                         <span style={{ fontSize: '0.9rem', lineHeight: '1.5', fontWeight: '500' }}>{displayCv?.ciri_fisik || '—'}</span>
                       </div>
                    </div>          
                  </div>

                  {/* Card: 4. Gambaran Diri (Full Width) */}
                  <div className="cv-card-premium" style={{ gridColumn: '1 / -1' }}>
                    <div className="cv-card-title">
                       <div className="cv-card-icon"><Smile size={22} color="#134E39" /></div>
                       <h3>Gambaran Diri & Karakter</h3>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                      <div className="cv-q-box">
                        <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: '900', color: '#D4AF37', textTransform: 'uppercase', marginBottom: '8px' }}>Karakter Positif</label>
                        <p style={{ margin: 0, fontSize: '0.92rem', lineHeight: 1.6, color: '#334155' }}>{displayCv?.karakter_positif || displayCv?.karakter || '—'}</p>
                      </div>
                      <div className="cv-q-box">
                        <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: '900', color: '#D4AF37', textTransform: 'uppercase', marginBottom: '8px' }}>Karakter Negatif</label>
                        <p style={{ margin: 0, fontSize: '0.92rem', lineHeight: 1.6, color: '#334155' }}>{displayCv?.karakter_negatif || '—'}</p>
                      </div>
                      <div className="cv-q-box">
                        <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: '900', color: '#D4AF37', textTransform: 'uppercase', marginBottom: '8px' }}>Hal-hal yang Disukai</label>
                        <p style={{ margin: 0, fontSize: '0.92rem', lineHeight: 1.6, color: '#334155' }}>{displayCv?.hal_disukai || '—'}</p>
                      </div>
                      <div className="cv-q-box">
                        <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: '900', color: '#D4AF37', textTransform: 'uppercase', marginBottom: '8px' }}>Hal-hal yang Tidak Disukai</label>
                        <p style={{ margin: 0, fontSize: '0.92rem', lineHeight: 1.6, color: '#334155' }}>{displayCv?.hal_benci || '—'}</p>
                      </div>
                    </div>
                    <div style={{ marginTop: '1.5rem' }} className="cv-info-field">
                      <label>Hobi & Kegemaran</label>
                      <span style={{ fontSize: '0.95rem', fontWeight: '700', color: '#134E39' }}>{displayCv?.hobi || '—'}</span>
                    </div>
                  </div>
                </div>
              )}

              {activeViewTab === 'latar_belakang' && (
                <div className="cv-grid-layout" style={{ alignItems: 'start', animation: 'fadeIn 0.35s ease' }}>
                  {/* Card: 5. Gambaran Keluarga */}
                  <div className="cv-card-premium">
                    <div className="cv-card-title">
                       <div className="cv-card-icon"><Users2 size={22} color="#134E39" /></div>
                       <h3>Gambaran Keluarga</h3>
                    </div>
                    <div className="cv-info-grid">
                       <div className="cv-info-field">
                         <label>Anak Ke / Bersaudara</label>
                         <span>{displayCv?.anak_ke_dari || '—'}</span>
                       </div>
                       <div className="cv-info-field">
                         <label>Pekerjaan Orang Tua</label>
                         <span>{displayCv?.pekerjaan_ortu || '—'}</span>
                       </div>
                       <div className="cv-info-field" style={{ gridColumn: '1 / -1' }}>
                         <label>Kondisi Agama / Sosial Keluarga</label>
                         <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.6, color: '#334155', fontWeight: '500' }}>{displayCv?.kondisi_keluarga || '—'}</p>
                       </div>
                    </div>
                  </div>

                  {/* Card: 6. Pendidikan */}
                  <div className="cv-card-premium">
                    <div className="cv-card-title">
                       <div className="cv-card-icon"><GraduationCap size={22} color="#134E39" /></div>
                       <h3>Pendidikan</h3>
                    </div>
                    <div className="cv-info-grid">
                       <div className="cv-info-field">
                         <label>Pendidikan Terakhir</label>
                         <span>{displayCv?.education || '—'}</span>
                       </div>
                       <div className="cv-info-field" style={{ gridColumn: '1 / -1' }}>
                         <label>Detail Riwayat Pendidikan</label>
                         <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.6, color: '#334155', fontWeight: '500' }}>{displayCv?.riwayat_pendidikan || '—'}</p>
                       </div>
                    </div>
                  </div>

                  {/* Card: 7. Pengalaman (Full Width) */}
                  <div className="cv-card-premium" style={{ gridColumn: '1 / -1' }}>
                    <div className="cv-card-title">
                       <div className="cv-card-icon"><Briefcase size={22} color="#134E39" /></div>
                       <h3>Pekerjaan & Pengalaman</h3>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                      <div className="cv-info-field">
                        <label>Pekerjaan Saat Ini</label>
                        <span style={{ fontSize: '1.1rem', fontWeight: '700' }}>{displayCv?.job || '—'}</span>
                      </div>
                      <div className="cv-info-field">
                        <label>Estimasi Gaji Bulanan</label>
                        <span style={{ fontSize: '1.1rem', fontWeight: '700' }}>{displayCv?.salary || '—'}</span>
                      </div>
                    </div>
                    <div className="cv-q-box">
                      <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: '900', color: '#D4AF37', textTransform: 'uppercase', marginBottom: '8px' }}>Pengalaman Kerja / Organisasi</label>
                      <p style={{ margin: 0, fontSize: '0.92rem', lineHeight: 1.6, color: '#334155', whiteSpace: 'pre-wrap' }}>{displayCv?.pengalaman_kerja || '—'}</p>
                    </div>
                  </div>
                </div>
              )}

              {activeViewTab === 'agama_nikah' && (
                <div className="cv-grid-layout" style={{ alignItems: 'start', animation: 'fadeIn 0.35s ease' }}>
                  {/* Card: 8. Ibadah */}
                  <div className="cv-card-premium" style={{ gridColumn: '1 / -1' }}>
                    <div className="cv-card-title">
                       <div className="cv-card-icon"><BookOpen size={22} color="#134E39" /></div>
                       <h3>Ibadah & Pemahaman Agama</h3>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                      <div className="cv-q-box">
                        <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: '900', color: '#D4AF37', textTransform: 'uppercase', marginBottom: '8px' }}>Ketaatan Ibadah Wajib</label>
                        <p style={{ margin: 0, fontSize: '0.92rem', lineHeight: 1.6, color: '#334155' }}>{displayCv?.worship_wajib || displayCv?.worship || '—'}</p>
                      </div>
                      <div className="cv-q-box">
                        <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: '900', color: '#D4AF37', textTransform: 'uppercase', marginBottom: '8px' }}>Rutinitas Ibadah Sunnah</label>
                        <p style={{ margin: 0, fontSize: '0.92rem', lineHeight: 1.6, color: '#334155' }}>{displayCv?.worship_sunnah || '—'}</p>
                      </div>
                      <div className="cv-q-box">
                        <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: '900', color: '#D4AF37', textTransform: 'uppercase', marginBottom: '8px' }}>Kemampuan Membaca Al-Qur'an</label>
                        <p style={{ margin: 0, fontSize: '0.92rem', lineHeight: 1.6, color: '#334155' }}>{displayCv?.baca_quran || '—'}</p>
                      </div>
                      <div className="cv-q-box">
                        <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: '900', color: '#D4AF37', textTransform: 'uppercase', marginBottom: '8px' }}>Kajian yang Sering Diikuti</label>
                        <p style={{ margin: 0, fontSize: '0.92rem', lineHeight: 1.6, color: '#334155' }}>{displayCv?.kajian || '—'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Card: 9. Persiapan Pernikahan */}
                  <div className="cv-card-premium" style={{ gridColumn: '1 / -1' }}>
                    <div className="cv-card-title">
                       <div className="cv-card-icon"><HeartHandshake size={22} color="#134E39" /></div>
                       <h3>Persiapan Pernikahan</h3>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                      <div className="cv-info-field">
                        <label>Target Waktu Menikah</label>
                        <span style={{ fontSize: '1.1rem', fontWeight: '700' }}>{displayCv?.target_menikah || '—'}</span>
                      </div>
                      <div className="cv-info-field">
                        <label>Pandangan Terhadap Poligami</label>
                        <span style={{ fontSize: '1.1rem', fontWeight: '700' }}>{displayCv?.poligami || 'Tidak Bersedia'}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      <div className="cv-q-box">
                        <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: '900', color: '#D4AF37', textTransform: 'uppercase', marginBottom: '8px' }}>Visi Pernikahan</label>
                        <p style={{ margin: 0, fontSize: '0.92rem', lineHeight: 1.65, color: '#334155', whiteSpace: 'pre-wrap' }}>{displayCv?.marriage_vision || '—'}</p>
                      </div>
                      <div className="cv-q-box">
                        <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: '900', color: '#D4AF37', textTransform: 'uppercase', marginBottom: '8px' }}>Hak & Tanggung Jawab Pasangan</label>
                        <p style={{ margin: 0, fontSize: '0.92rem', lineHeight: 1.65, color: '#334155', whiteSpace: 'pre-wrap' }}>{displayCv?.role_view || '—'}</p>
                      </div>
                      <div className="cv-q-box">
                        <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: '900', color: '#D4AF37', textTransform: 'uppercase', marginBottom: '8px' }}>Rencana Nafkah & Pengelolaan Keuangan</label>
                        <p style={{ margin: 0, fontSize: '0.92rem', lineHeight: 1.65, color: '#334155', whiteSpace: 'pre-wrap' }}>{displayCv?.rencana_nafkah || '—'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Card: 10. Harapan */}
                  <div className="cv-card-premium" style={{ gridColumn: '1 / -1' }}>
                    <div className="cv-card-title">
                       <div className="cv-card-icon"><Compass size={22} color="#134E39" /></div>
                       <h3>Harapan Setelah Menikah</h3>
                    </div>
                    <div className="cv-q-box">
                      <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: '900', color: '#D4AF37', textTransform: 'uppercase', marginBottom: '8px' }}>Harapan Tempat Tinggal, Karir, Pendidikan Pasangan, dll.</label>
                      <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.8, color: '#334155', whiteSpace: 'pre-wrap' }}>{displayCv?.harapan_pasangan || '—'}</p>
                    </div>
                  </div>
                </div>
              )}

              {activeViewTab === 'kriteria' && (
                <div className="cv-grid-layout" style={{ alignItems: 'start', animation: 'fadeIn 0.35s ease' }}>
                  {/* Card: 11. Kriteria Fisik */}
                  <div className="cv-card-premium">
                    <div className="cv-card-title">
                       <div className="cv-card-icon"><Target size={22} color="#134E39" /></div>
                       <h3>Kriteria Fisik</h3>
                    </div>
                    <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '1.25rem 1.5rem', border: '1px solid #f1f5f9', minHeight: '120px' }}>
                      <p style={{ fontSize: '0.95rem', lineHeight: 1.8, color: '#475569', fontWeight: '500', margin: 0, whiteSpace: 'pre-wrap' }}>{displayCv?.kriteria_fisik || '—'}</p>
                    </div>
                  </div>

                  {/* Card: 12. Kriteria Non Fisik */}
                  <div className="cv-card-premium">
                    <div className="cv-card-title">
                       <div className="cv-card-icon"><Shield size={22} color="#134E39" /></div>
                       <h3>Kriteria Non-Fisik</h3>
                    </div>
                    <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '1.25rem 1.5rem', border: '1px solid #f1f5f9', minHeight: '120px' }}>
                      <p style={{ fontSize: '0.95rem', lineHeight: 1.8, color: '#475569', fontWeight: '500', margin: 0, whiteSpace: 'pre-wrap' }}>{displayCv?.kriteria_non_fisik || displayCv?.criteria || '—'}</p>
                    </div>
                  </div>
                  
                  {/* Reviews list removed from main tab body */}
                </div>
              )}

              {/* ═══ DEDICATED REVIEW & KESAN BUTTON (bottom of right panel) ═══ */}
              <div style={{
                marginTop: '2rem',
                padding: '1.75rem',
                border: '2px dashed rgba(212, 175, 55, 0.35)',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, rgba(212,175,55,0.03) 0%, rgba(19,78,57,0.02) 100%)',
                textAlign: 'center',
                animation: 'fadeIn 0.5s ease'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '0.75rem' }}>
                  <div style={{
                    width: '42px', height: '42px', borderRadius: '12px',
                    background: 'rgba(212,175,55,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid rgba(212,175,55,0.15)'
                  }}>
                    <Star size={20} color="#D4AF37" fill="#D4AF37" />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '900', color: '#134E39' }}>Review & Kesan Kandidat</h4>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: '#94a3b8', fontWeight: '600' }}>Lihat pendapat jujur dari kandidat lainnya</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setShowReviewsListModal(true)}
                    style={{
                      flex: 1, minWidth: '180px', maxWidth: '280px',
                      padding: '0.85rem 1.5rem', borderRadius: '14px',
                      background: 'white', color: '#D4AF37',
                      border: '1.5px solid rgba(212,175,55,0.3)',
                      fontWeight: '900', fontSize: '0.78rem', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      boxShadow: '0 4px 15px rgba(212,175,55,0.08)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      letterSpacing: '0.03em'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(212,175,55,0.15)';
                      e.currentTarget.style.borderColor = '#D4AF37';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(212,175,55,0.08)';
                      e.currentTarget.style.borderColor = 'rgba(212,175,55,0.3)';
                    }}
                  >
                    <Eye size={16} /> LIHAT REVIEW & KESAN
                  </button>
                  {isViewingOther && (
                    <button
                      onClick={() => setShowReviewModal(true)}
                      style={{
                        flex: 1, minWidth: '180px', maxWidth: '280px',
                        padding: '0.85rem 1.5rem', borderRadius: '14px',
                        background: '#134E39', color: 'white',
                        border: 'none',
                        fontWeight: '900', fontSize: '0.78rem', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        boxShadow: '0 6px 20px rgba(19,78,57,0.2)',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        letterSpacing: '0.03em'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 10px 30px rgba(19,78,57,0.25)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(19,78,57,0.2)';
                      }}
                    >
                      <Quote size={16} /> BERIKAN KESAN
                    </button>
                  )}
                </div>
              </div>
            </div>
        </div>

        {/* Full Detail View Modal */}
        {fullViewItem && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }} onClick={() => setFullViewItem(null)}>
            <div style={{ background: 'white', padding: '3.5rem', borderRadius: '24px', maxWidth: '700px', width: '100%', maxHeight: '85vh', overflowY: 'auto', position: 'relative', boxShadow: '0 40px 100px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
              <button onClick={() => setFullViewItem(null)} style={{ position: 'absolute', top: '2rem', right: '2rem', background: '#f8fafc', border: 'none', width: '48px', height: '48px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
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
            <div style={{ background: 'white', padding: '3rem', borderRadius: '24px', maxWidth: '540px', width: '100%', position: 'relative', boxShadow: '0 40px 100px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
               <button onClick={() => setShowReviewModal(false)} style={{ position: 'absolute', top: '2rem', right: '2rem', background: '#f8fafc', border: 'none', width: '44px', height: '44px', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                 <X size={20} color={C.primary} />
               </button>
               
               <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '2.5rem' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '9px', background: 'rgba(19,78,57,0.05)', color: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                        width: '100%', padding: '1.5rem', borderRadius: '12px', border: '1.5px solid #f1f5f9', 
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
                     showToast('Review Anda telah berhasil disimpan.', 'success');
                   } catch {
                     showToast('Terjadi kesalahan saat menyimpan review.', 'error');
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

        {/* 📋 REVIEWS LIST MODAL 📋 */}
        {showReviewsListModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }} onClick={() => setShowReviewsListModal(false)}>
            <div style={{ background: 'white', padding: '2.5rem', borderRadius: '24px', maxWidth: '680px', width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', position: 'relative', boxShadow: '0 40px 100px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
               <button onClick={() => setShowReviewsListModal(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: '#f8fafc', border: 'none', width: '40px', height: '40px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                 <X size={20} color={C.primary} />
               </button>
               
               <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '1.5rem', textAlign: 'left' }}>
                   <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'rgba(212,175,55,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.12)', flexShrink: 0 }}>
                     <Star size={24} fill="#D4AF37" color="#D4AF37" />
                   </div>
                   <div>
                     <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#134E39', margin: 0 }}>Review & Kesan</h3>
                     <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.8rem', fontWeight: '600' }}>Pendapat jujur dari kandidat lainnya untuk {displayCv?.alias}</p>
                   </div>
               </div>

               <div style={{ flex: 1, overflowY: 'auto', paddingRight: '5px', marginBottom: '1rem' }} className="custom-scrollbar">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'left' }}>
                     {userReviews.filter(r => r.target_id === displayCv.user_id && r.is_active !== false).length === 0 ? (
                       <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#f8fafc', borderRadius: '20px', border: '2px dashed #e2e8f0' }}>
                          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', border: '1px solid #f1f5f9' }}>
                             <Quote size={26} color="#cbd5e1" />
                          </div>
                          <h4 style={{ color: '#134E39', fontWeight: '900', fontSize: '1.05rem', margin: '0 0 0.4rem' }}>Belum Ada Kesan</h4>
                          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.82rem', fontWeight: '500' }}>Jadilah yang pertama memberikan kesan</p>
                       </div>
                     ) : (
                       userReviews.filter(r => r.target_id === displayCv.user_id && r.is_active !== false).map(review => (
                         <div key={review.id} style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                             <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #134E39 0%, #1a5d46 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: '900', color: 'white' }}>
                                   {review.reviewer?.name?.charAt(0)}
                                </div>
                                <div>
                                   <span style={{ fontWeight: '800', color: '#134E39', fontSize: '0.95rem', display: 'block' }}>{review.reviewer?.name}</span>
                                   <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: '600' }}>{new Date(review.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                </div>
                             </div>
                             <div style={{ display: 'flex', gap: '3px', background: 'rgba(212,175,55,0.05)', padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(212,175,55,0.1)' }}>
                               {[1, 2, 3, 4, 5].map(s => <Star key={s} size={12} color={s <= review.rating ? '#D4AF37' : '#e2e8f0'} fill={s <= review.rating ? '#D4AF37' : 'transparent'} />)}
                             </div>
                           </div>
                           <div style={{ padding: '0.85rem 1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                              <p style={{ margin: 0, fontSize: '0.85rem', color: '#334155', lineHeight: 1.7, fontWeight: '500', fontStyle: 'italic' }}>"{review.comment}"</p>
                           </div>
                         </div>
                       ))
                     )}
                  </div>
               </div>

               {isViewingOther && (
                 <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
                   <button 
                     onClick={() => setShowReviewModal(true)}
                     style={{ 
                       background: '#134E39', color: 'white', border: 'none', 
                       padding: '0.75rem 1.5rem', borderRadius: '12px', 
                       fontWeight: '800', fontSize: '0.82rem', cursor: 'pointer',
                       display: 'flex', alignItems: 'center', gap: '8px',
                       boxShadow: '0 8px 20px rgba(19,78,57,0.15)',
                       transition: 'all 0.2s',
                       width: '100%',
                       justifyContent: 'center'
                     }}
                   >
                     <Plus size={16} /> BERIKAN KESAN
                   </button>
                 </div>
               )}
            </div>
          </div>
        )}
      </div>

    );
  }

  // 📝 WIZARD / EDIT CV DASHBOARD MODE 📝
  return (
    <div key="cv-edit-root" className="cv-root">
      <style>{`
        .cv-root {
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: ${C.text};
          width: 100%;
          height: 100%;
          overflow-y: auto;
          background: transparent;
          padding: 1rem 5%;
        }
        .edit-dashboard-card {
          background: white;
          border-radius: 24px;
          border: 1px solid #f1f5f9;
          padding: 1.5rem;
          box-shadow: none;
          max-width: 900px;
          margin: 0 auto;
        }
        .edit-table {
          width: 100%;
          border-collapse: collapse;
          margin: 2rem 0;
          background: white;
        }
        .edit-table th, .edit-table td {
          padding: 1rem 1.25rem;
          text-align: left;
          border-bottom: 1px solid #f1f5f9;
        }
        .edit-table th {
          font-weight: 800;
          color: ${C.primary};
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          background: #f8fafc;
        }
        .edit-table td {
          font-size: 0.95rem;
          font-weight: 600;
          color: ${C.text};
        }
        .status-badge {
          display: inline-flex;
          padding: 4px 12px;
          border-radius: 99px;
          font-size: 0.72rem;
          font-weight: 800;
        }
        .status-badge.filled {
          background: #dcfce7;
          color: #166534;
        }
        .status-badge.empty {
          background: #f1f5f9;
          color: #64748b;
        }
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
          text-align: left;
        }
        .form-group.full-width {
          grid-column: span 2;
        }
        .form-label {
          font-size: 0.8rem;
          font-weight: 800;
          color: ${C.primary};
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .form-control {
          width: 100%;
          padding: 0.85rem 1.25rem;
          border-radius: 12px;
          border: 1px solid #E2E8F0;
          font-size: 0.95rem;
          font-weight: 600;
          outline: none;
          background: #FFFFFF;
          transition: all 0.2s;
        }
        .form-control:focus {
          border-color: ${C.primary};
          box-shadow: 0 0 0 3px rgba(19,78,57,0.08);
        }
        .action-edit-btn {
          background: none;
          border: none;
          color: ${C.primary};
          font-weight: 800;
          font-size: 0.82rem;
          cursor: pointer;
          text-decoration: underline;
          padding: 4px 8px;
          border-radius: 6px;
        }
        .action-edit-btn:hover {
          background: rgba(19,78,57,0.05);
        }
        @media (max-width: 768px) {
          .cv-root {
            padding: 1rem 0.5rem !important;
          }
          .edit-dashboard-card {
            padding: 1.5rem 1rem !important;
          }
          .form-grid {
            grid-template-columns: 1fr !important;
          }
          .form-group.full-width {
            grid-column: span 1 !important;
          }
          .edit-table th:nth-child(1), .edit-table td:nth-child(1) {
            display: none; /* Hide No on mobile */
          }
        }
      `}</style>

      <div className="edit-dashboard-card">
        {activeEditSection === null ? (
          /* 📋 12-SECTIONS CHECKLIST TABLE DASHBOARD 📋 */
          <div style={{ animation: 'fadeIn 0.35s ease' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '950', color: C.primary, margin: '0 0 0.5rem', textAlign: 'center', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Restrukturisasi CV Taaruf</h2>
            <p style={{ color: C.muted, fontWeight: '600', fontSize: '0.9rem', textAlign: 'center', margin: '0 0 2rem' }}>Lengkapi 12 bagian di bawah ini sebelum menyimpan dan mempublikasikan CV Anda.</p>
            
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '16px', marginBottom: '2rem', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <Info size={20} color={C.primary} />
              <p style={{ margin: 0, fontSize: '0.82rem', color: C.primaryLt, fontWeight: '600', lineHeight: 1.4, textAlign: 'left' }}>
                Anda dapat mengisi data secara bertahap dengan mengklik <strong>Lengkapi / Edit</strong> di setiap baris. Klik tombol <strong>SIMPAN & KELUAR</strong> di bagian bawah jika sudah selesai.
              </p>
            </div>

            <table className="edit-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>No</th>
                  <th>Bagian</th>
                  <th style={{ width: '120px' }}>Status</th>
                  <th style={{ width: '120px', textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {sections.map((sec) => {
                  const filled = getSectionStatus(sec.id);
                  return (
                    <tr key={sec.id}>
                      <td style={{ fontWeight: '800', color: C.muted }}>{sec.id}</td>
                      <td style={{ fontWeight: '800', color: C.primary }}>{sec.name}</td>
                      <td>
                        <span className={`status-badge ${filled ? 'filled' : 'empty'}`}>
                          {filled ? 'terisi' : 'belum terisi'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button className="action-edit-btn" onClick={() => setActiveEditSection(sec.id)}>
                          {filled ? 'Edit' : 'Lengkapi'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '2.5rem' }}>
              <button 
                className="cv-btn-side cv-btn-side-outline" 
                style={{ flex: 1, padding: '1.1rem', borderRadius: '12px', fontWeight: '800', background: 'white', border: `2px solid ${C.border}`, color: C.primary, cursor: 'pointer' }}
                onClick={() => setIsEditingCv(false)}
              >
                KEMBALI KE PREVIEW
              </button>
              <button 
                className="cv-btn-side cv-btn-side-primary" 
                style={{ flex: 1.5, padding: '1.1rem', borderRadius: '12px', fontWeight: '900', background: C.primary, border: 'none', color: 'white', cursor: 'pointer', boxShadow: '0 10px 20px rgba(19,78,57,0.15)' }}
                onClick={async () => {
                  // Final check for Profil
                  if (!getSectionStatus(1)) {
                    showAlert('Formulir Belum Lengkap', 'Bagian PROFIL (Nomor 1) adalah bagian wajib yang harus diisi.', 'error');
                    setActiveEditSection(1);
                    return;
                  }
                  try {
                    await handleCvSubmit(false); // Global save with Alert and Reload
                    setIsEditingCv(false);
                  } catch (err) {
                    // Alert is handled inside handleCvSubmit
                  }
                }}
              >
                SIMPAN & KELUAR
              </button>
            </div>
          </div>
        ) : (
          /* 📝 DYNAMIC SUB-FORM FOR SPECIFIC SECTION 📝 */
          <div style={{ animation: 'fadeIn 0.35s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2.5rem' }}>
              <button 
                onClick={() => setActiveEditSection(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.primary, display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '800', fontSize: '0.85rem' }}
              >
                <ChevronLeft size={20} /> KEMBALI
              </button>
              <div style={{ margin: '0 auto', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '900', color: C.gold, letterSpacing: '0.15em', display: 'block', textTransform: 'uppercase', marginBottom: '4px' }}>EDIT BAGIAN {activeEditSection}</span>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: C.primary, margin: 0 }}>{sections.find(s => s.id === activeEditSection).name}</h2>
              </div>
            </div>

            <div className="form-grid" style={{ marginBottom: '3rem' }}>
              {/* SECTION 1: PROFIL */}
              {activeEditSection === 1 && (
                <>
                  <div className="form-group">
                    <label className="form-label">Nama Alias <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="text" className="form-control" placeholder="Contoh: Ahmad" value={myCv.alias || ''} onChange={e => set('alias', e.target.value)} />
                    <small style={{ color: C.muted }}>Nama samaran yang ditampilkan ke calon pasangan.</small>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Jenis Kelamin <span style={{ color: '#ef4444' }}>*</span></label>
                    <select className="form-control" value={myCv.gender || ''} onChange={e => set('gender', e.target.value)}>
                      <option value="ikhwan">Ikhwan (Laki-laki)</option>
                      <option value="akhwat">Akhwat (perempuan)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Usia <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="number" className="form-control" placeholder="Contoh: 25" value={myCv.age || ''} onChange={e => set('age', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Suku Bangsa <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="text" className="form-control" placeholder="Contoh: Jawa / Sunda" value={myCv.suku || ''} onChange={e => set('suku', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Domisili Provinsi <span style={{ color: '#ef4444' }}>*</span></label>
                    <select className="form-control" value={myCv.domisili_provinsi || ''} onChange={e => {
                      const val = e.target.value;
                      setMyCv(p => ({ ...p, domisili_provinsi: val, domisili_kota: '', location: `, ${val}` }));
                    }}>
                      <option value="">-- Pilih Provinsi --</option>
                      {provinces.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Domisili Kota <span style={{ color: '#ef4444' }}>*</span></label>
                    <select className="form-control" value={myCv.domisili_kota || ''} onChange={e => {
                      const val = e.target.value;
                      setMyCv(p => ({ ...p, domisili_kota: val, location: `${val}, ${p.domisili_provinsi}` }));
                    }} disabled={!myCv.domisili_provinsi || isFetchingCities}>
                      <option value="">{isFetchingCities ? 'Memuat...' : '-- Pilih Kota --'}</option>
                      {cities.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status Pernikahan <span style={{ color: '#ef4444' }}>*</span></label>
                    <select className="form-control" value={myCv.marital_status || ''} onChange={e => set('marital_status', e.target.value)}>
                      <option value="Lajang">Lajang (Belum Pernah Menikah)</option>
                      {myCv.gender === 'ikhwan' ? (
                        <>
                          <option value="Duda">Duda</option>
                          <option value="Sudah Menikah">Sudah Menikah</option>
                        </>
                      ) : myCv.gender === 'akhwat' ? (
                        <option value="Janda">Janda</option>
                      ) : (
                        <>
                          <option value="Duda">Duda</option>
                          <option value="Janda">Janda</option>
                          <option value="Sudah Menikah">Sudah Menikah</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div className="form-group full-width">
                    <label className="form-label">Alamat Lengkap <span style={{ color: '#ef4444' }}>*</span></label>
                    <textarea className="form-control" style={{ minHeight: '80px' }} placeholder="Tulis alamat lengkap tinggal saat ini..." value={myCv.address || ''} onChange={e => set('address', e.target.value)} />
                  </div>
                </>
              )}

              {/* SECTION 2: FOTO */}
              {activeEditSection === 2 && (
                <div className="form-group full-width" style={{ textAlign: 'center' }}>
                  <label className="form-label" style={{ display: 'block', textAlign: 'center', marginBottom: '1rem' }}>Foto Profil Diri</label>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ width: '150px', height: '150px', borderRadius: '50%', background: '#f8fafc', border: `2px dashed ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {myCv.foto_url ? (
                        <img src={myCv.foto_url} alt="Foto Profil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <Camera size={40} color={C.muted} />
                      )}
                    </div>
                    <div style={{ width: '100%', maxWidth: '500px', textAlign: 'center' }}>
                      <input 
                        type="file" 
                        accept="image/*"
                        id="photo-upload"
                        style={{ display: 'none' }}
                        onChange={handlePhotoUpload}
                        disabled={isUploadingPhoto}
                      />
                      <label 
                        htmlFor="photo-upload"
                        style={{ 
                          display: 'inline-flex', alignItems: 'center', gap: '8px', 
                          padding: '0.85rem 1.5rem', borderRadius: '12px',
                          background: isUploadingPhoto ? '#f1f5f9' : '#134E39', 
                          color: isUploadingPhoto ? '#94a3b8' : 'white', 
                          fontWeight: '800', cursor: isUploadingPhoto ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s', border: 'none',
                          boxShadow: isUploadingPhoto ? 'none' : '0 4px 12px rgba(19, 78, 57, 0.2)'
                        }}
                      >
                        {isUploadingPhoto ? <Loader2 size={18} className="spin-anim" /> : <UploadCloud size={18} />}
                        {isUploadingPhoto ? 'Mengunggah...' : (myCv.foto_url ? 'Ganti Foto' : 'Unggah Foto')}
                      </label>
                      <small style={{ color: C.muted, marginTop: '12px', display: 'block', lineHeight: '1.5' }}>
                        Format yang didukung: JPG, PNG, WEBP.<br/>Maksimal ukuran: 5MB.
                      </small>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 3: GAMBARAN FISIK */}
              {activeEditSection === 3 && (
                <>
                  <div className="form-group">
                    <label className="form-label">Tinggi Badan (cm) <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="text" className="form-control" placeholder="Contoh: 170" value={myCv.tinggi_badan || ''} onChange={e => set('tinggi_badan', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Berat Badan (kg) <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="text" className="form-control" placeholder="Contoh: 65" value={myCv.berat_badan || ''} onChange={e => set('berat_badan', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Kondisi Kesehatan <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="text" className="form-control" placeholder="Contoh: Sehat walafiat, tidak ada riwayat penyakit kronis" value={myCv.kesehatan || ''} onChange={e => set('kesehatan', e.target.value)} />
                  </div>
                  <div className="form-group full-width">
                    <label className="form-label">Bentuk Fisik & Ciri Khas <span style={{ color: '#ef4444' }}>*</span></label>
                    <textarea className="form-control" style={{ minHeight: '100px' }} placeholder="Jelaskan warna kulit, bentuk wajah, ciri khas fisik (jika ada tahi lalat, berkacamata, dll)..." value={myCv.ciri_fisik || ''} onChange={e => set('ciri_fisik', e.target.value)} />
                  </div>
                </>
              )}

              {/* SECTION 4: GAMBARAN DIRI */}
              {activeEditSection === 4 && (
                <>
                  <div className="form-group full-width">
                    <label className="form-label">Karakter Diri Positif <span style={{ color: '#ef4444' }}>*</span></label>
                    <textarea className="form-control" style={{ minHeight: '80px' }} placeholder="Tulis sifat positif Anda (contoh: disiplin, jujur, humoris)..." value={myCv.karakter_positif || ''} onChange={e => set('karakter_positif', e.target.value)} />
                  </div>
                  <div className="form-group full-width">
                    <label className="form-label">Karakter Diri Negatif <span style={{ color: '#ef4444' }}>*</span></label>
                    <textarea className="form-control" style={{ minHeight: '80px' }} placeholder="Tulis kelemahan atau hal negatif diri Anda secara jujur..." value={myCv.karakter_negatif || ''} onChange={e => set('karakter_negatif', e.target.value)} />
                  </div>
                  <div className="form-group full-width">
                    <label className="form-label">Hobi & Kegemaran <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="text" className="form-control" placeholder="Contoh: Membaca buku sirah, bersepeda sore" value={myCv.hobi || ''} onChange={e => set('hobi', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Hal-hal yang Disukai <span style={{ color: '#ef4444' }}>*</span></label>
                    <textarea className="form-control" style={{ minHeight: '80px' }} placeholder="Makanan, aktivitas, adab, dll..." value={myCv.hal_disukai || ''} onChange={e => set('hal_disukai', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Hal-hal yang Tidak Disukai <span style={{ color: '#ef4444' }}>*</span></label>
                    <textarea className="form-control" style={{ minHeight: '80px' }} placeholder="Sifat buruk, aktivitas maksiat, dll..." value={myCv.hal_benci || ''} onChange={e => set('hal_benci', e.target.value)} />
                  </div>
                </>
              )}

              {/* SECTION 5: GAMBARAN KELUARGA */}
              {activeEditSection === 5 && (
                <>
                  <div className="form-group">
                    <label className="form-label">Urutan Bersaudara <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="text" className="form-control" placeholder="Contoh: Anak ke 2 dari 3 bersaudara" value={myCv.anak_ke_dari || ''} onChange={e => set('anak_ke_dari', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Pekerjaan Orang Tua <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="text" className="form-control" placeholder="Contoh: Ayah Pensiunan PNS, Ibu Rumah Tangga" value={myCv.pekerjaan_ortu || ''} onChange={e => set('pekerjaan_ortu', e.target.value)} />
                  </div>
                  <div className="form-group full-width">
                    <label className="form-label">Kondisi Keagamaan / Hubungan Keluarga <span style={{ color: '#ef4444' }}>*</span></label>
                    <textarea className="form-control" style={{ minHeight: '100px' }} placeholder="Ceritakan bagaimana kebiasaan ibadah di keluarga Anda, keharmonisan hubungan orang tua, dsb..." value={myCv.kondisi_keluarga || ''} onChange={e => set('kondisi_keluarga', e.target.value)} />
                  </div>
                </>
              )}

              {/* SECTION 6: PENDIDIKAN */}
              {activeEditSection === 6 && (
                <>
                  <div className="form-group full-width">
                    <label className="form-label">Pendidikan Terakhir <span style={{ color: '#ef4444' }}>*</span></label>
                    <select className="form-control" value={myCv.education || ''} onChange={e => set('education', e.target.value)}>
                      <option value="">Pilih Pendidikan</option>
                      {['SMA/SMK', 'D3', 'S1', 'S2', 'S3', 'Lainnya'].map(edu => <option key={edu} value={edu}>{edu}</option>)}
                    </select>
                  </div>
                  <div className="form-group full-width">
                    <label className="form-label">Detail Riwayat Pendidikan <span style={{ color: '#ef4444' }}>*</span></label>
                    <textarea className="form-control" style={{ minHeight: '120px' }} placeholder="Tuliskan nama instansi sekolah/universitas, tahun lulus, jurusan, pondok pesantren (jika ada)..." value={myCv.riwayat_pendidikan || ''} onChange={e => set('riwayat_pendidikan', e.target.value)} />
                  </div>
                </>
              )}

              {/* SECTION 7: PENGALAMAN */}
              {activeEditSection === 7 && (
                <>
                  <div className="form-group">
                    <label className="form-label">Pekerjaan Saat Ini <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="text" className="form-control" placeholder="Contoh: Guru / Software Engineer" value={myCv.job || ''} onChange={e => set('job', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Estimasi Gaji Bulanan <span style={{ color: '#ef4444' }}>*</span></label>
                    <select className="form-control" value={myCv.salary || ''} onChange={e => set('salary', e.target.value)}>
                      <option value="">Pilih Rentang Gaji</option>
                      {['< 3 Juta', '3 - 5 Juta', '5 - 10 Juta', '> 10 Juta', 'Tidak Berpenghasilan'].map(sal => <option key={sal} value={sal}>{sal}</option>)}
                    </select>
                  </div>
                  <div className="form-group full-width">
                    <label className="form-label">Pengalaman Kerja & Organisasi Terdahulu <span style={{ color: '#ef4444' }}>*</span></label>
                    <textarea className="form-control" style={{ minHeight: '120px' }} placeholder="Jelaskan sejarah pekerjaan atau kegiatan organisasi sosial/keagamaan yang pernah Anda ikuti..." value={myCv.pengalaman_kerja || ''} onChange={e => set('pengalaman_kerja', e.target.value)} />
                  </div>
                </>
              )}

              {/* SECTION 8: IBADAH */}
              {activeEditSection === 8 && (
                <>
                  <div className="form-group">
                    <label className="form-label">Ketaatan Ibadah Wajib <span style={{ color: '#ef4444' }}>*</span></label>
                    <textarea className="form-control" style={{ minHeight: '80px' }} placeholder="Apakah shalat 5 waktu rutin (ikhwan berjamaah di masjid)? Ketaatan puasa Ramadhan?" value={myCv.worship_wajib || ''} onChange={e => set('worship_wajib', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Rutinitas Ibadah Sunnah <span style={{ color: '#ef4444' }}>*</span></label>
                    <textarea className="form-control" style={{ minHeight: '80px' }} placeholder="Shalat tahajjud, dhuha, puasa sunnah, dzikir pagi-petang..." value={myCv.worship_sunnah || ''} onChange={e => set('worship_sunnah', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Kemampuan Membaca Al-Qur'an <span style={{ color: '#ef4444' }}>*</span></label>
                    <textarea className="form-control" style={{ minHeight: '80px' }} placeholder="Kelancaran membaca, pemahaman tajwid, hafalan surat..." value={myCv.baca_quran || ''} onChange={e => set('baca_quran', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Kajian yang Sering Diikuti <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="text" className="form-control" placeholder="Contoh: Kajian kitab Aqidah/Fikih Ustadz Yazid, dsb" value={myCv.kajian || ''} onChange={e => set('kajian', e.target.value)} />
                  </div>
                </>
              )}

              {/* SECTION 9: PERSIAPAN PERNIKAHAN */}
              {activeEditSection === 9 && (
                <>
                  <div className="form-group">
                    <label className="form-label">Target Menikah <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="text" className="form-control" placeholder="Contoh: 6 Bulan ke depan / akhir tahun ini" value={myCv.target_menikah || ''} onChange={e => set('target_menikah', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Pandangan Terhadap Poligami <span style={{ color: '#ef4444' }}>*</span></label>
                    <select className="form-control" value={myCv.poligami || ''} onChange={e => set('poligami', e.target.value)}>
                      <option value="Tidak Bersedia">Tidak Bersedia</option>
                      <option value="Bersedia">Bersedia</option>
                      <option value="Mungkin">Mungkin / Diskusi</option>
                    </select>
                  </div>
                  <div className="form-group full-width">
                    <label className="form-label">Visi Pernikahan Islami Anda <span style={{ color: '#ef4444' }}>*</span></label>
                    <textarea className="form-control" style={{ minHeight: '80px' }} placeholder="Bagaimana visi rumah tangga sakinah, mawaddah, warahmah yang ingin Anda bangun?" value={myCv.marriage_vision || ''} onChange={e => set('marriage_vision', e.target.value)} />
                  </div>
                  <div className="form-group full-width">
                    <label className="form-label">Hak & Tanggung Jawab Pasangan (Role) <span style={{ color: '#ef4444' }}>*</span></label>
                    <textarea className="form-control" style={{ minHeight: '80px' }} placeholder="Bagaimana pandangan Anda tentang pembagian tugas suami istri di rumah tangga?" value={myCv.role_view || ''} onChange={e => set('role_view', e.target.value)} />
                  </div>
                  <div className="form-group full-width">
                    <label className="form-label">Rencana Nafkah & Pengelolaan Keuangan <span style={{ color: '#ef4444' }}>*</span></label>
                    <textarea className="form-control" style={{ minHeight: '80px' }} placeholder="Bagaimana pengelolaan nafkah, hak nafkah istri, tabungan bersama, dsb..." value={myCv.rencana_nafkah || ''} onChange={e => set('rencana_nafkah', e.target.value)} />
                  </div>
                </>
              )}

              {/* SECTION 10: HARAPAN */}
              {activeEditSection === 10 && (
                <div className="form-group full-width">
                  <label className="form-label">Harapan Setelah Menikah <span style={{ color: '#ef4444' }}>*</span></label>
                  <textarea className="form-control" style={{ minHeight: '150px' }} placeholder="Tuliskan harapan tempat tinggal (kontrak/ikut ortu), karir istri (boleh kerja/di rumah), pendidikan anak, nafkah, dll..." value={myCv.harapan_pasangan || ''} onChange={e => set('harapan_pasangan', e.target.value)} />
                </div>
              )}

              {/* SECTION 11: KRITERIA FISIK */}
              {activeEditSection === 11 && (
                <div className="form-group full-width">
                  <label className="form-label">Kriteria Fisik Pasangan <span style={{ color: '#ef4444' }}>*</span></label>
                  <textarea className="form-control" style={{ minHeight: '150px' }} placeholder="Sebutkan rentang usia yang dicari, tinggi/berat badan idaman, warna kulit, penampilan dsb..." value={myCv.kriteria_fisik || ''} onChange={e => set('kriteria_fisik', e.target.value)} />
                </div>
              )}

              {/* SECTION 12: KRITERIA NON FISIK */}
              {activeEditSection === 12 && (
                <div className="form-group full-width">
                  <label className="form-label">Kriteria Non-Fisik Pasangan <span style={{ color: '#ef4444' }}>*</span></label>
                  <textarea className="form-control" style={{ minHeight: '150px' }} placeholder="Sebutkan kriteria pemahaman agama (manhaj), akhlak, karakter sifat, tingkat pendidikan dsb..." value={myCv.kriteria_non_fisik || ''} onChange={e => set('kriteria_non_fisik', e.target.value)} />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <button 
                className="cv-btn-side cv-btn-side-outline" 
                style={{ flex: 1, padding: '1.1rem', borderRadius: '12px', fontWeight: '800', background: 'white', border: `2px solid ${C.border}`, color: C.primary, cursor: 'pointer' }}
                onClick={() => setActiveEditSection(null)}
              >
                BATAL & KEMBALI
              </button>
              <button 
                className="cv-btn-side cv-btn-side-primary" 
                disabled={isSubmittingCv}
                style={{ flex: 2, padding: '1.1rem', borderRadius: '12px', fontWeight: '900', background: C.primary, border: 'none', color: 'white', cursor: 'pointer', boxShadow: '0 10px 20px rgba(19,78,57,0.15)', opacity: isSubmittingCv ? 0.6 : 1 }}
                onClick={handleSectionSave}
              >
                {isSubmittingCv ? 'MENYIMPAN...' : 'SIMPAN BAGIAN INI'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}