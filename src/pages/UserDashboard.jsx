import React, { useContext, useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import {
  FileText, Search, UserCheck, Send, Clock, MessageCircle,
  Users, CheckCircle, XCircle, User, MapPin, Briefcase,
  GraduationCap, Heart, BookOpen, AlertCircle, ShieldAlert,
  ChevronDown, ChevronRight, Sparkles, Star, Target, Compass, ArrowRight, Award, Settings, Zap, ShieldCheck, Eye
} from 'lucide-react';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';
import { supabase } from '../supabase';
import AccountTab from '../components/dashboard/AccountTab';
import LearningTab from '../components/dashboard/LearningTab';
import CertificateTab from '../components/dashboard/CertificateTab';
import FeedbackTab from '../components/dashboard/FeedbackTab';

const MAJOR_SUKU = [
  "Jawa", "Sunda", "Batak", "Minangkabau", "Bugis", "Madura", "Betawi", "Melayu", 
  "Arab", "Tionghoa", "Aceh", "Bali", "Sasak", "Dayak", "Banjar", "Makassar", 
  "Minahasa", "Nias", "Mandar", "Cirebon", "Lampung", "Bangka", "Bima", "Papua",
  "Musi", "Banjar", "Dayak", "Toraja", "Buton", "Gorontalo", "Minahasa", "Nias"
].sort();

export default function UserDashboard() {
  const { user, cvs, setCvs, taarufRequests, setTaarufRequests, usersDb, setUsersDb, messages, setMessages, showAlert, addNotification, academyLevels, getAcademyBadge, claimedBadges, setClaimedBadges } = useContext(AppContext);
  console.log('DEBUG Academy Levels:', academyLevels);
  console.log('DEBUG Claimed:', claimedBadges);
  const navigate = useNavigate();
  const { tab, id, subId } = useParams();
  const activeTab = tab || 'home';

  const setActiveTab = (newTab) => navigate(`/app/${newTab}`);

  // ── Chat State ──
  const [activeChatId, setActiveChatId] = useState(null);
  const [chatInput, setChatInput] = useState('');

  // ── CV Form State ──
  const [myCv, setMyCv] = useState({
    alias: user?.name || '', gender: user?.gender || '', age: '', location: '',
    domisili_provinsi: '', domisili_kota: '',
    education: '', job: '', worship: '', about: '', criteria: '', suku: '',
    hobi: '', poligami: 'Tidak Bersedia', salary: '', address: '',
    marital_status: 'Lajang', tinggi_berat: '', kesehatan: '', kajian: '', karakter: ''
  });
  const [cvStep, setCvStep] = useState(1);
  const totalSteps = 6;
  const [isEditingCv, setIsEditingCv] = useState(false);
  const [isSubmittingCv, setIsSubmittingCv] = useState(false);

  const myExistingCv = cvs.find(cv => cv.user_id === user.id);
  const hasSubmittedCv = !!myExistingCv;

  // Split and sync location fields when editing
  useEffect(() => {
    if (isEditingCv && myExistingCv?.location) {
      const parts = myExistingCv.location.split(', ');
      if (parts.length === 2) {
        setMyCv(prev => ({ 
          ...prev, 
          domisili_kota: parts[0], 
          domisili_provinsi: parts[1] 
        }));
      }
    }
  }, [isEditingCv, myExistingCv?.location]);
  
  // ── LMS State ──
  const [curriculum, setCurriculum] = useState([]);
  const [classes, setClasses] = useState([]);
  const [activeClass, setActiveClass] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [lmsLoading, setLmsLoading] = useState(true);
  const [lmsView, setLmsView] = useState('catalog');
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // ── Filters & Search ──
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ province: '', city: '', suku: '', hobi: '', poligami: 'Semua' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  // ── Locations State ──
  const [provinces, setProvinces] = useState([]);
  const [regencies, setRegencies] = useState([]);
  const [isFetchingLocations, setIsFetchingLocations] = useState(false);

  // Fetch Provinces on Load
  useEffect(() => {
    setIsFetchingLocations(true);
    fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json')
      .then(r => {
        if (!r.ok) throw new Error("Gagal ambil provinsi");
        return r.json();
      })
      .then(data => {
        setProvinces(data || []);
        setIsFetchingLocations(false);
      })
      .catch(e => {
        console.error("Gagal ambil provinsi", e);
        setIsFetchingLocations(false);
      });
  }, []);

  // Fetch Regencies for Filters
  useEffect(() => {
    if (filters.province) {
       const provId = provinces.find(p => p.name === filters.province)?.id;
       if (provId) {
          fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${provId}.json`)
            .then(r => r.json())
            .then(data => setRegencies(data || []))
            .catch(e => console.error("Gagal ambil kota", e));
       }
    } else {
       setRegencies([]);
    }
  }, [filters.province, provinces]);

  const [viewingCv, setViewingCv] = useState(null);
  const [isPreviewingCv, setIsPreviewingCv] = useState(false);
  const [showQaTemplates, setShowQaTemplates] = useState(false);

  // Fetch Regencies for CV Form
  useEffect(() => {
    if (myCv.domisili_provinsi) {
       const provId = provinces.find(p => p.name === myCv.domisili_provinsi)?.id;
       if (provId) {
          fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${provId}.json`)
            .then(r => r.json())
            .then(data => setRegencies(data || []))
            .catch(e => console.error("Gagal ambil kota cv", e));
       }
    }
  }, [myCv.domisili_provinsi, provinces]);

  // Sync Detail Views with URL params
  useEffect(() => {
    // CV Detail Sync
    if (activeTab === 'find' && id) {
      const found = cvs.find(c => String(c.id) === String(id));
      if (found) setViewingCv(found);
    } else if (activeTab === 'find') {
      setViewingCv(null);
    }

    // Academy Detail Sync
    if (activeTab === 'materi' || activeTab === 'certificate') {
      if (id === 'catalog') {
        setLmsView('catalog');
        setActiveClass(null);
        setActiveLesson(null);
      } else if (id === 'dashboard') {
        setLmsView('dashboard');
        setActiveClass(null);
        setActiveLesson(null);
      } else if (id) {
        setLmsView('player');
        const foundClass = classes.find(c => String(c.id) === String(id));
        if (foundClass) {
          setActiveClass(foundClass);
          setCurriculum(foundClass.modules);
          if (subId) {
            const foundLesson = foundClass.modules.flatMap(m => m.items).find(i => String(i.id) === String(subId));
            if (foundLesson) setActiveLesson(foundLesson);
          } else {
            // Pick first lesson if no subId
            const firstLesson = foundClass.modules[0]?.items[0];
            if (firstLesson) setActiveLesson(firstLesson);
          }
        }
      } else if (activeTab === 'materi') {
        setLmsView('welcome');
        setActiveClass(null);
        setActiveLesson(null);
      }
    }
  }, [id, subId, activeTab, cvs, classes]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters]);


  const takenUserIds = useMemo(() => {
    return new Set(
      taarufRequests
        .filter(r => r.status === 'completed')
        .flatMap(r => [r.senderId, r.targetUserId])
    );
  }, [taarufRequests]);

  const fetchCurriculum = async () => {
    setLmsLoading(true);
    try {
      const { data: clsData } = await supabase.from('lms_classes').select('*').order('order_index');
      const { data: coursesData } = await supabase.from('courses').select('*').order('order_index');
      const { data: lessonsData } = await supabase.from('lessons').select('*').order('order_index');
      const { data: quizData } = await supabase.from('quiz_questions').select('*').order('order_index');

      const { data: progressData } = await supabase.from('user_lesson_progress').select('lesson_id, completed, score').eq('user_id', user.id);
      const doneSet = new Set((progressData || []).filter(p => p.completed).map(p => p.lesson_id));

      const builtClasses = (clsData || [])
        .filter(cls => cls.is_published !== false) // Default to visible if null/undefined, hide if explicitly false
        .map(cls => ({
          ...cls,
          modules: (coursesData || [])
            .filter(c => c.class_id === cls.id && c.is_active !== false)
            .map((course, mi) => ({
              ...course,
              expanded: mi === 0,
              items: (lessonsData || [])
                .filter(l => l.course_id === course.id && l.is_published !== false)
                .map(l => ({
              id: l.id,
              type: l.type,
              title: l.title,
              videoUrl: l.video_url,
              duration: l.duration,
              done: doneSet.has(l.id),
              quizQuestions: l.type === 'quiz'
                ? (quizData || [])
                    .filter(qa => qa.lesson_id === l.id)
                    .map(qa => ({
                      q: qa.question_text,
                      options: qa.options,
                      correctAnswer: qa.correct_index
                    }))
                : []
            }))
        }))
      }));

      if (activeClass) {
        const found = builtClasses.find(c => c.id === activeClass.id);
        if (found) setCurriculum(found.modules);
      } else if (builtClasses.length > 0) {
        setCurriculum(builtClasses[0].modules);
      }
      setClasses(builtClasses);
    } catch (err) { console.error('Error fetching curriculum:', err); }
    finally { setLmsLoading(false); }
  };

  useEffect(() => { if (user) fetchCurriculum(); }, [user?.id]);

  const selectClassForPlayer = (cls) => {
    setActiveClass(cls);
    setCurriculum(cls.modules);
    setLmsView('player');
    const firstLesson = cls.modules?.[0]?.items?.[0] || null;
    setActiveLesson(firstLesson);
  };

  const markLessonDone = async (lessonId, score = null) => {
    setCurriculum(prev => prev.map(m => ({
      ...m,
      items: m.items.map(item => item.id === lessonId ? { ...item, done: true } : item)
    })));
    setClasses(prev => prev.map(cls => (activeClass && cls.id === activeClass.id) ? {
      ...cls,
      modules: cls.modules.map(m => ({
        ...m,
        items: m.items.map(item => item.id === lessonId ? { ...item, done: true } : item)
      }))
    } : cls));
    try {
      await supabase.from('user_lesson_progress').upsert({
        user_id: user.id, lesson_id: lessonId, completed: true, score: score, completed_at: new Date().toISOString()
      }, { onConflict: 'user_id,lesson_id' });
      
      const lessonsInThisClass = curriculum.flatMap(m => m.items);
      const doneCount = lessonsInThisClass.filter(l => l.done).length + 1;
      if (doneCount === lessonsInThisClass.length && activeClass) {
         addNotification(`Alhamdulillah! Anda telah menyelesaikan seluruh materi di kelas "${activeClass.title}". Klik untuk lihat sertifikat!`);
      }
    } catch (err) { console.error('Error saving progress:', err); }
  };

  const totalLessons = curriculum.reduce((acc, m) => acc + m.items.length, 0);
  const doneLessons = curriculum.reduce((acc, m) => acc + m.items.filter(i => i.done).length, 0);
  const progressPercent = totalLessons > 0 ? Math.round((doneLessons / totalLessons) * 100) : 0;
  const allDone = totalLessons > 0 && curriculum.flatMap(m => m.items).every(i => i.done);

  const toggleModule = (moduleId) => setCurriculum(prev => prev.map(m => m.id === moduleId ? { ...m, expanded: !m.expanded } : m));

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeChatId) return;
    const { error } = await supabase.from('messages').insert({ taaruf_request_id: activeChatId, sender_id: user.id, text: chatInput.trim() });
    if (!error) {
      // Update local state correctly for the nested grouped structure
      setMessages(prevMessages => {
        const newMsg = { 
          id: Date.now(), 
          sender: user.email, 
          senderAlias: user.name, 
          text: chatInput.trim(), 
          timestamp: new Date().toISOString() 
        };
        
        const existingGroup = prevMessages.find(m => String(m.taarufId) === String(activeChatId));
        if (existingGroup) {
          return prevMessages.map(m => String(m.taarufId) === String(activeChatId) 
            ? { ...m, chats: [...m.chats, newMsg] } 
            : m
          );
        } else {
          return [...prevMessages, { taarufId: activeChatId, chats: [newMsg] }];
        }
      });
      setChatInput('');
    } else {
      showAlert('Gagal', 'Pesan tidak dapat dikirim: ' + error.message, 'error');
    }
  };

  const handleCvSubmit = async () => {
    if (cvStep !== totalSteps) { setCvStep(cvStep + 1); return; }
    if (isSubmittingCv) return;
    setIsSubmittingCv(true);
    try {
      const cvPayload = {
        user_id: user.id, alias: myCv.alias, gender: myCv.gender, age: parseInt(myCv.age) || null,
        location: myCv.location, education: myCv.education, job: myCv.job, worship: myCv.worship,
        about: myCv.about, criteria: myCv.criteria, suku: myCv.suku, hobi: myCv.hobi,
        poligami: myCv.poligami, salary: myCv.salary, address: myCv.address,
        marital_status: myCv.marital_status, tinggi_berat: myCv.tinggi_berat,
        kesehatan: myCv.kesehatan, kajian: myCv.kajian, karakter: myCv.karakter, status: 'approved'
      };
      if (isEditingCv && myExistingCv) {
        const { data, error } = await supabase.from('cv_profiles').update(cvPayload).eq('id', myExistingCv.id).select();
        if (error || !data?.length) { 
           setIsSubmittingCv(false);
           return (showAlert('Error', 'Gagal update CV.', 'error'));
        }
        setCvs(cvs.map(cv => cv.id === myExistingCv.id ? data[0] : cv));
        addNotification('Alhamdulillah, CV berhasil diperbarui!');
      } else {
        const { data, error } = await supabase.from('cv_profiles').insert(cvPayload).select();
        if (error || !data?.length) {
           setIsSubmittingCv(false);
           return (showAlert('Error', 'Gagal kirim CV.', 'error'));
        }
        setCvs([...cvs, data[0]]);
        addNotification('Alhamdulillah, CV berhasil disubmit!');
      }
      setCvStep(7);
    } catch (err) { 
      showAlert('Error', 'Kesalahan sistem saat mengirim CV.', 'error'); 
    } finally {
      setIsSubmittingCv(false);
    }
  };

  const handleAjukanTaaruf = async (targetCv) => {
    if (!myExistingCv) { showAlert('CV Belum Lengkap', 'Lengkapi CV Taaruf terlebih dahulu.', 'error'); setActiveTab('my_cv'); return; }
    try {
      const { data, error } = await supabase.from('taaruf_requests').insert({ sender_id: user.id, target_cv_id: targetCv.id, target_user_id: targetCv.user_id, status: 'pending_target' }).select('*, sender:sender_id(email, name), target:target_cv_id(*), target_user:target_user_id(email, name)').single();
      if (error) { showAlert('Error', 'Gagal melakukan pengajuan.', 'error'); return; }
      setTaarufRequests([...taarufRequests, { id: data.id, senderEmail: data.sender.email, senderAlias: data.sender.name, targetCvId: data.target_cv_id, targetAlias: data.target.alias, targetEmail: data.target_user?.email, status: data.status, updatedAt: data.updated_at }]);
      showAlert('Berhasil', 'Pengajuan berhasil! Pantau di tab Status Taaruf.', 'success');
      setActiveTab('status');
    } catch (err) { showAlert('Error', 'Kesalahan sistem.', 'error'); }
  };

  const hour = new Date().getHours();
  const greeting = hour < 11 ? 'Selamat Pagi' : hour < 15 ? 'Selamat Siang' : hour < 18 ? 'Selamat Sore' : 'Selamat Malam';
  const candidateCount = cvs.filter(cv => {
    const isBasicMatch = cv.status === 'approved' && cv.user_id !== user.id && cv.gender !== user.gender;
    if (!isBasicMatch) return false;
    
    // Jika user sudah isi CV, filter yang lokasinya sama (minimal kotanya sama)
    if (myExistingCv && myExistingCv.location && cv.location) {
      const myCity = myExistingCv.location.split(' ')[0].toLowerCase();
      const candidateCity = cv.location.split(' ')[0].toLowerCase();
      return myCity === candidateCity;
    }
    return true; // Jika user belum isi CV, tampilkan semua sebagai potensi
  }).length;
  const myActiveRequests = taarufRequests.filter(r => r.senderEmail === user.email).length;
  const checks = [
    { label: 'Profil Dasar Dilengkapi', icon: <User size={14} />, done: !!(user?.name && user?.email) },
    { label: 'CV Taaruf Terpublikasi', icon: <FileText size={14} />, done: !!(myExistingCv && myExistingCv.status === 'approved') },
    { label: 'Detail Pekerjaan & Pendidikan', icon: <Briefcase size={14} />, done: !!(myExistingCv?.job && myExistingCv?.education) },
    { label: 'Ajukan Taaruf Pertama', icon: <Heart size={14} />, done: myActiveRequests > 0 },
  ];
  const checksDone = checks.filter(c => c.done).length;
  const onboardingPct = Math.round((checksDone / checks.length) * 100);

  return (
    <div className="dashboard-root" style={{ animation: 'fadeIn 0.6s ease-out', padding: '1rem' }}>
      
      {/* ══ HOME TAB ══ */}
      {activeTab === 'home' && (
        <div className="home-content">
          {/* ✨ HERO SECTION SOLID ✨ */}
          <div className="animate-up" style={{
            background: '#134E39',
            borderRadius: '40px', padding: 'clamp(2rem, 5vw, 4rem)', marginBottom: '2.5rem',
            position: 'relative', overflow: 'hidden', color: 'white',
            boxShadow: '0 25px 50px -12px rgba(19, 78, 57, 0.4)'
          }}>
            <div className="animate-float" style={{ position: 'absolute', bottom: '40px', right: '10%', opacity: 0.1 }}><Sparkles size={160} color="white" /></div>
            
            <div style={{ position: 'relative', zIndex: 2 }}>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <div style={{ 
                  display: 'inline-flex', alignItems: 'center', gap: '8px', 
                  background: 'rgba(255,255,255,0.05)', padding: '8px 20px', 
                  borderRadius: '99px', fontSize: '0.75rem', fontWeight: '700', 
                  color: '#D4AF37', letterSpacing: '0.08em',
                  backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <Target size={14} /> TINGKATKAN IKHTIAR ANDA
                </div>
                {getAcademyBadge(academyLevels[user.id]) && (() => {
                  const badge = getAcademyBadge(academyLevels[user.id]);
                  return (
                    <div style={{ 
                      display: 'inline-flex', alignItems: 'center', gap: '8px', 
                      background: 'rgba(212, 175, 55, 0.15)', padding: '8px 20px', 
                      borderRadius: '99px', fontSize: '0.75rem', fontWeight: '800', 
                      color: '#D4AF37', letterSpacing: '0.05em', border: '1px solid rgba(212, 175, 55, 0.3)'
                    }}>
                      {badge.icon} {badge.label.toUpperCase()}
                    </div>
                  );
                })()}

                {/* ✅ VERIFIED BADGE ✅ */}
                {user.is_verified && (
                  <div style={{ 
                    display: 'inline-flex', alignItems: 'center', gap: '8px', 
                    background: 'rgba(14, 165, 233, 0.15)', padding: '8px 20px', 
                    borderRadius: '99px', fontSize: '0.75rem', fontWeight: '800', 
                    color: '#0ea5e9', letterSpacing: '0.05em', border: '1px solid rgba(14, 165, 233, 0.3)'
                  }}>
                    <ShieldCheck size={14} /> AKUN TERVERIFIKASI
                  </div>
                )}
              </div>
              
              <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: '800', margin: '0 0 1rem', letterSpacing: '-0.04em', lineHeight: 1.05, color: 'white' }}>
                {greeting}, <br/>
                <span style={{ color: '#D4AF37' }}>{user?.name?.split(' ')[0]}</span>
              </h1>
              
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 'clamp(0.9rem, 1.2vw, 1.15rem)', margin: '0 0 2.5rem', maxWidth: '600px', lineHeight: '1.6' }}>
                Selamat datang di platform Taaruf modern. Langkah istiqomah Anda hari ini adalah awal dari keluarga berkah di masa depan.
              </p>
              
              <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                {hasSubmittedCv ? (
                   <button onClick={() => setActiveTab('my_cv')} style={{ background: '#D4AF37', color: '#134E39', border: 'none', borderRadius: '20px', padding: '1.2rem 2.5rem', fontWeight: '800', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 15px 30px rgba(212,175,55,0.3)' }}>
                      <Eye size={20} /> Lihat CV Premium
                   </button>
                ) : (
                   <button onClick={() => setActiveTab('my_cv')} style={{ background: '#D4AF37', color: '#134E39', border: 'none', borderRadius: '20px', padding: '1.2rem 2.5rem', fontWeight: '800', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 15px 30px rgba(212,175,55,0.3)' }}>
                      <FileText size={20} /> Lengkapi CV Taaruf
                   </button>
                )}
                <button onClick={() => navigate('/app/materi')} style={{ background: 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '16px', padding: '0.8rem 1.5rem', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', backdropFilter: 'blur(10px)', transition: 'all 0.3s' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.transform = 'translateY(-3px)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                  <GraduationCap size={18} /> Akademi Mawaddah
                </button>
              </div>
            </div>
          </div>

          {/* 🧩 STATS GRID SOLID 🧩 */}
          <div className="dashboard-grid animate-up stagger-1" style={{ marginBottom: '3rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {[
              { label: 'Kandidat Cocok', value: candidateCount, color: '#134E39', icon: <Users size={24} />, sub: 'Tersedia di lokasi Anda', tab: 'find' },
              { label: 'Prosedur Aktif', value: myActiveRequests, color: '#134E39', icon: <Heart size={24} />, sub: 'Pengajuan berjalan', tab: 'status' },
              { label: 'Badge Aktivitas', value: 'Aktif', color: '#134E39', icon: <Star size={24} />, sub: 'Status Akun Pengguna', tab: 'status' },
            ].map((stat, i) => (
              <div key={i} onClick={() => setActiveTab(stat.tab)} style={{ 
                background: 'white', borderRadius: '30px', padding: '2rem', 
                cursor: 'pointer', border: '1px solid rgba(0,0,0,0.03)',
                boxShadow: '0 15px 35px rgba(0,0,0,0.02)', display: 'flex', 
                alignItems: 'center', gap: '1.5rem', transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
              }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = '0 25px 45px rgba(0,0,0,0.05)'; e.currentTarget.style.borderColor = 'rgba(19,78,57,0.1)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 15px 35px rgba(0,0,0,0.02)'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.03)'; }}>
                <div style={{ width: '70px', height: '70px', borderRadius: '22px', background: `${stat.color}08`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color, flexShrink: 0, transition: 'all 0.3s' }}>{stat.icon}</div>
                <div>
                  <div style={{ fontSize: '1.85rem', fontWeight: '800', color: '#0f172a', lineHeight: 1, marginBottom: '0.4rem' }}>{stat.value}</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#64748b', marginBottom: '0.2rem' }}>{stat.label}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600' }}>{stat.sub}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="dashboard-main-grid animate-up stagger-2">
            <div style={{ background: 'white', borderRadius: '32px', padding: '2.5rem', border: '1px solid #f1f5f9' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#134E39', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                   <CheckCircle size={20} /> Checklist Persiapan Taaruf
                </h3>
                <div style={{ background: 'rgba(19,78,57,0.03)', padding: '1.5rem', borderRadius: '24px', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                   <div style={{ position: 'relative', width: '60px', height: '60px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                      <span style={{ fontWeight: '900', color: '#134E39', fontSize: '1.1rem' }}>{onboardingPct}%</span>
                   </div>
                   <div>
                      <div style={{ fontWeight: '800', color: '#134E39', fontSize: '1rem' }}>Progres Onboarding</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Lengkapi langkah berikut untuk memulai pencarian.</div>
                   </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                   {checks.map((check, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderRadius: '20px', background: check.done ? '#f0fdf4' : '#f8fafc', border: check.done ? '1px solid #bbf7d0' : '1px solid #f1f5f9', transition: 'all 0.3s' }}>
                         <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: check.done ? '#166534' : '#e2e8f0', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {check.done ? <CheckCircle size={18} /> : check.icon}
                         </div>
                         <div style={{ flex: 1, fontWeight: '700', fontSize: '0.9rem', color: check.done ? '#166534' : '#64748b' }}>{check.label}</div>
                         {check.done ? (
                            <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#166534', background: '#dcfce7', padding: '4px 10px', borderRadius: '99px' }}>SELESAI</span>
                         ) : (
                            <button onClick={() => idx === 1 ? setActiveTab('my_cv') : navigate('/app/find')} style={{ background: 'none', border: 'none', color: '#134E39', fontWeight: '800', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}>LAKUKAN</button>
                         )}
                      </div>
                   ))}
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
               <div style={{ background: '#134E39', borderRadius: '32px', padding: '2rem', color: 'white', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.1 }}><Compass size={100} fill="white" /></div>
                  <h4 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: '900', color: 'white' }}>Alur Taaruf Syar'i</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                     {[
                        'Cari & Pilih Kandidat Sesuai Kriteria',
                        'Pertukaran Kurikulum Vitae (CV) Taaruf',
                        'Nadzhor & Komunikasi Melalui Mediator',
                        'Khitbah & Akad Nikah Berkati'
                     ].map((t, i) => (
                        <div key={i} style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', lineHeight: 1.4 }}>
                           <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#D4AF37', color: '#134E39', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', flexShrink: 0 }}>{i+1}</div>
                           <div style={{ opacity: 0.9 }}>{t}</div>
                        </div>
                     ))}
                  </div>
               </div>

               <div style={{ background: 'white', borderRadius: '32px', padding: '1.5rem', border: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                     <ShieldCheck size={18} color="#134E39" />
                     <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '900', color: '#134E39' }}>Keamanan & Adab</h4>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', lineHeight: 1.6 }}>Semua interaksi dipantau oleh admin untuk menjaga kualitas dan adab Islami selama proses Taaruf berlangsung.</p>
               </div>
            </div>
         </div>
        </div>
      )}

      {/* ══ STATUS TAB ══ */}
      {activeTab === 'status' && (
        <div className="status-container" style={{ animation: 'fadeInUp 0.5s ease-out' }}>
           {activeChatId ? (() => {
            const req = taarufRequests.find(r => r.id === activeChatId);
            return (
              <div className="chat-window-container">
                <button className="chat-back-btn" onClick={() => setActiveChatId(null)}><ChevronRight size={18} style={{ transform: 'rotate(180deg)' }} /> Kembali ke Daftar Status</button>
                <div className="chat-card card">
                  <div className="chat-header">
                    <div className="chat-avatar"><User size={24} /></div>
                    <div className="chat-info">
                      <h3>Ruang Mediasi: {req?.senderEmail === user.email ? req.targetAlias : req.senderAlias}</h3>
                      <p>Diawasi oleh Admin & Ustadz Mawaddah</p>
                    </div>
                    <button className="qa-helper-btn" onClick={() => setShowQaTemplates(true)}>
                      <Compass size={14} /> Panduan Pertanyaan
                    </button>
                  </div>
                  <div className="chat-messages">
                    <div className="chat-disclaimer">
                      <ShieldAlert size={16} /> Percakapan ini dipantau untuk menjaga adab dan syariat. Dilarang bertukar nomor telepon atau media sosial lain di sini.
                    </div>
                    {(() => {
                      const chatObj = messages.find(m => String(m.taarufId) === String(activeChatId));
                      const chatMsgs = chatObj ? chatObj.chats : [];
                      return chatMsgs.map((msg, mi) => (
                        <div key={mi} className={`chat-bubble ${msg.sender === user.email ? 'sent' : 'received'}`}>
                          <div className="message-content">{msg.text}</div>
                          <div className="message-time">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                      ));
                    })()}
                  </div>
                  <form onSubmit={handleSendMessage} className="chat-input-area">
                    <input type="text" className="chat-input-field" placeholder="Ketik pertanyaan atau balasan Anda..." value={chatInput} onChange={e => setChatInput(e.target.value)} />
                    <button type="submit" className="chat-send-btn"><Send size={20} /></button>
                  </form>
                </div>
              </div>
            );
          })() : (
            <>
              <div style={{ marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: '900', color: '#134E39', margin: '0 0 0.5rem' }}>Status Ihtiar Anda</h2>
                <p style={{ color: '#64748b' }}>Pantau setiap tahapan proses taaruf yang sedang berlangsung.</p>
              </div>

              {taarufRequests.filter(req => req.senderEmail === user.email || (myExistingCv && req.targetCvId === myExistingCv.id)).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '6rem 2rem', background: 'white', borderRadius: '32px', border: '1px solid #f1f5f9' }}>
                  <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(19,78,57,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
                    <Compass size={48} color="#134E39" />
                  </div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#134E39' }}>Belum Ada Pengajuan Aktif</h3>
                  <p style={{ color: '#64748b', maxWidth: '400px', margin: '0 auto 2rem' }}>Mulailah dengan mencari kandidat yang sesuai dengan kriteria Anda di halaman pencarian.</p>
                  <button onClick={() => setActiveTab('find')} style={{ background: '#134E39', color: 'white', border: 'none', borderRadius: '16px', padding: '1rem 2.5rem', fontWeight: '800', cursor: 'pointer' }}>Cari Calon Pasangan</button>
                </div>
              ) : taarufRequests.filter(req => req.senderEmail === user.email || (myExistingCv && req.targetCvId === myExistingCv.id)).map(req => {
                const stages = ['pending_target', 'pending_admin', 'qna', 'wali_process', 'meet', 'completed'];
                const currentIndex = stages.indexOf(req.status);
                const getStepClass = (stepIndex) => {
                  if (req.status === 'rejected') return 'rejected';
                  if (currentIndex > stepIndex) return 'completed';
                  if (currentIndex === stepIndex) return 'active';
                  return '';
                };
                return (
                  <div key={req.id} style={{ background: 'white', borderRadius: '32px', padding: '2.5rem', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'rgba(212,175,55,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b8861e' }}>
                          <Heart size={24} />
                        </div>
                        <div>
                          <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#134E39', margin: 0 }}>
                            {req.senderEmail === user.email ? `Sedang Mengajukan ke ${req.targetAlias}` : `Pengajuan Masuk dari ${req.senderAlias}`}
                          </h3>
                          <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: '700', marginTop: '4px' }}>DIPERBARUI PADA {new Date(req.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}</div>
                        </div>
                      </div>
                      <div style={{ 
                        background: req.status === 'rejected' ? '#fef2f2' : (req.status === 'completed' || currentIndex >= 5 ? '#fefce8' : '#f0fdf4'), 
                        color: req.status === 'rejected' ? '#ef4444' : (req.status === 'completed' || currentIndex >= 5 ? '#a16207' : '#166534'), 
                        padding: '6px 16px', borderRadius: '99px', fontSize: '0.8rem', fontWeight: '800',
                        border: (req.status === 'completed' || currentIndex >= 5) ? '1px solid #fde047' : 'none'
                      }}>
                        {req.status === 'rejected' ? 'PROSES BERHENTI' : (req.status === 'completed' || currentIndex >= 5 ? 'PROSES BERHASIL' : 'PROSES BERJALAN')}
                      </div>
                    </div>

                    <div className="stepper-container" style={{ margin: '0 0 3rem' }}>
                      <div className="stepper" style={{ '--primary': '#134E39' }}>
                        {[['1', 'Tunggu\nCalon'], ['2', 'Review\nAdmin'], [<MessageCircle size={18} />, 'Fase Q&A'], [<Users size={18} />, 'Proses Wali'], ['5', 'Nadzhor'], [<CheckCircle size={18} />, 'Nikah']].map((step, idx) => (
                          <div key={idx} className={`step ${getStepClass(idx)}`}>
                            <div className="step-icon">{step[0]}</div>
                            <span className="step-label" style={{ whiteSpace: 'pre-line' }}>{step[1]}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ background: '#f8fafc', padding: '2rem', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
                      <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1rem', fontWeight: '900', color: '#134E39' }}>
                        <Clock size={20} color="#b8861e" /> Kabar Terbaru:
                      </h4>
                      
                      <div style={{ color: '#475569', lineHeight: 1.75, fontSize: '0.95rem' }}>
                        {req.status === 'pending_target' && <p>{req.senderEmail === user.email ? 'Alhamdulillah, pengajuan Anda sudah sampai ke pihak calon. Saat ini calon sedang meninjau profil/CV Anda. Mohon sabar menanti dan perbanyak istikharah.' : 'Ahlan! Seseorang tertarik dengan profil Anda. Silakan pelajari profil calon pengaju sebelum memutuskan setuju atau tidak.'}</p>}
                        
                        {req.status === 'pending_target' && req.senderEmail !== user.email && (
                          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                            <button className="btn btn-primary" style={{ padding: '0.8rem 1.5rem', background: '#134E39' }} onClick={async () => {
                              const { error } = await supabase.from('taaruf_requests').update({ status: 'pending_admin', updated_at: new Date().toISOString() }).eq('id', req.id);
                              if (!error) { 
                                setTaarufRequests(taarufRequests.map(r => r.id === req.id ? { ...r, status: 'pending_admin' } : r)); 
                                showAlert('Berhasil', 'Anda menyetujui pengajuan. Admin akan segera memverifikasi.', 'success');
                              }
                            }}><CheckCircle size={18} /> Bismillah, Saya Setuju</button>
                            <button onClick={async () => {
                              if (!window.confirm('Yakin menolak pengajuan ini?')) return;
                              const { error } = await supabase.from('taaruf_requests').update({ status: 'rejected', updated_at: new Date().toISOString() }).eq('id', req.id);
                              if (!error) setTaarufRequests(taarufRequests.map(r => r.id === req.id ? { ...r, status: 'rejected' } : r));
                            }} style={{ background: 'white', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '12px', padding: '0.8rem 1.5rem', fontWeight: '700', cursor: 'pointer' }}>Maaf, Belum Sesuai</button>
                          </div>
                        )}

                        {req.status === 'pending_admin' && <p>Calon kandidat telah memberikan lampu hijau. Sekarang berkas kedua belah pihak sedang diverifikasi oleh Ustadz/Admin untuk memastikan kesesuaian syariat sebelum berlanjut ke Q&A.</p>}
                        {req.status === 'qna' && <p>Alhamdulillah, Admin telah membuka pintu komunikasi virtual. Anda sekarang dapat saling mengenal visi misi lebih dalam melalui Ruang Chat Q&A di bawah.</p>}
                        {(req.status === 'completed' || currentIndex >= 5) && (
                          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🎉</div>
                            <h3 style={{ color: '#134E39', fontWeight: '900', marginBottom: '1rem' }}>Barakallahu Lakuma!</h3>
                            <p>Alhamdulillah, atas izin Allah proses taaruf ini telah disepakati untuk berlanjut ke jenjang pernikahan. CV Anda dan pasangan kini telah dinonaktifkan dari pencarian publik untuk menjaga privasi dan komitmen.</p>
                            <p style={{ marginTop: '1rem', fontStyle: 'italic', color: '#b8861e', fontWeight: '700' }}>"Semoga Allah memberkahimu dan memberkahi atasmu serta mengumpulkan kamu berdua dalam kebaikan."</p>
                          </div>
                        )}
                        {req.status === 'rejected' && <p>Afwan, proses taaruf ini tidak dapat dilanjutkan. Jangan berkecil hati, insya Allah ada hikmah terbaik dan calon yang lebih tepat menanti di waktu yang tepat.</p>}
                      </div>
                      
                      {req.status === 'qna' && (
                        <button style={{ marginTop: '1.5rem', width: '100%', background: '#134E39', color: 'white', border: 'none', borderRadius: '16px', padding: '1rem', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 10px 20px rgba(19,78,57,0.2)' }} onClick={() => setActiveChatId(req.id)}>
                          <MessageCircle size={20} /> Masuk Ruang Chat Q&A <ChevronRight size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* ══ ACCOUNT TAB ══ */}
      {activeTab === 'account' && <AccountTab user={user} showAlert={showAlert} />}

      {/* ══ MATERI TAB ══ */}
      {activeTab === 'materi' && (
        lmsLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '1.5rem' }}>
            <div style={{ width: 50, height: 50, border: '5px solid rgba(19,78,57,0.1)', borderTop: '5px solid #134E39', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <p style={{ color: '#64748b', fontWeight: '700' }}>Menyiapkan kurikulum belajar...</p>
          </div>
        ) : (
          <LearningTab
            user={user} classes={classes} 
            activeClass={activeClass} 
            selectClass={(cls) => navigate(`/app/materi/${cls.id}`)}
            curriculum={curriculum} 
            activeLesson={activeLesson} 
            setActiveLesson={(lesson) => navigate(`/app/materi/${activeClass?.id}/${lesson.id}`)}
            lmsView={lmsView} 
            setLmsView={(view) => { 
                if(view === 'catalog') navigate('/app/materi/catalog'); 
                else if(view === 'dashboard') navigate('/app/materi/dashboard');
                else if(view === 'welcome') navigate('/app/materi');
            }}
            quizAnswers={quizAnswers} setQuizAnswers={setQuizAnswers}
            quizSubmitted={quizSubmitted} setQuizSubmitted={setQuizSubmitted} progressPercent={progressPercent}
            doneLessons={doneLessons} totalLessons={totalLessons} allDone={allDone} markLessonDone={markLessonDone}
            toggleModule={toggleModule} setActiveTab={setActiveTab}
            academyLevels={academyLevels} getAcademyBadge={getAcademyBadge}
            claimedBadges={claimedBadges} setClaimedBadges={setClaimedBadges}
          />
        )
      )}

      {/* ══ CERTIFICATE TAB ══ */}
      {activeTab === 'certificate' && (
        lmsLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '1.5rem' }}>
            <div style={{ width: 50, height: 50, border: '5px solid rgba(19,78,57,0.1)', borderTop: '5px solid #134E39', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <p style={{ color: '#64748b', fontWeight: '700' }}>Menyiapkan sertifikat Anda...</p>
          </div>
        ) : (
          <CertificateTab user={user} activeClass={activeClass || classes.find(c => String(c.id) === String(id))} />
        )
      )}

      {/* ══ FEEDBACK TAB ══ */}
      {activeTab === 'feedback' && <FeedbackTab user={user} showAlert={showAlert} />}

      {/* ══ FIND TAB ══ */}
      {activeTab === 'find' && (
         <div className="find-container" style={{ animation: 'fadeInUp 0.5s ease-out' }}>
            {!myExistingCv ? (
              <div style={{ textAlign: 'center', padding: '6rem 2rem', background: 'white', borderRadius: '32px', border: '1px solid #f1f5f9' }}>
                <ShieldAlert size={64} color="#ef4444" style={{ marginBottom: '1.5rem' }} />
                <h2 style={{ fontSize: '1.75rem', fontWeight: '900', color: '#134E39' }}>Fitur Pencarian Terkunci</h2>
                <p style={{ color: '#64748b', maxWidth: '450px', margin: '0 auto 2rem', lineHeight: 1.6 }}>Sesuai aturan keamanan Mawaddah, Anda harus memiliki CV yang valid sebelum dapat melihat calon pasangan.</p>
                <button onClick={() => setActiveTab('my_cv')} style={{ background: '#134E39', color: 'white', border: 'none', borderRadius: '16px', padding: '1rem 3rem', fontWeight: '800', cursor: 'pointer' }}>Buat CV Sekarang</button>
              </div>
            ) : viewingCv ? (
              <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                <button onClick={() => navigate('/app/find')} style={{ border: 'none', background: 'none', color: '#64748b', fontWeight: '800', cursor: 'pointer', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>&larr; KEMBALI KE PENCARIAN</button>
                <div style={{ background: 'white', borderRadius: '32px', padding: '3rem', border: '1px solid #f1f5f9', boxShadow: '0 20px 40px rgba(0,0,0,0.03)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '2rem' }}>
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                      <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(19,78,57,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#134E39' }}><User size={40} /></div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <h2 style={{ fontSize: '2rem', fontWeight: '900', color: '#134E39', margin: 0 }}>{viewingCv.alias}</h2>
                          {getAcademyBadge(academyLevels[String(viewingCv.user_id)]) && (
                            <div 
                              title={`Lulusan Akademi: ${getAcademyBadge(academyLevels[String(viewingCv.user_id)]).label}`}
                              style={{ 
                                display: 'flex', alignItems: 'center', gap: '6px', 
                                background: 'rgba(212,175,55,0.08)', padding: '6px 12px',
                                borderRadius: '12px', border: '1px solid rgba(212,175,55,0.2)',
                                color: getAcademyBadge(academyLevels[String(viewingCv.user_id)]).color,
                                fontSize: '0.9rem', fontWeight: '800'
                              }}
                            >
                              {getAcademyBadge(academyLevels[String(viewingCv.user_id)]).icon}
                              <span>{getAcademyBadge(academyLevels[String(viewingCv.user_id)]).label.split(' ')[0]}</span>
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '8px', flexWrap: 'wrap' }}>
                          <span style={{ background: viewingCv.gender === 'ikhwan' ? '#e0f2fe' : '#fce7f3', color: viewingCv.gender === 'ikhwan' ? '#0369a1' : '#be185d', padding: '4px 12px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: '900', textTransform: 'uppercase' }}>{viewingCv.gender}</span>
                          {viewingCv.is_verified && (
                            <span style={{ background: '#dbeafe', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '4px 12px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: '900', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <ShieldCheck size={12} /> Terverifikasi
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {viewingCv.user_id !== user.id && (
                      <button onClick={() => handleAjukanTaaruf(viewingCv)} style={{ background: '#134E39', color: 'white', border: 'none', borderRadius: '16px', padding: '1rem 2.5rem', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 10px 20px rgba(19,78,57,0.2)' }}>
                        <Heart size={20} /> Bismillah, Ajukan Taaruf
                      </button>
                    )}
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2.5rem' }}>
                    <div>
                      <h4 style={{ color: '#D4AF37', fontWeight: '900', fontSize: '0.9rem', marginBottom: '1.25rem', letterSpacing: '0.05em' }}>PROFIL UMUM</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {[
                          { icon: <User size={16} />, label: 'Usia', val: `${viewingCv.age} Tahun` },
                          { icon: <Briefcase size={16} />, label: 'Pekerjaan', val: viewingCv.job },
                          { icon: <MapPin size={16} />, label: 'Domisili', val: viewingCv.location },
                          { icon: <GraduationCap size={16} />, label: 'Pendidikan', val: viewingCv.education },
                          { icon: <Heart size={16} />, label: 'Status', val: viewingCv.marital_status },
                          { icon: <Users size={16} />, label: 'Suku', val: viewingCv.suku },
                          { icon: <Target size={16} />, label: 'Tinggi/Berat', val: viewingCv.tinggi_berat }, 
                          { icon: <ShieldAlert size={16} />, label: 'Kesehatan', val: viewingCv.kesehatan },
                        ].map((i, k) => (
                          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#475569', fontSize: '0.95rem' }}>
                            <div style={{ color: '#134E39', width: 20 }}>{i.icon}</div>
                            <strong>{i.label}:</strong> {i.val}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 style={{ color: '#D4AF37', fontWeight: '900', fontSize: '0.9rem', marginBottom: '1.25rem', letterSpacing: '0.05em' }}>VISI & KRITERIA</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div><strong style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: '#134E39' }}>Visi Pernikahan:</strong><p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>{viewingCv.about}</p></div>
                        <div><strong style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: '#134E39' }}>Kriteria Pasangan:</strong><p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>{viewingCv.criteria}</p></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <h2 style={{ fontSize: '2rem', fontWeight: '900', color: '#134E39', margin: '0 0 0.5rem' }}>Cari Calon Pasangan</h2>
                    <p style={{ color: '#64748b' }}>Gunakan filter untuk menemukan kriteria yang paling mendekati harapan Anda.</p>
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: '800', color: '#134E39', background: 'rgba(19,78,57,0.05)', padding: '8px 16px', borderRadius: '12px' }}>
                    TOTAL: {candidateCount} KANDIDAT
                  </div>
                </div>

                {/* Filters */}
                <div style={{ background: 'white', borderRadius: '24px', padding: '2rem', border: '1px solid #f1f5f9', marginBottom: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Cari Nama/Alias</label>
                    <input type="text" className="form-control" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Tulis nama..." />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Provinsi</label>
                    <select className="form-control" value={filters.province} onChange={e => setFilters({...filters, province: e.target.value, city: ''})}>
                      <option value="">{isFetchingLocations ? 'Memuat Provinsi...' : 'Semua Provinsi'}</option>
                      {provinces.map(p => (
                        <option key={p.id} value={p.name}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Kota/Wilayah</label>
                    <select className="form-control" value={filters.city} onChange={e => setFilters({...filters, city: e.target.value})} disabled={!filters.province}>
                      <option value="">{filters.province ? 'Semua Kota' : 'Pilih Provinsi'}</option>
                      {regencies.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Suku</label>
                    <select className="form-control" value={filters.suku} onChange={e => setFilters({...filters, suku: e.target.value})}>
                      <option value="">Semua Suku</option>
                      {MAJOR_SUKU.sort().map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* ✨ BEST RECOMMENDATION SECTION ✨ */}
                {myExistingCv && (
                  <div style={{ marginBottom: '3rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#134E39', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}><Sparkles size={18} /></div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#134E39', margin: 0 }}>Rekomendasi Terdekat </h3>
                    </div>
                    <div className="recommendation-scroll-container" style={{ position: 'relative' }}>
                      <div className="recommendation-scroll" style={{ display: 'flex', gap: '1.5rem', overflowX: 'auto', padding: '0.5rem 0.5rem 1.5rem', scrollSnapType: 'x mandatory', scrollBehavior: 'smooth' }}>
                        {cvs
                          .filter(cv => cv.status === 'approved' && cv.user_id !== user.id && cv.gender !== user.gender && !takenUserIds.has(cv.user_id))
                          .filter(cv => cv.location && myExistingCv.location && (
                            cv.location.toLowerCase().includes(myExistingCv.location.split(' ')[0].toLowerCase()) ||
                            myExistingCv.location.toLowerCase().includes(cv.location.split(' ')[0].toLowerCase())
                          ))
                          .map(cv => (
                        <div key={cv.id} onClick={() => navigate(`/app/find/${cv.id}`)} style={{ minWidth: '300px', background: 'white', padding: '1.5rem', borderRadius: '24px', border: '2px solid rgba(19,78,57,0.1)', cursor: 'pointer', transition: 'all 0.3s', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)', scrollSnapAlign: 'start' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                               <div style={{ background: '#134E39', color: 'white', fontSize: '0.65rem', fontWeight: '900', padding: '4px 10px', borderRadius: '99px' }}>LOKASI SAMA</div>
                               <div style={{ color: '#D4AF37' }}><MapPin size={14} /></div>
                            </div>
                             <div style={{ fontWeight: '900', fontSize: '1.1rem', color: '#134E39', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                               {cv.alias}
                               {getAcademyBadge(academyLevels[String(cv.user_id)]) && (
                                 <div title={getAcademyBadge(academyLevels[String(cv.user_id)]).label} style={{ color: getAcademyBadge(academyLevels[String(cv.user_id)]).color }}>
                                   {getAcademyBadge(academyLevels[String(cv.user_id)]).icon}
                                 </div>
                               )}
                             </div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '700', marginBottom: '0.75rem' }}>{cv.age} THN • {cv.location}</div>
                            <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5, margin: 0, height: '3.6em', overflow: 'hidden' }}>{cv.about}</p>
                          </div>
                      ))}
                        {cvs.filter(cv => cv.status === 'approved' && cv.user_id !== user.id && cv.gender !== user.gender && cv.location && myExistingCv.location && (cv.location.toLowerCase().includes(myExistingCv.location.split(' ')[0].toLowerCase()))).length === 0 && (
                          <p style={{ color: '#94a3b8', fontSize: '0.9rem', fontStyle: 'italic' }}>Belum ada kandidat di lokasi yang sama dengan Anda.</p>
                        )}
                      </div>
                      {/* Sub-pagination text/dots can go here */}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                   <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(19,78,57,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#134E39' }}><Users size={18} /></div>
                   <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#134E39', margin: 0 }}>Semua Kandidat</h3>
                </div>

                <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                   {cvs
                    .filter(cv => cv.status === 'approved' && cv.user_id !== user.id && cv.gender !== user.gender && !takenUserIds.has(cv.user_id))
                    .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
                    .filter(cv => {
                      const query = searchQuery.toLowerCase();
                      const matchQuery = cv.alias?.toLowerCase().includes(query) || 
                                         cv.location?.toLowerCase().includes(query) ||
                                         cv.job?.toLowerCase().includes(query);
                      
                      const matchProvince = !filters.province || cv.location?.toLowerCase().includes(filters.province.toLowerCase());
                      const matchCity = !filters.city || cv.location?.toLowerCase().includes(filters.city.toLowerCase());
                      const matchSuku = !filters.suku || cv.suku === filters.suku;
                      
                      return matchQuery && matchProvince && matchCity && matchSuku;
                    })
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map(cv => (
                      <div key={cv.id} className="card" style={{ padding: '1.75rem', borderRadius: '24px', cursor: 'pointer', transition: 'all 0.3s' }} onClick={() => navigate(`/app/find/${cv.id}`)}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.25rem' }}>
                          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(19,78,57,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={24} color="#134E39" /></div>
                          <div>
                             <div style={{ fontWeight: '900', fontSize: '1.1rem', color: '#134E39', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                               {cv.alias}
                               {cv.is_verified && <ShieldCheck size={16} color="#3b82f6" title="Verified Member" />}
                               {getAcademyBadge(academyLevels[String(cv.user_id)]) && (
                                 <div title={getAcademyBadge(academyLevels[String(cv.user_id)]).label} style={{ color: getAcademyBadge(academyLevels[String(cv.user_id)]).color }}>
                                   {getAcademyBadge(academyLevels[String(cv.user_id)]).icon}
                                 </div>
                               )}
                             </div>
                             <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700' }}>{cv.age} THN • {cv.location} • {cv.tinggi_berat}</div>
                          </div>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5, marginBottom: '1.5rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{cv.about}</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f8fafc', paddingTop: '1rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#D4AF37' }}>{cv.education}</span>
                          <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#134E39', display: 'flex', alignItems: 'center', gap: '4px' }}>Detail CV <ChevronRight size={14} /></span>
                        </div>
                      </div>
                   ))}
                </div>

                {/* Main Pagination */}
                {cvs.filter(cv => cv.status === 'approved' && cv.user_id !== user.id && cv.gender !== user.gender && !takenUserIds.has(cv.user_id)).filter(cv => {
                      const query = searchQuery.toLowerCase();
                      const matchQuery = cv.alias?.toLowerCase().includes(query) || cv.location?.toLowerCase().includes(query) || cv.job?.toLowerCase().includes(query);
                      const matchProvince = !filters.province || cv.location?.toLowerCase().includes(filters.province.toLowerCase());
                      const matchCity = !filters.city || cv.location?.toLowerCase().includes(filters.city.toLowerCase());
                      const matchSuku = !filters.suku || cv.suku === filters.suku;
                      return matchQuery && matchProvince && matchCity && matchSuku;
                    }).length > itemsPerPage && (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '2rem' }}>
                    <button 
                      onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      disabled={currentPage === 1}
                      style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.5rem 1rem', fontWeight: '700', color: currentPage === 1 ? '#cbd5e1' : '#134E39', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                    >
                      Sebelumnya
                    </button>
                    <span style={{ fontWeight: '800', color: '#134E39', fontSize: '0.9rem' }}>
                      Halaman {currentPage} dari {Math.ceil(cvs.filter(cv => cv.status === 'approved' && cv.user_id !== user.id && cv.gender !== user.gender).filter(cv => {
                      const query = searchQuery.toLowerCase();
                      const matchQuery = cv.alias?.toLowerCase().includes(query) || cv.location?.toLowerCase().includes(query) || cv.job?.toLowerCase().includes(query);
                      const matchProvince = !filters.province || cv.location?.toLowerCase().includes(filters.province.toLowerCase());
                      const matchCity = !filters.city || cv.location?.toLowerCase().includes(filters.city.toLowerCase());
                      const matchSuku = !filters.suku || cv.suku === filters.suku;
                      return matchQuery && matchProvince && matchCity && matchSuku;
                    }).length / itemsPerPage)}
                    </span>
                    <button 
                      onClick={() => { setCurrentPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      disabled={currentPage >= Math.ceil(cvs.filter(cv => cv.status === 'approved' && cv.user_id !== user.id && cv.gender !== user.gender).filter(cv => {
                        const query = searchQuery.toLowerCase();
                        const matchQuery = cv.alias?.toLowerCase().includes(query) || cv.location?.toLowerCase().includes(query) || cv.job?.toLowerCase().includes(query);
                        const matchProvince = !filters.province || cv.location?.toLowerCase().includes(filters.province.toLowerCase());
                        const matchCity = !filters.city || cv.location?.toLowerCase().includes(filters.city.toLowerCase());
                        const matchSuku = !filters.suku || cv.suku === filters.suku;
                        return matchQuery && matchProvince && matchCity && matchSuku;
                      }).length / itemsPerPage)}
                      style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.5rem 1rem', fontWeight: '700', color: currentPage >= Math.ceil(cvs.filter(cv => cv.status === 'approved' && cv.user_id !== user.id && cv.gender !== user.gender).filter(cv => {
                        const query = searchQuery.toLowerCase();
                        const matchQuery = cv.alias?.toLowerCase().includes(query) || cv.location?.toLowerCase().includes(query) || cv.job?.toLowerCase().includes(query);
                        const matchProvince = !filters.province || cv.location?.toLowerCase().includes(filters.province.toLowerCase());
                        const matchCity = !filters.city || cv.location?.toLowerCase().includes(filters.city.toLowerCase());
                        const matchSuku = !filters.suku || cv.suku === filters.suku;
                        return matchQuery && matchProvince && matchCity && matchSuku;
                      }).length / itemsPerPage) ? '#cbd5e1' : '#134E39', cursor: currentPage >= Math.ceil(cvs.filter(cv => cv.status === 'approved' && cv.user_id !== user.id && cv.gender !== user.gender).filter(cv => {
                        const query = searchQuery.toLowerCase();
                        const matchQuery = cv.alias?.toLowerCase().includes(query) || cv.location?.toLowerCase().includes(query) || cv.job?.toLowerCase().includes(query);
                        const matchProvince = !filters.province || cv.location?.toLowerCase().includes(filters.province.toLowerCase());
                        const matchCity = !filters.city || cv.location?.toLowerCase().includes(filters.city.toLowerCase());
                        const matchSuku = !filters.suku || cv.suku === filters.suku;
                        return matchQuery && matchProvince && matchCity && matchSuku;
                      }).length / itemsPerPage) ? 'not-allowed' : 'pointer' }}
                    >
                      Selanjutnya
                    </button>
                  </div>
                )}
              </>
            )}
         </div>
      )}

      {/* ══ MY CV TAB (Partial Re-Design) ══ */}
      {activeTab === 'my_cv' && (
        <div style={{ maxWidth: '850px', margin: '0 auto', animation: 'fadeInUp 0.5s ease-out' }}>
           <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
             <h2 style={{ fontSize: '2.25rem', fontWeight: '900', color: '#134E39', margin: '0 0 0.5rem' }}>CV Taaruf Anda</h2>
             <p style={{ color: '#64748b' }}>Lengkapi data dengan jujur karena ini adalah cerminan niat dan pribadi Anda.</p>
           </div>
           
           {hasSubmittedCv && !isEditingCv ? (
              <div style={{ background: 'white', borderRadius: '32px', padding: '3.5rem', border: '1px solid #f1f5f9', boxShadow: '0 20px 40px rgba(0,0,0,0.04)', position: 'relative', overflow: 'hidden' }}>
                 {/* Decorative Background Element */}
                 <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(19,78,57,0.03) 0%, transparent 70%)', borderRadius: '50%' }}></div>
                 
                 <div className="my-cv-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem', position: 'relative' }}>
                     <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                        <div style={{ width: 80, height: 80, borderRadius: '24px', background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 20px rgba(34,197,94,0.2)' }}><CheckCircle size={40} color="white" /></div>
                        <div>
                          <h3 style={{ margin: 0, color: '#134E39', fontSize: '1.75rem', fontWeight: '900' }}>CV Aktif & Publik</h3>
                          <p style={{ color: '#64748b', fontSize: '1rem', fontWeight: '500', marginTop: '4px' }}>Data Anda telah terverifikasi dan dapat dilihat oleh calon pasangan.</p>
                        </div>
                     </div>
                     <div className="btn-group" style={{ display: 'flex', gap: '1rem' }}>
                        <button onClick={() => { setMyCv(myExistingCv); setIsEditingCv(true); setCvStep(1); }} style={{ background: 'white', color: '#134E39', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '0.8rem 1.5rem', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.borderColor = '#134E39'} onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}>
                           <Settings size={18} /> Edit CV
                        </button>
                        <button onClick={() => setIsPreviewingCv(true)} style={{ background: '#134E39', color: 'white', border: 'none', borderRadius: '16px', padding: '0.8rem 1.5rem', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 10px 20px rgba(19,78,57,0.15)', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                           <Eye size={18} /> Pratinjau
                        </button>
                     </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '4rem', position: 'relative' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                      <section>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(212,175,55,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4AF37' }}><User size={18} /></div>
                          <h4 style={{ color: '#134E39', fontWeight: '900', fontSize: '1.1rem', margin: 0 }}>DATA PERSONAL</h4>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', background: '#f8fafc', padding: '2rem', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
                          {[
                            { label: 'Alias', val: myExistingCv.alias },
                            { label: 'Usia', val: `${myExistingCv.age} Tahun` },
                            { label: 'Domisili', val: myExistingCv.location },
                            { label: 'Pendidikan', val: myExistingCv.education },
                            { label: 'Pekerjaan', val: myExistingCv.job },
                            { label: 'Suku', val: myExistingCv.suku },
                            { label: 'Status', val: myExistingCv.marital_status },
                            { label: 'Tinggi/Berat', val: myExistingCv.tinggi_berat }
                          ].map((item, idx) => (
                            <div key={idx}>
                              <span style={{ display: 'block', color: '#94a3b8', fontWeight: '700', fontSize: '0.75rem', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</span>
                              <span style={{ color: '#134E39', fontWeight: '800', fontSize: '1rem' }}>{item.val}</span>
                            </div>
                          ))}
                        </div>
                      </section>

                      <section>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(19,78,57,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#134E39' }}><GraduationCap size={18} /></div>
                          <h4 style={{ color: '#134E39', fontWeight: '900', fontSize: '1.1rem', margin: 0 }}>IBADAH & KESEHATAN</h4>
                        </div>
                         <div style={{ background: 'white', padding: '1.5rem', borderRadius: '24px', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid #f8fafc' }}>
                              <span style={{ color: '#64748b', fontWeight: '600' }}>Gambaran Ibadah</span>
                              <span style={{ color: '#134E39', fontWeight: '700', textAlign: 'right', maxWidth: '60%' }}>{myExistingCv.worship?.substring(0, 50)}...</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: '#64748b', fontWeight: '600' }}>Kesehatan</span>
                              <span style={{ color: '#134E39', fontWeight: '700' }}>{myExistingCv.kesehatan}</span>
                            </div>
                         </div>
                      </section>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                      <section style={{ background: 'linear-gradient(135deg, #134E39 0%, #1a4d35 100%)', padding: '2.5rem', borderRadius: '32px', color: 'white', boxShadow: '0 20px 30px rgba(19,78,57,0.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                          <Heart size={20} color="#D4AF37" fill="#D4AF37" />
                          <h4 style={{ color: 'white', fontWeight: '900', fontSize: '1.1rem', margin: 0 }}>VISI MENIKAH</h4>
                        </div>
                        <p style={{ margin: 0, color: 'rgba(255,255,255,0.9)', fontWeight: '500', lineHeight: 1.7, fontSize: '0.95rem' }}>{myExistingCv.about}</p>
                      </section>

                      <section style={{ border: '2px dashed #f1f5f9', padding: '2rem', borderRadius: '32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' }}>
                          <Target size={20} color="#134E39" />
                          <h4 style={{ color: '#134E39', fontWeight: '900', fontSize: '1.1rem', margin: 0 }}>KRITERIA</h4>
                        </div>
                        <p style={{ margin: 0, color: '#64748b', fontWeight: '500', lineHeight: 1.7, fontSize: '0.95rem' }}>{myExistingCv.criteria}</p>
                      </section>
                    </div>
                  </div>
              </div>
           ) : (
              <div style={{ background: 'white', borderRadius: '32px', padding: '3rem', border: '1px solid #f1f5f9', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.05)' }}>
                 {cvStep < 7 && (
                   <div style={{ display: 'flex', gap: '10px', marginBottom: '4rem', flexWrap: 'wrap' }}>
                      {[
                        { s: 1, label: 'Biodata', icon: <User size={14} /> },
                        { s: 2, label: 'Lokasi', icon: <MapPin size={14} /> },
                        { s: 3, label: 'Pekerjaan', icon: <Briefcase size={14} /> },
                        { s: 4, label: 'Ibadah', icon: <Sparkles size={14} /> },
                        { s: 5, label: 'Visi', icon: <Heart size={14} /> },
                        { s: 6, label: 'Fisik', icon: <Target size={14} /> }
                      ].map((item) => (
                        <div key={item.s} style={{ flex: 1, minWidth: '80px' }}>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', opacity: cvStep >= item.s ? 1 : 0.4 }}>
                              <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: cvStep >= item.s ? '#134E39' : '#f1f5f9', color: cvStep >= item.s ? 'white' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '900' }}>
                                {cvStep > item.s ? <CheckCircle size={14} /> : item.s}
                              </div>
                              <span style={{ fontSize: '0.75rem', fontWeight: '800', color: cvStep >= item.s ? '#134E39' : '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</span>
                           </div>
                           <div style={{ height: '6px', borderRadius: '10px', background: cvStep >= item.s ? '#134E39' : '#f1f5f9', transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}></div>
                        </div>
                      ))}
                   </div>
                 )}
                 {/* Re-using form steps but with slightly cleaner styling */}
                 <div style={{ minHeight: '300px' }}>
                    {cvStep === 1 && (
                      <div style={{ animation: 'fadeIn 0.3s ease' }}>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#134E39', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '12px' }}><div style={{ width: '4px', height: '24px', background: '#D4AF37', borderRadius: '2px' }}></div> 1. Gambaran Umum Diri</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                          <div className="form-group"><label className="form-label"><User size={16} /> Alias Penyamaran</label><input type="text" className="form-control" value={myCv.alias} onChange={e => setMyCv({ ...myCv, alias: e.target.value })} placeholder="Misal: Hamba Allah" /></div>
                          <div className="form-group"><label className="form-label"><Clock size={16} /> Usia (Tahun)</label><input type="number" className="form-control" value={myCv.age} onChange={e => setMyCv({ ...myCv, age: e.target.value })} /></div>
                          <div className="form-group">
                            <label className="form-label"><Users size={16} /> Jenis Kelamin</label>
                            <select className="form-control" value={myCv.gender} onChange={e => setMyCv({ ...myCv, gender: e.target.value })}>
                              <option value="">Pilih Jenis Kelamin</option>
                              <option value="ikhwan">Ikhwan (Laki-laki)</option>
                              <option value="akhwat">Akhwat (Perempuan)</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label className="form-label"><Heart size={16} /> Status Pernikahan</label>
                            <select className="form-control" value={myCv.marital_status} onChange={e => setMyCv({ ...myCv, marital_status: e.target.value })}>
                              <option value="Lajang">Lajang</option>
                              <option value="Duda">Duda</option>
                              <option value="Janda">Janda</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    {cvStep === 2 && (
                      <div style={{ animation: 'fadeIn 0.3s ease' }}>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#134E39', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '12px' }}><div style={{ width: '4px', height: '24px', background: '#D4AF37', borderRadius: '2px' }}></div> 2. Identitas & Lokasi</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                          <div className="form-group">
                            <label className="form-label"><Compass size={16} /> Suku Bangsa</label>
                            <select className="form-control" value={myCv.suku} onChange={e => setMyCv({ ...myCv, suku: e.target.value })}>
                              <option value="">Pilih Suku</option>
                              {MAJOR_SUKU.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                          <div className="form-group">
                            <label className="form-label"><MapPin size={16} /> Provinsi</label>
                            <select className="form-control" value={myCv.domisili_provinsi || ''} onChange={e => setMyCv({ ...myCv, domisili_provinsi: e.target.value, domisili_kota: '' })}>
                               <option value="">{isFetchingLocations ? 'Memuat Provinsi...' : 'Pilih Provinsi'}</option>
                               {provinces.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                            </select>
                          </div>
                          <div className="form-group">
                            <label className="form-label"><MapPin size={16} /> Kota/Kabupaten</label>
                            <select className="form-control" value={myCv.domisili_kota || ''} onChange={e => {
                                const city = e.target.value;
                                setMyCv({ ...myCv, domisili_kota: city, location: `${city}, ${myCv.domisili_provinsi}` });
                            }} disabled={!myCv.domisili_provinsi}>
                               <option value="">Pilih Kota</option>
                               {regencies.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                            </select>
                          </div>
                        </div>
                        <div className="form-group"><label className="form-label"><Search size={16} /> Alamat Lengkap (Rahasia)</label><textarea className="form-control" value={myCv.address} onChange={e => setMyCv({ ...myCv, address: e.target.value })} placeholder="Jl. Kedamaian No. 123..." style={{ height: '80px' }}></textarea></div>
                      </div>
                    )}

                    {cvStep === 3 && (
                      <div style={{ animation: 'fadeIn 0.3s ease' }}>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#134E39', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '12px' }}><div style={{ width: '4px', height: '24px', background: '#D4AF37', borderRadius: '2px' }}></div> 3. Pendidikan & Pekerjaan</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                          <div className="form-group">
                            <label className="form-label"><GraduationCap size={16} /> Pendidikan Terakhir</label>
                            <select className="form-control" value={myCv.education} onChange={e => setMyCv({ ...myCv, education: e.target.value })}>
                              <option value="">Pilih Pendidikan</option>
                              <option value="SMA/SMK">SMA/SMK</option>
                              <option value="D3">Diploma (D3)</option>
                              <option value="S1">Sarjana (S1)</option>
                              <option value="S2">Magister (S2)</option>
                              <option value="S3">Doktor (S3)</option>
                            </select>
                          </div>
                          <div className="form-group"><label className="form-label">Pekerjaan</label><input type="text" className="form-control" value={myCv.job} onChange={e => setMyCv({ ...myCv, job: e.target.value })} placeholder="Misal: Software Engineer" /></div>
                          <div className="form-group"><label className="form-label">Estimasi Penghasilan per Bulan</label><input type="text" className="form-control" value={myCv.salary} onChange={e => setMyCv({ ...myCv, salary: e.target.value })} placeholder="Misal: 5-10 Juta" /></div>
                        </div>
                      </div>
                    )}

                    {cvStep === 4 && (
                      <div style={{ animation: 'fadeIn 0.3s ease' }}>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#134E39', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '12px' }}><div style={{ width: '4px', height: '24px', background: '#D4AF37', borderRadius: '2px' }}></div> 4. Ibadah & Karakter</h3>
                        <div className="form-group"><label className="form-label">Gambaran Ibadah Harian</label><textarea className="form-control" value={myCv.worship} onChange={e => setMyCv({ ...myCv, worship: e.target.value })} placeholder="Shalat 5 waktu, tilawah harian, puasa sunnah..." style={{ height: '80px' }}></textarea></div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                          <div className="form-group"><label className="form-label">Kajian yang Diikuti</label><input type="text" className="form-control" value={myCv.kajian} onChange={e => setMyCv({ ...myCv, kajian: e.target.value })} placeholder="Ustadz/Tema kajian yang sering diikuti" /></div>
                          <div className="form-group"><label className="form-label">Sifat & Karakter Diri</label><input type="text" className="form-control" value={myCv.karakter} onChange={e => setMyCv({ ...myCv, karakter: e.target.value })} placeholder="Sabar, pendiam, disiplin..." /></div>
                        </div>
                      </div>
                    )}

                    {cvStep === 5 && (
                      <div style={{ animation: 'fadeIn 0.3s ease' }}>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#134E39', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '12px' }}><div style={{ width: '4px', height: '24px', background: '#D4AF37', borderRadius: '2px' }}></div> 5. Visi & Kriteria</h3>
                        <div className="form-group"><label className="form-label">Visi Misi Pernikahan</label><textarea className="form-control" value={myCv.about} onChange={e => setMyCv({ ...myCv, about: e.target.value })} placeholder="Apa tujuan pernikahan yang ingin Anda bangun?" style={{ height: '100px' }}></textarea></div>
                        <div className="form-group"><label className="form-label">Kriteria Pasangan yang Diharapkan</label><textarea className="form-control" value={myCv.criteria} onChange={e => setMyCv({ ...myCv, criteria: e.target.value })} placeholder="Sifat, latar belakang, atau hal lain yang dicari dari pasangan" style={{ height: '100px' }}></textarea></div>
                        <div className="form-group"><label className="form-label">Hobi & Kegemaran</label><input type="text" className="form-control" value={myCv.hobi} onChange={e => setMyCv({ ...myCv, hobi: e.target.value })} placeholder="Membaca, traveling, memasak..." /></div>
                      </div>
                    )}

                    {cvStep === 6 && (
                      <div style={{ animation: 'fadeIn 0.3s ease' }}>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#134E39', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '12px' }}><div style={{ width: '4px', height: '24px', background: '#D4AF37', borderRadius: '2px' }}></div> 6. Data Fisik & Tambahan</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                          <div className="form-group"><label className="form-label">Tinggi & Berat Badan</label><input type="text" className="form-control" value={myCv.tinggi_berat} onChange={e => setMyCv({ ...myCv, tinggi_berat: e.target.value })} placeholder="Contoh: 170cm / 65kg" /></div>
                          <div className="form-group"><label className="form-label">Riwayat Kesehatan</label><input type="text" className="form-control" value={myCv.kesehatan} onChange={e => setMyCv({ ...myCv, kesehatan: e.target.value })} placeholder="Normal, Asma, Maag, dll" /></div>
                        </div>
                        <div className="form-group">
                          <label className="form-label"><Users size={16} /> Pandangan Poligami</label>
                          <select className="form-control" value={myCv.poligami} onChange={e => setMyCv({ ...myCv, poligami: e.target.value })}>
                            <option value="Tidak Bersedia">Tidak Bersedia</option>
                            <option value="Bersedia Jika Diizinkan">Bersedia Jika Diizinkan</option>
                            <option value="Ada Keinginan">Ada Keinginan</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {cvStep === 7 && (
                      <div style={{ textAlign: 'center', padding: '3rem 0', animation: 'fadeIn 0.5s ease' }}>
                        <div style={{ width: '80px', height: '80px', background: 'rgba(34,197,94,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
                          <CheckCircle size={40} color="#22c55e" />
                        </div>
                        <h3 style={{ fontSize: '1.75rem', fontWeight: '900', color: '#134E39', marginBottom: '1rem' }}>Alhamdulillah! 🎉</h3>
                        <p style={{ color: '#64748b', maxWidth: '400px', margin: '0 auto 2rem', lineHeight: 1.6 }}>
                          CV Anda telah berhasil disimpan. Sekarang Anda sudah dapat melakukan pencarian calon pasangan.
                        </p>
                        <button onClick={() => { setIsEditingCv(false); setCvStep(1); setActiveTab('find'); }} style={{ background: '#134E39', color: 'white', border: 'none', borderRadius: '16px', padding: '1rem 2.5rem', fontWeight: '800', cursor: 'pointer' }}>
                          Mulai Cari Pasangan
                        </button>
                      </div>
                    )}
                 </div>
                 
                 {cvStep < 7 && (
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid #f8fafc' }}>
                      <button className="btn btn-outline" onClick={() => cvStep > 1 ? setCvStep(cvStep-1) : setIsEditingCv(false)} style={{ padding: '0.8rem 2rem' }}>KEMBALI</button>
                      <button className="btn btn-primary" onClick={handleCvSubmit} style={{ padding: '0.8rem 2.5rem', background: '#134E39' }}>{cvStep < totalSteps ? 'SELANJUTNYA →' : 'SIMPAN DATA CV'}</button>
                   </div>
                 )}
              </div>
           )}
        </div>
      )}

      {/* Styles Injection */}
      <style>{`
        .dashboard-root { 
          padding: 1.5rem; 
          max-width: 1400px; 
          margin: 0 auto; 
          color: #1e293b;
        }
        
        .form-control { 
          border-radius: 12px; 
          border: 1.5px solid #e2e8f0; 
          padding: 0.8rem 1rem; 
          transition: all 0.2s; 
          font-size: 0.95rem; 
          width: 100%; 
        }
        .form-control:focus { border-color: #134E39; box-shadow: 0 0 0 4px rgba(19,78,57,0.06); outline: none; }
        .card { transition: all 0.3s ease; }
        .auto-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 1rem; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        /* 📱 RESPONSIVE ADJUSTMENTS 📱 */
        @media (max-width: 768px) {
          .dashboard-root { padding: 1rem; }
          .modal-content { 
            width: 100% !important; 
            height: 100% !important; 
            max-height: 100% !important; 
            border-radius: 0 !important; 
            margin: 0 !important; 
            overflow-y: auto !important;
          }
          .cv-preview-grid { 
            grid-template-columns: 1fr !important; 
            gap: 2rem !important; 
            padding: 1.5rem !important;
          }
          .cv-header { 
            padding: 2rem !important; 
          }
          .cv-header h2 { font-size: 1.75rem !important; }
          .qa-template-container { padding: 1.5rem !important; }
          
          .dashboard-grid { 
            grid-template-columns: 1fr !important; 
          }
          
          /* Optimization for My CV Tab */
          .my-cv-header {
            flex-direction: column;
            gap: 1.5rem;
            text-align: center;
          }
          .my-cv-header .btn-group {
            width: 100%;
            flex-direction: column;
          }
          
          /* 💬 CHAT MOBILE FIXES 💬 */
          .chat-window-container { padding: 0 !important; }
          .chat-card { border-radius: 20px !important; height: clamp(500px, 80vh, 800px); display: flex; flex-direction: column; }
          .chat-header { padding: 1rem !important; gap: 0.75rem !important; flex-wrap: wrap; }
          .chat-info h3 { font-size: 0.95rem !important; }
          .chat-info p { font-size: 0.75rem !important; }
          .qa-helper-btn { width: 100%; justify-content: center; margin-top: 5px; }
          .chat-messages { padding: 1rem !important; }
          .chat-bubble { max-width: 85% !important; }
          .chat-input-area { padding: 0.75rem !important; }
        }

        /* 🟢 GLOBAL CHAT STYLES 🟢 */
        .chat-card { background: white; border: 1px solid #f1f5f9; overflow: hidden; display: flex; flex-direction: column; }
        .chat-header { display: flex; align-items: center; gap: 15px; padding: 1.5rem; border-bottom: 1px solid #f1f5f9; background: #fff; }
        .chat-avatar { width: 45px; height: 45px; background: #f8fafc; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #134E39; flex-shrink: 0; }
        .chat-info { flex: 1; min-width: 0; }
        .chat-info h3 { margin: 0; font-size: 1.1rem; color: #134E39; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .chat-info p { margin: 2px 0 0; font-size: 0.85rem; color: #94a3b8; font-weight: 600; }
        .qa-helper-btn { background: #D4AF37; color: #134E39; border: none; border-radius: 12px; padding: 8px 16px; font-weight: 800; font-size: 0.75rem; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.2s; white-space: nowrap; margin-left: auto; }
        .qa-helper-btn:hover { background: #b8861e; transform: translateY(-2px); }
        
        .chat-messages { flex: 1; overflow-y: auto; padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; background: #fcfcfc; }
        .chat-disclaimer { background: #f8fafc; border: 1px solid #e2e8f0; padding: 1rem; border-radius: 16px; font-size: 0.75rem; color: #64748b; line-height: 1.5; display: flex; gap: 10px; margin-bottom: 0.5rem; }
        
        .chat-bubble { padding: 12px 18px; border-radius: 20px; font-size: 0.95rem; line-height: 1.5; max-width: 70%; position: relative; font-weight: 500; }
        .chat-bubble.sent { background: #134E39; color: white; align-self: flex-end; border-bottom-right-radius: 4px; }
        .chat-bubble.received { background: white; color: #1e293b; align-self: flex-start; border-bottom-left-radius: 4px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); border: 1px solid #f1f5f9; }
        
        .message-time { font-size: 0.65rem; margin-top: 4px; opacity: 0.7; font-weight: 700; text-align: right; }
        
        .chat-input-area { padding: 1.25rem; background: white; border-top: 1px solid #f1f5f9; display: flex; gap: 12px; }
        .chat-input-field { flex: 1; background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 16px; padding: 0.8rem 1.25rem; font-size: 0.95rem; transition: all 0.2s; }
        .chat-input-field:focus { outline: none; border-color: #134E39; background: white; box-shadow: 0 0 0 4px rgba(19, 78, 57, 0.05); }
        .chat-send-btn { width: 48px; height: 48px; background: #134E39; color: white; border: none; border-radius: 16px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; flex-shrink: 0; }
        .chat-send-btn:hover { transform: scale(1.05); background: #1a4d35; }
        .chat-send-btn:active { transform: scale(0.95); }
      `}</style>

      {/* 🖼️ CV PREVIEW MODAL 🖼️ */}
      {isPreviewingCv && myExistingCv && (
        <div className="modal-overlay" onClick={() => setIsPreviewingCv(false)} style={{ zIndex: 1000 }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '750px', width: '95%', padding: 0, overflow: 'hidden', borderRadius: '40px', border: 'none' }}>
             {/* CV Header */}
             <div className="cv-header" style={{ background: 'linear-gradient(135deg, #134E39 0%, #1a4d35 100%)', padding: '3rem', color: 'white', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '40px', right: '40px', width: '120px', height: '120px', borderRadius: '30px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)' }}><User size={64} /></div>
                <div style={{ padding: '4px 14px', background: '#D4AF37', borderRadius: '8px', color: '#134E39', fontSize: '0.7rem', fontWeight: '900', display: 'inline-block', marginBottom: '1.5rem', letterSpacing: '0.1em' }}>CV TAARUF SYAR'I</div>
                <h2 style={{ fontSize: '2.5rem', fontWeight: '900', margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>{myExistingCv.alias}</h2>
                <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.9rem', opacity: 0.9, fontWeight: '700' }}>
                   <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={16} /> {myExistingCv.location}</span>
                   <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={16} /> {myExistingCv.age} Tahun</span>
                   <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Heart size={16} /> {myExistingCv.marital_status}</span>
                </div>
             </div>

             {/* CV Body */}
             <div className="cv-preview-grid" style={{ padding: '3.5rem', background: '#fff', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                   <section>
                      <h4 style={{ color: '#134E39', fontWeight: '900', fontSize: '0.85rem', letterSpacing: '0.12em', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '4px', height: '18px', background: '#D4AF37', borderRadius: '2px' }}></div> DATA PRIBADI
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {[
                          { label: 'Pekerjaan', val: myExistingCv.job, icon: <Briefcase size={18} /> },
                          { label: 'Pendidikan', val: myExistingCv.education, icon: <GraduationCap size={18} /> },
                          { label: 'Suku Bangsa', val: myExistingCv.suku, icon: <Compass size={18} /> },
                          { label: 'Tinggi / Berat', val: myExistingCv.tinggi_berat, icon: <Target size={18} /> },
                          { label: 'Kesehatan', val: myExistingCv.kesehatan || 'Normal', icon: <Heart size={18} /> },
                          { label: 'Poligami', val: myExistingCv.poligami || '-', icon: <ShieldCheck size={18} /> },
                        ].map((item, i) => (
                           <div key={i} style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(212,175,55,0.08)', color: '#D4AF37', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{item.icon}</div>
                              <div>
                                 <div style={{ fontSize: '0.7rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>{item.label}</div>
                                 <div style={{ fontSize: '1.05rem', fontWeight: '700', color: '#1e293b' }}>{item.val}</div>
                              </div>
                           </div>
                        ))}
                      </div>
                   </section>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                   <section style={{ background: '#f8fafc', padding: '2.5rem', borderRadius: '32px', border: '1px solid #f1f5f9' }}>
                      <h4 style={{ color: '#134E39', fontWeight: '900', fontSize: '0.85rem', letterSpacing: '0.12em', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                         <Heart size={16} fill="#D4AF37" color="#D4AF37" /> VISI PERNIKAHAN
                      </h4>
                      <p style={{ margin: 0, fontSize: '1rem', color: '#475569', lineHeight: 1.8, fontWeight: '500' }}>{myExistingCv.about}</p>
                   </section>
                   
                   <section style={{ background: 'white', padding: '2.5rem', borderRadius: '32px', border: '2px dashed #f1f5f9' }}>
                      <h4 style={{ color: '#134E39', fontWeight: '900', fontSize: '0.85rem', letterSpacing: '0.12em', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                         <Target size={16} color="#134E39" /> KRITERIA PASANGAN
                      </h4>
                      <p style={{ margin: 0, fontSize: '1rem', color: '#475569', lineHeight: 1.8, fontWeight: '500' }}>{myExistingCv.criteria}</p>
                   </section>

                   <section style={{ padding: '0 1rem' }}>
                      <h4 style={{ color: '#134E39', fontWeight: '900', fontSize: '0.85rem', letterSpacing: '0.12em', marginBottom: '1rem' }}>HOBI & KEGEMARAN</h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                         {myExistingCv.hobi?.split(',').map((h, i) => (
                            <span key={i} style={{ padding: '6px 14px', background: 'rgba(19,78,57,0.05)', color: '#134E39', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '700' }}>{h.trim()}</span>
                         )) || '-'}
                      </div>
                   </section>
                </div>
             </div>

             <div style={{ padding: '2.5rem', background: '#fff', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'center' }}>
                <button className="btn btn-primary" onClick={() => setIsPreviewingCv(false)} style={{ borderRadius: '16px', padding: '1rem 4rem', fontSize: '1rem', background: '#134E39' }}>Tutup Pratinjau</button>
             </div>
          </div>
        </div>
      )}

      {/* 💡 Q&A TEMPLATES MODAL 💡 */}
      {showQaTemplates && (
        <div className="modal-overlay" onClick={() => setShowQaTemplates(false)} style={{ zIndex: 1100 }}>
          <div className="modal-content qa-template-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', width: '95%', padding: '2.5rem' }}>
             <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#134E39', marginBottom: '0.5rem', textAlign: 'center' }}>Panduan Pertanyaan Q&A</h3>
             <p style={{ color: '#64748b', textAlign: 'center', marginBottom: '2rem', fontSize: '0.9rem' }}>Klik pada pertanyaan untuk menyalin teks secara otomatis.</p>
             
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxHeight: '450px', overflowY: 'auto', paddingRight: '10px' }}>
                {[
                  { 
                    cat: 'Visi & Misi', 
                    qs: [
                      'Bagaimana visi Anda dalam membina rumah tangga islami?',
                      'Apa ekspektasi Anda terhadap pasangan dalam hal ketaatan beragama?',
                      'Bagaimana Anda mendefinisikan keluarga yang sakinah, mawaddah, warahmah?'
                    ]
                  },
                  { 
                    cat: 'Keseharian & Karir', 
                    qs: [
                      'Bagaimana pembagian peran antara suami dan istri pandangan Anda?',
                      'Apakah Anda bersedia jika pasangan tetap bekerja setelah menikah?',
                      'Bagaimana kebiasaan harian Anda dalam mengelola waktu dan keuangan?'
                    ]
                  },
                  { 
                    cat: 'Pola Asuh & Keluarga Besar', 
                    qs: [
                      'Bagaimana prinsip Anda dalam mendidik anak secara islami?',
                      'Bagaimana cara Anda menyikapi perbedaan pendapat dengan keluarga besar?',
                      'Apa harapan Anda mengenai tempat tinggal setelah menikah nanti?'
                    ]
                  }
                ].map((group, gi) => (
                  <div key={gi}>
                    <h5 style={{ color: '#D4AF37', fontWeight: '900', fontSize: '0.75rem', letterSpacing: '0.1em', marginBottom: '1rem', textTransform: 'uppercase' }}>{group.cat}</h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {group.qs.map((q, qi) => (
                        <div 
                          key={qi} 
                          onClick={() => { setChatInput(q); setShowQaTemplates(false); }}
                          style={{ 
                            padding: '12px 16px', background: 'white', border: '1px solid #f1f5f9', 
                            borderRadius: '12px', fontSize: '0.85rem', color: '#475569', 
                            cursor: 'pointer', transition: 'all 0.2s', fontWeight: '500'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#f0fdf4'; e.currentTarget.style.borderColor = '#134E39'; e.currentTarget.style.color = '#134E39'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#f1f5f9'; e.currentTarget.style.color = '#475569'; }}
                        >
                          {q}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
             </div>
             
             <button className="btn btn-primary" onClick={() => setShowQaTemplates(false)} style={{ width: '100%', marginTop: '2rem', background: '#134E39' }}>Tutup</button>
          </div>
        </div>
      )}
    </div>
  );
}
