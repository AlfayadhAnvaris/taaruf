import React, { useState } from 'react';
import {
  CheckCircle, PlayCircle, ChevronDown, ChevronRight, ChevronLeft,
  Award, BookOpen, BarChart2, GraduationCap, Lock, ArrowRight,
  Search, ShieldCheck, Zap, Menu, X, Clock, AlertCircle, Users, FileText
} from 'lucide-react';

export default function LearningTab({
  user, classes, activeClass, selectClass,
  curriculum, activeLesson, setActiveLesson,
  lmsView, setLmsView, quizAnswers, setQuizAnswers,
  quizSubmitted, setQuizSubmitted, progressPercent,
  doneLessons, totalLessons, allDone, markLessonDone,
  toggleModule, setActiveTab
}) {
  const [isLmsSidebarOpen, setIsLmsSidebarOpen] = useState(false);
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

          <div className="academy-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
            {[
              { label: 'Kelas Selesai', value: completedClasses, total: totalClasses, color: '#134E39', icon: <CheckCircle /> },
              { label: 'Materi Dipelajari', value: completedAcademyLessons, total: totalAcademyLessons, color: '#D4AF37', icon: <PlayCircle /> },
              { label: 'Sertifikat Didapat', value: completedClasses, total: totalClasses, color: '#0ea5e9', icon: <Award /> }
            ].map((stat, i) => (
              <div key={i} style={{ background: 'white', padding: '2rem', borderRadius: '32px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: `${stat.color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color }}>
                    {stat.icon}
                  </div>
                  <div style={{ fontSize: '0.7rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>Target: {stat.total}</div>
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: '900', color: '#134E39', lineHeight: 1, marginBottom: '0.5rem' }}>{stat.value}</div>
                <div style={{ fontSize: '0.875rem', fontWeight: '700', color: '#64748b' }}>{stat.label}</div>
              </div>
            ))}
         </div>

         <div style={{ background: 'white', borderRadius: '32px', padding: '2.5rem', border: '1px solid #f1f5f9' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#134E39', marginBottom: '2rem' }}>Status Kelas Anda</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {classes.map(cls => {
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
                        else selectClass(cls);
                      }}
                      style={{ background: pct === 100 ? '#f0fdf4' : '#134E39', color: pct === 100 ? '#166534' : 'white', border: pct === 100 ? '1px solid #bbf7d0' : 'none', padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer' }}
                    >
                      {pct === 100 ? 'LIHAT SERTIFIKAT' : (pct > 0 ? 'LANJUTKAN' : 'MULAI BELAJAR')}
                    </button>
                  </div>
                );
              })}
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
            <span style={{ color: '#D4AF37' }}>Akademi Separuh Agama</span>
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
            onClick={() => setLmsView('catalog')}
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
          <span>DAFTAR KELAS & KURSUS</span>
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
              <Zap size={14} fill="white" /> AKADEMI SEPARUH AGAMA
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
                    <button 
                      onClick={() => selectClass(cls)}
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
    <div className="lms-player">
      {isLmsSidebarOpen && <div className="lms-overlay" onClick={() => setIsLmsSidebarOpen(false)}></div>}

      <div className={`lms-sidebar ${isLmsSidebarOpen ? 'open' : ''}`}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', background: 'white' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#0f172a', marginBottom: '0.5rem', letterSpacing: '-0.02em', lineHeight: '1.3' }}>
            {activeClass?.title}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase' }}>Progress Kelas</span>
              <span style={{ fontSize: '0.65rem', fontWeight: '900', color: '#2C5F4D' }}>{doneLessons}/{totalLessons} Materi</span>
            </div>
            <div style={{ height: '4px', background: '#f1f5f9', borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: '99px', background: '#2C5F4D', width: `${progressPercent}%`, transition: 'width 0.4s ease' }} />
            </div>
          </div>
        </div>

        <div style={{ flex: 1, padding: '1rem 0', overflowY: 'auto' }}>
          {curriculum.map((mod, mi) => (
            <div key={mod.id} style={{ marginBottom: '1rem' }}>
              <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', background: 'white', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: 36, height: 36, borderRadius: '10px', background: '#134E39', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '1rem' }}>{mi + 1}</div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '900', color: '#134E39', letterSpacing: '-0.01em', lineHeight: '1.3' }}>{mod.title.toUpperCase()}</h3>
              </div>
              <div style={{ padding: '0.5rem 0' }}>
              {mod.items.map(item => {
                const isActive = item.id === activeLesson?.id;
                const isLocked = isLessonLocked(item);
                const isTypeQuiz = item.type === 'quiz';
                const isTypeText = item.type === 'text';
                return (
                  <div 
                    key={item.id} 
                    onClick={() => goToLesson(item)}
                    style={{ 
                      display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', cursor: isLocked ? 'not-allowed' : 'pointer', borderLeft: `4px solid ${isActive ? '#134E39' : 'transparent'}`, background: isActive ? 'white' : 'transparent', transition: 'all 0.2s' 
                    }}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: item.done ? '#ecfdf5' : 'white', border: `2px solid ${item.done ? '#10b981' : '#e2e8f0'}`, color: item.done ? '#10b981' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {item.done ? <CheckCircle size={18} /> : (isLocked ? <Lock size={14} /> : (isTypeQuiz ? <Zap size={14} /> : (isTypeText ? <FileText size={14} /> : <PlayCircle size={14} />)))}
                    </div>
                    <span style={{ fontSize: '0.9rem', fontWeight: isActive ? '800' : '650', color: isActive ? '#134E39' : (isLocked ? '#cbd5e1' : '#475569'), textTransform: 'uppercase', letterSpacing: '0.02em', lineHeight: '1.4' }}>{item.title}</span>
                  </div>
                );
              })}
            </div>
          </div>
          ))}
        </div>
      </div>

      <div className="lms-content">
        <div className="lms-top-bar" style={{ height: '60px', background: 'white', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', padding: '0 2rem', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.7rem', fontWeight: '700', color: '#94a3b8' }}>
            <button className="hamburger-btn" onClick={() => setIsLmsSidebarOpen(!isLmsSidebarOpen)} style={{ display: 'none', padding: '0.5rem', margin: '0', color: '#0f172a', background: 'rgba(0,0,0,0.05)', borderRadius: '8px' }}><Menu size={20} /></button>
            <style>{`@media (max-width: 1024px) { .hamburger-btn { display: flex !important; } }`}</style>
            <button onClick={() => { setLmsView('catalog'); resetQuiz(); }} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'none', border: 'none', padding: '0.4rem 0.6rem', fontSize: '0.7rem', fontWeight: '800', color: '#64748b', cursor: 'pointer' }}><ChevronLeft size={16} /> KEMBALI</button>
            <div className="lms-breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><div style={{ width: 1, height: 16, background: '#e2e8f0' }} /> {activeClass?.title?.toUpperCase()}</div>
          </div>
        </div>

        <div className="lms-player-content" style={{ flex: 1, overflowY: 'auto', padding: 'var(--lms-player-padding, 2.5rem)' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
            {activeLesson ? (
              <>
                <div style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <button 
                    onClick={() => setLmsView('dashboard')} 
                    style={{ 
                       alignSelf: 'flex-start',
                       background: 'rgba(0,0,0,0.03)', border: 'none', 
                       borderRadius: '8px', padding: '0.5rem 0.8rem', 
                       fontWeight: '700', color: '#64748b', cursor: 'pointer',
                       display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem'
                    }}
                  >
                    <ChevronLeft size={16} /> Keluar Ke Dashboard
                  </button>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: '900', color: '#2C5F4D', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>MATERI KELAS</div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>{activeLesson.title.toUpperCase()}</h2>
                  </div>
                </div>

                <div style={{ borderRadius: '1.5rem', overflow: 'hidden', background: '#000', aspectRatio: '16/9', marginBottom: '2rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                  {activeLesson.type === 'video' ? (
                    <iframe width="100%" height="100%" src={activeLesson.videoUrl || "https://www.youtube.com/embed/dQw4w9WgXcQ"} title={activeLesson.title} frameBorder="0" allowFullScreen />
                  ) : activeLesson.type === 'text' ? (
                    <div style={{ height: '100%', padding: '4rem', overflowY: 'auto', background: 'white' }}>
                       <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                          <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#134E39', marginBottom: '2rem', borderBottom: '2px solid rgba(19,78,57,0.1)', paddingBottom: '1rem' }}>Ringkasan Materi</h3>
                          <div style={{ fontSize: '1.1rem', color: '#334155', lineHeight: '2', whiteSpace: 'pre-wrap' }}>
                             {activeLesson.content || 'Konten materi teks belum tersedia.'}
                          </div>
                          <div style={{ marginTop: '3rem', padding: '2rem', background: '#f8fafc', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
                             <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b', textAlign: 'center', fontStyle: 'italic' }}>
                                "Teruslah menuntut ilmu, karena ilmu adalah cahaya dalam melangkah menuju ridha-Nya."
                             </p>
                          </div>
                       </div>
                    </div>
                  ) : (
                    <div style={{ height: '100%', padding: '2rem', overflowY: 'auto', background: '#f8fafc' }}>
                       <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                        {quizSubmitted ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'white', borderRadius: '2rem', boxShadow: '0 20px 50px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9' }}>
                              <div style={{ width: 80, height: 80, borderRadius: '24px', background: quizPassed ? '#ecfdf5' : '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem', transform: 'rotate(-10deg)' }}>
                                {quizPassed ? <Award size={40} color="#10b981" /> : <AlertCircle size={40} color="#ef4444" />}
                              </div>
                              <h2 style={{ fontSize: '2rem', fontWeight: '900', color: '#0f172a', marginBottom: '0.5rem' }}>{quizPassed ? 'Mabruk! Anda Lulus' : 'Coba Lagi Yuk!'}</h2>
                              <p style={{ color: '#64748b', fontSize: '1rem', marginBottom: '2.5rem' }}>{quizPassed ? 'Masya Allah, Anda telah memahami materi ini dengan sangat baik.' : 'Jangan menyerah! Pelajari kembali materinya dan raih hasil terbaik.'}</p>
                              
                              <div style={{ display: 'flex', justifyContent: 'center', gap: '4rem', marginBottom: '3rem' }}>
                                 <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>SKOR AKHIR</div>
                                    <div style={{ fontSize: '2.5rem', fontWeight: '950', color: quizPassed ? '#10b981' : '#ef4444' }}>{quizScore}%</div>
                                 </div>
                                 <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>JAWABAN BENAR</div>
                                    <div style={{ fontSize: '2.5rem', fontWeight: '950', color: '#134E39' }}>{currentQuiz.filter((q, i) => quizAnswers[i] === q.correctAnswer).length} / {currentQuiz.length}</div>
                                 </div>
                              </div>

                              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                 {quizPassed ? (
                                   currentLessonIdx === allItems.length - 1 ? (
                                      <button onClick={handleCertificateDownload} style={{ background: '#D4AF37', color: 'white', padding: '1.2rem 3rem', borderRadius: '1.25rem', fontWeight: '900', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.1rem', boxShadow: '0 10px 25px rgba(212,175,55,0.2)' }}>AMBIL SERTIFIKAT <Award size={22} /></button>
                                   ) : (
                                      <button onClick={handleQuizPassed} style={{ background: '#134E39', color: 'white', padding: '1.2rem 3rem', borderRadius: '1.25rem', fontWeight: '900', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.1rem', boxShadow: '0 10px 25px rgba(19,78,57,0.2)' }}>LANJUT MATERI BERIKUTNYA <ArrowRight /></button>
                                   )
                                 ) : (
                                   <button onClick={resetQuiz} style={{ background: '#0f172a', color: 'white', padding: '1.2rem 3rem', borderRadius: '1.25rem', fontWeight: '900', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.1rem' }}>ULANGI KUIS <Zap size={20} /></button>
                                 )}
                              </div>
                            </div>

                            {/* History Section */}
                            {quizAttempts.length > 0 && (
                              <div style={{ background: '#f8fafc', padding: '2rem', borderRadius: '1.5rem', border: '1px solid #e2e8f0' }}>
                                 <h4 style={{ margin: '0 0 1.5rem', fontSize: '1rem', fontWeight: '900', color: '#134E39', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                    <Clock size={18} /> RIWAYAT PERCOBAAN
                                 </h4>
                                 <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {quizAttempts.map((att, ai) => (
                                      <div key={ai} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '1rem 1.5rem', borderRadius: '1rem', border: '1px solid #f1f5f9' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: att.passed ? '#ecfdf5' : '#fef2f2', color: att.passed ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '950', fontSize: '0.8rem' }}>{quizAttempts.length - ai}</div>
                                          <div>
                                             <div style={{ fontWeight: '800', fontSize: '0.9rem', color: '#0f172a' }}>Percobaan #{quizAttempts.length - ai}</div>
                                             <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{new Date(att.date).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                                          </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                           <div style={{ fontWeight: '950', fontSize: '1.1rem', color: att.passed ? '#10b981' : '#ef4444' }}>{att.score}%</div>
                                           <div style={{ fontSize: '0.65rem', fontWeight: '800', color: att.passed ? '#10b981' : '#ef4444', textTransform: 'uppercase' }}>{att.passed ? 'LULUS' : 'GAGAL'}</div>
                                        </div>
                                      </div>
                                    ))}
                                 </div>
                              </div>
                            )}
                          </div>
                        ) : !quizStarted ? (
                          <div style={{ padding: '3rem', background: 'white', borderRadius: '1.5rem', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                             <div style={{ width: '60px', height: '60px', background: 'rgba(212,175,55,0.1)', color: '#D4AF37', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                               <Clock size={32} />
                             </div>
                             <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#134E39', marginBottom: '1rem' }}>Instruksi Kuis</h3>
                             <div style={{ textAlign: 'left', background: '#f8fafc', padding: '1.5rem', borderRadius: '1rem', marginBottom: '2rem', border: '1px solid #f1f5f9' }}>
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#475569' }}><CheckCircle size={16} /> Durasi pengerjaan: <strong>10 Menit</strong></div>
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#475569' }}><CheckCircle size={16} /> Skor kelulusan Minimal: <strong>70%</strong></div>
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#475569' }}><CheckCircle size={16} /> Jangan melakukan refresh halaman saat kuis berlangsung</div>
                                <div style={{ display: 'flex', gap: '8px', fontSize: '0.9rem', color: '#475569' }}><CheckCircle size={16} /> Klik tombol di bawah jika Anda sudah siap</div>
                             </div>
                             <button onClick={() => setQuizStarted(true)} style={{ width: '100%', background: '#134E39', color: 'white', padding: '1rem', borderRadius: '1rem', fontWeight: '900', border: 'none', cursor: 'pointer', boxShadow: '0 10px 20px rgba(19,78,57,0.2)' }}>MULAI KUIS SEKARANG</button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f8fafc', padding: '1rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', marginBottom: '1rem' }}>
                               <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: timeLeft < 60 ? '#ef4444' : '#134E39', fontWeight: '800' }}>
                                 <Clock size={18} /> SISA WAKTU: {formatTime(timeLeft)}
                               </div>
                               <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#64748b' }}>{Object.keys(quizAnswers).length} / {currentQuiz.length} TERJAWAB</div>
                            </div>
                            {currentQuiz.map((q, i) => (
                              <div key={i} style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
                                <div style={{ fontWeight: '800', fontSize: '0.95rem', color: '#0f172a', marginBottom: '1rem', display: 'flex', gap: '0.75rem' }}><span style={{ color: '#2C5F4D' }}>{i + 1}.</span> {q.q}</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                  {q.options.map((opt, oi) => (
                                    <button key={oi} onClick={() => setQuizAnswers(prev => ({ ...prev, [i]: oi }))} style={{ textAlign: 'left', padding: '1rem', borderRadius: '0.75rem', fontSize: '0.85rem', fontWeight: '600', border: `2px solid ${quizAnswers[i] === oi ? '#2C5F4D' : '#f1f5f9'}`, background: quizAnswers[i] === oi ? '#f0fdf4' : 'white', color: quizAnswers[i] === oi ? '#166534' : '#475569', cursor: 'pointer' }}>{String.fromCharCode(65 + oi)}. {opt}</button>
                                  ))}
                                </div>
                              </div>
                            ))}
                            <button onClick={handleQuizSubmit} disabled={Object.keys(quizAnswers).length < currentQuiz.length} style={{ background: '#2C5F4D', color: 'white', padding: '1rem', borderRadius: '1rem', fontWeight: '800', opacity: Object.keys(quizAnswers).length < currentQuiz.length ? 0.5 : 1, cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>SUBMIT KUIS</button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {activeLesson.content && activeLesson.type !== 'text' && (
                  <div style={{ background: 'white', padding: '2rem', borderRadius: '1.5rem', border: '1px solid #f1f5f9', marginBottom: '3rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                      <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(44,95,77,0.1)', color: '#2C5F4D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BookOpen size={20} /></div>
                      <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '900', color: '#0f172a' }}>Ringkasan Materi</h4>
                    </div>
                    <p style={{ fontSize: '0.95rem', color: '#475569', lineHeight: '1.8', margin: 0, whiteSpace: 'pre-wrap' }}>{activeLesson.content}</p>
                  </div>
                )}
              </>
            ) : (
                <div style={{ textAlign: 'center', padding: '4rem' }}>
                    <p>Mohon pilih materi di sidebar.</p>
                </div>
            )}
          </div>
        </div>

        <div className="lms-player-header" style={{ height: '80px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', padding: '0 4rem', justifyContent: 'space-between', background: 'white' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: '900', color: '#94a3b8' }}>PROGRES: {doneLessons}/{totalLessons} MATERI SELESAI</div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {(activeLesson?.type === 'video' || activeLesson?.type === 'text') && (
              <button 
                onClick={handleMarkDone} 
                disabled={activeLesson.done}
                style={{ background: activeLesson.done ? '#f1f5f9' : '#134E39', color: activeLesson.done ? '#94a3b8' : 'white', padding: '0.8rem 2rem', borderRadius: '12px', fontWeight: '800', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.75rem', border: 'none', cursor: activeLesson.done ? 'default' : 'pointer' }}
              >
                {activeLesson.done ? 'SESI SELESAI' : 'TANDAI SELESAI & LANJUT'} <ArrowRight size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      {showLeaveModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', animation: 'fadeIn 0.3s ease' }}>
          <div style={{ background: 'white', borderRadius: '2.5rem', width: '100%', maxWidth: '480px', padding: '3rem', textAlign: 'center', boxShadow: '0 30px 60px -12px rgba(0,0,0,0.25)', animation: 'scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
             <div style={{ width: '80px', height: '80px', background: '#fef2f2', color: '#ef4444', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem', transform: 'rotate(-5deg)' }}>
                <AlertCircle size={40} />
             </div>
             <h3 style={{ fontSize: '1.75rem', fontWeight: '950', color: '#0f172a', marginBottom: '1rem', letterSpacing: '-0.02em' }}>Keluar dari Kuis?</h3>
             <p style={{ color: '#64748b', fontSize: '1.05rem', lineHeight: '1.6', marginBottom: '2.5rem' }}>
                Segala progres pengerjaan Anda pada materi ini akan hilang jika Anda berpindah sekarang.
             </p>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button 
                  onClick={confirmLeaveQuiz}
                  style={{ width: '100%', padding: '1.25rem', borderRadius: '1.25rem', background: '#ef4444', color: 'white', border: 'none', fontWeight: '900', fontSize: '1rem', cursor: 'pointer', boxShadow: '0 10px 20px rgba(239,68,68,0.2)' }}
                >
                  YA, SAYA MENGERTI & KELUAR
                </button>
                <button 
                  onClick={() => setShowLeaveModal(false)}
                  style={{ width: '100%', padding: '1.25rem', borderRadius: '1.25rem', background: '#f1f5f9', color: '#475569', border: 'none', fontWeight: '800', fontSize: '1rem', cursor: 'pointer' }}
                >
                  TIDAK, LANJUTKAN KUIS
                </button>
             </div>
          </div>
          <style>{`
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            @keyframes scaleUp { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }

            @media (max-width: 768px) {
              :root {
                --lms-player-padding: 1.25rem 1rem;
              }
              .academy-container {
                padding: 1rem 0 !important;
              }
              .academy-banner {
                padding: 1.5rem !important;
                border-radius: 1rem !important;
                text-align: center !important;
              }
              .banner-title {
                font-size: 1.75rem !important;
                line-height: 1.2 !important;
              }
              .banner-desc {
                font-size: 0.9rem !important;
                margin: 0 auto !important;
              }
              .zap-tag {
                margin: 0 auto 1rem !important;
              }
              .academy-class-grid {
                grid-template-columns: 1fr !important;
                gap: 1.25rem !important;
                padding: 0 1rem;
              }
              .academy-stats-grid {
                grid-template-columns: 1fr !important;
                gap: 1rem !important;
              }
              .academy-class-card {
                flex-direction: column !important;
                padding: 1.25rem !important;
                text-align: center;
              }
              .academy-class-card img {
                margin: 0 auto 1rem !important;
              }
              .academy-class-card button {
                width: 100% !important;
              }
              .lms-top-bar {
                padding: 0 1rem !important;
                height: 54px !important;
              }
              .lms-player-header {
                padding: 1rem !important;
                flex-direction: column !important;
                height: auto !important;
                gap: 12px;
              }
              .academy-welcome-title {
                font-size: 2rem !important;
              }
            }

            /* 🚫 HIDE SCROLLBARS 🚫 */
            .academy-container::-webkit-scrollbar,
            .lms-player-content::-webkit-scrollbar,
            .lms-sidebar::-webkit-scrollbar,
            .academy-class-grid::-webkit-scrollbar,
            .dashboard-tab-container::-webkit-scrollbar {
              display: none;
            }

            .academy-container,
            .lms-player-content,
            .lms-sidebar,
            .academy-class-grid,
            .dashboard-tab-container {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          }
          `}</style>
        </div>
      )}
    </div>
  );
}
