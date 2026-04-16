import React, { useContext, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import {
  FileText, Search, UserCheck, Send, Clock, MessageCircle,
  Users, CheckCircle, XCircle, User, MapPin, Briefcase,
  GraduationCap, Heart, BookOpen, AlertCircle, ShieldAlert,
  ChevronDown, ChevronRight
} from 'lucide-react';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';
import { supabase } from '../supabase';
import AccountTab from '../components/dashboard/AccountTab';
import LearningTab from '../components/dashboard/LearningTab';
import CertificateTab from '../components/dashboard/CertificateTab';

// ── Constants ──
const INDONESIA_REGIONS = {
  'DKI Jakarta': ['Jakarta Pusat', 'Jakarta Barat', 'Jakarta Selatan', 'Jakarta Timur', 'Jakarta Utara', 'Kepulauan Seribu'],
  'Jawa Barat': ['Bandung', 'Bekasi', 'Depok', 'Bogor', 'Tasikmalaya', 'Cimahi', 'Sukabumi', 'Cirebon', 'Banjar'],
  'Jawa Tengah': ['Semarang', 'Surakarta', 'Magelang', 'Pekalongan', 'Salatiga', 'Tegal'],
  'Jawa Timur': ['Surabaya', 'Malang', 'Batu', 'Blitar', 'Kediri', 'Madiun', 'Mojokerto', 'Pasuruan', 'Probolinggo'],
  'DI Yogyakarta': ['Yogyakarta', 'Sleman', 'Bantul', 'Kulon Progo', 'Gunungkidul'],
  'Banten': ['Tangerang', 'Serang', 'Cilegon', 'Tangerang Selatan'],
  'Sumatera Utara': ['Medan', 'Binjai', 'Pematangsiantar', 'Tanjungbalai', 'Tebing Tinggi', 'Padang Sidempuan'],
  'Sumatera Barat': ['Padang', 'Bukittinggi', 'Payakumbuh', 'Pariaman', 'Solok', 'Sawahlunto', 'Padang Panjang'],
  'Riau': ['Pekanbaru', 'Dumai'],
  'Kepulauan Riau': ['Batam', 'Tanjung Pinang'],
  'Sumatera Selatan': ['Palembang', 'Lubuklinggau', 'Pagar Alam', 'Prabumulih'],
  'Lampung': ['Bandar Lampung', 'Metro'],
  'Bali': ['Denpasar'],
  'NTB': ['Mataram', 'Bima'],
  'NTT': ['Kupang'],
  'Kalimantan Barat': ['Pontianak', 'Singkawang'],
  'Kalimantan Selatan': ['Banjarmasin', 'Banjarbaru'],
  'Kalimantan Timur': ['Samarinda', 'Balikpapan', 'Bontang'],
  'Sulawesi Selatan': ['Makassar', 'Palopo', 'Parepare'],
  'Sulawesi Utara': ['Manado', 'Bitung', 'Tomohon', 'Kotamobagu'],
  'Papua': ['Jayapura'],
};

// ── Curriculum Data (fetched from Supabase) ──────────────────────────────────

export default function UserDashboard() {
  const { user, cvs, setCvs, taarufRequests, setTaarufRequests, showAlert, addNotification, messages, setMessages } = useContext(AppContext);
  const navigate = useNavigate();
  const { tab } = useParams();
  const activeTab = tab || 'home';

  const setActiveTab = (newTab) => navigate(`/app/${newTab}`);

  // ── Chat State ──
  const [activeChatId, setActiveChatId] = useState(null);
  const [chatInput, setChatInput] = useState('');

  // ── CV Form State ──
  const [myCv, setMyCv] = useState({
    alias: user?.name || '', gender: user?.gender || 'ikhwan', age: '', location: '',
    education: '', job: '', worship: '', about: '', criteria: '', suku: '',
    hobi: '', poligami: 'Tidak Bersedia', salary: '', address: '',
    marital_status: 'Lajang', tinggi_berat: '', kesehatan: '', kajian: '', karakter: ''
  });
  const [cvStep, setCvStep] = useState(1);
  const totalSteps = 6;
  const [isEditingCv, setIsEditingCv] = useState(false);
  const myExistingCv = cvs.find(cv => cv.user_id === user.id);
  const hasSubmittedCv = !!myExistingCv && !isEditingCv;

  // ── Filter State ──
  const [filters, setFilters] = useState({ gender: 'Semua', province: '', city: '', suku: '', hobi: '', poligami: 'Semua' });
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingCv, setViewingCv] = useState(null);

  // ── LMS State ──
  const [classes, setClasses] = useState([]);
  const [curriculum, setCurriculum] = useState([]);
  const [lmsLoading, setLmsLoading] = useState(true);
  const [activeClass, setActiveClass] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [lmsView, setLmsView] = useState('catalog');
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // ── Fetch curriculum from Supabase ──
  const fetchCurriculum = async () => {
    setLmsLoading(true);
    try {
      // 1. Fetch Classes
      const { data: clsData } = await supabase.from('lms_classes').select('*').eq('is_active', true).order('order_index');
      setClasses(clsData || []);

      // 2. Fetch courses (Modules)
      const { data: coursesData } = await supabase.from('courses').select('*').eq('is_active', true).order('order_index');
      
      // 3. Fetch lessons
      const { data: lessonsData } = await supabase.from('lessons').select('*').order('order_index');
      
      // 4. Fetch quiz questions
      const { data: quizData } = await supabase.from('quiz_questions').select('*').order('order_index');
      
      // 5. Fetch user progress
      const { data: progressData } = await supabase.from('user_lesson_progress').select('lesson_id, completed, score').eq('user_id', user.id);
      const doneSet = new Set((progressData || []).filter(p => p.completed).map(p => p.lesson_id));

      // 6. Structure Class -> Module -> Lesson
      const builtClasses = (clsData || []).map(cls => ({
        ...cls,
        modules: (coursesData || []).filter(c => c.class_id === cls.id).map((course, mi) => ({
          ...course,
          expanded: mi === 0,
          items: (lessonsData || [])
            .filter(l => l.course_id === course.id)
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

      // Find active class curriculum if already playing
      if (activeClass) {
        const found = builtClasses.find(c => c.id === activeClass.id);
        if (found) setCurriculum(found.modules);
      } else if (builtClasses.length > 0) {
        // Just for initializing stats etc
        setCurriculum(builtClasses[0].modules);
      }

      setClasses(builtClasses);
    } catch (err) {
      console.error('Error fetching curriculum:', err);
    } finally {
      setLmsLoading(false);
    }
  };

  const selectClassForPlayer = (cls) => {
    setActiveClass(cls);
    setCurriculum(cls.modules);
    setLmsView('player');
    const firstLesson = cls.modules?.[0]?.items?.[0] || null;
    setActiveLesson(firstLesson);
  };

  useEffect(() => {
    if (user) fetchCurriculum();
  }, [user.id]);

  const toggleModule = (moduleId) => setCurriculum(prev => prev.map(m => m.id === moduleId ? { ...m, expanded: !m.expanded } : m));

  const markLessonDone = async (lessonId, score = null) => {
    // Update local state immediately
    setCurriculum(prev => prev.map(m => ({
      ...m,
      items: m.items.map(item => item.id === lessonId ? { ...item, done: true } : item)
    })));
    // Persist to Supabase
    try {
      await supabase.from('user_lesson_progress').upsert({
        user_id: user.id,
        lesson_id: lessonId,
        completed: true,
        score: score,
        completed_at: new Date().toISOString()
      }, { onConflict: 'user_id,lesson_id' });
      
      // Check if this was the last lesson in the ACTIVE class
      const lessonsInThisClass = curriculum
        .filter(cls => cls.id === activeClass.id)
        .flatMap(cls => cls.modules.flatMap(m => m.items));
      
      const doneCount = lessonsInThisClass.filter(l => l.done).length + 1;
      
      if (doneCount === lessonsInThisClass.length && activeClass) {
         addNotification(`Alhamdulillah! Anda telah menyelesaikan seluruh materi di kelas "${activeClass.title}". Klik untuk lihat sertifikat!`);
      }
    } catch (err) {
      console.error('Error saving progress:', err);
    }
  };

  const totalLessons = curriculum.reduce((acc, m) => acc + m.items.length, 0);
  const doneLessons = curriculum.reduce((acc, m) => acc + m.items.filter(i => i.done).length, 0);
  const progressPercent = totalLessons > 0 ? Math.round((doneLessons / totalLessons) * 100) : 0;
  const allDone = totalLessons > 0 && curriculum.flatMap(m => m.items).every(i => i.done);

  useEffect(() => {
    if (activeTab !== 'materi') {
      setLmsView('catalog');
      setQuizAnswers({});
      setQuizSubmitted(false);
    }
  }, [activeTab]);

  // ── CV Submit ──
  const handleCvSubmit = async () => {
    if (cvStep !== totalSteps) { setCvStep(cvStep + 1); return; }
    if (!myCv.job || !myCv.location || !myCv.education || !myCv.worship || !myCv.about || !myCv.criteria || !myCv.marital_status || !myCv.age) {
      showAlert('Data Belum Lengkap', 'Mohon lengkapi semua field yang wajib diisi.', 'error'); return;
    }
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
        if (error || !data?.length) { showAlert('Error', 'Gagal memperbarui CV. ' + (error?.message || ''), 'error'); return; }
        setCvs(cvs.map(cv => cv.id === myExistingCv.id ? data[0] : cv));
        addNotification('Alhamdulillah, CV berhasil diperbarui!');
      } else {
        const { data, error } = await supabase.from('cv_profiles').insert(cvPayload).select();
        if (error || !data?.length) { showAlert('Error', 'Gagal mengirim CV. ' + (error?.message || ''), 'error'); return; }
        setCvs([...cvs, data[0]]);
        addNotification('Alhamdulillah, CV berhasil disubmit!');
      }
      setCvStep(7);
    } catch (err) { showAlert('Error', 'Kesalahan sistem saat mengirim CV.', 'error'); }
  };

  // ── Ajukan Taaruf ──
  const handleAjukanTaaruf = async (targetCv) => {
    if (!myExistingCv) { showAlert('CV Belum Lengkap', 'Lengkapi CV Taaruf terlebih dahulu.', 'error'); setActiveTab('my_cv'); return; }
    if (myExistingCv.status !== 'approved') { showAlert('CV Pending', 'CV Anda masih menunggu verifikasi.', 'info'); return; }
    const existingReq = taarufRequests.find(req => req.senderEmail === user.email && req.targetCvId === targetCv.id && req.status !== 'rejected');
    if (existingReq) { showAlert('Sudah Ada', 'Anda sudah memiliki proses pengajuan untuk kandidat ini.', 'info'); return; }
    const activeRequests = taarufRequests.filter(req => req.senderEmail === user.email && req.status !== 'rejected');
    if (activeRequests.length >= 1) {
      if (user.gender === 'akhwat') { showAlert('Batas Pengajuan', 'Hanya 1 proses taaruf dalam satu waktu untuk akhwat.', 'error'); return; }
      if (user.gender === 'ikhwan') {
        if (targetCv.poligami === 'Tidak Bersedia') { showAlert('Pengajuan Ditolak', 'Kandidat tidak bersedia poligami dan Anda masih memiliki proses aktif.', 'error'); return; }
        const existingAntiPoligami = activeRequests.some(req => { const cv = cvs.find(c => c.id === req.targetCvId); return cv && cv.poligami === 'Tidak Bersedia'; });
        if (existingAntiPoligami) { showAlert('Pengajuan Ditolak', 'Proses aktif Anda berstatus "Tidak Bersedia" poligami.', 'error'); return; }
      }
    }
    try {
      const { data, error } = await supabase.from('taaruf_requests').insert({ sender_id: user.id, target_cv_id: targetCv.id, target_user_id: targetCv.user_id, status: 'pending_target' }).select('*, sender:sender_id(email, name), target:target_cv_id(*), target_user:target_user_id(email, name)').single();
      if (error) { showAlert('Error', 'Gagal melakukan pengajuan.', 'error'); return; }
      setTaarufRequests([...taarufRequests, { id: data.id, senderEmail: data.sender.email, senderAlias: data.sender.name, targetCvId: data.target_cv_id, targetAlias: data.target.alias, targetEmail: data.target_user?.email, status: data.status, updatedAt: data.updated_at }]);
      showAlert('Berhasil', 'Pengajuan berhasil! Pantau di tab Status Taaruf.', 'success');
      await addNotification(`Pengajuan taaruf kepada ${targetCv.alias} berhasil dikirim.`);
      await addNotification(`Seseorang baru saja mengajukan taaruf kepada Anda (Alias CV: ${targetCv.alias}). Mohon cek tab Status Taaruf.`, targetCv.user_id);
      setActiveTab('status');
    } catch (err) { 
      console.error('Error Ajukan Taaruf:', err);
      showAlert('Error', 'Kesalahan sistem saat mengajukan taaruf.', 'error'); 
    }
  };

  // ── Filters ──
  const applyFilters = (cvList) => cvList.filter(cv => {
    if (cv.status !== 'approved' || cv.user_id === user.id) return false;
    
    // Gender check
    if (user.gender === 'ikhwan' && cv.gender !== 'akhwat') return false;
    if (user.gender === 'akhwat' && cv.gender !== 'ikhwan') return false;
    
    // Search Query (Alias or Location)
    if (searchQuery && !cv.alias?.toLowerCase().includes(searchQuery.toLowerCase()) && !cv.location?.toLowerCase().includes(searchQuery.toLowerCase())) return false;

    // Province/City check
    if (filters.province && !cv.location?.toLowerCase().includes(filters.province.toLowerCase())) return false;
    if (filters.city && !cv.location?.toLowerCase().includes(filters.city.toLowerCase())) return false;
    
    if (filters.suku && !cv.suku?.toLowerCase().includes(filters.suku.toLowerCase())) return false;
    if (filters.hobi && !cv.hobi?.toLowerCase().includes(filters.hobi.toLowerCase())) return false;
    if (filters.poligami !== 'Semua' && cv.poligami !== filters.poligami && cv.poligami !== 'Semua') return false;
    return true;
  });
  const filteredCvs = applyFilters(cvs);

  // ── Home Tab Stats ──
  const hour = new Date().getHours();
  const greeting = hour < 11 ? 'Selamat Pagi' : hour < 15 ? 'Selamat Siang' : hour < 18 ? 'Selamat Sore' : 'Selamat Malam';
  const greetingEmoji = hour < 11 ? '🌅' : hour < 15 ? '☀️' : hour < 18 ? '🌤️' : '🌙';
  const candidateCount = cvs.filter(cv => cv.status === 'approved' && cv.user_id !== user.id).length;
  const myActiveRequests = taarufRequests.filter(r => r.senderEmail === user.email).length;
  const checks = [
    { label: 'Profil Dasar Dilengkapi', done: !!(user.name && user.email) },
    { label: 'CV Taaruf Dibuat', done: !!myExistingCv },
    { label: 'Materi Pembelajaran Dimulai', done: doneLessons > 0 },
    { label: 'Pengajuan Taaruf Pertama', done: myActiveRequests > 0 },
  ].filter(Boolean);
  const checksDone = checks.filter(c => c.done).length;
  const onboardingPct = Math.round((checksDone / checks.length) * 100);
  const quotes = [
    { text: 'Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu pasangan-pasangan dari jenismu sendiri, supaya kamu cenderung dan merasa tenteram kepadanya.', source: 'QS. Ar-Rum: 21' },
    { text: 'Barang siapa menikah maka ia telah menyempurnakan separuh agamanya, hendaklah ia bertakwa kepada Allah dalam separuh yang lainnya.', source: 'HR. Al-Baihaqi' },
    { text: 'Sebaik-baik pemuda adalah yang menikah muda, menjaga pandangan dan memelihara kehormatan.', source: 'HR. Ibnu Majah' },
  ];
  const todayQuote = quotes[new Date().getDate() % quotes.length];

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>

      {/* ══ HOME TAB ══ */}
      {activeTab === 'home' && (
        <div style={{ animation: 'fadeIn 0.5s ease' }}>
          {/* Greeting Hero */}
          <div className="greeting-hero" style={{ background: 'linear-gradient(135deg, #1a4d35 0%, #2C5F4D 50%, #1e6b4f 100%)', borderRadius: '24px', padding: '2rem 2.5rem', marginBottom: '1.75rem', position: 'relative', overflow: 'hidden', color: 'white' }}>
            <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
            <div style={{ position: 'absolute', top: '16px', right: '20px', fontSize: '4rem', opacity: 0.18, lineHeight: 1 }}>🕌</div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.55)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>Dashboard Taaruf Anda</div>
              <h1 style={{ fontSize: '2rem', fontWeight: '900', margin: '0 0 0.5rem', color: 'white', letterSpacing: '-0.03em' }}>
                {greetingEmoji} {greeting}, {user.name.split(' ')[0]}!
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: '0.93rem', margin: '0 0 1.5rem', maxWidth: '520px', lineHeight: '1.65' }}>
                Semoga Allah memudahkan perjalanan Anda menuju pernikahan yang berkah dan <em>sakinah mawaddah warahmah</em>.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {!myExistingCv && (
                  <button onClick={() => setActiveTab('my_cv')} style={{ background: '#D4AF37', color: '#1a1a1a', border: 'none', borderRadius: '12px', padding: '0.65rem 1.35rem', fontWeight: '800', fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <FileText size={16} /> Buat CV Taaruf
                  </button>
                )}
                <button onClick={() => setActiveTab('find')} style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.22)', borderRadius: '12px', padding: '0.65rem 1.35rem', fontWeight: '600', fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', backdropFilter: 'blur(8px)' }}>
                  <Search size={16} /> Cari Kandidat
                </button>
              </div>
            </div>
          </div>

          {/* Quote */}
          <div style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.07), rgba(212,175,55,0.03))', border: '1px solid rgba(212,175,55,0.18)', borderRadius: '16px', padding: '1.25rem 1.75rem', marginBottom: '1.75rem', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <div style={{ fontSize: '1.8rem', flexShrink: 0 }}>📖</div>
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: '800', color: '#b8962e', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>✨ Renungan Hari Ini</div>
              <p style={{ color: 'var(--text-main)', fontSize: '0.88rem', lineHeight: '1.75', margin: '0 0 0.4rem', fontStyle: 'italic' }}>"{todayQuote.text}"</p>
              <span style={{ fontSize: '0.76rem', fontWeight: '700', color: '#b8962e' }}>— {todayQuote.source}</span>
            </div>
          </div>

          {/* Stats */}
          <div className="dashboard-grid" style={{ marginBottom: '1.75rem' }}>
            {[
              { label: 'Kandidat Tersedia', value: candidateCount, color: 'var(--primary)', hex: '#2C5F4D', icon: <Users size={20} />, sub: 'profil aktif', onClick: () => setActiveTab('find') },
              { label: 'Proses Taaruf', value: myActiveRequests, color: '#e11d48', hex: '#e11d48', icon: <Heart size={20} />, sub: 'pengajuan', onClick: () => setActiveTab('status') },
              { label: 'Progres Belajar', value: `${progressPercent}%`, color: '#8b5cf6', hex: '#8b5cf6', icon: <BookOpen size={20} />, sub: `${doneLessons}/${totalLessons} materi`, onClick: () => setActiveTab('materi') },
              { label: 'Status CV', value: myExistingCv ? 'Aktif' : 'Belum', color: myExistingCv ? '#22c55e' : '#E63946', hex: myExistingCv ? '#22c55e' : '#E63946', icon: <FileText size={20} />, sub: myExistingCv ? 'dipublikasikan' : 'buat sekarang', onClick: () => setActiveTab('my_cv') },
            ].map((stat, i) => (
              <div key={i} onClick={stat.onClick} className="card" style={{ padding: '1.25rem', cursor: 'pointer', textAlign: 'center' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${stat.hex}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem', color: stat.color }}>{stat.icon}</div>
                <div style={{ fontSize: '1.65rem', fontWeight: '900', color: stat.color, lineHeight: 1, marginBottom: '0.2rem' }}>{stat.value}</div>
                <div style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.12rem' }}>{stat.label}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{stat.sub}</div>
              </div>
            ))}
          </div>

          {/* Cards Grid */}
          <div className="dashboard-grid" style={{ marginBottom: '1.75rem' }}>
            {/* Onboarding */}
            <div className="card" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '1rem' }}>Checklist Onboarding</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{checksDone} dari {checks.length} selesai</div>
                </div>
                <div style={{ width: '56px', height: '56px', position: 'relative', flexShrink: 0 }}>
                  <ResponsiveContainer width={56} height={56} minWidth={0} minHeight={0}>
                    <RadialBarChart cx="50%" cy="50%" innerRadius="65%" outerRadius="100%" startAngle={90} endAngle={-270} data={[{ value: onboardingPct, fill: 'var(--primary)' }]}>
                      <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                      <RadialBar background={{ fill: 'rgba(44,95,77,0.08)' }} dataKey="value" cornerRadius={10} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem', fontWeight: '900', color: 'var(--primary)' }}>{onboardingPct}%</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {checks.map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.875rem', borderRadius: '10px', background: c.done ? 'rgba(34,197,94,0.05)' : 'rgba(44,95,77,0.03)', border: `1px solid ${c.done ? 'rgba(34,197,94,0.15)' : 'var(--border)'}` }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: c.done ? '#22c55e' : 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {c.done ? <CheckCircle size={12} color="white" strokeWidth={3} /> : <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-muted)' }} />}
                    </div>
                    <span style={{ fontSize: '0.84rem', fontWeight: c.done ? '600' : '500', color: c.done ? 'var(--text-main)' : 'var(--text-muted)', flex: 1 }}>{c.label}</span>
                    {c.done && <CheckCircle size={14} color="#22c55e" />}
                  </div>
                ))}
              </div>
            </div>

            {/* Learning Progress */}
            <div className="card" style={{ padding: '1.75rem' }}>
              <div style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '0.15rem' }}>Progres Pembelajaran</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Materi pra-nikah yang telah diselesaikan</div>
              <div style={{ width: '100%', height: '140px', marginBottom: '0.5rem' }}>
                <ResponsiveContainer width="100%" height={140} minWidth={0} minHeight={0}>
                  <RadialBarChart cx="50%" cy="100%" innerRadius="55%" outerRadius="90%" startAngle={180} endAngle={0} data={[{ name: 'Sisa', value: 100, fill: 'rgba(139,92,246,0.1)' }, { name: 'Selesai', value: progressPercent || 1, fill: '#8b5cf6' }]}>
                    <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                    <RadialBar background dataKey="value" cornerRadius={8} />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '2.25rem', fontWeight: '900', color: '#8b5cf6', lineHeight: 1 }}>{progressPercent}%</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{doneLessons} selesai · {totalLessons - doneLessons} tersisa</div>
              </div>
              {curriculum.map(mod => {
                const modDone = mod.items.filter(i => i.done).length;
                const modPct = Math.round((modDone / mod.items.length) * 100);
                return (
                  <div key={mod.id} style={{ marginBottom: '0.65rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', marginBottom: '0.28rem' }}>
                      <span style={{ fontWeight: '600' }}>{mod.title.replace(/Modul \d+: /, '')}</span>
                      <span style={{ color: '#8b5cf6', fontWeight: '700' }}>{modPct}%</span>
                    </div>
                    <div style={{ height: '6px', borderRadius: '99px', background: 'rgba(139,92,246,0.1)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${modPct}%`, borderRadius: '99px', background: 'linear-gradient(90deg, #8b5cf6, #a78bfa)', transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                );
              })}
              <button onClick={() => setActiveTab('materi')} className="btn btn-outline" style={{ width: '100%', marginTop: '1rem', color: '#8b5cf6', borderColor: '#8b5cf6', fontSize: '0.875rem' }}>
                Lanjut Belajar →
              </button>
            </div>
          </div>

          {/* Quick Access */}
          <div className="card" style={{ padding: '1.5rem 1.75rem' }}>
            <div style={{ fontWeight: '700', fontSize: '0.95rem', marginBottom: '1rem' }}>⚡ Akses Cepat</div>
          <div className="auto-grid">
              {[
                { label: 'Buat / Edit CV', tab: 'my_cv', icon: '📄' },
                { label: 'Cari Kandidat', tab: 'find', icon: '🔍' },
                { label: 'Status Taaruf', tab: 'status', icon: '📊' },
                { label: 'Materi Belajar', tab: 'materi', icon: '📚' },
                { label: 'Profil & Akun', tab: 'account', icon: '⚙️' },
              ].map((link, i) => (
                <button key={i} onClick={() => setActiveTab(link.tab)}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', padding: '0.9rem 0.5rem', borderRadius: '12px', background: 'var(--bg-light)', border: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.2s ease', fontSize: '1.4rem' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(44,95,77,0.07)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-light)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <span>{link.icon}</span>
                  <span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-main)' }}>{link.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ MY CV TAB ══ */}
      {activeTab === 'my_cv' && (
        <div className="card card-no-hover" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div className="card-header" style={{ marginBottom: '2rem' }}>
            <h3 className="card-title">Pembuatan CV Taaruf</h3>
          </div>
          {hasSubmittedCv ? (
            <div className="card-body">
              <div style={{ textAlign: 'left', animation: 'fadeIn 0.3s ease' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <h3 style={{ margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CheckCircle color="var(--success)" size={24} /> CV Anda Aktif & Terpublish
                    </h3>
                    <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0 0', fontSize: '0.9rem' }}>Kandidat lain sudah bisa melihat profil Anda.</p>
                  </div>
                  <button className="btn btn-primary" onClick={() => {
                    setMyCv({ alias: myExistingCv.alias || '', gender: myExistingCv.gender || 'ikhwan', age: myExistingCv.age || '', location: myExistingCv.location || '', education: myExistingCv.education || '', job: myExistingCv.job || '', worship: myExistingCv.worship || '', about: myExistingCv.about || '', criteria: myExistingCv.criteria || '', suku: myExistingCv.suku || '', hobi: myExistingCv.hobi || '', poligami: myExistingCv.poligami || 'Tidak Bersedia', salary: myExistingCv.salary || '', address: myExistingCv.address || '', marital_status: myExistingCv.marital_status || 'Lajang', tinggi_berat: myExistingCv.tinggi_berat || '', kesehatan: myExistingCv.kesehatan || '', kajian: myExistingCv.kajian || '', karakter: myExistingCv.karakter || '' });
                    setCvStep(1); setIsEditingCv(true);
                  }}>
                    <FileText size={18} style={{ marginRight: '0.5rem' }} /> Edit Data CV
                  </button>
                </div>
                <div style={{ background: 'rgba(44,95,77,0.03)', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem', border: '1px solid rgba(44,95,77,0.08)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><User size={18} color="var(--primary)" /> <span><strong>Alias:</strong> {myExistingCv.alias}</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><UserCheck size={18} color="var(--primary)" /> <span><strong>Usia:</strong> {myExistingCv.age} Tahun</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><MapPin size={18} color="var(--primary)" /> <span><strong>Lokasi:</strong> {myExistingCv.location}</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Briefcase size={18} color="var(--primary)" /> <span><strong>Pekerjaan:</strong> {myExistingCv.job || '-'}</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><GraduationCap size={18} color="var(--primary)" /> <span><strong>Pendidikan:</strong> {myExistingCv.education}</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Heart size={18} color="var(--primary)" /> <span><strong>Status:</strong> {myExistingCv.marital_status}</span></div>
                  </div>
                </div>
                <div style={{ padding: '1.5rem', border: '1px solid var(--border)', borderRadius: '12px' }}>
                  <h4 style={{ marginBottom: '0.5rem', color: 'var(--primary)' }}>Visi Pernikahan</h4>
                  <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>{myExistingCv.about || 'Belum diisi.'}</p>
                  <h4 style={{ marginBottom: '0.5rem', color: 'var(--primary)', marginTop: '1.5rem' }}>Kriteria Pasangan</h4>
                  <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>{myExistingCv.criteria || 'Belum diisi.'}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="cv-form-container">
              {cvStep < 7 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', borderBottom: '2px solid var(--border)', paddingBottom: '1rem' }}>
                  {[1,2,3,4,5,6].map(step => (
                    <div key={step} style={{ width: '30px', height: '30px', borderRadius: '50%', background: cvStep >= step ? 'var(--primary)' : 'var(--border)', color: cvStep >= step ? 'white' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{step}</div>
                  ))}
                </div>
              )}
              {cvStep === 1 && (<div className="animation-fade"><h4 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>1. Data Pribadi</h4><div className="form-group"><label className="form-label">Nama Alias / Samaran</label><input type="text" className="form-control" value={myCv.alias} onChange={e => setMyCv({...myCv, alias: e.target.value})} /><small style={{color: 'var(--primary)', marginTop: '0.2rem', display: 'block'}}>*Gunakan nama samaran (contoh: Ikhwan 01, Hamba Allah)</small></div><div className="dashboard-grid" style={{ marginTop: 0, gap: '1rem' }}><div className="form-group"><label className="form-label">Usia</label><input type="number" className="form-control" required value={myCv.age} onChange={e => setMyCv({...myCv, age: e.target.value})} /></div><div className="form-group"><label className="form-label">Jenis Kelamin</label><select className="form-control" value={myCv.gender} disabled><option value="ikhwan">Ikhwan (Pria)</option><option value="akhwat">Akhwat (Wanita)</option></select></div></div><div className="dashboard-grid" style={{ marginTop: '1rem', gap: '1rem' }}><div className="form-group"><label className="form-label">Tinggi / Berat Badan</label><input type="text" className="form-control" value={myCv.tinggi_berat} onChange={e => setMyCv({...myCv, tinggi_berat: e.target.value})} placeholder="Contoh: 170cm / 65kg" /></div><div className="form-group"><label className="form-label">Kondisi Kesehatan</label><input type="text" className="form-control" value={myCv.kesehatan} onChange={e => setMyCv({...myCv, kesehatan: e.target.value})} placeholder="Contoh: Sehat walafiat..." /></div></div><div className="form-group"><label className="form-label">Suku Bangsa</label><input type="text" className="form-control" value={myCv.suku} onChange={e => setMyCv({...myCv, suku: e.target.value})} placeholder="Contoh: Jawa, Sunda..." /></div></div>)}
              {cvStep === 2 && (<div className="animation-fade"><h4 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>2. Pekerjaan & Gaji</h4><div className="form-group"><label className="form-label">Pekerjaan Saat Ini</label><input type="text" className="form-control" required value={myCv.job} onChange={e => setMyCv({...myCv, job: e.target.value})} placeholder="Contoh: Guru, Software Engineer..." /></div><div className="form-group"><label className="form-label">Gaji / Penghasilan per Bulan (Opsional)</label><select className="form-control" value={myCv.salary} onChange={e => setMyCv({...myCv, salary: e.target.value})}><option value="">Rahasia / Tidak Ingin Menjawab</option><option value="< 3 Juta">Kurang dari Rp 3 Juta</option><option value="3 - 5 Juta">Rp 3 - 5 Juta</option><option value="5 - 10 Juta">Rp 5 - 10 Juta</option><option value="> 10 Juta">Lebih dari Rp 10 Juta</option></select></div></div>)}
              {cvStep === 3 && (<div className="animation-fade"><h4 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>3. Alamat Domisili</h4><div className="form-group"><label className="form-label">Domisili Kota</label><input type="text" className="form-control" required value={myCv.location} onChange={e => setMyCv({...myCv, location: e.target.value})} placeholder="Contoh: Jakarta Selatan" /></div><div className="form-group"><label className="form-label">Alamat Lengkap (Disembunyikan dari Publik)</label><textarea className="form-control" rows="2" value={myCv.address} onChange={e => setMyCv({...myCv, address: e.target.value})} placeholder="Jalan, RT/RW, Kelurahan..."></textarea></div></div>)}
              {cvStep === 4 && (<div className="animation-fade"><h4 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>4. Status Pernikahan & Pendidikan</h4><div className="form-group"><label className="form-label">Status Pernikahan</label><select className="form-control" required value={myCv.marital_status} onChange={e => setMyCv({...myCv, marital_status: e.target.value})}><option value="Lajang">Lajang (Belum Pernah Menikah)</option><option value="Duda/Janda">Duda / Janda</option></select></div><div className="form-group"><label className="form-label">Pendidikan Terakhir</label><select className="form-control" required value={myCv.education} onChange={e => setMyCv({...myCv, education: e.target.value})}><option value="">Pilih Pendidikan...</option><option value="SMA/SMK">SMA / SMK Sederajat</option><option value="D3">Diploma (D3)</option><option value="S1">Sarjana (S1)</option><option value="S2/S3">Pascasarjana (S2/S3)</option></select></div></div>)}
              {cvStep === 5 && (<div className="animation-fade"><h4 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>5. Informasi Keagamaan</h4><div className="form-group"><label className="form-label">Kebiasaan Ibadah</label><textarea className="form-control" rows="3" required value={myCv.worship} onChange={e => setMyCv({...myCv, worship: e.target.value})} placeholder="Contoh: Shalat fardhu jamaah di masjid, tilawah 1 juz/hari..."></textarea></div><div className="form-group"><label className="form-label">Visi Poligami</label><select className="form-control" value={myCv.poligami} onChange={e => setMyCv({...myCv, poligami: e.target.value})}><option value="Tidak Bersedia">Tidak Bersedia</option><option value="Mungkin">Mungkin</option><option value="Bersedia">Bersedia</option><option value="Semua">Semua (Bebas)</option></select></div><div className="form-group"><label className="form-label">Rujukan Kajian / Ustadz Favorit</label><textarea className="form-control" rows="2" value={myCv.kajian} onChange={e => setMyCv({...myCv, kajian: e.target.value})} placeholder="Contoh: Kajian rutin masjid X..."></textarea></div><div className="form-group"><label className="form-label">Visi Pernikahan</label><textarea className="form-control" rows="2" required value={myCv.about} onChange={e => setMyCv({...myCv, about: e.target.value})} placeholder="Tujuan dan harapan Anda dalam membangun rumah tangga..."></textarea></div></div>)}
              {cvStep === 6 && (<div className="animation-fade"><h4 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>6. Karakter & Informasi Tambahan</h4><div className="form-group"><label className="form-label">Kelebihan & Kekurangan Karakter Diri</label><textarea className="form-control" rows="3" value={myCv.karakter} onChange={e => setMyCv({...myCv, karakter: e.target.value})} placeholder="Sebutkan 3 sifat positif dan 3 hal yang perlu diperbaiki..."></textarea></div><div className="form-group"><label className="form-label">Hobi / Aktivitas Waktu Luang</label><input type="text" className="form-control" value={myCv.hobi} onChange={e => setMyCv({...myCv, hobi: e.target.value})} placeholder="Contoh: Membaca, Olahraga..." /></div><div className="form-group"><label className="form-label">Kriteria Pasangan yang Diharapkan</label><textarea className="form-control" rows="3" required value={myCv.criteria} onChange={e => setMyCv({...myCv, criteria: e.target.value})} placeholder="Syarat-syarat yang menjadi prioritas..."></textarea></div></div>)}
              {cvStep === 7 && (<div className="animation-fade empty-state"><CheckCircle size={64} color="var(--success)" style={{ display: 'block', margin: '0 auto 1rem' }} /><h3>Alhamdulillah, Proses Selesai</h3><p style={{ color: 'var(--text-muted)' }}>Data CV Anda berhasil disimpan dan langsung dipublish.</p><button type="button" className="btn btn-primary" style={{ marginTop: '1.5rem' }} onClick={() => { setIsEditingCv(false); setCvStep(1); }}>Lihat Status CV &rarr;</button></div>)}
              {cvStep < 7 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
                  {cvStep > 1 ? (<button type="button" className="btn btn-outline" onClick={() => setCvStep(cvStep - 1)}>Kembali</button>) : isEditingCv ? (<button type="button" className="btn btn-outline" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => setIsEditingCv(false)}>Batal Edit</button>) : <div></div>}
                  {cvStep < totalSteps ? (<button type="button" className="btn btn-primary" onClick={() => setCvStep(cvStep + 1)}>Selanjutnya</button>) : (<button type="button" className="btn btn-success" style={{ padding: '0.8rem 1.75rem' }} onClick={handleCvSubmit}>{isEditingCv ? 'Simpan Perubahan' : 'Kirim CV'}</button>)}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══ FIND TAB ══ */}
      {activeTab === 'find' && (
        <div style={{ animation: 'fadeIn 0.5s ease' }}>
          {!myExistingCv ? (
            <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem', borderTop: '4px solid var(--danger)', maxWidth: '600px', margin: '2rem auto' }}>
              <AlertCircle size={64} color="var(--danger)" style={{ margin: '0 auto 1.5rem', opacity: 0.8 }} />
              <h3 style={{ marginBottom: '1rem' }}>CV Belum Dibuat</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '2.5rem', lineHeight: '1.6' }}>Anda wajib melengkapi form CV Taaruf terlebih dahulu sebelum dapat melihat daftar kandidat.</p>
              <button className="btn btn-primary" onClick={() => setActiveTab('my_cv')} style={{ width: '100%', maxWidth: '300px' }}>Lengkapi CV Sekarang</button>
            </div>
          ) : viewingCv ? (
            <div className="cv-detail-view" style={{ animation: 'fadeIn 0.3s ease' }}>
              <button className="btn btn-outline" onClick={() => { if (viewingCv.user_id === user.id) { setViewingCv(null); setActiveTab('my_cv'); } else { setViewingCv(null); } }} style={{ marginBottom: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '8px', border: 'none', paddingLeft: 0 }}>
                &larr; {viewingCv.user_id === user.id ? 'Kembali ke CV Saya' : 'Kembali ke Daftar Pencarian'}
              </button>
              <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}><User size={32} /></div>
                    <div>
                      <h3 className="card-title" style={{ fontSize: '1.5rem', margin: 0 }}>{viewingCv.alias}</h3>
                      <span className={`badge ${viewingCv.gender === 'ikhwan' ? 'badge-info' : 'badge-warning'}`} style={{ textTransform: 'capitalize', marginTop: '0.3rem', display: 'inline-block' }}>{viewingCv.gender}</span>
                    </div>
                  </div>
                  <span className="badge badge-success">Terverifikasi Admin</span>
                </div>
                <h4 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>Informasi Dasar</h4>
                <div style={{ background: 'rgba(44,95,77,0.03)', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem', border: '1px solid rgba(44,95,77,0.08)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><User size={18} color="var(--primary)" /> <span><strong>Usia:</strong> {viewingCv.age} Thn ({viewingCv.marital_status || 'Lajang'})</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><MapPin size={18} color="var(--primary)" /> <span><strong>Domisili:</strong> {viewingCv.location}</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Briefcase size={18} color="var(--primary)" /> <span><strong>Pekerjaan:</strong> {viewingCv.job || '-'}</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><GraduationCap size={18} color="var(--primary)" /> <span><strong>Pendidikan:</strong> {viewingCv.education}</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Users size={18} color="var(--primary)" /> <span><strong>Suku:</strong> {viewingCv.suku || '-'}</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Heart size={18} color="var(--primary)" /> <span><strong>Poligami:</strong> {viewingCv.poligami}</span></div>
                  </div>
                </div>
                <h4 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>Detail Visi & Harapan</h4>
                <div style={{ marginBottom: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {viewingCv.worship && <div><h5 style={{ marginBottom: '0.4rem' }}>Kualitas Ibadah</h5><p style={{ color: 'var(--text-muted)', lineHeight: '1.6', padding: '1rem', background: '#f8fafc', borderRadius: '8px', borderLeft: '4px solid var(--primary-light)', margin: 0 }}>{viewingCv.worship}{viewingCv.kajian && <><br/><br/><strong>Rujukan:</strong><br/>{viewingCv.kajian}</>}</p></div>}
                  {viewingCv.about && <div><h5 style={{ marginBottom: '0.4rem' }}>Visi Pernikahan</h5><p style={{ color: 'var(--text-muted)', lineHeight: '1.6', padding: '1rem', background: '#f8fafc', borderRadius: '8px', borderLeft: '4px solid var(--primary-light)', margin: 0 }}>{viewingCv.about}</p></div>}
                  {viewingCv.criteria && <div><h5 style={{ marginBottom: '0.4rem' }}>Kriteria Pasangan</h5><p style={{ color: 'var(--text-muted)', lineHeight: '1.6', padding: '1rem', background: '#f8fafc', borderRadius: '8px', borderLeft: '4px solid var(--secondary)', margin: 0 }}>{viewingCv.criteria}</p></div>}
                </div>
                {viewingCv.user_id !== user.id && (
                  <button className="btn btn-primary" style={{ width: '100%', fontSize: '1.1rem', padding: '1rem' }} onClick={() => handleAjukanTaaruf(viewingCv)}>
                    <Send size={20} style={{ marginRight: '0.5rem' }} /> Bismillah, Ajukan Taaruf
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Search Bar */}
              <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Cari berdasarkan alias atau lokasi..." 
                  style={{ paddingLeft: '3rem', height: '50px', borderRadius: '12px', fontSize: '1rem' }}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="filter-panel" style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  {/* Provinsi Filter */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)' }}>PROVINSI</label>
                    <select 
                      className="form-control" 
                      value={filters.province} 
                      onChange={e => setFilters({ ...filters, province: e.target.value, city: '' })}
                      style={{ borderRadius: '8px' }}
                    >
                      <option value="">Semua Provinsi</option>
                      {Object.keys(INDONESIA_REGIONS).map(prov => <option key={prov} value={prov}>{prov}</option>)}
                    </select>
                  </div>

                  {/* Kota Filter (Dynamic) */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)' }}>KOTA / KABUPATEN</label>
                    <select 
                      className="form-control" 
                      value={filters.city} 
                      onChange={e => setFilters({ ...filters, city: e.target.value })}
                      disabled={!filters.province}
                      style={{ borderRadius: '8px' }}
                    >
                      <option value="">{filters.province ? 'Semua Kota' : 'Pilih Provinsi Dahulu'}</option>
                      {filters.province && INDONESIA_REGIONS[filters.province].map(city => <option key={city} value={city}>{city}</option>)}
                    </select>
                  </div>

                  {/* Suku Filter */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)' }}>SUKU BANGSA</label>
                    <select 
                      className="form-control" 
                      value={filters.suku} 
                      onChange={e => setFilters({ ...filters, suku: e.target.value })}
                      style={{ borderRadius: '8px' }}
                    >
                      <option value="">Semua Suku</option>
                      {['Jawa', 'Sunda', 'Batak', 'Minang', 'Betawi', 'Bugis', 'Melayu', 'Madura', 'Dayak'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  {/* Poligami Filter */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)' }}>VISI POLIGAMI</label>
                    <select 
                      className="form-control" 
                      value={filters.poligami} 
                      onChange={e => setFilters({ ...filters, poligami: e.target.value })}
                      style={{ borderRadius: '8px' }}
                    >
                      <option value="Semua">Semua</option>
                      <option value="Tidak Bersedia">Tidak Bersedia</option>
                      <option value="Mungkin">Mungkin</option>
                      <option value="Bersedia">Bersedia</option>
                    </select>
                  </div>
                </div>
                
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button 
                    onClick={() => { setFilters({ gender: 'Semua', province: '', city: '', suku: '', hobi: '', poligami: 'Semua' }); setSearchQuery(''); }}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer' }}
                  >
                    Reset Semua Filter
                  </button>
                  <div style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)' }}>
                    MENAMPILKAN {filteredCvs.length} KANDIDAT
                  </div>
                </div>
              </div>
              <div className="dashboard-grid" style={{ marginTop: '0' }}>
                {filteredCvs.length > 0 ? filteredCvs.map(cv => (
                  <div key={cv.id} className="card cv-item" style={{ display: 'block' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <h4 className="card-title" style={{ fontSize: '1.3rem', margin: 0 }}>{cv.alias}</h4>
                        <span className={`badge ${cv.gender === 'ikhwan' ? 'badge-info' : 'badge-warning'}`} style={{ textTransform: 'capitalize' }}>{cv.gender}</span>
                      </div>
                      <span className="badge badge-success">Terverifikasi</span>
                    </div>
                    <div style={{ background: 'rgba(44,95,77,0.03)', borderRadius: '12px', padding: '1.2rem', marginBottom: '1.5rem', border: '1px solid rgba(44,95,77,0.08)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', fontSize: '0.95rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><User size={16} color="var(--primary)" /> <span><strong>Usia:</strong> {cv.age} Thn</span></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MapPin size={16} color="var(--primary)" /> <span><strong>Domisili:</strong> {cv.location}</span></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Briefcase size={16} color="var(--primary)" /> <span><strong>Pekerjaan:</strong> {cv.job || '-'}</span></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><GraduationCap size={16} color="var(--primary)" /> <span><strong>Pendidikan:</strong> {cv.education}</span></div>
                      </div>
                    </div>
                    <button className="btn btn-outline" style={{ width: '100%', borderColor: 'var(--primary)', color: 'var(--primary)' }} onClick={() => setViewingCv(cv)}>
                      <Search size={18} style={{ marginRight: '0.5rem' }} /> Lihat Detail Profil
                    </button>
                  </div>
                )) : (
                  <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>
                    <Search size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
                    <h3>Tidak Ditemukan</h3>
                    <p style={{ color: 'var(--text-muted)' }}>Belum ada kandidat yang cocok dengan kriteria pencarian Anda.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ══ STATUS TAB ══ */}
      {activeTab === 'status' && (
        <div className="status-container" style={{ animation: 'fadeIn 0.5s ease' }}>
          {activeChatId ? (() => {
            const req = taarufRequests.find(r => r.id === activeChatId);
            const chatData = messages.find(m => m.taarufId === activeChatId);
            const isSender = req.senderEmail === user.email;
            const targetAlias = isSender ? req.targetAlias : req.senderAlias;
            const handleSendMessage = async (e) => {
              e.preventDefault();
              if (!chatInput.trim()) return;
              try {
                const { data, error } = await supabase.from('messages').insert({ taaruf_request_id: activeChatId, sender_id: user.id, text: chatInput }).select('*, sender:sender_id(email, name)').single();
                if (error) { showAlert('Gagal Kirim', error.message, 'error'); return; }
                const newMsg = { id: data.id, sender: data.sender.email, senderAlias: data.sender.name, text: data.text, timestamp: data.created_at };
                if (chatData) { setMessages(messages.map(m => m.taarufId === activeChatId ? { ...m, chats: [...m.chats, newMsg] } : m)); }
                else { setMessages([...messages, { taarufId: activeChatId, chats: [newMsg] }]); }
                setChatInput('');
              } catch (err) { showAlert('Gagal Sistem', err.message, 'error'); }
            };
            return (
              <div className="card card-no-hover" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="modal-header info" style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', flexDirection: 'row', justifyContent: 'space-between', background: 'var(--bg-light)' }}>
                  <div style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', border: 'none' }} onClick={() => setActiveChatId(null)}>&larr; Kembali</button>
                    <div>
                      <h3 style={{ fontSize: '1.1rem' }}>Ruang Q&A dengan {targetAlias}</h3>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}><ShieldAlert size={14} style={{ position: 'relative', top: '2px' }} /> Percakapan diawasi oleh Ustadz</p>
                    </div>
                  </div>
                </div>
                <div className="chat-container" style={{ borderTop: 'none', borderRadius: '0 0 var(--radius-lg) var(--radius-lg)', boxShadow: 'none' }}>
                  <div className="chat-history">
                    {(!chatData || chatData.chats.length === 0) ? (
                      <div className="empty-state" style={{ padding: '2rem' }}><MessageCircle size={40} color="var(--border-color)" /><p style={{ marginTop: '1rem' }}>Sesi Q&A baru dimulai. Ucapkan salam dengan sopan.</p></div>
                    ) : chatData.chats.map(msg => {
                      const isMe = msg.sender === user.email;
                      const isAdmin = msg.sender.includes('admin');
                      return (
                        <div key={msg.id} className={`chat-bubble ${isAdmin ? 'admin' : (isMe ? 'right' : 'left')}`} style={isAdmin ? { alignSelf: 'center', background: 'var(--surface)', border: '1px solid var(--secondary)', textAlign: 'center' } : {}}>
                          <span className="chat-sender-name" style={isAdmin ? { color: 'var(--secondary)' } : {}}>{isAdmin ? 'Ustadz / Admin' : msg.senderAlias}</span>
                          {msg.text}
                          <span className="chat-meta">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      );
                    })}
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
              <h2 style={{ marginBottom: '1.5rem' }}>Status Pengajuan Taaruf Saya</h2>
              {taarufRequests.filter(req => req.senderEmail === user.email || (myExistingCv && req.targetCvId === myExistingCv.id)).length === 0 ? (
                <div className="card empty-state" style={{ maxWidth: '600px', margin: '0 auto' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(44,95,77,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                    <UserCheck size={40} color="var(--primary)" />
                  </div>
                  <h3>Belum Ada Pengajuan</h3>
                  <p style={{ color: 'var(--text-muted)' }}>Anda belum mengajukan taaruf ke kandidat manapun.</p>
                  <button className="btn btn-outline" style={{ marginTop: '1rem' }} onClick={() => setActiveTab('find')}>Cari Pasangan</button>
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
                  <div key={req.id} className="card" style={{ marginBottom: '1.5rem' }}>
                    <div className="card-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
                      <div>
                        <h3 className="card-title">{req.senderEmail === user.email ? `Pengajuan ke ${req.targetAlias}` : `Pengajuan dari ${req.senderAlias}`}</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Update: {new Date(req.updatedAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      </div>
                      {req.status === 'rejected' && <span className="badge badge-warning">Ditolak</span>}
                    </div>
                    <div className="stepper-container">
                      <div className="stepper">
                        {[['1', 'Tunggu\nCalon'], ['2', 'Review\nUstadz'], [<MessageCircle size={18} />, 'Fase Q&A'], [<Users size={18} />, 'Proses Wali'], ['5', 'Pertemuan'], [<CheckCircle size={18} />, 'Khitbah /\nNikah']].map((step, idx) => (
                          <div key={idx} className={`step ${getStepClass(idx)}`}>
                            <div className="step-icon">{step[0]}</div>
                            <span className="step-label">{step[1]}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="empty-state" style={{ background: 'var(--bg-light)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', marginTop: '1rem', textAlign: 'left' }}>
                      <h4 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Clock size={18} color="var(--primary)" /> Status Saat Ini:</h4>
                      {req.status === 'pending_target' && <p>{req.senderEmail === user.email ? 'Pengajuan Anda sedang dipertimbangkan oleh calon. Mohon doanya.' : 'Ada pengajuan masuk untuk Anda.'}</p>}
                      {req.status === 'pending_target' && req.senderEmail !== user.email && (
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                          <button className="btn btn-primary" onClick={async () => {
                            const { error } = await supabase.from('taaruf_requests').update({ status: 'pending_admin', updated_at: new Date().toISOString() }).eq('id', req.id);
                            if (!error) { 
                              setTaarufRequests(taarufRequests.map(r => r.id === req.id ? { ...r, status: 'pending_admin' } : r)); 
                              addNotification('Anda menyetujui pengajuan. Menunggu verifikasi Ustadz.'); 
                              addNotification(`Pengajuan taaruf Anda ke ${req.targetAlias} telah diterima.`, req.sender_id);
                            }
                          }}><CheckCircle size={18} /> Bismillah, Saya Setuju</button>
                          <button className="btn btn-outline" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={async () => {
                            const { error } = await supabase.from('taaruf_requests').update({ status: 'rejected', updated_at: new Date().toISOString() }).eq('id', req.id);
                            if (!error) { 
                              setTaarufRequests(taarufRequests.map(r => r.id === req.id ? { ...r, status: 'rejected' } : r)); 
                              addNotification('Anda menolak pengajuan.'); 
                              addNotification(`Pengajuan taaruf Anda ke ${req.targetAlias} telah ditolak.`, req.sender_id);
                            }
                          }}><XCircle size={18} /> Maaf, Kurang Cocok</button>
                        </div>
                      )}
                       {req.status === 'pending_admin' && <p>Kandidat telah setuju. Menunggu Ustadz memverifikasi dan membuka Ruang Q&A.</p>}
                      {req.status === 'qna' && <p>Alhamdulillah, sesi tanya jawab telah dibuka. Silakan masuk ke ruang Q&A untuk saling mengenal visi misi.</p>}
                      
                      {req.status === 'wali_process' && (
                        <div>
                          <p>Alhamdulillah, sesi Q&A selesai dan admin telah menyetujui tahap selanjutnya.</p>
                          {user.gender === 'ikhwan' ? (
                            <div style={{ marginTop: '1rem', padding: '1rem', background: 'white', borderRadius: '8px', border: '1px solid #fbbf24' }}>
                              <h5 style={{ color: '#92400e', marginBottom: '0.5rem' }}>Instruksi Hubungi Wali:</h5>
                              <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>Silakan hubungi Wali/Bapak dari <strong>{req.senderEmail === user.email ? req.targetAlias : req.senderAlias}</strong> untuk menjadwalkan pertemuan (Nadzhor).</p>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#fef3c7', padding: '0.75rem', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.1rem', justifyContent: 'center' }}>
                                📞 {req.senderEmail === user.email ? req.targetWaliPhone : req.senderWaliPhone}
                              </div>
                              <a 
                                href={`https://wa.me/${(req.senderEmail === user.email ? req.targetWaliPhone : req.senderWaliPhone)?.replace(/\D/g,'')}`} 
                                target="_blank" 
                                rel="noreferrer"
                                className="btn btn-primary" 
                                style={{ width: '100%', marginTop: '0.75rem', textDecoration: 'none', textAlign: 'center', display: 'block', background: '#25D366', borderColor: '#25D366' }}
                              >
                                Hubungi via WhatsApp
                              </a>
                            </div>
                          ) : (
                            <p style={{ color: 'var(--primary)', fontWeight: '600' }}>Menunggu pihak Ikhwan menghubungi Wali Anda. Mohon bersabar dan perbanyak doa.</p>
                          )}
                        </div>
                      )}

                      {req.status === 'meet' && (
                        <div>
                          <p>Tahap Nadzhor / Pertemuan Tatap Muka. Semoga Allah memberikan ketetapan terbaik bagi kedua belah pihak.</p>
                          <p style={{ fontSize: '0.85rem', marginTop: '0.5rem', fontStyle: 'italic' }}>Informasikan kepada Admin/Ustadz jika sudah ada keputusan (Lanjut Khithbah atau Tidak).</p>
                        </div>
                      )}

                      {req.status === 'completed' && (
                        <div style={{ textAlign: 'center', padding: '1rem' }}>
                          <Heart size={32} color="var(--danger)" style={{ marginBottom: '0.5rem' }} />
                          <h4 style={{ color: 'var(--success)' }}>Barakallahu lakuma!</h4>
                          <p>Proses taaruf telah selesai dengan keberhasilan (Khithbah/Nikah). Semoga menjadi keluarga sakinah mawaddah warahmah.</p>
                        </div>
                      )}

                      {req.status === 'rejected' && <p>Mohon maaf, proses ini tidak dapat dilanjutkan. Tetap semangat menjemput jodoh!</p>}
                      
                      {req.status === 'qna' && (
                        <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setActiveChatId(req.id)}>
                          <MessageCircle size={18} style={{ marginRight: '0.5rem' }} /> Masuk Sesi Q&A
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
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '1rem', color: 'var(--primary)' }}>
            <div style={{ width: 40, height: 40, border: '4px solid rgba(44,95,77,0.15)', borderTop: '4px solid var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Memuat kurikulum...</p>
          </div>
        ) : (
          <LearningTab
            user={user}
            classes={classes}
            activeClass={activeClass}
            selectClass={selectClassForPlayer}
            curriculum={curriculum}
            setCurriculum={setCurriculum}
            activeLesson={activeLesson}
            setActiveLesson={setActiveLesson}
            lmsView={lmsView}
            setLmsView={setLmsView}
            quizAnswers={quizAnswers}
            setQuizAnswers={setQuizAnswers}
            quizSubmitted={quizSubmitted}
            setQuizSubmitted={setQuizSubmitted}
            progressPercent={progressPercent}
            doneLessons={doneLessons}
            totalLessons={totalLessons}
            allDone={allDone}
            markLessonDone={markLessonDone}
            toggleModule={toggleModule}
            setActiveTab={setActiveTab}
          />
        )
      )}

      {/* ══ CERTIFICATE TAB ══ */}
      {activeTab === 'certificate' && (
        <CertificateTab user={user} activeClass={activeClass} />
      )}
    </div>
  );
}
