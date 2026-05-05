import React, { useState } from 'react';
import {
  CheckCircle, PlayCircle, ChevronDown, ChevronRight, ChevronLeft,
  Award, BookOpen, BarChart2, GraduationCap, Lock, ArrowRight,
  Search, ShieldCheck, Zap, Menu, X, Clock, AlertCircle, Users, FileText,
  Maximize2, Minimize2, Sparkles
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
  const [isMounted, setIsMounted] = useState(false);
  useState(() => { setIsMounted(true); }, []);
  const [isLmsSidebarOpen, setIsLmsSidebarOpen] = useState(false);
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const isMobile = window.innerWidth < 768;
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
    const newAttempt = {
      date: new Date().toISOString(),
      score: quizScore,
      passed: quizPassed
    };
    const updatedHistory = [newAttempt, ...quizAttempts].slice(0, 5);
    setQuizAttempts(updatedHistory);
    localStorage.setItem(`quiz_history_${user?.id}_${activeLesson?.id}`, JSON.stringify(updatedHistory));

    await markLessonDone(activeLesson.id, quizScore);
    if (currentLessonIdx < allItems.length - 1) goNext();
  };

  const handleQuizSubmit = () => {
    setQuizSubmitted(true);
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
      <div key="academy-dashboard" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#F8FAF9', animation: 'fadeIn 0.5s ease' }}>
        
        {/* ⚪️ HERO HEADER (LIGHT) ⚪️ */}
        <div style={{ 
          background: '#F8FAFC', 
          padding: 'clamp(2.5rem, 10vw, 5rem) 5%', color: '#1e293b', position: 'relative', overflow: 'hidden', flexShrink: 0 
        }}>
          <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(212,175,55,0.1) 0%, transparent 70%)', borderRadius: '50%' }}></div>
          
          <div style={{ position: 'relative', zIndex: 1, maxWidth: '100%', margin: '0 auto' }}>
             <button 
               onClick={() => setActiveTab('home')} 
               style={{ 
                 background: 'white', border: '1px solid #E2E8F0', 
                 borderRadius: '12px', padding: '0.6rem 1.25rem', 
                 fontWeight: '800', color: '#134E39', cursor: 'pointer',
                 display: 'inline-flex', alignItems: 'center', gap: '8px',
                 marginBottom: '2rem', fontSize: '0.8rem', boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
               }}
             >
               <ChevronLeft size={18} /> KEMBALI KE BERANDA
             </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
              <div style={{ flex: '1 1 300px' }}>
                <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 'clamp(2rem, 6vw, 3.5rem)', fontWeight: '900', margin: 0, lineHeight: 1.1, color: '#134E39' }}>
                  Dashboard <span style={{ color: '#D4AF37' }}>Akademi</span>
                </h1>
                <p style={{ fontSize: 'clamp(1rem, 2vw, 1.25rem)', color: '#64748b', marginTop: '1rem', maxWidth: '600px', lineHeight: 1.6, fontWeight: 500 }}>
                  Kelola dan pantau setiap progres pembelajaran Anda untuk membekali diri dengan ilmu syar'i.
                </p>
              </div>
              <div style={{ 
                background: 'white', padding: '1.25rem 2rem', borderRadius: '24px', 
                border: '1px solid #E2E8F0', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.02)',
                flex: '0 0 auto', minWidth: '160px'
              }}>
                <div style={{ fontSize: '2.5rem', fontWeight: '900', color: '#D4AF37' }}>{completedClasses}</div>
                <div style={{ fontSize: '0.7rem', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Sertifikat Diraih</div>
              </div>
            </div>
          </div>
        </div>

        {/* ⚪️ CONTENT AREA ⚪️ */}
        <div style={{ padding: '4rem 5%', flex: 1 }}>
          <div style={{ maxWidth: '100%', margin: '0 auto' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', marginBottom: '3.5rem' }}>
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                  {[
                    { label: 'Kelas Diikuti', value: classes.filter(c => c.isEnrolled).length, total: classes.length, color: '#134E39', icon: <BookOpen /> },
                    { label: 'Materi Selesai', value: completedAcademyLessons, total: totalAcademyLessons, color: '#D4AF37', icon: <CheckCircle /> },
                    { label: 'Total Progres', value: `${totalAcademyLessons > 0 ? Math.round((completedAcademyLessons / totalAcademyLessons) * 100) : 0}%`, total: '100%', color: '#0ea5e9', icon: <BarChart2 /> }
                  ].map((stat, i) => (
                    <div key={i} style={{ background: 'white', padding: '1.5rem', borderRadius: '28px', border: '1px solid #E4EDE8', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `${stat.color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color, marginBottom: '1.25rem' }}>
                        {React.cloneElement(stat.icon, { size: 20 })}
                      </div>
                      <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#134E39', marginBottom: '0.2rem' }}>{stat.value}</div>
                      <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#64748B' }}>{stat.label}</div>
                    </div>
                  ))}
               </div>

               <div style={{ 
                 background: 'white', padding: 'clamp(1.5rem, 5vw, 2.5rem)', borderRadius: '32px', 
                 border: '1px solid #E4EDE8', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '2rem' 
               }}>
                  <div style={{ width: '110px', height: '110px', flexShrink: 0, margin: '0 auto' }}>
                    {isMounted && (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie 
                            data={[
                              { name: 'Selesai', value: completedAcademyLessons, color: '#134E39' },
                              { name: 'Belum', value: (totalAcademyLessons - completedAcademyLessons) || 1, color: '#F1F5F9' }
                            ]} 
                            innerRadius={40} outerRadius={55} paddingAngle={5} dataKey="value" stroke="none"
                          >
                            <Cell fill="#134E39" />
                            <Cell fill="#F1F5F9" />
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                  <div style={{ flex: '1 1 200px', textAlign: 'center' }}>
                     <h4 style={{ margin: 0, fontSize: '0.75rem', fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Statistik Belajar</h4>
                     <div style={{ fontSize: '2.2rem', fontWeight: '950', color: '#134E39', margin: '4px 0' }}>
                       {totalAcademyLessons > 0 ? Math.round((completedAcademyLessons / totalAcademyLessons) * 100) : 0}%
                     </div>
                     <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>{completedAcademyLessons} materi dari {totalAcademyLessons} telah dikuasai.</p>
                  </div>
               </div>
            </div>

            <div style={{ 
              background: 'white', borderRadius: '32px', padding: 'clamp(1.5rem, 5vw, 3rem)', 
              border: '1px solid #E4EDE8', boxShadow: '0 20px 40px rgba(0,0,0,0.02)' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', fontWeight: '900', color: '#134E39' }}>Daftar Kelas Anda</h3>
                  <p style={{ margin: '0.4rem 0 0', color: '#64748B', fontSize: '0.85rem', fontWeight: 500 }}>Lanjutkan materi yang belum Anda selesaikan.</p>
                </div>
                <button 
                  onClick={() => setLmsView('catalog')}
                  style={{ 
                    background: 'rgba(19,78,57,0.05)', color: '#134E39', border: 'none', 
                    padding: '0.7rem 1.25rem', borderRadius: '14px', fontWeight: '800', 
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                    fontSize: '0.8rem'
                  }}
                >
                  <Search size={16} /> JELAJAHI KELAS
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {classes.filter(c => c.isEnrolled).length > 0 ? (
                  classes.filter(c => c.isEnrolled).map(cls => {
                    const clsLessons = cls.modules.flatMap(m => m.items);
                    const clsDone = clsLessons.filter(l => l.done).length;
                    const clsTotal = clsLessons.length;
                    const pct = clsTotal > 0 ? Math.round((clsDone / clsTotal) * 100) : 0;
                    return (
                      <div key={cls.id} style={{ 
                        display: 'flex', alignItems: 'center', gap: 'clamp(1rem, 3vw, 2rem)', 
                        padding: '1.25rem', borderRadius: '24px', background: '#F8FAF9', 
                        border: '1px solid #E4EDE8', transition: 'all 0.3s ease',
                        flexWrap: 'wrap'
                      }}>
                        <div style={{ width: 'clamp(60px, 15vw, 90px)', height: 'clamp(60px, 15vw, 90px)', borderRadius: '18px', overflow: 'hidden', flexShrink: 0, border: '1px solid #E4EDE8' }}>
                          <img src={cls.banner_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=200&auto=format&fit=crop"} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div style={{ flex: '1 1 200px' }}>
                          <div style={{ fontWeight: '900', fontSize: 'clamp(1rem, 2.5vw, 1.2rem)', color: '#134E39', marginBottom: '8px' }}>{cls.title}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ flex: 1, height: '6px', background: '#E2E8F0', borderRadius: '99px', overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: '#134E39', borderRadius: '99px', transition: 'width 0.8s ease' }} />
                            </div>
                            <span style={{ fontSize: '0.85rem', fontWeight: '900', color: '#134E39', minWidth: '40px' }}>{pct}%</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            if (pct === 100) setActiveTab(`certificate/${cls.id}`);
                            else selectClassForPlayer(cls);
                          }}
                          style={{ 
                            background: pct === 100 ? '#D4AF37' : '#134E39', 
                            color: pct === 100 ? '#134E39' : 'white', 
                            border: 'none', padding: '0.8rem 1.5rem', 
                            borderRadius: '14px', fontWeight: '900', 
                            fontSize: '0.85rem', cursor: 'pointer', 
                            boxShadow: '0 8px 15px rgba(0,0,0,0.1)', 
                            transition: 'all 0.2s',
                            width: '100%',
                            maxWidth: '200px',
                            flex: '1 1 auto'
                          }}
                          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                          {pct === 100 ? 'SERTIFIKAT' : (pct > 0 ? 'LANJUTKAN' : 'MULAI BELAJAR')}
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ textAlign: 'center', padding: '5rem 2rem', background: '#F8FAF9', borderRadius: '32px', border: '2px dashed #E2E8F0' }}>
                     <BookOpen size={64} color="#CBD5E1" style={{ marginBottom: '1.5rem', opacity: 0.5 }} />
                     <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#134E39', marginBottom: '1rem' }}>Belum Ada Kelas</h3>
                     <p style={{ color: '#64748B', fontWeight: '600', maxWidth: '400px', margin: '0 auto 2.5rem', lineHeight: 1.6 }}>Anda belum terdaftar di kelas manapun. Silakan pilih kelas dari daftar kelas kami untuk memulai.</p>
                     <button onClick={() => setLmsView('catalog')} style={{ background: '#134E39', color: 'white', border: 'none', padding: '1.2rem 3rem', borderRadius: '18px', fontWeight: '900', cursor: 'pointer', boxShadow: '0 10px 20px rgba(19,78,57,0.2)' }}>LIHAT DAFTAR KELAS</button>
                  </div>
                )}
              </div>
            </div>
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
      <div style={{ 
        display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 100px)', 
        background: 'white', animation: 'fadeIn 0.5s ease', justifyContent: 'center', 
        alignItems: 'center', padding: isMobile ? '1.5rem' : '2rem'
      }}>
        
        {/* ⚪️ HERO WELCOME (CENTERED) ⚪️ */}
        <div style={{ 
          background: 'white', 
          padding: isMobile ? '1rem 0' : '2rem 5%', color: '#1e293b', position: 'relative', overflow: 'hidden', textAlign: 'center',
          width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center'
        }}>

          <div style={{ position: 'relative', zIndex: 1, width: '100%', margin: '0 auto', maxWidth: '1000px' }}>
            <div style={{ 
              width: isMobile ? '80px' : '100px', 
              height: isMobile ? '80px' : '100px', 
              background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)', 
              borderRadius: isMobile ? '24px' : '32px', display: 'flex', alignItems: 'center', 
              justifyContent: 'center', color: '#D4AF37', margin: isMobile ? '0 auto 1.5rem' : '0 auto 3rem' 
            }}>
              <GraduationCap size={isMobile ? 40 : 56} />
            </div>
            
            <h1 style={{ 
              fontFamily: "'Plus Jakarta Sans', sans-serif", 
              fontSize: isMobile ? '2.2rem' : 'clamp(3rem, 8vw, 4.5rem)', 
              fontWeight: '950', color: '#134E39', marginBottom: isMobile ? '1rem' : '2rem', 
              lineHeight: 1.1, letterSpacing: '-0.03em' 
            }}>
              Selamat Datang di <br />
              <span style={{ color: '#D4AF37' }}>Separuh Agama Academy</span>
            </h1>
            
            <p style={{ 
              fontSize: isMobile ? '1rem' : '1.4rem', 
              color: '#64748b', lineHeight: isMobile ? 1.6 : 1.8, 
              marginBottom: isMobile ? '2.5rem' : '4rem', 
              maxWidth: '850px', margin: isMobile ? '0 auto 2.5rem' : '0 auto 4rem', 
              fontWeight: 500 
            }}>
              Bekali niat suci Anda dengan ilmu syar'i tentang pernikahan dan rumah tangga sebelum melangkah menuju ikatan yang abadi di bawah ridha Allah.
            </p>
            
            <button 
              onClick={() => setLmsView('dashboard')}
              style={{ 
                background: '#D4AF37', color: '#134E39', border: 'none', 
                padding: isMobile ? '1.2rem 2.5rem' : '1.5rem 5rem', 
                borderRadius: '20px', fontSize: isMobile ? '0.95rem' : '1.2rem', 
                fontWeight: '900', cursor: 'pointer', display: 'inline-flex', 
                alignItems: 'center', gap: '12px',
                boxShadow: '0 20px 40px rgba(212,175,55,0.2)',
                transition: 'all 0.3s'
              }}
              onMouseEnter={e => {
                if (!isMobile) e.currentTarget.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={e => {
                if (!isMobile) e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              MULAI BELAJAR SEKARANG <ArrowRight size={isMobile ? 20 : 24} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================
  // VIEW: CATALOG
  // ============================
  if (lmsView === 'catalog') {
    return (
      <div key="academy-catalog" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f8fafc', animation: 'fadeIn 0.5s ease' }}>
        
        {/* ⚪️ MINIMALIST HEADER (GRAY BACKGROUND) ⚪️ */}
        <div style={{ padding: '4rem 5% 2rem' }}>
          <div style={{ 
            position: 'relative', 
            overflow: 'hidden'
          }}>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#e2e8f0', color: '#64748b', fontSize: '0.7rem', fontWeight: '900', letterSpacing: '0.15em', textTransform: 'uppercase', padding: '8px 18px', borderRadius: '99px', marginBottom: '1.5rem' }}>
                <Zap size={14} fill="#64748b" /> KURIKULUM TAARUF
              </div>
              
              <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: '900', margin: 0, lineHeight: 1.1, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                DAFTAR <span style={{ color: '#D4AF37' }}>KELAS</span> 
              </h1>
              <p style={{ fontSize: '1.2rem', color: '#64748b', marginTop: '1.25rem', maxWidth: '700px', lineHeight: 1.6, fontWeight: 500 }}>
                Persiapkan diri menuju pernikahan sakinah mawaddah warahmah dengan kurikulum terbaik kami.
              </p>
            </div>
          </div>
        </div>

        {/* ⚪️ SEARCH & FILTER BAR ⚪️ */}
        <div style={{ padding: '1rem 5% 3rem', display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <Search size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder="Cari kursus..." 
              style={{ width: '100%', padding: '0.9rem 1rem 0.9rem 3.2rem', borderRadius: '14px', border: '1px solid #e2e8f0', background: 'white', fontSize: '0.9rem', fontWeight: '600', outline: 'none' }}
            />
          </div>
          <button style={{ background: '#134E39', color: 'white', padding: '0.9rem 2rem', borderRadius: '12px', border: 'none', fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer', textTransform: 'uppercase' }}>
            SEMUA
          </button>
        </div>

        {/* ⚪️ CLASS GRID ⚪️ */}
        <div style={{ padding: '0 5% 5rem', flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2.5rem' }}>
            {classes.map(cls => {
              const clsLessonsCount = cls.modules.reduce((a, m) => a + m.items.length, 0);
              const clsDoneCount = cls.modules.reduce((a, m) => a + m.items.filter(i => i.done).length, 0);
              const isFinished = clsLessonsCount > 0 && clsLessonsCount === clsDoneCount;
              
              return (
                <div key={cls.id} style={{ 
                  borderRadius: '24px', overflow: 'hidden', border: '1px solid #e2e8f0', 
                  background: 'white', display: 'flex', flexDirection: 'column', 
                  transition: 'transform 0.3s ease'
                }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-8px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                  
                  {/* Banner Image */}
                  <div style={{ position: 'relative', height: '220px', overflow: 'hidden' }}>
                    <img src={cls.banner_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop"} alt={cls.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    {isFinished && (
                      <div style={{ position: 'absolute', top: '1rem', right: '1rem', background: '#D4AF37', color: 'white', padding: '6px 14px', borderRadius: '10px', fontSize: '0.65rem', fontWeight: '900', letterSpacing: '0.05em' }}>
                        SELESAI
                      </div>
                    )}
                  </div>
                  
                  {/* Content Area */}
                  <div style={{ padding: '1.75rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#1e293b', marginBottom: '0.75rem' }}>{cls.title}</h3>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.5, flex: 1 }}>
                      {cls.description || "Program intensif persiapan menuju keluarga sakinah mawaddah warahmah."}
                    </p>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <button onClick={() => cls.isEnrolled ? selectClassForPlayer(cls) : enrollClass(cls.id)} style={{ width: '100%', background: '#134E39', color: 'white', padding: '0.9rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '800', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        {isFinished ? <PlayCircle size={18} /> : (cls.isEnrolled ? (clsDoneCount > 0 ? <PlayCircle size={18} /> : <PlayCircle size={18} />) : <ArrowRight size={18} />)}
                        {isFinished ? 'MULAI LAGI' : (cls.isEnrolled ? (clsDoneCount > 0 ? 'LANJUTKAN' : 'MULAI BELAJAR') : 'IKUTI KELAS')}
                      </button>
                      
                      {isFinished && (
                        <button onClick={() => setActiveTab(`certificate/${cls.id}`)} style={{ width: '100%', background: 'white', color: '#D4AF37', padding: '0.8rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '800', border: '1.5px solid #D4AF37', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          <Award size={18} /> DOWNLOAD SERTIFIKAT
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Bottom Yellow Shadow Accent */}
                  <div ></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ============================
  // VIEW: PLAYER (FULLSCREEN STYLE)
  // ============================
  return (
    <div className="lms-player" style={{ height: '100%', display: 'flex', background: '#fff', position: 'relative' }}>
        {/* Sidebar Overlay */}
        {isLmsSidebarOpen && <div className="lms-overlay" onClick={() => setIsLmsSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(19,78,57,0.3)', backdropFilter: 'blur(4px)', zIndex: 190 }}></div>}
        
        <div className={`lms-sidebar ${isLmsSidebarOpen ? 'open' : ''}`} style={{ 
          width: isSidebarHidden ? '0' : '340px', 
          display: isSidebarHidden ? 'none' : 'flex',
          flexDirection: 'column',
          borderRight: '1px solid #F1F5F9',
          background: 'white',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 200,
          height: '100%',
          overflow: 'hidden'
        }}>
          <div style={{ padding: '2rem 1.5rem', borderBottom: '1px solid #F1F5F9' }}>
            <button onClick={() => setLmsView('catalog')} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', padding: 0, fontSize: '0.75rem', fontWeight: '900', color: '#94A3B8', cursor: 'pointer', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              <ChevronLeft size={16} /> Kembali
            </button>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <h5 style={{ fontSize: '1rem', fontWeight: '900', color: '#134E39', margin: 0, lineHeight: 1.4 }}>{activeClass?.title}</h5>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Progress Belajar</span>
                <span style={{ fontSize: '0.65rem', fontWeight: '900', color: '#134E39' }}>{progressPercent}%</span>
              </div>
              <div style={{ height: '6px', background: '#F1F5F9', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#134E39', width: `${progressPercent}%`, transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)' }} />
              </div>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 0' }} className="custom-scrollbar">
            {curriculum.map((mod, mi) => (
              <div key={mod.id} style={{ marginBottom: '1rem' }}>
                <div style={{ padding: '1rem 1.75rem 0.75rem', fontSize: '0.7rem', fontWeight: '900', color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  {mod.title.toUpperCase().includes('MODUL') ? mod.title : `MODUL ${mi + 1}: ${mod.title}`}
                </div>
                {mod.items.map(item => {
                  const isActive = activeLesson?.id === item.id;
                  const isLocked = isLessonLocked(item);
                  return (
                    <div 
                      key={item.id} 
                      onClick={() => goToLesson(item)}
                      style={{ 
                        padding: '1rem 1.75rem', margin: '0.25rem 1rem', borderRadius: '16px',
                        display: 'flex', alignItems: 'center', gap: '1rem', cursor: isLocked ? 'not-allowed' : 'pointer',
                        background: isActive ? '#134E39' : 'transparent',
                        color: isActive ? 'white' : (isLocked ? '#CBD5E1' : '#475569'),
                        transition: 'all 0.2s',
                        position: 'relative',
                        boxShadow: isActive ? '0 10px 20px rgba(19,78,57,0.15)' : 'none'
                      }}
                    >
                      <div style={{ 
                        width: 28, height: 28, borderRadius: '50%', 
                        background: isActive ? 'rgba(255,255,255,0.2)' : (item.done ? '#E6F4ED' : 'white'), 
                        border: `2px solid ${isActive ? 'white' : (item.done ? '#10B981' : '#F1F5F9')}`, 
                        color: isActive ? 'white' : (item.done ? '#10B981' : '#CBD5E1'), 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
                      }}>
                        {item.done ? <CheckCircle size={16} strokeWidth={3} /> : (isLocked ? <Lock size={14} /> : (item.type === 'quiz' ? <Zap size={14} /> : <PlayCircle size={14} />))}
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: isActive ? '900' : '700', lineHeight: 1.4 }}>{item.title}</span>
                      {isActive && <div style={{ position: 'absolute', right: '15px', width: '4px', height: '16px', background: '#D4AF37', borderRadius: '2px' }}></div>}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* 🎬 MAIN CONTENT 🎬 */}
        <div className="lms-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          {/* Top Bar */}
          <div className="lms-top-bar" style={{ 
            height: '70px', background: 'white', borderBottom: '1px solid #F1F5F9', 
            display: 'flex', alignItems: 'center', padding: '0 1.5rem', 
            justifyContent: 'space-between', flexShrink: 0, zIndex: 10 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
              <button 
                onClick={() => setIsLmsSidebarOpen(true)} 
                style={{ 
                  background: '#f8fafc', border: '1px solid #e2e8f0', padding: '8px', 
                  borderRadius: '10px', cursor: 'pointer', display: isMobile ? 'flex' : 'none',
                  alignItems: 'center', justifyContent: 'center'
                }}
              >
                <Menu size={20} color="#134E39" />
              </button>
              <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ fontSize: '0.6rem', fontWeight: '900', color: '#D4AF37', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{activeClass?.title}</div>
                <div className="lms-lesson-title" style={{ fontSize: '1.1rem', fontWeight: '900', color: '#134E39', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{activeLesson?.title}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {activeLesson?.done && (
                <div className="hide-on-tiny" style={{ 
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', 
                  background: '#F0FDF4', color: '#10B981', border: '1px solid #DCFCE7', 
                  borderRadius: '10px', fontSize: '0.7rem', fontWeight: '900'
                }}>
                  <CheckCircle size={14} /> SELESAI
                </div>
              )}
              <button onClick={() => setIsSidebarHidden(!isSidebarHidden)} className="hide-on-mobile" style={{ background: 'white', border: '1px solid #F1F5F9', color: '#94A3B8', cursor: 'pointer', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isSidebarHidden ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
              </button>
            </div>
          </div>

          <div className="lms-player-content custom-scrollbar" style={{ 
            flex: '1 1 auto', 
            height: isMobile ? 'calc(100dvh - 160px)' : 'calc(100vh - 150px)',
            maxHeight: isMobile ? 'calc(100dvh - 160px)' : 'calc(100vh - 150px)',
            overflowY: 'scroll', 
            overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y',
            padding: isMobile ? '1.5rem 1rem 120px' : '2.5rem 1.5rem', 
            background: '#FBFDFA',
            position: 'relative',
            zIndex: 1
          }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
              {activeLesson ? (
                <>
                  {activeLesson.type !== 'quiz' && (
                    <>
                      {activeLesson.type === 'video' && (
                        <div className="lms-video-container" style={{ 
                          background: '#000', aspectRatio: '16/9', width: '100%', 
                          borderRadius: '24px', boxShadow: '0 30px 60px rgba(0,0,0,0.1)',
                          position: 'relative', overflow: 'hidden', marginBottom: '2.5rem',
                          border: '4px solid white'
                        }}>
                          <iframe 
                            width="100%" height="100%" 
                            src={activeLesson.videoUrl || "https://www.youtube.com/embed/dQw4w9WgXcQ"} 
                            title={activeLesson.title} frameBorder="0" allowFullScreen style={{ border: 'none' }}
                          />
                        </div>
                      )}
                      <div style={{ padding: '0 1rem', marginBottom: '5rem', textAlign: 'left' }}>
                        <div className="prose-modern" dangerouslySetInnerHTML={{ __html: activeLesson.content }} style={{ fontSize: '1.15rem', lineHeight: 1.9, color: '#2D3748' }} />
                      </div>
                    </>
                  )}

                  {activeLesson.type === 'quiz' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px', margin: '0 auto' }}>
                      {quizSubmitted ? (
                        <div style={{ textAlign: 'center', padding: '5rem 3rem', background: 'white', borderRadius: '40px', border: '1px solid #E4EDE8', boxShadow: '0 20px 40px rgba(0,0,0,0.02)' }}>
                           <div style={{ width: 100, height: 100, borderRadius: '32px', background: quizPassed ? '#F0FDF4' : '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2.5rem', color: quizPassed ? '#10B981' : '#EF4444', boxShadow: '0 15px 30px rgba(0,0,0,0.05)' }}>
                             {quizPassed ? <Award size={54} strokeWidth={1.5} /> : <AlertCircle size={54} strokeWidth={1.5} />}
                           </div>
                           <h2 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#134E39', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{quizPassed ? 'Mabruk! Anda Lulus' : 'Coba Lagi Yuk!'}</h2>
                           <div style={{ fontSize: '4rem', fontWeight: '950', color: quizPassed ? '#10B981' : '#EF4444', margin: '2rem 0', letterSpacing: '-0.02em' }}>{quizScore}<span style={{ fontSize: '1.5rem', opacity: 0.5 }}>%</span></div>
                           <p style={{ color: '#64748B', fontSize: '1.1rem', marginBottom: '3rem', maxWidth: '400px', margin: '0 auto 3rem' }}>{quizPassed ? 'Selamat! Anda telah menguasai materi ini dengan sangat baik.' : 'Afwan, skor minimal kelulusan adalah 70%. Silakan ulangi kuis untuk memantapkan pemahaman Anda.'}</p>
                           <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
                              {!quizPassed && <button onClick={resetQuiz} style={{ background: '#134E39', color: 'white', padding: '1.2rem 3.5rem', borderRadius: '18px', fontWeight: '900', border: 'none', cursor: 'pointer', boxShadow: '0 10px 20px rgba(19,78,57,0.2)' }}>ULANGI KUIS SEKARANG</button>}
                              {quizPassed && <button onClick={handleQuizPassed} style={{ background: '#134E39', color: 'white', padding: '1.2rem 3.5rem', borderRadius: '18px', fontWeight: '900', border: 'none', cursor: 'pointer', boxShadow: '0 10px 20px rgba(19,78,57,0.2)' }}>LANJUTKAN MATERI</button>}
                           </div>
                        </div>
                      ) : !quizStarted ? (
                        <div style={{ padding: '5rem 3rem', background: 'white', borderRadius: '40px', textAlign: 'center', border: '1px solid #E4EDE8', boxShadow: '0 20px 40px rgba(0,0,0,0.02)' }}>
                           <div style={{ width: 90, height: 90, background: 'rgba(212,175,55,0.1)', color: '#D4AF37', borderRadius: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2.5rem' }}>
                             <Clock size={48} />
                           </div>
                           <h3 style={{ fontSize: '2rem', fontWeight: '900', color: '#134E39', marginBottom: '1.5rem', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Instruksi Kuis</h3>
                           <p style={{ color: '#64748B', fontSize: '1.1rem', marginBottom: '3.5rem', lineHeight: 1.7, maxWidth: '500px', margin: '0 auto 3.5rem' }}>Bismillah, pastikan Anda telah memahami materi sebelumnya. Selesaikan kuis ini dengan skor minimal <strong>70%</strong> untuk melanjutkan.</p>
                           <button onClick={() => setQuizStarted(true)} style={{ background: '#134E39', color: 'white', padding: '1.4rem 4rem', borderRadius: '22px', fontWeight: '900', fontSize: '1.1rem', border: 'none', cursor: 'pointer', boxShadow: '0 20px 40px rgba(19,78,57,0.25)' }}>MULAI KUIS SEKARANG</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                          <div style={{ background: '#134E39', color: 'white', padding: '1rem 2rem', borderRadius: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                             <div style={{ fontWeight: '800', fontSize: '0.9rem' }}>PROGRESS: {Object.keys(quizAnswers).length} / {currentQuiz.length}</div>
                             <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', fontWeight: '900', color: '#D4AF37' }}><Clock size={18} /> {formatTime(timeLeft)}</div>
                          </div>
                          {currentQuiz.map((q, i) => (
                            <div key={i} style={{ background: 'white', padding: '2.5rem', borderRadius: '32px', border: '1px solid #E4EDE8', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                              <div style={{ fontWeight: '900', fontSize: '1.2rem', color: '#134E39', marginBottom: '2rem', lineHeight: 1.5 }}>{i + 1}. {q.q}</div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {q.options.map((opt, oi) => (
                                  <button key={oi} onClick={() => setQuizAnswers(prev => ({ ...prev, [i]: oi }))} style={{ textAlign: 'left', padding: '1.5rem', borderRadius: '18px', border: '2px solid', borderColor: quizAnswers[i] === oi ? '#134E39' : '#F1F5F9', background: quizAnswers[i] === oi ? 'rgba(19,78,57,0.04)' : 'white', cursor: 'pointer', transition: 'all 0.2s', fontSize: '1rem', fontWeight: '700', color: quizAnswers[i] === oi ? '#134E39' : '#475569', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ width: 24, height: 24, borderRadius: '8px', background: quizAnswers[i] === oi ? '#134E39' : '#F1F5F9', color: quizAnswers[i] === oi ? 'white' : '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>{String.fromCharCode(65 + oi)}</div>
                                    {opt}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                          <button onClick={handleQuizSubmit} style={{ background: '#134E39', color: 'white', padding: '1.5rem', borderRadius: '22px', fontWeight: '900', fontSize: '1.1rem', border: 'none', cursor: 'pointer', marginTop: '2rem', boxShadow: '0 20px 40px rgba(19,78,57,0.25)' }}>SUBMIT JAWABAN ANDA</button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '6rem 2rem', color: '#CBD5E1', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                   <BookOpen size={64} opacity={0.3} />
                   <p style={{ fontSize: '1.2rem', fontWeight: '700' }}>Mohon pilih materi di sidebar untuk memulai.</p>
                </div>
              )}
            </div>
          </div>

          {/* 🏁 STICKY FOOTER 🏁 */}
          <div className="lms-footer" style={{ 
            height: isMobile ? '90px' : '80px', 
            background: 'white', 
            borderTop: '1px solid #F1F5F9', 
            display: 'flex', 
            alignItems: 'center', 
            padding: '0 1.5rem', 
            justifyContent: 'space-between', 
            flexShrink: 0, 
            zIndex: 150,
            position: isMobile ? 'fixed' : 'relative',
            bottom: 0,
            left: 0,
            width: '100%',
            boxShadow: isMobile ? '0 -10px 25px rgba(0,0,0,0.05)' : 'none'
          }}>
            {!isMobile && (
              <div className="lms-progress-info" style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '900', color: '#134E39', whiteSpace: 'nowrap' }}>{progressPercent}% <span className="hide-on-mobile">PROGRES</span></div>
                <div style={{ flex: 1, maxWidth: '200px', height: '6px', background: '#F1F5F9', borderRadius: '99px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: '#134E39', width: `${progressPercent}%`, transition: 'width 1s ease' }} />
                </div>
              </div>
            )}
            {activeLesson && activeLesson.type !== 'quiz' && (
              <div style={{ 
                display: 'flex', gap: '0.75rem', flex: 1, 
                justifyContent: isMobile ? 'center' : 'flex-end', 
                alignItems: 'center',
                width: '100%'
              }}>
                <div style={{ display: 'flex', gap: '0.75rem', flex: isMobile ? 1 : 'none' }}>
                  {currentLessonIdx > 0 && (
                    <button 
                      onClick={() => goToLesson(allItems[currentLessonIdx - 1], true)}
                      className="lms-nav-btn"
                      style={{ 
                        flex: isMobile ? 1 : 'none',
                        background: 'white', border: '1.5px solid #E2E8F0', color: '#64748B', 
                        padding: isMobile ? '0.85rem 0.5rem' : '0.9rem 1.5rem', borderRadius: '14px', fontWeight: '800', 
                        fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                        transition: 'all 0.2s'
                      }}
                    >
                      <ChevronLeft size={16} /> {isMobile ? 'BACK' : 'MATERI SEBELUMNYA'}
                    </button>
                  )}
                  
                  {(activeLesson.done || isMobile) && (
                    <button 
                      onClick={() => isMobile ? setIsLmsSidebarOpen(true) : setLmsView('dashboard')}
                      className="lms-nav-btn"
                      style={{ 
                        background: 'white', border: '1.5px solid #134E39', color: '#134E39', 
                        padding: '0.85rem 1rem', borderRadius: '14px', fontWeight: '800', 
                        fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                        transition: 'all 0.2s'
                      }}
                    >
                      <Menu size={16} /> {isMobile ? '' : 'DAFTAR'}
                    </button>
                  )}
                </div>

                <button 
                  onClick={activeLesson.done ? goNext : handleMarkDone}
                  disabled={activeLesson.done && currentLessonIdx === allItems.length - 1}
                  className="lms-done-btn"
                  style={{ 
                    background: activeLesson.done ? '#F0FDF4' : '#134E39', 
                    color: activeLesson.done ? '#10B981' : 'white', 
                    padding: isMobile ? '0.85rem 1.5rem' : '0.9rem 2rem', borderRadius: '14px', 
                    fontWeight: '900', fontSize: '0.8rem', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '8px', border: 'none',
                    boxShadow: activeLesson.done ? 'none' : '0 10px 25px rgba(19,78,57,0.2)',
                    transition: 'all 0.3s',
                    flex: isMobile ? 1.5 : '0 0 auto',
                    justifyContent: 'center',
                    pointerEvents: 'auto',
                    zIndex: 110
                  }}
                >
                  <span className="btn-text">{activeLesson.done ? 'SELESAI' : 'LANJUTKAN'}</span> <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>

      {showLeaveModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(19,78,57,0.4)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div style={{ background: 'white', borderRadius: '35px', width: '100%', maxWidth: '450px', padding: '3.5rem', textAlign: 'center', boxShadow: '0 30px 60px rgba(0,0,0,0.2)' }}>
             <div style={{ width: 80, height: 80, background: '#FEF2F2', color: '#EF4444', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
               <AlertCircle size={48} />
             </div>
             <h3 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#134E39', marginBottom: '1rem', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Keluar dari Kuis?</h3>
             <p style={{ color: '#64748B', fontSize: '1.05rem', marginBottom: '3rem', lineHeight: 1.6 }}>Progres pengerjaan kuis Anda akan hilang jika Anda meninggalkan halaman sekarang.</p>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <button onClick={confirmLeaveQuiz} style={{ padding: '1.2rem', borderRadius: '18px', background: '#EF4444', color: 'white', border: 'none', fontWeight: '900', cursor: 'pointer', boxShadow: '0 10px 20px rgba(239,68,68,0.2)' }}>YA, KELUAR & BATALKAN</button>
                <button onClick={() => setShowLeaveModal(false)} style={{ padding: '1.2rem', borderRadius: '18px', background: '#F1F5F9', color: '#475569', border: 'none', fontWeight: '900', cursor: 'pointer' }}>LANJUTKAN KUIS</button>
             </div>
          </div>
        </div>
      )}

      <style>{`
        .lms-sidebar.open { transform: translateX(0) !important; display: flex !important; width: 340px !important; }
        @media (max-width: 1024px) {
          .lms-sidebar { position: fixed; height: 100%; transform: translateX(-100%); }
          .lms-player-content { padding: 2rem 1rem !important; }
          .mobile-only-btn { display: flex !important; }
          .hide-on-mobile { display: none !important; }
          .lms-lesson-title { font-size: 1rem !important; }
          .lms-top-bar { height: 64px !important; padding: 0 1rem !important; }
          .lms-footer { min-height: 70px !important; padding: 0.75rem 1rem !important; }
          .lms-done-btn { padding: 0.75rem 1.25rem !important; }
          .lms-progress-info { gap: 0.5rem !important; }
        }
        @media (max-width: 480px) {
          .hide-on-tiny { display: none !important; }
          .lms-footer { flex-direction: column; align-items: stretch !important; height: auto !important; padding: 1rem !important; }
          .lms-done-btn { width: 100% !important; justify-content: center; }
          .lms-progress-info { width: 100%; margin-bottom: 0.5rem; }
        }
        .prose-modern h1 { font-size: 2.5rem; color: #134E39; margin-bottom: 2rem; font-weight: 900; font-family: 'Plus Jakarta Sans', sans-serif; }
        @media (max-width: 768px) {
          .prose-modern h1 { font-size: 1.75rem; }
          .prose-modern h2 { font-size: 1.4rem; margin-top: 2rem; }
          .prose-modern p { font-size: 1rem; line-height: 1.7; }
        }
        .prose-modern h2 { font-size: 1.8rem; color: #134E39; margin-top: 3.5rem; margin-bottom: 1.5rem; font-weight: 900; }
        .prose-modern p { margin-bottom: 1.75rem; line-height: 1.9; }
        .prose-modern ul, .prose-modern ol { margin-bottom: 2rem; padding-left: 2rem; }
        .prose-modern li { margin-bottom: 1rem; }
        .prose-modern strong { color: #134E39; font-weight: 800; }
        
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E4EDE8; borderRadius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #CBD5E1; }
      `}</style>
    </div>
  );
}
