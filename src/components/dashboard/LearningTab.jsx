import React, { useState } from 'react';
import {
  CheckCircle, PlayCircle, ChevronDown, ChevronRight, ChevronLeft,
  Award, BookOpen, BarChart2, GraduationCap, Lock, ArrowRight,
  Search, ShieldCheck, Zap, Menu, X, Clock, AlertCircle, Users, FileText,
  Maximize2, Minimize2
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

export default function LearningTab({
  user, classes, activeClass, selectClass,
  curriculum, activeLesson, setActiveLesson,
  lmsView, setLmsView, quizAnswers, setQuizAnswers,
  quizSubmitted, setQuizSubmitted, progressPercent,
  doneLessons, totalLessons, allDone, markLessonDone,
  toggleModule, setActiveTab, enrollClass, selectClassForPlayer
}) {
  const [isLmsSidebarOpen, setIsLmsSidebarOpen] = useState(false);
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [pendingLesson, setPendingLesson] = useState(null);
  const [timeLeft, setTimeLeft] = useState(600); // 10 menit default

  React.useEffect(() => {
    let timer;
    if (quizStarted && !quizSubmitted && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && !quizSubmitted && quizStarted) {
      setQuizSubmitted(true);
    }
    return () => clearInterval(timer);
  }, [quizStarted, quizSubmitted, timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const [quizAttempts, setQuizAttempts] = useState(() => {
    const saved = localStorage.getItem(`quiz_history_${user?.id}_${activeLesson?.id}`);
    return saved ? JSON.parse(saved) : [];
  });

  React.useEffect(() => {
    const saved = localStorage.getItem(`quiz_history_${user?.id}_${activeLesson?.id}`);
    setQuizAttempts(saved ? JSON.parse(saved) : []);
  }, [activeLesson?.id, user?.id]);

  React.useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (quizStarted && !quizSubmitted) {
        e.preventDefault();
        e.returnValue = 'Kuis sedang berlangsung. Yakin ingin meninggalkan?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [quizStarted, quizSubmitted]);

  const allItems = curriculum.flatMap(m => m.items);
  const currentLessonIdx = allItems.findIndex(i => i.id === activeLesson?.id);

  const currentQuiz =
    activeLesson?.type === 'quiz'
      ? activeLesson.quizQuestions || []
      : [];

  const quizScore = quizSubmitted && currentQuiz.length > 0
    ? Math.round((currentQuiz.filter((q, i) => quizAnswers[i] === q.correctAnswer).length / currentQuiz.length) * 100)
    : 0;

  const quizPassed = quizScore >= 70;

  const resetQuiz = () => { 
    setQuizAnswers({}); 
    setQuizSubmitted(false); 
    setQuizStarted(false); 
    setTimeLeft(600);
  };

  const isLessonLocked = (item) => {
    const idx = allItems.findIndex(i => i.id === item.id);
    if (idx <= 0) return false;
    return !allItems[idx - 1].done;
  };

  const goToLesson = (item, force = false) => { 
    if (!force && isLessonLocked(item)) return;
    if (quizStarted && !quizSubmitted) {
      setPendingLesson(item);
      setShowLeaveModal(true);
      return;
    }
    setActiveLesson(item); 
    resetQuiz(); 
  };

  const confirmLeaveQuiz = () => {
    if (pendingLesson) {
      setActiveLesson(pendingLesson);
      setPendingLesson(null);
      resetQuiz();
    }
    setShowLeaveModal(false);
  };

  const goNext = () => {
    if (currentLessonIdx < allItems.length - 1)
      goToLesson(allItems[currentLessonIdx + 1], true);
  };

  const handleMarkDone = async () => {
    await markLessonDone(activeLesson.id, null);
    if (currentLessonIdx < allItems.length - 1) goNext();
  };

  const handleQuizPassed = async () => {
    // Save to history
    const newAttempt = {
      date: new Date().toISOString(),
      score: quizScore,
      passed: quizPassed
    };
    const updatedHistory = [newAttempt, ...quizAttempts].slice(0, 5); // Simpan 5 terakhir
    setQuizAttempts(updatedHistory);
    localStorage.setItem(`quiz_history_${user?.id}_${activeLesson?.id}`, JSON.stringify(updatedHistory));

    await markLessonDone(activeLesson.id, quizScore);
    if (currentLessonIdx < allItems.length - 1) goNext();
  };

  const handleQuizSubmit = () => {
    setQuizSubmitted(true);
    // Jika tidak lulus pun, kita simpan ke history
    if (quizScore < 70) {
      const newAttempt = {
        date: new Date().toISOString(),
        score: quizScore,
        passed: false
      };
      const updatedHistory = [newAttempt, ...quizAttempts].slice(0, 5);
      setQuizAttempts(updatedHistory);
      localStorage.setItem(`quiz_history_${user?.id}_${activeLesson?.id}`, JSON.stringify(updatedHistory));
    }
  };

  const handleCertificateDownload = async () => {
    if (activeLesson) {
      await markLessonDone(activeLesson.id, quizScore);
    }
    // Mencoba mengambil ID dari activeClass atau URL aslinya
    const classId = activeClass?.id || (window.location.pathname.split('/')[3]);
    setActiveTab(`certificate/${classId}`);
  };

  // ============================
  // VIEW: ACADEMY DASHBOARD
  // ============================
  if (lmsView === 'dashboard') {
    const totalClasses = classes.length;
    const completedClasses = classes.filter(cls => {
      const clsLessons = cls.modules.flatMap(m => m.items);
      return clsLessons.length > 0 && clsLessons.every(l => l.done);
    }).length;
    const totalAcademyLessons = classes.reduce((acc, cls) => acc + cls.modules.flatMap(m => m.items).length, 0);
    const completedAcademyLessons = classes.reduce((acc, cls) => acc + cls.modules.flatMap(m => m.items).filter(l => l.done).length, 0);

    return (
      <div style={{ animation: 'fadeIn 0.4s ease', padding: '1rem 0' }}>
          <div style={{ marginBottom: '2.5rem', position: 'relative' }}>
             <button 
               onClick={() => setActiveTab('home')} 
               style={{ 
                 background: 'white', border: '1px solid #e2e8f0', 
                 borderRadius: '12px', padding: '0.6rem 1rem', 
                 fontWeight: '700', color: '#64748b', cursor: 'pointer',
                 display: 'flex', alignItems: 'center', gap: '8px',
                 marginBottom: '1.5rem'
               }}
             >
               <ChevronLeft size={18} /> Kembali ke Beranda
             </button>
             <h2 style={{ fontSize: '1.75rem', fontWeight: '900', color: '#134E39', marginBottom: '0.5rem' }}>Dashboard Akademi</h2>
             <p style={{ color: '#64748b' }}>Pantau perkembangan ilmu Anda di Separuh Agama Academy.</p>
          </div>

          <div className="academy-analytics-section" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1.5rem', marginBottom: '3rem' }}>
             <div className="academy-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                {[
                  { label: 'Kelas Selesai', value: completedClasses, total: totalClasses, color: '#134E39', icon: <CheckCircle /> },
                  { label: 'Materi Dipelajari', value: completedAcademyLessons, total: totalAcademyLessons, color: '#D4AF37', icon: <PlayCircle /> },
                  { label: 'Sertifikat Didapat', value: completedClasses, total: totalClasses, color: '#0ea5e9', icon: <Award /> }
                ].map((stat, i) => (
                  <div key={i} style={{ background: 'white', padding: '1.5rem', borderRadius: '32px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `${stat.color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color }}>
                        {React.cloneElement(stat.icon, { size: 20 })}
                      </div>
                      <div style={{ fontSize: '0.65rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>Target: {stat.total}</div>
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: '900', color: '#134E39', lineHeight: 1, marginBottom: '0.4rem' }}>{stat.value}</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#64748b' }}>{stat.label}</div>
                  </div>
                ))}
             </div>

             <div className="card" style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem', background: 'white', borderRadius: '32px', border: '1px solid #f1f5f9' }}>
                <div style={{ width: '150px', height: '150px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={[
                          { name: 'Selesai', value: completedAcademyLessons, color: '#134E39' },
                          { name: 'Belum', value: totalAcademyLessons - completedAcademyLessons, color: '#f1f5f9' }
                        ]} 
                        innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value" stroke="none"
                      >
                        <Cell fill="#134E39" />
                        <Cell fill="#f1f5f9" />
                      </Pie>
                      <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontSize: '0.8rem' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div>
                   <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Total Progres Kurikulum</div>
                   <div style={{ fontSize: '1.75rem', fontWeight: '950', color: '#134E39', marginBottom: '8px' }}>
                     {totalAcademyLessons > 0 ? Math.round((completedAcademyLessons / totalAcademyLessons) * 100) : 0}%
                   </div>
                   <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>{completedAcademyLessons} dari {totalAcademyLessons} materi dikuasai</div>
                </div>
             </div>
          </div>

         <div style={{ background: 'white', borderRadius: '32px', padding: '2.5rem', border: '1px solid #f1f5f9' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#134E39', marginBottom: '2rem' }}>Status Kelas Anda</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {classes.filter(c => c.isEnrolled).length > 0 ? (
                classes.filter(c => c.isEnrolled).map(cls => {
                  const clsLessons = cls.modules.flatMap(m => m.items);
                  const clsDone = clsLessons.filter(l => l.done).length;
                  const clsTotal = clsLessons.length;
                  const pct = clsTotal > 0 ? Math.round((clsDone / clsTotal) * 100) : 0;
                  return (
                    <div key={cls.id} className="academy-class-card" style={{ display: 'flex', alignItems: 'center', gap: '2rem', padding: '1.5rem', borderRadius: '24px', background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                      <div style={{ width: '80px', height: '80px', borderRadius: '20px', overflow: 'hidden', flexShrink: 0 }}>
                        <img src={cls.banner_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=200&auto=format&fit=crop"} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '800', fontSize: '1.1rem', color: '#134E39', marginBottom: '0.5rem' }}>{cls.title}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ flex: 1, height: '8px', background: '#e2e8f0', borderRadius: '99px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: '#134E39', borderRadius: '99px', transition: 'width 0.5s' }} />
                          </div>
                          <span style={{ fontSize: '0.875rem', fontWeight: '800', color: '#134E39', minWidth: '45px' }}>{pct}%</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          if (pct === 100) setActiveTab(`certificate/${cls.id}`);
                          else selectClassForPlayer(cls);
                        }}
                        style={{ background: pct === 100 ? '#f0fdf4' : '#134E39', color: pct === 100 ? '#166534' : 'white', border: pct === 100 ? '1px solid #bbf7d0' : 'none', padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer' }}
                      >
                        {pct === 100 ? 'LIHAT SERTIFIKAT' : (pct > 0 ? 'LANJUTKAN' : 'MULAI BELAJAR')}
                      </button>
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem', background: '#f8fafc', borderRadius: '24px', border: '1px dashed #cbd5e1' }}>
                   <BookOpen size={48} color="#94a3b8" style={{ marginBottom: '1rem', opacity: 0.5 }} />
                   <p style={{ color: '#64748b', fontWeight: '700', margin: 0 }}>Anda belum mendaftar di kelas manapun.</p>
                   <button onClick={() => setLmsView('catalog')} style={{ marginTop: '1.5rem', background: '#134E39', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' }}>Cari Daftar Kelas Sekarang</button>
                </div>
              )}
            </div>
         </div>
      </div>
    );
  }

  // ============================
  // VIEW: WELCOME / INTRO
  // ============================
  if (lmsView === 'welcome') {
    return (
      <div className="academy-container" style={{ 
        animation: 'fadeInUp 0.6s ease', 
        padding: '3rem 0', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        textAlign: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ maxWidth: '800px' }}>
          <div style={{ 
            width: '80px', height: '80px', background: '#D4AF37', 
            borderRadius: '24px', display: 'flex', alignItems: 'center', 
            justifyContent: 'center', color: 'white', margin: '0 auto 2rem',
            boxShadow: '0 20px 40px rgba(212,175,55,0.3)'
          }}>
            <GraduationCap size={40} />
          </div>
          
          <h1 className="academy-welcome-title" style={{ fontWeight: '900', color: '#134E39', marginBottom: '1.5rem', letterSpacing: '-0.03em' }}>
            Selamat Datang di <br />
            <span style={{ color: '#D4AF37' }}>Separuh Agama Academy</span>
          </h1>
          
          <p style={{ fontSize: '1.25rem', color: '#64748b', lineHeight: 1.8, marginBottom: '3rem' }}>
            Bukan sekadar portal pencarian, Separuh Agama adalah tempat bagi Anda untuk bertumbuh. 
            Bekali niat suci Anda dengan ilmu syar'i tentang pernikahan dan rumah tangga 
            sebelum melangkah menuju ikatan yang abadi.
          </p>
          
          <div className="academy-features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '4rem', width: '100%' }}>
            {[
              { icon: <ShieldCheck size={28} />, title: 'Ilmu Syar\'i', desc: 'Kurikulum berdasarkan Al-Qur\'an & Sunnah' },
              { icon: <Users size={28} />, title: 'Adab Islami', desc: 'Panduan tata krama dalam proses taaruf' },
              { icon: <Award size={28} />, title: 'Sertifikasi', desc: 'Bukti keseriusan Anda dalam belajar' }
            ].map((feature, idx) => (
              <div key={idx} style={{ background: 'white', padding: '1.5rem', borderRadius: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9' }}>
                <div style={{ color: '#D4AF37', marginBottom: '1rem' }}>{feature.icon}</div>
                <div style={{ fontWeight: '800', color: '#134E39', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{feature.title}</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{feature.desc}</div>
              </div>
            ))}
          </div>
          
          <button 
            onClick={() => setLmsView('dashboard')}
            style={{ 
              background: '#134E39', color: 'white', border: 'none', 
              padding: '1.25rem 3.5rem', borderRadius: '18px', fontSize: '1.1rem', 
              fontWeight: '800', cursor: 'pointer', display: 'flex', 
              alignItems: 'center', gap: '12px', margin: '0 auto',
              boxShadow: '0 20px 40px rgba(19,78,57,0.2)',
              transition: 'all 0.3s'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            Mulai Belajar <ArrowRight size={20} />
          </button>
        </div>
      </div>
    );
  }

  // ============================
  // VIEW: CATALOG (DAFTAR KELAS)
  // ============================
  if (lmsView === 'catalog') {
    return (
      <div className="academy-container" style={{ animation: 'fadeIn 0.4s ease', padding: 'clamp(1rem, 5vw, 3rem) 0' }}>
        {/* Breadcrumb */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          marginBottom: '1.5rem', fontSize: '0.65rem',
          color: '#94a3b8', fontWeight: '800',
          textTransform: 'uppercase', letterSpacing: '0.08em'
        }}>
          <span style={{ cursor: 'pointer' }} onClick={() => setLmsView('welcome')}>ACADEMY HOME</span>
          <ChevronRight size={10} />
          <span>DAFTAR KELAS</span>
        </div>

        <div className="academy-banner" style={{
          marginBottom: '2rem',
          background: 'linear-gradient(135deg, #1a4d35 0%, #2C5F4D 50%, #1e6b4f 100%)',
          border: 'none', color: 'white', padding: 'clamp(1.5rem, 8vw, 3rem) clamp(1.25rem, 8vw, 3.5rem)',
          borderRadius: '1.5rem', overflow: 'hidden', position: 'relative',
          display: 'flex', flexDirection: 'column', justifyContent: 'center'
        }}>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="zap-tag" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              background: 'rgba(255,255,255,0.1)', padding: '0.3rem 0.75rem',
              borderRadius: '99px', fontSize: '0.65rem', fontWeight: '800',
              marginBottom: '1.5rem', letterSpacing: '0.05em', border: '1px solid rgba(255,255,255,0.2)'
            }}>
              <Zap size={14} fill="white" /> Separuh Agama Academy
            </div>
            
            <h2 className="banner-title" style={{ color: 'white', margin: '0 0 1rem', fontSize: '2.5rem', fontWeight: '900', letterSpacing: '-0.02em' }}>
              KURIKULUM <span style={{ color: '#D4AF37' }}>BELAJAR</span> TAARUF
            </h2>
            <p className="banner-desc" style={{ fontSize: '1.1rem', opacity: 0.9, fontWeight: '500', maxWidth: '600px' }}>
              Persiapkan mental, ilmu, dan iman Anda sebelum melangkah ke jenjang pernikahan yang suci.
            </p>
          </div>
          <div style={{ position: 'absolute', right: '5%', top: '50%', transform: 'translateY(-50%)', fontSize: '15rem', fontWeight: '900', opacity: 0.05, pointerEvents: 'none' }}>M</div>
        </div>

        {/* Classes Grid */}
        <div className="academy-class-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '2.5rem' }}>
          {classes.length === 0 && (
            <div className="card" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem' }}>
              <p style={{ color: 'var(--text-muted)' }}>Belum ada kelas yang tersedia saat ini.</p>
            </div>
          )}
          {classes.map(cls => {
            const clsLessonsCount = cls.modules.reduce((a, m) => a + m.items.length, 0);
            const clsDoneCount = cls.modules.reduce((a, m) => a + m.items.filter(i => i.done).length, 0);
            const isFinished = clsLessonsCount > 0 && clsLessonsCount === clsDoneCount;
            
            return (
              <div key={cls.id} className="card" style={{ padding: 0, borderRadius: '1.5rem', overflow: 'hidden', border: isFinished ? '2px solid #D4AF37' : '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', maxWidth: '420px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                <div style={{ position: 'relative', height: '240px', background: '#f1f5f9', overflow: 'hidden' }}>
                  <img 
                    src={cls.banner_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop"} 
                    alt={cls.title} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
                    className="class-banner"
                    onError={(e) => {
                      e.target.src = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop";
                    }}
                  />
                  {isFinished && (
                    <div style={{ position: 'absolute', top: '1rem', right: '1rem', background: '#D4AF37', color: 'white', padding: '0.4rem 0.8rem', borderRadius: '99px', fontSize: '0.65rem', fontWeight: '900', boxShadow: '0 4px 12px rgba(212,175,55,0.4)' }}>
                      SELESAI
                    </div>
                  )}
                </div>
                
                <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#0f172a', marginBottom: '0.5rem' }}>{cls.title}</h3>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1.5rem', lineHeight: '1.5', flex: 1 }}>
                    {cls.description || "Program pembelajaran intensif untuk persiapan taaruf dan pernikahan islami."}
                  </p>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><BookOpen size={14} /> {cls.modules.length} Modul</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Clock size={14} /> {clsLessonsCount} Materi</div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.6rem' }}>
                    {!cls.isEnrolled ? (
                      <button 
                        onClick={() => enrollClass(cls.id)}
                        style={{
                          flex: 1,
                          background: '#134E39', 
                          color: 'white', 
                          padding: '0.75rem',
                          borderRadius: '10px', fontSize: '0.75rem', fontWeight: '800',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                          border: 'none',
                          boxShadow: '0 10px 20px rgba(19, 78, 57, 0.15)'
                        }}
                      >
                        DAFTAR KELAS INI
                      </button>
                    ) : (
                      <button 
                        onClick={() => selectClassForPlayer(cls)}
                        style={{
                          flex: 1,
                          background: isFinished ? 'white' : '#2C5F4D', 
                          color: isFinished ? '#2C5F4D' : 'white', 
                          padding: '0.75rem',
                          borderRadius: '10px', fontSize: '0.75rem', fontWeight: '800',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                          border: isFinished ? '2px solid #2C5F4D' : 'none'
                        }}
                      >
                        <PlayCircle size={16} /> {isFinished ? 'ULANGI' : (clsDoneCount > 0 ? 'LANJUTKAN' : 'MULAI KELAS')}
                      </button>
                    )}
                    {isFinished && (
                      <button 
                        onClick={() => setActiveTab(`certificate/${cls.id}`)}
                        style={{
                          flex: 1,
                          background: '#D4AF37', 
                          color: 'white', 
                          padding: '0.75rem',
                          borderRadius: '10px', fontSize: '0.75rem', fontWeight: '800',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                          border: 'none',
                          boxShadow: '0 4px 12px rgba(212,175,55,0.2)'
                        }}
                      >
                        <Award size={16} /> SERTIFIKAT
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ============================
  // VIEW: PLAYER
  // ============================
  return (
    <div className="lms-player" style={{ height: '100%', display: 'flex', background: '#fff', position: 'relative', overflow: 'hidden' }}>
        {/* 📋 SIDEBAR 📋 */}
        {isLmsSidebarOpen && <div className="lms-overlay" onClick={() => setIsLmsSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 90 }}></div>}
        
        <div className={`lms-sidebar ${isLmsSidebarOpen ? 'open' : ''}`} style={{ 
          width: isSidebarHidden ? '0' : '320px', 
          display: isSidebarHidden ? 'none' : 'flex',
          flexDirection: 'column',
          borderRight: '1px solid #f1f5f9',
          background: 'white',
          transition: 'all 0.3s ease',
          zIndex: 100,
          height: '100%',
          overflow: 'hidden'
        }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid #f1f5f9' }}>
            <button onClick={() => setLmsView('catalog')} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', padding: 0, fontSize: '0.7rem', fontWeight: '800', color: '#94a3b8', cursor: 'pointer', marginBottom: '1.5rem', textTransform: 'uppercase' }}>
              <ChevronLeft size={14} /> Kembali
            </button>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '900', color: '#0f172a', marginBottom: '4px' }}>{activeClass?.title}</div>

            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.6rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>Progress</span>
                <span style={{ fontSize: '0.6rem', fontWeight: '800', color: '#134E39' }}>{progressPercent}%</span>
              </div>
              <div style={{ height: '4px', background: '#f1f5f9', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#134E39', width: `${progressPercent}%`, transition: 'width 0.4s ease' }} />
              </div>
            </div>
            
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 0' }}>
            {curriculum.map((mod, mi) => (
              <div key={mod.id} style={{ marginBottom: '0.5rem' }}>
                <div style={{ padding: '1rem 1.5rem 0.5rem', fontSize: '0.7rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  MODUL {mi + 1}: {mod.title}
                </div>
                {mod.items.map(item => {
                  const isActive = activeLesson?.id === item.id;
                  const isLocked = isLessonLocked(item);
                  return (
                    <div 
                      key={item.id} 
                      onClick={() => goToLesson(item)}
                      style={{ 
                        padding: '0.75rem 1.25rem', margin: '0.25rem 0.75rem', borderRadius: '12px',
                        display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: isLocked ? 'not-allowed' : 'pointer',
                        background: isActive ? '#134E39' : 'transparent',
                        color: isActive ? 'white' : (isLocked ? '#cbd5e1' : '#475569'),
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ 
                        width: 24, height: 24, borderRadius: '50%', 
                        background: isActive ? 'rgba(255,255,255,0.2)' : (item.done ? '#ecfdf5' : 'white'), 
                        border: `1.5px solid ${isActive ? 'white' : (item.done ? '#10b981' : '#e2e8f0')}`, 
                        color: isActive ? 'white' : (item.done ? '#10b981' : '#94a3b8'), 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
                      }}>
                        {item.done ? <CheckCircle size={14} /> : (isLocked ? <Lock size={12} /> : (item.type === 'quiz' ? <Zap size={12} /> : (item.type === 'text' ? <FileText size={12} /> : <PlayCircle size={12} />)))}
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.02em' }}>{item.title}</span>
                    </div>
                  );
                })}
              </div>
            ))}
        </div>
      </div>

      {/* 🎬 MAIN CONTENT 🎬 */}
      <div className="lms-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>
          {/* Top Bar */}
          <div style={{ height: '70px', background: 'white', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', padding: '0 2rem', justifyContent: 'space-between', flexShrink: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: '800', color: '#be185d', letterSpacing: '0.05em' }}>{activeClass?.title?.toUpperCase()}</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a' }}>{activeLesson?.title?.toUpperCase()}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {activeLesson?.done && (
                <div style={{ 
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '0.5rem 1rem', 
                  background: '#f0fdf4', color: '#10b981', border: '1px solid #dcfce7', 
                  borderRadius: '99px', fontSize: '0.7rem', fontWeight: '800'
                }}>
                  <CheckCircle size={14} /> SUDAH SELESAI
                </div>
              )}
              <button onClick={() => setIsSidebarHidden(!isSidebarHidden)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                {isSidebarHidden ? <Maximize2 size={20} /> : <Minimize2 size={20} />}
              </button>
            </div>
          </div>

          <div className="lms-player-content" style={{ flex: 1, overflowY: 'auto', padding: '3rem 2rem', background: '#fafafa' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
              {activeLesson ? (
                <>
                  {activeLesson.type !== 'quiz' && (
                    <>
                      {activeLesson.type === 'video' && (
                        <div style={{ 
                          background: '#000', aspectRatio: '16/9', width: '100%', 
                          borderRadius: '24px', boxShadow: '0 30px 60px rgba(0,0,0,0.25)',
                          position: 'relative', overflow: 'hidden', marginBottom: '2.5rem'
                        }}>
                          <iframe 
                            width="100%" height="100%" 
                            src={activeLesson.videoUrl || "https://www.youtube.com/embed/dQw4w9WgXcQ"} 
                            title={activeLesson.title} frameBorder="0" allowFullScreen style={{ border: 'none' }}
                          />
                        </div>
                      )}
                      <div style={{ padding: '0 1rem', marginBottom: '4rem', textAlign: 'left' }}>
                        <div className="prose" dangerouslySetInnerHTML={{ __html: activeLesson.content }} style={{ fontSize: '1.1rem', lineHeight: 1.8, color: '#1e293b', whiteSpace: 'pre-wrap' }} />
                      </div>
                    </>
                  )}

                  {activeLesson.type === 'quiz' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                      {quizSubmitted ? (
                        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'white', borderRadius: '2rem', border: '1px solid #f1f5f9' }}>
                           <div style={{ width: 80, height: 80, borderRadius: '24px', background: quizPassed ? '#ecfdf5' : '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
                             {quizPassed ? <Award size={40} color="#10b981" /> : <AlertCircle size={40} color="#ef4444" />}
                           </div>
                           <h2 style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a' }}>{quizPassed ? 'Mabruk! Anda Lulus' : 'Coba Lagi Yuk!'}</h2>
                           <div style={{ fontSize: '2.5rem', fontWeight: '900', color: quizPassed ? '#10b981' : '#ef4444', margin: '1.5rem 0' }}>{quizScore}%</div>
                           <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                              {!quizPassed && <button onClick={resetQuiz} style={{ background: '#0f172a', color: 'white', padding: '1rem 2.5rem', borderRadius: '12px', fontWeight: '800', border: 'none', cursor: 'pointer' }}>ULANGI KUIS</button>}
                              {quizPassed && <button onClick={handleQuizPassed} style={{ background: '#134E39', color: 'white', padding: '1rem 2.5rem', borderRadius: '12px', fontWeight: '800', border: 'none', cursor: 'pointer' }}>LANJUTKAN</button>}
                           </div>
                        </div>
                      ) : !quizStarted ? (
                        <div style={{ padding: '4rem', background: 'white', borderRadius: '2rem', textAlign: 'center', border: '1px solid #f1f5f9' }}>
                           <Clock size={48} color="#D4AF37" style={{ marginBottom: '1.5rem' }} />
                           <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#134E39', marginBottom: '1.5rem' }}>Instruksi Kuis</h3>
                           <p style={{ color: '#64748b', marginBottom: '2rem' }}>Selesaikan kuis ini dengan skor minimal 70% untuk melanjutkan materi berikutnya.</p>
                           <button onClick={() => setQuizStarted(true)} style={{ background: '#134E39', color: 'white', padding: '1rem 3rem', borderRadius: '12px', fontWeight: '800', border: 'none', cursor: 'pointer' }}>MULAI KUIS</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                          {currentQuiz.map((q, i) => (
                            <div key={i} style={{ background: 'white', padding: '2rem', borderRadius: '1.5rem', border: '1px solid #f1f5f9' }}>
                              <div style={{ fontWeight: '800', fontSize: '1.1rem', marginBottom: '1.5rem' }}>{i + 1}. {q.q}</div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {q.options.map((opt, oi) => (
                                  <button key={oi} onClick={() => setQuizAnswers(prev => ({ ...prev, [i]: oi }))} style={{ textAlign: 'left', padding: '1.25rem', borderRadius: '12px', border: `2px solid ${quizAnswers[i] === oi ? '#134E39' : '#f1f5f9'}`, background: quizAnswers[i] === oi ? '#f0fdf4' : 'white', cursor: 'pointer', transition: 'all 0.2s' }}>
                                    {String.fromCharCode(65 + oi)}. {opt}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                          <button onClick={handleQuizSubmit} style={{ background: '#134E39', color: 'white', padding: '1.25rem', borderRadius: '12px', fontWeight: '800', border: 'none', cursor: 'pointer', marginTop: '2rem' }}>SUBMIT JAWABAN</button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>Mohon pilih materi di sidebar.</div>
              )}
            </div>
          </div>

          {/* 🏁 STICKY FOOTER 🏁 */}
          <div style={{ height: '80px', background: 'white', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', padding: '0 2.5rem', justifyContent: 'space-between', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#94a3b8' }}>{progressPercent}% SELESAI</div>
              <div style={{ width: '150px', height: '6px', background: '#f1f5f9', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#134E39', width: `${progressPercent}%` }} />
              </div>
            </div>
            {activeLesson && activeLesson.type !== 'quiz' && (
              <button 
                onClick={handleMarkDone}
                disabled={activeLesson.done}
                style={{ 
                  background: activeLesson.done ? '#f1f5f9' : '#0f172a', 
                  color: activeLesson.done ? '#94a3b8' : 'white', 
                  padding: '1rem 2.5rem', borderRadius: '12px', 
                  fontWeight: '900', fontSize: '0.85rem', cursor: activeLesson.done ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: '12px', border: 'none'
                }}
              >
                {activeLesson.done ? 'SESI SELESAI' : 'SELESAIKAN & BERIKUTNYA'} <ArrowRight size={18} />
              </button>
            )}
          </div>
        </div>

      {showLeaveModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div style={{ background: 'white', borderRadius: '2rem', width: '100%', maxWidth: '450px', padding: '3rem', textAlign: 'center' }}>
             <AlertCircle size={48} color="#ef4444" style={{ marginBottom: '1.5rem' }} />
             <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1rem' }}>Keluar dari Kuis?</h3>
             <p style={{ color: '#64748b', marginBottom: '2.5rem' }}>Progres pengerjaan kuis Anda akan hilang jika keluar sekarang.</p>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button onClick={confirmLeaveQuiz} style={{ padding: '1rem', borderRadius: '12px', background: '#ef4444', color: 'white', border: 'none', fontWeight: '800', cursor: 'pointer' }}>YA, KELUAR</button>
                <button onClick={() => setShowLeaveModal(false)} style={{ padding: '1rem', borderRadius: '12px', background: '#f1f5f9', color: '#475569', border: 'none', fontWeight: '800', cursor: 'pointer' }}>BATAL</button>
             </div>
          </div>
        </div>
      )}

      <style>{`
        .lms-sidebar.open { transform: translateX(0) !important; display: flex !important; width: 320px !important; }
        @media (max-width: 1024px) {
          .lms-sidebar { position: fixed; height: 100%; transform: translateX(-100%); }
          .lms-player-content { padding: 1.5rem 1rem !important; }
        }
        .prose h1 { font-size: 2rem; color: #134E39; margin-bottom: 1rem; font-weight: 800; }
        .prose h2 { font-size: 1.5rem; color: #134E39; margin-top: 2rem; margin-bottom: 1rem; font-weight: 700; }
        .prose p { margin-bottom: 1.25rem; line-height: 1.8; }
        .prose ul, .prose ol { margin-bottom: 1.25rem; padding-left: 1.5rem; }
        .prose li { margin-bottom: 0.5rem; }

        /* 🚫 HIDE SCROLLBARS 🚫 */
        .lms-player-content::-webkit-scrollbar,
        .lms-sidebar::-webkit-scrollbar {
          display: none;
        }
        .lms-player-content,
        .lms-sidebar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
