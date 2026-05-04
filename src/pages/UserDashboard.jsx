import React, { useContext, useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { FileText, X, User, Briefcase, Heart } from 'lucide-react';
import { supabase } from '../supabase';
import AccountTab from '../components/dashboard/AccountTab';
import LearningTab from '../components/dashboard/LearningTab';
import MyCvTab from '../components/dashboard/MyCvTab';
import CertificateTab from '../components/dashboard/CertificateTab';
import FeedbackTab from '../components/dashboard/FeedbackTab';
import HomeTab from '../components/dashboard/HomeTab';
import FindTab from '../components/dashboard/FindTab';
import StatusTab from '../components/dashboard/StatusTab';

const MAJOR_SUKU = [
  "Jawa", "Sunda", "Batak", "Minangkabau", "Bugis", "Madura", "Betawi", "Melayu", 
  "Arab", "Tionghoa", "Aceh", "Bali", "Sasak", "Dayak", "Banjar", "Makassar", 
  "Minahasa", "Nias", "Mandar", "Cirebon", "Lampung", "Bangka", "Bima", "Papua",
  "Musi", "Toraja", "Buton", "Gorontalo"
].sort();

export default function UserDashboard() {
  const { user, setUser, cvs, setCvs, taarufRequests, setTaarufRequests, messages, setMessages, showAlert, addNotification, academyLevels, getAcademyBadge, claimedBadges, setClaimedBadges, bookmarks, setBookmarks } = useContext(AppContext);
  const navigate = useNavigate();
  const { tab, id, subId } = useParams();
  const activeTab = tab || 'home';

  const setActiveTab = (newTab) => navigate(`/app/${newTab}`);

  // ── Chat State ──
  const [activeChatId, setActiveChatId] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [viewingStatusId, setViewingStatusId] = useState(null);

  // ── Chart State ──
  const [chartFilter, setChartFilter] = useState('7_hari');

  // ── CV Form State ──
  const [myCv, setMyCv] = useState({
    alias: user?.name || '', gender: user?.gender || '', age: '', location: '',
    domisili_provinsi: '', domisili_kota: '',
    education: '', job: '', worship: '', about: '', criteria: '', suku: '',
    hobi: '', poligami: 'Tidak Bersedia', salary: '', address: '',
    marital_status: 'Lajang', tinggi_berat: '', kesehatan: '', kajian: '', karakter: '',
    aqidah1: user?.aqidah1 || '', aqidah2: user?.aqidah2 || '', aqidah3: user?.aqidah3 || '',
    aqidah4: user?.aqidah4 || '', marriage_vision: user?.marriage_vision || '', role_view: user?.role_view || ''
  });
  const [cvStep, setCvStep] = useState(1);
  const totalSteps = 7;
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
      if (id === 'catalog' || id === 'daftar-kelas') {
        setLmsView('catalog');
        setActiveClass(null);
        setActiveLesson(null);
      } else if (id === 'dashboard') {
        setLmsView('dashboard');
        setActiveClass(null);
        setActiveLesson(null);
        setCurriculum([]);
      } else if (id) {
        const foundClass = classes.find(c => String(c.id) === String(id));
        if (foundClass) {
          setLmsView('player');
          setActiveClass(foundClass);
          setCurriculum(foundClass.modules);
          if (subId) {
            const foundLesson = foundClass.modules.flatMap(m => m.items).find(i => String(i.id) === String(subId));
            if (foundLesson) setActiveLesson(foundLesson);
          } else {
            const firstLesson = foundClass.modules[0]?.items[0];
            if (firstLesson) setActiveLesson(firstLesson);
          }
        } else if (classes.length > 0) {
           // Class ID not found in the loaded classes, reset to welcome or catalog
           setLmsView('welcome');
           setActiveClass(null);
           setActiveLesson(null);
           setCurriculum([]);
        }
      } else if (activeTab === 'materi') {
        setLmsView('welcome');
        setActiveClass(null);
        setActiveLesson(null);
        setCurriculum([]);
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

      const { data: enrollmentData } = await supabase.from('course_enrollments').select('class_id').eq('user_id', user.id);
      const enrolledSet = new Set((enrollmentData || []).map(e => e.class_id));

      const builtClasses = (clsData || [])
        .filter(cls => cls.is_published !== false) // Default to visible if null/undefined, hide if explicitly false
        .map(cls => ({
          ...cls,
          isEnrolled: enrolledSet.has(cls.id),
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

  const enrollClass = async (classId) => {
    try {
      const { error } = await supabase.from('course_enrollments').insert({ user_id: user.id, class_id: classId });
      if (error) throw error;
      
      // Update local state
      setClasses(prev => prev.map(cls => cls.id === classId ? { ...cls, isEnrolled: true } : cls));
      
      // Navigate to player for this class
      navigate(`/app/materi/${classId}`);
      
      addNotification('Berhasil mengikuti kelas baru!');
    } catch (err) {
      console.error('Error enrolling:', err);
      showAlert('Gagal', 'Tidak dapat mengikuti kelas: ' + err.message, 'error');
    }
  };

  const selectClassForPlayer = (cls) => {
    navigate(`/app/materi/${cls.id}`);
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

      // 🔄 Update Religious Data in Profiles Table
      const profilePayload = {
        aqidah1: myCv.aqidah1,
        aqidah2: myCv.aqidah2,
        aqidah3: myCv.aqidah3,
        aqidah4: myCv.aqidah4,
        marriage_vision: myCv.marriage_vision,
        role_view: myCv.role_view
      };
      await supabase.from('profiles').update(profilePayload).eq('id', user.id);
      setUser({ ...user, ...profilePayload });

      setCvStep(8);
    } catch { 
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
    } catch { showAlert('Error', 'Kesalahan sistem.', 'error'); }
  };

  const hour = new Date().getHours();
  const greeting = hour < 11 ? 'Selamat Pagi' : hour < 15 ? 'Selamat Siang' : hour < 18 ? 'Selamat Sore' : 'Selamat Malam';
  const filteredCvs = useMemo(() => {
    return cvs.filter(cv => {
      // 1. Basic Security & Status
      const isBasicMatch = cv.status === 'approved' && 
                          cv.user_id !== user.id && 
                          cv.gender?.toLowerCase() !== user.gender?.toLowerCase() &&
                          !takenUserIds.has(cv.user_id);
      if (!isBasicMatch) return false;

      // 2. Search Query
      const query = searchQuery.toLowerCase();
      const matchQuery = !query || 
                         cv.alias?.toLowerCase().includes(query) || 
                         cv.location?.toLowerCase().includes(query) ||
                         cv.job?.toLowerCase().includes(query);
      if (!matchQuery) return false;

      // 3. Filters
      const matchProvince = !filters.province || cv.location?.toLowerCase().includes(filters.province.toLowerCase());
      const matchCity = !filters.city || cv.location?.toLowerCase().includes(filters.city.toLowerCase());
      const matchSuku = !filters.suku || cv.suku === filters.suku;
      const matchMinAge = !filters.minAge || cv.age >= parseInt(filters.minAge);
      const matchMaxAge = !filters.maxAge || cv.age <= parseInt(filters.maxAge);
      const matchEdu = !filters.education || (cv.education && cv.education.includes(filters.education));
      const matchBookmark = !filters.onlyBookmarked || bookmarks.some(b => b.target_id === cv.user_id);

      return matchProvince && matchCity && matchSuku && matchMinAge && matchMaxAge && matchEdu && matchBookmark;
    });
  }, [cvs, user.id, user.gender, takenUserIds, searchQuery, filters, bookmarks]);

  const candidateCount = filteredCvs.length;
  const myActiveRequests = taarufRequests.filter(r => r.senderEmail === user.email).length;
  
  let activityData = [];
  if (chartFilter === '7_hari') {
    activityData = [
      { name: 'Sen', aktivitas: 2 },
      { name: 'Sel', aktivitas: 5 },
      { name: 'Rab', aktivitas: 3 },
      { name: 'Kam', aktivitas: 8 },
      { name: 'Jum', aktivitas: 4 },
      { name: 'Sab', aktivitas: 9 },
      { name: 'Min', aktivitas: 7 },
    ];
  } else if (chartFilter === '1_bulan') {
    activityData = [
      { name: 'Mg 1', aktivitas: 15 },
      { name: 'Mg 2', aktivitas: 22 },
      { name: 'Mg 3', aktivitas: 18 },
      { name: 'Mg 4', aktivitas: 28 },
    ];
  } else {
    activityData = [
      { name: 'Jan', aktivitas: 40 },
      { name: 'Feb', aktivitas: 55 },
      { name: 'Mar', aktivitas: 45 },
      { name: 'Apr', aktivitas: 60 },
      { name: 'Mei', aktivitas: 70 },
      { name: 'Jun', aktivitas: 85 },
    ];
  }

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
        <HomeTab 
          user={user} greeting={greeting} candidateCount={candidateCount}
          myActiveRequests={myActiveRequests} getAcademyBadge={getAcademyBadge}
          academyLevels={academyLevels} activityData={activityData}
          chartFilter={chartFilter} setChartFilter={setChartFilter}
          onboardingPct={onboardingPct} checks={checks}
          setActiveTab={setActiveTab} navigate={navigate}
        />
      )}

      {/* ══ STATUS TAB ══ */}
      {activeTab === 'status' && (
        !hasSubmittedCv ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', background: 'white', borderRadius: '40px', border: '1px solid #f1f5f9', textAlign: 'center', animation: 'fadeInUp 0.5s ease' }}>
             <div style={{ width: '120px', height: '120px', borderRadius: '40px', background: 'rgba(19,78,57,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#134E39', marginBottom: '2.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.02)' }}>
                <FileText size={60} strokeWidth={1.5} />
             </div>
             <h2 style={{ fontSize: '2.2rem', fontWeight: '900', color: '#134E39', marginBottom: '1.2rem', letterSpacing: '-0.02em' }}>Fitur Masih Terkunci</h2>
             <p style={{ fontSize: '1.15rem', color: '#64748b', maxWidth: '550px', lineHeight: 1.8, marginBottom: '3rem', fontWeight: '500' }}>
               Demi menjaga kualitas dan keseriusan taaruf, Anda wajib **melengkapi Profil CV** Anda terlebih dahulu sebelum dapat memantau status ikhtiar.
             </p>
             <button 
               onClick={() => setActiveTab('my_cv')}
               style={{ background: '#134E39', color: 'white', border: 'none', padding: '1.25rem 3rem', borderRadius: '20px', fontWeight: '900', fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 15px 35px rgba(19,78,57,0.25)', transition: 'all 0.3s' }}
               onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
               onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
             >
               LENGKAPI CV SEKARANG
             </button>
          </div>
        ) : (
          <StatusTab 
            user={user} taarufRequests={taarufRequests} setTaarufRequests={setTaarufRequests}
            myExistingCv={myExistingCv} viewingStatusId={viewingStatusId} setViewingStatusId={setViewingStatusId}
            activeChatId={activeChatId} setActiveChatId={setActiveChatId}
            messages={messages} setMessages={setMessages} chatInput={chatInput} setChatInput={setChatInput}
            handleSendMessage={handleSendMessage} setShowQaTemplates={setShowQaTemplates}
            showAlert={showAlert} setActiveTab={setActiveTab}
          />
        )
      )}

      {/* ══ FIND TAB ══ */}
      {activeTab === 'find' && (
        !hasSubmittedCv ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', background: 'white', borderRadius: '40px', border: '1px solid #f1f5f9', textAlign: 'center', animation: 'fadeInUp 0.5s ease' }}>
             <div style={{ width: '120px', height: '120px', borderRadius: '40px', background: 'rgba(212,175,55,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4AF37', marginBottom: '2.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.02)' }}>
                <Sparkles size={60} strokeWidth={1.5} />
             </div>
             <h2 style={{ fontSize: '2.2rem', fontWeight: '900', color: '#134E39', marginBottom: '1.2rem', letterSpacing: '-0.02em' }}>Buka Akses Cari Jodoh</h2>
             <p style={{ fontSize: '1.15rem', color: '#64748b', maxWidth: '550px', lineHeight: 1.8, marginBottom: '3rem', fontWeight: '500' }}>
               Lengkapi CV Anda untuk mulai melihat daftar kandidat yang sesuai dengan kriteria Anda. Keamanan dan privasi adalah prioritas kami.
             </p>
             <button 
               onClick={() => setActiveTab('my_cv')}
               style={{ background: '#134E39', color: 'white', border: 'none', padding: '1.25rem 3rem', borderRadius: '20px', fontWeight: '900', fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 15px 35px rgba(19,78,57,0.25)', transition: 'all 0.3s' }}
             >
               LENGKAPI CV SEKARANG
             </button>
          </div>
        ) : (
          <FindTab 
            user={user} cvs={cvs} myExistingCv={myExistingCv} 
            viewingCv={viewingCv} setViewingCv={setViewingCv}
            filters={filters} setFilters={setFilters} searchQuery={searchQuery} setSearchQuery={setSearchQuery}
            provinces={provinces} candidateCount={candidateCount} bookmarks={bookmarks} setBookmarks={setBookmarks}
            academyLevels={academyLevels} getAcademyBadge={getAcademyBadge} takenUserIds={takenUserIds}
            currentPage={currentPage} setCurrentPage={setCurrentPage} itemsPerPage={itemsPerPage}
            handleAjukanTaaruf={handleAjukanTaaruf} navigate={navigate} setActiveTab={setActiveTab}
          />
        )
      )}

      {/* ══ MY CV TAB (Partial Re-Design) ══ */}
      {activeTab === 'my_cv' && (
        <div key="tab-content-mycv" style={{ flex: 1, minHeight: '100%', width: '100%', animation: 'fadeInUp 0.5s ease-out', position: 'relative', display: 'flex', flexDirection: 'column' }}>
           <MyCvTab 
              user={user}
              myExistingCv={myExistingCv}
              isEditingCv={isEditingCv}
              setIsEditingCv={setIsEditingCv}
              hasSubmittedCv={hasSubmittedCv}
              cvStep={cvStep}
              setCvStep={setCvStep}
              myCv={myCv}
              setMyCv={setMyCv}
              isSubmittingCv={isSubmittingCv}
              handleCvSubmit={handleCvSubmit}
              isPreviewingCv={isPreviewingCv}
              setIsPreviewingCv={setIsPreviewingCv}
              totalSteps={totalSteps}
              setActiveTab={setActiveTab}
              onBack={() => setActiveTab('home')}
           />
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
            enrollClass={enrollClass} selectClassForPlayer={selectClassForPlayer}
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

      {/* Styles Injection */}
      <style>{`
        .dashboard-root { 
          padding: 0; 
          width: 100%;
          margin: 0; 
          color: #1e293b;
          min-height: 100%;
          display: flex;
          flex-direction: column;
        }

        .dashboard-tab-container { 
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .cv-container::-webkit-scrollbar,
        .modal-content::-webkit-scrollbar {
          width: 8px;
        }
        .cv-container::-webkit-scrollbar-track,
        .modal-content::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .cv-container::-webkit-scrollbar-thumb,
        .modal-content::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .cv-container::-webkit-scrollbar-thumb:hover,
        .modal-content::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
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

        @media (max-width: 1100px) {
          .dashboard-root { 
            padding: 0; 
            height: auto;
            overflow: visible;
            display: block;
          }
          .dashboard-tab-container {
            overflow: visible;
            display: block;
          }
        }
        @media (max-width: 768px) {
          .dashboard-root { padding: 1.25rem 1rem; }
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
          
          .chart-card {
            padding: 1.5rem !important;
            border-radius: 24px !important;
          }
          .chart-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 1.25rem !important;
          }
          .chart-filter-group {
            width: 100%;
            display: flex !important;
            gap: 4px !important;
            background: #f1f5f9 !important;
            padding: 4px !important;
            border-radius: 16px !important;
          }
          .chart-filter-group button {
            flex: 1;
            padding: 8px 5px !important;
            font-size: 0.7rem !important;
            border-radius: 12px !important;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .chart-filter-group::-webkit-scrollbar { display: none; }

          .mobile-status-toggle { display: flex !important; }
          .status-detail-content { display: none; }
          .status-detail-content.expanded { display: block !important; }
          .stepper-container { margin: 0 0 2rem !important; }
          .stepper { gap: 1rem !important; }
          .step-label { font-size: 0.6rem !important; }
          
          .chat-card { border-radius: 0 !important; height: calc(100vh - 120px); border: none !important; }
          .chat-header { padding: 0.75rem 1rem !important; gap: 0.75rem !important; flex-wrap: wrap; }
          .chat-avatar { width: 32px !important; height: 32px !important; }
          .chat-info h3 { font-size: 0.85rem !important; white-space: normal !important; line-height: 1.2; }
          .chat-info p { font-size: 0.65rem !important; }
          .qa-helper-btn { width: 100%; justify-content: center; margin-top: 5px; padding: 6px 12px !important; font-size: 0.7rem !important; }
          .chat-messages { padding: 1rem !important; gap: 0.75rem !important; }
          .chat-bubble { max-width: 90% !important; padding: 10px 14px !important; font-size: 0.85rem !important; }
          .chat-input-area { padding: 0.75rem !important; gap: 8px !important; }
          .chat-input-field { padding: 0.7rem 1rem !important; font-size: 0.85rem !important; }
          .chat-send-btn { width: 42px !important; height: 42px !important; }
          
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
        <div key="cv-preview-modal" style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'white', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
           <button 
             onClick={() => setIsPreviewingCv(false)}
             style={{ 
               position: 'absolute', top: '1.5rem', left: '1.5rem', zIndex: 2100, 
               background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', 
               padding: '10px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
               display: 'flex', alignItems: 'center', justifyContent: 'center'
             }}
           >
             <X size={20} color="#134E39" />
           </button>
           <MyCvTab 
             user={user}
             myExistingCv={myExistingCv}
             hasSubmittedCv={true}
             isPreviewingCv={true}
           />
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
                      'Bagaimana Anda mendefinisikan keluarga yang sakinah, Separuh Agama, warahmah?'
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
