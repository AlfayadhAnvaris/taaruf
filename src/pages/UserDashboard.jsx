import React, { useContext, useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import {
  FileText, Search, UserCheck, Send, Clock, MessageCircle,
  Users, CheckCircle, XCircle, X, User, MapPin, Briefcase,
  GraduationCap, Heart, BookOpen, AlertCircle, ShieldAlert,
  ChevronDown, ChevronUp, ChevronRight, ChevronLeft, Sparkles, Star, Target, Compass, ArrowRight, Award, Settings, Zap, ShieldCheck, Eye, Activity, BadgeCheck
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
  const [viewingStatusId, setViewingStatusId] = useState(null);

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

  const myExistingCv = cvs.find(cv => cv.user_id === user?.id);
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
  const [filters, setFilters] = useState({ province: '', city: '', suku: '', minAge: '', maxAge: '', education: '' });
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
         addNotification(`Alhamdulillah! Anda telah menyelesaikan seluruh materi di kelas "${activeClass.title}".`);
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
        <div key="tab-container-home" className="home-content">
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
                {user && getAcademyBadge(academyLevels[user.id]) && (() => {
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
                   <button onClick={() => setActiveTab('my_cv')} style={{ background: '#D4AF37', color: '#134E39', border: 'none', borderRadius: '20px', padding: '1.2rem 2.5rem', fontWeight: '800', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 15px 30px rgba(212,175,55,0.3)' }}>  Lihat CV 
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
              { 
                label: 'Badge Akademi', 
                value: getAcademyBadge(academyLevels[String(user.id)])?.label.split(' ')[0] || 'Aktif', 
                color: '#134E39', 
                icon: getAcademyBadge(academyLevels[String(user.id)])?.icon || <Star size={24} />, 
                sub: getAcademyBadge(academyLevels[String(user.id)]) ? 'Level Keilmuan Anda' : 'Status Akun Pengguna', 
                tab: 'materi' 
              },
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
        <div key="tab-container-status" className="status-container" style={{ animation: 'fadeInUp 0.5s ease-out' }}>
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

                    <button 
                        className="btn btn-outline"
                        onClick={() => setViewingStatusId(req.id)}
                        style={{
                          width: '100%',
                          padding: '1rem',
                          borderRadius: '16px',
                          fontWeight: '800',
                          fontSize: '0.85rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          marginTop: '2rem'
                        }}
                      >
                        <Eye size={18} /> Lihat Detail Progres
                      </button>
                  </div>
                );
              })}
            </>
          )}

          {/* 🟢 NEW PREMIUM STATUS DETAIL MODAL 🟢 */}
          {viewingStatusId && (() => {
            const req = taarufRequests.find(r => r.id === viewingStatusId);
            if (!req) return null;
            const statusSteps = [
              { status: 'pending_target', label: 'Tunggu Calon' },
              { status: 'pending_admin', label: 'Verifikasi Admin' },
              { status: 'qna', label: 'Sesi Q&A' },
              { status: 'wali_process', label: 'Proses Wali' },
              { status: 'meet', label: 'Nadzhor' },
              { status: 'completed', label: 'Menikah' }
            ];

            const currentStepIdx = statusSteps.findIndex(s => s.status === req.status);
            const isRejected = req.status === 'rejected';

            return (
              <div className="modal-overlay" onClick={() => setViewingStatusId(null)} style={{ zIndex: 3000 }}>
                <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', width: '95%', padding: 0, overflow: 'hidden', animation: 'fadeInUp 0.3s ease' }}>
                  {/* Header */}
                  <div style={{ background: '#134E39', color: 'white', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', margin: 0, fontWeight: '900' }}>Detail Progres Mediasi</h3>
                      <p style={{ margin: '4px 0 0', fontSize: '0.8rem', opacity: 0.8 }}>ID Permintaan: #{req.id}</p>
                    </div>
                    <button onClick={() => setViewingStatusId(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', padding: '8px', borderRadius: '10px', color: 'white', cursor: 'pointer' }}><X size={20} /></button>
                  </div>

                  <div style={{ padding: '1.75rem' }}>
                    {/* 🪜 Visual Stepper 🪜 */}
                    {!isRejected && (
                      <div style={{ marginBottom: '2.5rem', padding: '0 10px', overflowX: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', minWidth: '450px', paddingBottom: '10px' }}>
                          <div style={{ position: 'absolute', top: '20px', left: 0, right: 0, height: '4px', background: '#f1f5f9', zIndex: 0 }}></div>
                          <div style={{ 
                            position: 'absolute', top: '20px', left: 0, 
                            width: `${(currentStepIdx / (statusSteps.length - 1)) * 100}%`, 
                            height: '4px', background: '#D4AF37', zIndex: 1,
                            transition: 'width 0.5s ease' 
                          }}></div>

                          {statusSteps.map((step, idx) => {
                            const isCompleted = idx < currentStepIdx || (req.status === 'completed');
                            const isActive = idx === currentStepIdx && req.status !== 'completed';
                            return (
                              <div key={idx} style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                                <div style={{ 
                                  width: '40px', height: '40px', borderRadius: '50%', 
                                  background: isCompleted ? '#D4AF37' : (isActive ? 'white' : '#f8fafc'),
                                  border: `2px solid ${isActive || isCompleted ? '#D4AF37' : '#e2e8f0'}`,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  color: isCompleted ? '#134E39' : (isActive ? '#D4AF37' : '#94a3b8'),
                                  fontWeight: '800', fontSize: '0.8rem',
                                  boxShadow: isActive ? '0 0 0 4px rgba(212, 175, 55, 0.15)' : 'none'
                                }}>
                                  {isCompleted ? <CheckCircle size={20} /> : idx + 1}
                                </div>
                                <span style={{ 
                                  marginTop: '10px', fontSize: '0.64rem', fontWeight: '800', 
                                  textAlign: 'center', color: isActive || isCompleted ? '#134E39' : '#94a3b8',
                                  width: '60px', lineHeight: 1.2, textTransform: 'uppercase'
                                }}>
                                  {step.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 👤 Partner Summary Section 👤 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', padding: '1.25rem', background: '#f8fafc', borderRadius: '20px', border: '1px solid #f1f5f9' }}>
                      <div style={{ width: 54, height: 54, borderRadius: '14px', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 'bold' }}>
                        {(req.senderEmail === user.email ? req.targetAlias : req.senderAlias).charAt(0)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                          <span style={{ fontSize: '1.05rem', fontWeight: '900', color: '#1A2E25' }}>
                            {req.senderEmail === user.email ? req.targetAlias : req.senderAlias}
                          </span>
                          {req.status === 'completed' && <BadgeCheck size={16} color="#D4AF37" />}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: isRejected ? '#ef4444' : '#134E39', fontWeight: '900', letterSpacing: '0.02em' }}>
                          STATUS: {isRejected ? 'DIBATALKAN' : statusSteps[currentStepIdx]?.label.toUpperCase()}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.6rem', fontWeight: '800', color: '#94a3b8', marginBottom: '2px' }}>UPDATE</div>
                        <div style={{ fontSize: '0.75rem', fontWeight: '900', color: '#134E39' }}>{new Date(req.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</div>
                      </div>
                    </div>

                    {/* 📑 Phase Information 📑 */}
                    <div style={{ marginBottom: '1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
                        <Activity size={16} color="#134E39" />
                        <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '900', color: '#134E39' }}>Deskripsi Tahapan</h4>
                      </div>
                      <div style={{ padding: '1.25rem', background: 'white', borderRadius: '16px', border: '1px solid #f1f5f9', fontSize: '0.9rem', color: '#475569', lineHeight: '1.6' }}>
                        {req.status === 'pending_target' && 'Bismillah, permohonan taaruf sudah terkirim. Saat ini sedang menunggu persetujuan dari calon pasangan Anda.'}
                        {req.status === 'pending_admin' && 'Maasyaa Allah, calon pasangan telah setuju! Mohon tunggu Admin/Ustadz untuk memverifikasi dan membuka ruang Q&A.'}
                        {req.status === 'qna' && 'Silakan masuk ke Ruang Mediasi untuk sesi tanya jawab visi-misi yang didampingi oleh Admin Mawaddah.'}
                        {req.status === 'wali_process' && 'Sesi Q&A selesai. Saat ini Admin sedang berkoordinasi dengan Wali atau pihak keluarga akhwat.'}
                        {req.status === 'meet' && 'Tahapan Nadzhor (pertemuan offline) sedang dijadwalkan. Mohon siapkan diri Anda sesuai arahan pendamping.'}
                        {req.status === 'completed' && 'Alhamdulillah, proses taaruf telah selesai. Semoga Allah memberkahi langkah selanjutnya.'}
                        {isRejected && 'Afwan, proses taaruf telah dihentikan. Percaya bahwa Allah telah menyiapkan yang terbaik di waktu yang tepat.'}
                      </div>
                    </div>

                    {/* 🕹️ Actions 🕹️ */}
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button className="btn btn-outline" onClick={() => setViewingStatusId(null)} style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', fontWeight: '800' }}>TUTUP</button>
                      
                      {!isRejected && req.status === 'pending_target' && req.senderEmail !== user.email && (
                        <button className="btn btn-primary" style={{ flex: 2, background: '#134E39' }} onClick={async () => {
                          const { error } = await supabase.from('taaruf_requests').update({ status: 'pending_admin', updated_at: new Date().toISOString() }).eq('id', req.id);
                          if (!error) { 
                            setTaarufRequests(taarufRequests.map(r => r.id === req.id ? { ...r, status: 'pending_admin' } : r)); 
                            showAlert('Bismillah', 'Persetujuan Anda telah dikirim ke Admin.', 'success');
                            setViewingStatusId(null);
                          }
                        }}><CheckCircle size={18} /> SETUJUI PENGAJUAN</button>
                      )}

                      {(req.status === 'qna' || req.status === 'meet') && (
                        <button className="btn btn-primary" style={{ flex: 2, background: '#134E39', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={() => { setViewingStatusId(null); setActiveChatId(req.id); }}>
                          <MessageCircle size={18} /> LANJUT KE CHAT MEDIASI
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ══ ACCOUNT TAB ══ */}
      {activeTab === 'account' && (
        <div key="tab-account" className="dashboard-tab-container">
          <AccountTab user={user} showAlert={showAlert} />
        </div>
      )}

      {/* ══ MATERI TAB ══ */}
      {activeTab === 'materi' && (
        <div key="tab-materi" className="dashboard-tab-container">
          {lmsLoading ? (
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
        )}
      </div>
    )}

      {/* ══ CERTIFICATE TAB ══ */}
      {activeTab === 'certificate' && (
        <div key="tab-certificate" className="dashboard-tab-container">
          {lmsLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '1.5rem' }}>
            <div style={{ width: 50, height: 50, border: '5px solid rgba(19,78,57,0.1)', borderTop: '5px solid #134E39', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <p style={{ color: '#64748b', fontWeight: '700' }}>Menyiapkan sertifikat Anda...</p>
          </div>
        ) : (
          <CertificateTab 
            user={user} 
            activeClass={activeClass || classes.find(c => String(c.id) === String(id))} 
            allClasses={classes}
          />
        )}
      </div>
    )}

      {/* ══ FEEDBACK TAB ══ */}
      {activeTab === 'feedback' && (
        <div key="tab-feedback" className="dashboard-tab-container">
          <FeedbackTab user={user} showAlert={showAlert} />
        </div>
      )}

      {/* ══ FIND TAB ══ */}
      {activeTab === 'find' && (
        <div key="tab-find" className="dashboard-tab-container" style={{ animation: 'fadeInUp 0.5s ease-out' }}>
          {!myExistingCv ? (
              <div style={{ textAlign: 'center', padding: '6rem 2rem', background: 'white', borderRadius: '32px', border: '1px solid #f1f5f9' }}>
                <ShieldAlert size={64} color="#ef4444" style={{ marginBottom: '1.5rem' }} />
                <h2 style={{ fontSize: '1.75rem', fontWeight: '900', color: '#134E39' }}>Fitur Pencarian Terkunci</h2>
                <p style={{ color: '#64748b', maxWidth: '450px', margin: '0 auto 2rem', lineHeight: 1.6 }}>Sesuai aturan keamanan Mawaddah, Anda harus memiliki CV yang valid sebelum dapat melihat calon pasangan.</p>
                <button onClick={() => setActiveTab('my_cv')} style={{ background: '#134E39', color: 'white', border: 'none', borderRadius: '16px', padding: '1rem 3rem', fontWeight: '800', cursor: 'pointer' }}>Buat CV Sekarang</button>
              </div>
            ) : viewingCv ? (
              <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', paddingTop: '2rem' }}>
                <button 
                  onClick={() => setViewingCv(null)} 
                  style={{ 
                    position: 'absolute', top: '-1rem', left: 0, 
                    background: 'white', border: '1px solid #e2e8f0', 
                    borderRadius: '12px', padding: '0.6rem 1rem', 
                    fontWeight: '700', color: '#64748b', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '8px', zIndex: 10
                  }}
                >
                  <ChevronLeft size={18} /> Kembali ke Pencarian
                </button>
                <div className="candidate-detail-card" style={{ background: 'white', borderRadius: '32px', padding: '3rem', border: '1px solid #f1f5f9', boxShadow: '0 20px 40px rgba(0,0,0,0.03)' }}>
                  <div className="candidate-profile-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '2rem', gap: '2rem' }}>
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                      <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(19,78,57,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#134E39' }}><User size={40} /></div>
                      <div>
                        <div className="candidate-name-container" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                        <div className="badge-group" style={{ display: 'flex', gap: '10px', marginTop: '8px', flexWrap: 'wrap' }}>
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
                      <button className="ajukan-taaruf-btn" onClick={() => handleAjukanTaaruf(viewingCv)} style={{ background: '#134E39', color: 'white', border: 'none', borderRadius: '16px', padding: '1rem 2.5rem', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 10px 20px rgba(19,78,57,0.2)' }}>
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
                <div style={{ 
                  background: 'white', borderRadius: '32px', padding: '1.5rem', marginBottom: '3rem',
                  display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem',
                  border: '1px solid #f1f5f9', boxShadow: '0 10px 30px rgba(0,0,0,0.03)',
                  alignItems: 'end'
                }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Kata Kunci</label>
                    <div style={{ position: 'relative' }}>
                      <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                      <input 
                        type="text" className="form-control" placeholder="Cari alias, hobi..." 
                        style={{ paddingLeft: '2.5rem', fontSize: '0.85rem' }}
                        value={searchQuery} onChange={e => setSearchQuery(e.target.value)} 
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Rentang Usia</label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input 
                        type="number" className="form-control" placeholder="Min" 
                        style={{ fontSize: '0.85rem', padding: '0.6rem' }}
                        value={filters.minAge} onChange={e => setFilters({...filters, minAge: e.target.value})} 
                      />
                      <span style={{ color: '#cbd5e1' }}>-</span>
                      <input 
                        type="number" className="form-control" placeholder="Max" 
                        style={{ fontSize: '0.85rem', padding: '0.6rem' }}
                        value={filters.maxAge} onChange={e => setFilters({...filters, maxAge: e.target.value})} 
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Provinsi</label>
                    <select className="form-control" style={{ fontSize: '0.85rem' }} value={filters.province} onChange={e => setFilters({...filters, province: e.target.value, city: ''})}>
                      <option value="">Semua Provinsi</option>
                      {provinces.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Pendidikan</label>
                    <select className="form-control" style={{ fontSize: '0.85rem' }} value={filters.education} onChange={e => setFilters({...filters, education: e.target.value})}>
                      <option value="">Semua Jenjang</option>
                      {['SMA/SMK', 'Diploma', 'S1', 'S2', 'S3'].map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <button 
                      onClick={() => {
                        setFilters({ province: '', city: '', suku: '', minAge: '', maxAge: '', education: '' });
                        setSearchQuery('');
                      }}
                      style={{ 
                        width: '100%', padding: '0.75rem', borderRadius: '16px', background: '#f8fafc',
                        border: '1px solid #e2e8f0', color: '#64748b', fontWeight: '800', 
                        cursor: 'pointer', fontSize: '0.75rem', transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                      onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
                    >
                      RESET FILTER
                    </button>
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

                <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>
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
                      <div key={cv.id} className="card" style={{ padding: '2rem', borderRadius: '28px', cursor: 'pointer', transition: 'var(--transition)', border: '1px solid var(--border)', background: 'white' }} onClick={() => navigate(`/app/find/${cv.id}`)} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; e.currentTarget.style.borderColor = 'var(--primary-light)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow)'; e.currentTarget.style.borderColor = 'var(--border)'; }}>
                        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', marginBottom: '1.5rem' }}>
                          <div style={{ width: 52, height: 52, borderRadius: '16px', background: 'rgba(19,78,57,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}><User size={28} /></div>
                          <div>
                             <div style={{ fontWeight: '900', fontSize: '1.2rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                               {cv.alias}
                               {cv.is_verified && <ShieldCheck size={16} color="var(--primary-light)" title="Verified Member" />}
                               {getAcademyBadge(academyLevels[String(cv.user_id)]) && (
                                 <div title={getAcademyBadge(academyLevels[String(cv.user_id)]).label} style={{ color: getAcademyBadge(academyLevels[String(cv.user_id)]).color }}>
                                   {getAcademyBadge(academyLevels[String(cv.user_id)]).icon}
                                 </div>
                               )}
                             </div>
                             <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '800', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                               <MapPin size={12} /> {cv.location?.split(',')[0]} • {cv.age} THN • {cv.tinggi_berat}
                             </div>
                          </div>
                        </div>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.6, marginBottom: '2rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '4.8em' }}>{cv.about}</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: '900', color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', background: 'rgba(212,175,55,0.08)', padding: '4px 10px', borderRadius: '8px' }}>{cv.education}</span>
                          <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>Lihat Detail <ChevronRight size={16} /></span>
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
                      const matchMinAge = !filters.minAge || cv.age >= parseInt(filters.minAge);
                      const matchMaxAge = !filters.maxAge || cv.age <= parseInt(filters.maxAge);
                      const matchEdu = !filters.education || (cv.education && cv.education.includes(filters.education));

                      return matchQuery && matchProvince && matchCity && matchSuku && matchMinAge && matchMaxAge && matchEdu;
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
                      const matchMinAge = !filters.minAge || cv.age >= parseInt(filters.minAge);
                      const matchMaxAge = !filters.maxAge || cv.age <= parseInt(filters.maxAge);
                      const matchEdu = !filters.education || (cv.education && cv.education.includes(filters.education));

                      return matchQuery && matchProvince && matchCity && matchSuku && matchMinAge && matchMaxAge && matchEdu;
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
        <div key="tab-content-mycv" style={{ maxWidth: '850px', margin: '0 auto', animation: 'fadeInUp 0.5s ease-out', position: 'relative' }}>

           <button 
             onClick={() => setActiveTab('home')} 
             style={{ 
               position: 'absolute', top: 0, left: 0, 
               background: 'white', border: '1px solid #e2e8f0', 
               borderRadius: '12px', padding: '0.6rem 1rem', 
               fontWeight: '700', color: '#64748b', cursor: 'pointer',
               display: 'flex', alignItems: 'center', gap: '8px'
             }}
           >
             <ChevronLeft size={18} /> <span className="btn-text">Kembali</span>
           </button>
           <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
             <h2 style={{ fontSize: '2.25rem', fontWeight: '900', color: '#134E39', margin: '0 0 0.5rem' }}>CV Taaruf Anda</h2>
             <p style={{ color: '#64748b' }}>Lengkapi data dengan jujur karena ini adalah cerminan niat dan pribadi Anda.</p>
           </div>
           {hasSubmittedCv && !isEditingCv ? (
              <div className="cv-container" style={{ background: 'white', borderRadius: '32px', padding: '3.5rem', border: '1px solid #f1f5f9', boxShadow: '0 20px 60px rgba(15,23,42,0.08)', position: 'relative', overflow: 'hidden' }}>
                  {/* Premium Ambient Backgrounds */}
                  <div style={{ position: 'absolute', top: '-150px', right: '-150px', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(212,175,55,0.07) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }}></div>
                  <div style={{ position: 'absolute', bottom: '-150px', left: '-150px', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(19,78,57,0.05) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }}></div>
                  
                  <div className="my-cv-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3.5rem', position: 'relative', flexWrap: 'wrap', gap: '2rem' }}>
                      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                         <div style={{ width: 80, height: 80, borderRadius: '24px', background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 40px rgba(19,78,57,0.15)', position: 'relative' }}>
                            <div style={{ position: 'absolute', bottom: -4, right: -4, width: 26, height: 26, borderRadius: '50%', background: 'var(--secondary)', border: '3px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)' }}>
                               <CheckCircle size={12} color="white" />
                            </div>
                            <FileText size={36} color="white" />
                         </div>
                         <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                               <h3 style={{ margin: 0, color: 'var(--primary)', fontSize: '1.75rem', fontWeight: '900', letterSpacing: '-0.02em' }}>CV Aktif & Publik</h3>
                               <span style={{ padding: '0.4rem 0.8rem', borderRadius: '99px', background: 'rgba(16,185,129,0.1)', color: 'var(--success)', fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Terverifikasi</span>
                            </div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: '500', marginTop: '6px', maxWidth: '420px', lineHeight: '1.5' }}>Biodata Anda aktif dan siap ditemukan oleh calon pasangan yang sesuai.</p>
                         </div>
                      </div>
                                             <div className="action-buttons-container" style={{ display: 'flex', gap: '12px' }}>
                         <button onClick={() => { setMyCv(myExistingCv); setIsEditingCv(true); setCvStep(1); }} className="dropdown-action-btn" style={{ background: 'white !important', border: '1px solid var(--border) !important', width: 'auto !important', padding: '0.8rem 1.5rem !important', borderRadius: '16px !important', fontWeight: '800 !important' }}>
                            <Settings size={18} /> Edit Data
                         </button>
                         <button onClick={() => setIsPreviewingCv(true)} style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '16px', padding: '0.8rem 1.8rem', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: 'var(--shadow)', transition: 'var(--transition)' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}>
                            <Eye size={18} /> Pratinjau
                         </button>
                      </div>
                  </div>

                  <div className="cv-preview-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '2.5rem', position: 'relative' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', minWidth: 0 }}>
                      {/* SECTION: DATA PERSONAL */}
                      <section style={{ background: '#ffffff', borderRadius: '32px', padding: '2.5rem', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2.5rem' }}>
                          <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(212,175,55,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--secondary)' }}><User size={22} /></div>
                                                     <h4 className="cv-section-title" style={{ color: 'var(--primary)', fontWeight: '900', fontSize: '1.35rem', margin: 0 }}>Data Personal</h4>
                        </div>
                        
                        <div className="data-personal-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                          {[
                            { label: 'Alias', val: myExistingCv.alias, icon: <User size={16}/> },
                            { label: 'Usia', val: `${myExistingCv.age} Tahun`, icon: <Clock size={16}/> },
                            { label: 'Domisili', val: myExistingCv.location?.replace(/\b\w/g, l => l.toUpperCase()), icon: <MapPin size={16}/> },
                            { label: 'Pendidikan', val: myExistingCv.education, icon: <GraduationCap size={16}/> },
                            { label: 'Pekerjaan', val: myExistingCv.job, icon: <Briefcase size={16}/> },
                            { label: 'Suku', val: myExistingCv.suku, icon: <Compass size={16}/> },
                            { label: 'Status', val: myExistingCv.marital_status, icon: <Heart size={16}/> },
                            { label: 'Tinggi/Berat', val: myExistingCv.tinggi_berat, icon: <Target size={16}/> },
                            { label: 'Hobi', val: myExistingCv.hobi, icon: <Activity size={16}/> }
                          ].map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ color: 'var(--text-muted)', display: 'flex' }}>{item.icon}</span>
                                <span style={{ color: 'var(--text-muted)', fontWeight: '800', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</span>
                              </div>
                              <span style={{ color: 'var(--primary)', fontWeight: '800', fontSize: '1.1rem', lineHeight: '1.4' }}>{item.val || '-'}</span>
                            </div>
                          ))}
                        </div>
                      </section>

                      {/* SECTION: IBADAH & KARAKTER */}
                      <section>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
                          <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(19, 78, 57, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}><Sparkles size={22} /></div>
                          <h4 style={{ color: 'var(--primary)', fontWeight: '900', fontSize: '1.35rem', margin: 0 }}>Ibadah & Karakter</h4>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem' }}>
                          {[
                            { label: 'Gambaran Ibadah', val: myExistingCv.worship, theme: 'gold' },
                            { label: 'Karakter Diri', val: myExistingCv.karakter, theme: 'gold' },
                            { label: 'Kajian Rutin', val: myExistingCv.kajian, theme: 'gold' },
                            { label: 'Riwayat Kesehatan', val: myExistingCv.kesehatan, theme: 'green' }
                          ].map((item, idx) => (
                            <div key={idx} style={{ 
                              background: '#ffffff', 
                              padding: '1.75rem', 
                              borderRadius: '24px', 
                              border: '1px solid var(--border)',
                              boxShadow: '0 8px 25px rgba(0,0,0,0.02)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '12px'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.theme === 'gold' ? 'var(--secondary)' : 'var(--success)' }}></div>
                                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</span>
                              </div>
                              <p style={{ margin: 0, color: 'var(--primary)', fontWeight: '700', fontSize: '1rem', lineHeight: 1.6, overflowWrap: 'break-word', wordBreak: 'break-word' }}>{item.val || '-'}</p>
                            </div>
                          ))}
                        </div>
                      </section>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', minWidth: 0 }}>
                      <section style={{ 
                        background: 'linear-gradient(145deg, var(--primary) 0%, #1a5e45 100%)', 
                        padding: '2.5rem', 
                        borderRadius: '32px', 
                        color: 'white', 
                        boxShadow: 'var(--shadow-lg)', 
                        position: 'relative', 
                        overflow: 'hidden' 
                      }}>
                        <div style={{ position: 'absolute', top: -30, right: -30, opacity: 0.1 }}>
                           <Heart size={140} color="white" />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.75rem', position: 'relative' }}>
                          <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Heart size={24} color="var(--secondary)" fill="var(--secondary)" />
                          </div>
                          <h4 style={{ color: 'white', fontWeight: '900', fontSize: '1.35rem', margin: 0 }}>Visi Menikah</h4>
                        </div>
                        <blockquote style={{ margin: 0, color: 'rgba(255,255,255,0.95)', fontWeight: '500', lineHeight: 1.8, fontSize: '1.1rem', position: 'relative', fontStyle: 'italic', borderLeft: '3px solid var(--secondary)', paddingLeft: '1.5rem' }}>
                          "{myExistingCv.about}"
                        </blockquote>
                      </section>

                      <section style={{ background: '#fff', border: '2px dashed var(--border)', padding: '2.5rem', borderRadius: '32px', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
                          <div style={{ width: 44, height: 44, borderRadius: '14px', background: 'rgba(19, 78, 57, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                            <Target size={24} />
                          </div>
                          <h4 style={{ color: 'var(--primary)', fontWeight: '900', fontSize: '1.35rem', margin: 0 }}>Kriteria Idaman</h4>
                        </div>
                        <p style={{ margin: 0, color: 'var(--text-main)', fontWeight: '600', lineHeight: 1.8, fontSize: '1rem', paddingLeft: '4px' }}>{myExistingCv.criteria || 'Belum mengisi kriteria pasangan.'}</p>
                      </section>

                      <div style={{ background: 'rgba(212,175,55,0.05)', padding: '1.75rem', borderRadius: '24px', border: '1px solid rgba(212,175,55,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(212,175,55,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--secondary)' }}>
                            <Users size={20} />
                          </div>
                          <div>
                            <h5 style={{ margin: 0, color: '#B8860B', fontWeight: '900', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pandangan Poligami</h5>
                            <span style={{ color: 'var(--primary)', fontWeight: '800', fontSize: '0.95rem' }}>{myExistingCv.poligami || 'Tidak Bersedia'}</span>
                          </div>
                        </div>
                        {myExistingCv.poligami === 'Bersedia' && <div style={{ fontSize: '0.65rem', fontWeight: '900', padding: '4px 10px', background: 'white', borderRadius: '8px', color: 'var(--secondary)', border: '1px solid var(--secondary)' }}>MODERAT</div>}
                      </div>
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

        .dashboard-tab-container::-webkit-scrollbar { display: none; }
        .dashboard-tab-container { 
          -ms-overflow-style: none; 
          scrollbar-width: none; 
          overflow-y: auto;
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
          .cv-container {
            padding: 1.25rem !important;
            border-radius: 20px !important;
          }
          .cv-preview-grid { 
            grid-template-columns: 1fr !important; 
            gap: 1.5rem !important; 
            background: white !important;
            padding: 0 !important;
          }
          .cv-preview-grid section {
            padding: 1.5rem !important;
            border-radius: 24px !important;
          }
          .my-cv-header {
            flex-direction: column;
            gap: 1.5rem !important;
            text-align: center;
            align-items: center !important;
            margin-bottom: 2rem !important;
          }
          .my-cv-header .btn-group {
            width: 100%;
            flex-direction: column;
            gap: 0.75rem !important;
          }
          .my-cv-header .btn-group button {
            width: 100% !important;
            justify-content: center !important;
            padding: 0.75rem !important;
          }
          .dashboard-grid { grid-template-columns: 1fr !important; }
          .section-grid { grid-template-columns: 1fr !important; }
          
          .cv-preview-grid > div {
            gap: 1.5rem !important;
          }
          
          .data-personal-grid {
            grid-template-columns: 1fr !important;
            gap: 1.25rem !important;
          }
          
          .action-buttons-container {
            flex-direction: column !important;
            width: 100%;
          }
          .cv-section-title { font-size: 1.1rem !important; }
          .qa-template-container { padding: 1.25rem !important; }
          .chat-window-container { padding: 0 !important; }
          
          .candidate-detail-card { 
            padding: 1.5rem !important; 
            border-radius: 24px !important; 
          }
          .candidate-profile-header {
            flex-direction: column !important;
            align-items: center !important;
            text-align: center !important;
            padding-bottom: 1.5rem !important;
          }
          .candidate-profile-header > div:first-child {
            flex-direction: column !important;
            align-items: center !important;
            gap: 1rem !important;
          }
          .candidate-profile-header .badge-group {
            justify-content: center !important;
          }
          .candidate-name-container {
            justify-content: center !important;
          }
          .ajukan-taaruf-btn {
            width: 100% !important;
            justify-content: center !important;
            margin-top: 1rem !important;
          }

          .mobile-status-toggle { display: flex !important; }
          .status-detail-content { display: none; }
          .status-detail-content.expanded { display: block !important; }
          .stepper-container { margin: 0 0 2rem !important; }
          .stepper { gap: 1rem !important; }
          .step-label { font-size: 0.6rem !important; }
          
          .chat-card { border-radius: 20px !important; height: clamp(500px, 80vh, 800px); display: flex; flex-direction: column; }
          .chat-header { padding: 1rem !important; gap: 0.75rem !important; flex-wrap: wrap; }
          .chat-info h3 { font-size: 0.95rem !important; }
          .chat-info p { font-size: 0.75rem !important; }
          .qa-helper-btn { width: 100%; justify-content: center; margin-top: 5px; }
          .chat-messages { padding: 1rem !important; }
          .chat-bubble { max-width: 85% !important; }
          .chat-input-area { padding: 0.75rem !important; }
          
          .mobile-status-toggle { display: flex !important; }
          .status-detail-content { display: none; }
          .status-detail-content.expanded { display: block !important; }
          .stepper-container { margin: 0 0 2rem !important; }
          .stepper { gap: 1rem !important; }
          .step-label { font-size: 0.6rem !important; }
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
             <div className="cv-header" style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)', padding: '3.5rem', color: 'white', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '40px', right: '40px', width: '120px', height: '120px', borderRadius: '30px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)' }}><User size={64} /></div>
                <div style={{ padding: '6px 14px', background: 'var(--secondary)', borderRadius: '8px', color: 'var(--primary)', fontSize: '0.7rem', fontWeight: '900', display: 'inline-block', marginBottom: '1.5rem', letterSpacing: '0.15em', boxShadow: 'var(--shadow-sm)' }}>DATA CV TAARUF</div>
                <h2 style={{ fontSize: '3rem', fontWeight: '900', margin: '0 0 0.75rem', letterSpacing: '-0.03em' }}>{myExistingCv.alias}</h2>
                <div style={{ display: 'flex', gap: '2rem', fontSize: '0.95rem', opacity: 0.9, fontWeight: '800', flexWrap: 'wrap' }}>
                   <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MapPin size={18} color="var(--secondary)" /> {myExistingCv.location}</span>
                   <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Clock size={18} color="var(--secondary)" /> {myExistingCv.age} Tahun</span>
                   <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Heart size={18} color="var(--secondary)" /> {myExistingCv.marital_status}</span>
                </div>
             </div>
             
             <div className="cv-preview-grid" style={{ padding: '3.5rem', background: '#fff', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem' }}>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                    <section>
                       <h4 style={{ color: 'var(--primary)', fontWeight: '900', fontSize: '0.9rem', letterSpacing: '0.15em', marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                         <div style={{ width: '4px', height: '22px', background: 'var(--secondary)', borderRadius: '2px' }}></div> DATA PRIBADI
                       </h4>
                       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem 2rem' }}>
                         {[
                           { label: 'Pekerjaan', val: myExistingCv.job, icon: <Briefcase size={20} /> },
                           { label: 'Pendidikan', val: myExistingCv.education, icon: <GraduationCap size={20} /> },
                           { label: 'Suku Bangsa', val: myExistingCv.suku, icon: <Compass size={20} /> },
                           { label: 'Tinggi / Berat', val: myExistingCv.tinggi_berat, icon: <Target size={20} /> },
                           { label: 'Kesehatan', val: myExistingCv.kesehatan || 'Normal', icon: <Heart size={20} /> },
                           { label: 'Hobi', val: myExistingCv.hobi || '-', icon: <Activity size={20} /> },
                         ].map((item, i) => (
                            <div key={i} style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                               <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(212,175,55,0.1)', color: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 5px 15px rgba(212,175,55,0.05)' }}>{item.icon}</div>
                               <div>
                                  <div style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{item.label}</div>
                                  <div style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)' }}>{item.val}</div>
                               </div>
                            </div>
                         ))}
                       </div>
                    </section>
                 </div>

                 <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                    <section style={{ background: 'var(--bg-light)', padding: '2.5rem', borderRadius: '32px', border: '1px solid var(--border)', position: 'relative' }}>
                       <h4 style={{ color: 'var(--primary)', fontWeight: '900', fontSize: '0.85rem', letterSpacing: '0.15em', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Heart size={18} fill="var(--secondary)" color="var(--secondary)" /> VISI PERNIKAHAN
                       </h4>
                       <p style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-main)', lineHeight: 1.8, fontWeight: '600', fontStyle: 'italic' }}>"{myExistingCv.about}"</p>
                    </section>
                    
                    <section style={{ background: 'white', padding: '2.5rem', borderRadius: '32px', border: '2px dashed var(--border)', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
                       <h4 style={{ color: 'var(--primary)', fontWeight: '900', fontSize: '0.85rem', letterSpacing: '0.15em', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Target size={18} color="var(--primary)" /> KRITERIA PASANGAN
                       </h4>
                       <p style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-main)', lineHeight: 1.8, fontWeight: '600' }}>{myExistingCv.criteria}</p>
                    </section>

                    <section style={{ padding: '0 1.5rem' }}>
                       <h4 style={{ color: 'var(--primary)', fontWeight: '900', fontSize: '0.85rem', letterSpacing: '0.15em', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <ShieldCheck size={18} color="var(--secondary)" /> PANDANGAN POLIGAMI
                       </h4>
                       <span style={{ display: 'inline-block', padding: '10px 20px', background: 'rgba(19, 78, 57, 0.05)', color: 'var(--primary)', borderRadius: '16px', fontSize: '1rem', fontWeight: '800' }}>{myExistingCv.poligami || 'Tidak Bersedia'}</span>
                    </section>
                 </div>
              </div>
              <div style={{ padding: '2.5rem', background: '#fff', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'center' }}>
                 <button className="btn btn-primary" onClick={() => setIsPreviewingCv(false)} style={{ borderRadius: '20px', padding: '1.1rem 4rem', fontSize: '1.05rem', background: 'var(--primary)', fontWeight: '900', boxShadow: 'var(--shadow)', border: 'none', cursor: 'pointer', transition: 'var(--transition)' }}>Tutup Pratinjau</button>
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
