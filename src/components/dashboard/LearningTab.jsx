import React, { useState } from 'react';
import {
  CheckCircle, PlayCircle, ChevronDown, ChevronRight, ChevronLeft,
  Award, BookOpen, BarChart2, GraduationCap, Lock, ArrowRight,
  Search, ShieldCheck, Zap, Menu, X, Clock, AlertCircle, Users, FileText,
  Maximize2, Minimize2, Sparkles, LayoutDashboard, Activity, MessageCircle, Phone
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

import { useAppContext } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';

export default function LearningTab({
  classes, activeClass,
  curriculum, activeLesson, setActiveLesson,
  lmsView, setLmsView, quizAnswers, setQuizAnswers,
  quizSubmitted, setQuizSubmitted, progressPercent,
  markLessonDone,
  setActiveTab, enrollClass, selectClassForPlayer, lmsLoading
}) {
  const { user, csContacts } = useAppContext();

  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isLmsSidebarOpen, setIsLmsSidebarOpen] = useState(false);
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [levels, setLevels] = useState([]);

  React.useEffect(() => {
    const fetchTaxonomies = async () => {
      let catData = [];
      try {
        const { data, error } = await supabase.from('lms_categories').select('*').order('order_index');
        if (!error && data) catData = data;
      } catch (e) {
        console.warn("Table lms_categories not found or error fetching", e);
      }
      if (!catData || catData.length === 0) {
        catData = [
          { id: 1, name: 'Umum', order_index: 1 },
          { id: 2, name: 'Pranikah', order_index: 2 },
          { id: 3, name: 'Aqidah', order_index: 3 },
          { id: 4, name: 'Fikih', order_index: 4 },
          { id: 5, name: 'Keluarga', order_index: 5 }
        ];
      }
      setCategories(catData);

      let lvlData = [];
      try {
        const { data, error } = await supabase.from('lms_levels').select('*').order('order_index');
        if (!error && data) lvlData = data;
      } catch (e) {
        console.warn("Table lms_levels not found or error fetching", e);
      }
      if (!lvlData || lvlData.length === 0) {
        lvlData = [
          { id: 1, name: 'Dasar', order_index: 1 },
          { id: 2, name: 'Menengah', order_index: 2 },
          { id: 3, name: 'Lanjutan', order_index: 3 }
        ];
      }
      setLevels(lvlData);
    };
    fetchTaxonomies();
  }, []);

  React.useEffect(() => {
    setIsMounted(true);
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [pendingLesson, setPendingLesson] = useState(null);
  const [timeLeft, setTimeLeft] = useState(600); // 10 menit default
  const [quizAttempts, setQuizAttempts] = useState([]);

  React.useEffect(() => {
    const saved = localStorage.getItem(`quiz_history_${user?.id}_${activeLesson?.id}`);
    setQuizAttempts(saved ? JSON.parse(saved) : []);
  }, [activeLesson?.id, user?.id]);

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
  }, [quizStarted, quizSubmitted, timeLeft, setQuizSubmitted]);

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

  if (lmsLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10rem 2rem', gap: '1.5rem' }}>
        <div style={{ position: 'relative', width: '80px', height: '80px' }}>
          <div style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', border: '4px solid rgba(19,78,57,0.1)', borderTopColor: '#134E39', animation: 'spin 1s linear infinite' }} />
          <div style={{ position: 'absolute', width: '60%', height: '60%', top: '20%', left: '20%', borderRadius: '50%', border: '4px solid rgba(212,175,55,0.1)', borderBottomColor: '#D4AF37', animation: 'spin 1.5s linear infinite reverse' }} />
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#134E39' }}>
            <Sparkles size={24} />
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ margin: 0, fontWeight: '900', color: '#134E39', fontSize: '1.2rem' }}>Menyiapkan Kurikulum</h3>
          <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '0.9rem', fontWeight: '600' }}>Mohon tunggu sebentar, kami sedang memuat materi belajar Anda...</p>
        </div>
      </div>
    );
  }

  if (!isMounted) return null;

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };



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



  // ============================
  // VIEW: ACADEMY DASHBOARD
  // ============================
  if (lmsView === 'dashboard') {

    const completedClasses = classes.filter(cls => {
      if (cls.isSuspended) return false;
      const clsLessons = cls.modules.flatMap(m => m.items);
      return clsLessons.length > 0 && clsLessons.every(l => l.done);
    }).length;
    const totalAcademyLessons = classes.reduce((acc, cls) => acc + (cls.isSuspended ? 0 : cls.modules.flatMap(m => m.items).length), 0);
    const completedAcademyLessons = classes.reduce((acc, cls) => acc + (cls.isSuspended ? 0 : cls.modules.flatMap(m => m.items).filter(l => l.done).length), 0);

    const chartData = totalAcademyLessons === 0 
      ? [{ name: 'Belum Mulai', value: 1, color: '#F1F5F9' }]
      : [
          { name: 'Selesai', value: completedAcademyLessons, color: '#134E39' },
          ...(totalAcademyLessons > completedAcademyLessons 
            ? [{ name: 'Belum', value: totalAcademyLessons - completedAcademyLessons, color: '#F1F5F9' }]
            : [])
        ];

    return (
      <div key="academy-dashboard" className="academy-dashboard-container">
        <style>{`
          .academy-dashboard-container {
            display: flex;
            flex-direction: column;
            min-height: 100vh;
            background: white;
            animation: fadeIn 0.5s ease;
          }
          .stat-card {
            background: white;
            padding: 1.75rem;
            border-radius: 16px;
            border: 1px solid #E4EDE8;
            box-shadow: 0 10px 30px rgba(19, 78, 57, 0.015);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .stat-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 20px 40px rgba(19, 78, 57, 0.05);
            border-color: #D4AF37;
          }
          .class-item-card {
            display: flex;
            align-items: center;
            gap: 2rem;
            padding: 1.5rem;
            border-radius: 16px;
            background: white;
            border: 1px solid #E4EDE8;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            flex-wrap: wrap;
          }
          .class-item-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 15px 35px rgba(19, 78, 57, 0.03);
            border-color: #134E39;
          }
          @media (max-width: 768px) {
            .class-item-card {
              gap: 1.25rem !important;
              padding: 1.25rem !important;
              border-radius: 12px !important;
            }
          }
        `}</style>
        
        {/* PREMIUM ACADEMY HERO */}
        <div style={{ 
          padding: '2rem 5% 2.5rem', 
          background: 'linear-gradient(180deg, #F4F9F6 0%, #FFFFFF 100%)', 
          color: '#134E39',
          position: 'relative',
          overflow: 'hidden',
          borderBottom: '1px solid #E4EDE8',
          flexShrink: 0
        }}>
          {/* Decorative Elements */}
          <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '300px', height: '300px', background: 'rgba(212,175,55,0.08)', borderRadius: '50%', filter: 'blur(60px)' }}></div>
          <div style={{ position: 'absolute', bottom: '-20px', left: '10%', width: '150px', height: '150px', background: 'rgba(19,78,57,0.02)', borderRadius: '50%', filter: 'blur(40px)' }}></div>
 
          <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
            <div>
              <button 
                onClick={() => setLmsView('welcome')}
                style={{ 
                  background: 'white', border: '1px solid #e2e8f0', color: '#134E39', 
                  padding: '0.6rem 1.2rem', borderRadius: '10px', fontSize: '0.75rem', 
                  fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', 
                  gap: '8px', marginBottom: '1.25rem', boxShadow: '0 2px 5px rgba(0,0,0,0.02)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateX(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}
              >
                <ChevronLeft size={16} /> KEMBALI KE BERANDA
              </button>
 
              <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.2rem)', fontWeight: '950', margin: 0, lineHeight: 1.1, letterSpacing: '-0.02em', color: '#134E39' }}>
                Dashboard <span style={{ color: '#D4AF37' }}>Akademi</span>
              </h1>
              <p style={{ margin: '0.75rem 0 0', color: '#64748b', fontSize: '1.05rem', maxWidth: '600px', fontWeight: 500, lineHeight: 1.6 }}>
                Kelola dan pantau setiap progres pembelajaran Anda untuk membekali diri dengan ilmu syar'i.
              </p>
            </div>
 
            <div style={{ 
              background: 'linear-gradient(135deg, #134E39 0%, #1e6b52 100%)', 
              padding: '1.5rem 2rem', borderRadius: '16px', 
              textAlign: 'center', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 10px 25px rgba(19, 78, 57, 0.15)', minWidth: '190px',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'white'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Award size={24} color="#D4AF37" fill="#D4AF37" />
                <span style={{ fontSize: '2.5rem', fontWeight: '950', color: '#D4AF37', lineHeight: 1 }}>{completedClasses}</span>
              </div>
              <div style={{ fontSize: '0.7rem', fontWeight: '900', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Sertifikat Diraih</div>
            </div>
          </div>
        </div>
 
        {/* CONTENT AREA */}
        <div style={{ padding: '2.5rem 5% 5rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            
            {/* STATS TILES GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
              {[
                { label: 'Kelas Diikuti', value: classes.filter(c => c.isEnrolled && !c.isSuspended).length, total: classes.length, color: '#134E39', icon: <BookOpen />, bg: '#f0fdf4' },
                { label: 'Materi Selesai', value: completedAcademyLessons, total: totalAcademyLessons, color: '#D4AF37', icon: <CheckCircle />, bg: '#fefbf0' },
                { label: 'Total Progres', value: `${totalAcademyLessons > 0 ? Math.round((completedAcademyLessons / totalAcademyLessons) * 100) : 0}%`, total: '100%', color: '#0ea5e9', icon: <BarChart2 />, bg: '#f0f9ff' }
              ].map((stat, i) => (
                <div key={i} className="stat-card">
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color, marginBottom: '1.25rem' }}>
                    {React.cloneElement(stat.icon, { size: 24 })}
                  </div>
                  <div style={{ fontSize: '1.85rem', fontWeight: '950', color: '#134E39', marginBottom: '0.2rem' }}>{stat.value}</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* TWO-COLUMN GRAPHICS & LEARNING TIP SECTION */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
               {/* Column 1: Statistik Belajar Donut Chart */}
               <div style={{ 
                 background: 'white', padding: '2rem', borderRadius: '16px', 
                 border: '1px solid #E4EDE8', display: 'flex', flexWrap: 'wrap', 
                 alignItems: 'center', justifyContent: 'center', gap: '2rem',
                 boxShadow: '0 10px 30px rgba(19, 78, 57, 0.015)'
               }}>
                  <div style={{ position: 'relative', width: '150px', height: '150px', flexShrink: 0 }}>
                    {isMounted && (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie 
                            data={chartData} 
                            innerRadius={50} outerRadius={68} 
                            paddingAngle={chartData.length > 1 ? 4 : 0} 
                            dataKey="value" stroke="none"
                          >
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                    <div style={{
                      position: 'absolute', top: '50%', left: '50%',
                      transform: 'translate(-50%, -50%)', textAlign: 'center',
                      pointerEvents: 'none'
                    }}>
                      <div style={{ fontSize: '1.65rem', fontWeight: '950', color: '#134E39', lineHeight: 1 }}>
                        {totalAcademyLessons > 0 ? Math.round((completedAcademyLessons / totalAcademyLessons) * 100) : 0}%
                      </div>
                      <div style={{ fontSize: '0.6rem', fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase', marginTop: '2px', letterSpacing: '0.05em' }}>
                        Selesai
                      </div>
                    </div>
                  </div>
                  <div style={{ flex: '1 1 200px', textAlign: 'left' }}>
                     <h4 style={{ margin: 0, fontSize: '0.75rem', fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Detail Progress</h4>
                     <div style={{ fontSize: '2rem', fontWeight: '950', color: '#134E39', margin: '4px 0', lineHeight: 1 }}>
                       {completedAcademyLessons} <span style={{ fontSize: '1.1rem', color: '#94A3B8', fontWeight: '700' }}>/ {totalAcademyLessons} Materi</span>
                     </div>
                     <p style={{ margin: '8px 0 0', fontSize: '0.85rem', color: '#64748B', fontWeight: 600, lineHeight: 1.5 }}>
                       {completedAcademyLessons === totalAcademyLessons && totalAcademyLessons > 0 
                         ? 'Mabruk! Seluruh materi pembelajaran di akademi telah Anda selesaikan.' 
                         : 'Pertahankan semangat belajar Anda untuk memahami konsep pernikahan syar\'i.'}
                     </p>
                  </div>
               </div>

               {/* Column 2: Premium Quote / Pathway Accent */}
               <div style={{ 
                 background: 'linear-gradient(135deg, #134E39 0%, #1e6b52 100%)', 
                 padding: '2.25rem 2rem', borderRadius: '16px', 
                 color: 'white', position: 'relative', overflow: 'hidden',
                 display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                 boxShadow: '0 12px 30px rgba(19, 78, 57, 0.12)',
                 border: '1px solid rgba(255,255,255,0.05)'
               }}>
                 {/* Decorative background shape */}
                 <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '130px', height: '130px', background: 'rgba(212,175,55,0.12)', borderRadius: '50%', filter: 'blur(10px)' }}></div>
                 <div style={{ position: 'absolute', bottom: '-40px', left: '-20px', width: '150px', height: '150px', background: 'rgba(255,255,255,0.03)', borderRadius: '50%', filter: 'blur(20px)' }}></div>
                 
                 <div style={{ position: 'relative', zIndex: 1 }}>
                   <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.1)', color: '#D4AF37', fontSize: '0.7rem', fontWeight: '900', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '6px 14px', borderRadius: '99px', marginBottom: '1.25rem' }}>
                     <Sparkles size={12} fill="#D4AF37" /> Tips Belajar Hari Ini
                   </div>
                   <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: '900', color: '#ffffff', lineHeight: 1.3, letterSpacing: '-0.01em' }}>
                     Ilmu Sebelum Amal dan Ucapan
                   </h3>
                   <p style={{ margin: '0.85rem 0 0', color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.9rem', lineHeight: 1.6, fontWeight: 500 }}>
                     "Pernikahan adalah ibadah terpanjang. Bekali diri Anda dengan pemahaman syar'i untuk membangun keluarga sakinah, mawaddah, warahmah."
                   </p>
                 </div>

                 <div style={{ position: 'relative', zIndex: 1, marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                   <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4AF37', flexShrink: 0 }}>
                     <Award size={18} />
                   </div>
                   <span style={{ fontSize: '0.8rem', fontWeight: '800', color: 'rgba(255, 255, 255, 0.95)' }}>
                     Sertifikat otomatis terbit setelah Anda menuntaskan seluruh materi kelas.
                   </span>
                 </div>
               </div>
            </div>
 
            {/* DAFTAR KELAS SECTION */}
            <div style={{ 
              background: 'white', borderRadius: '16px', padding: 'clamp(1.5rem, 5vw, 3rem)', 
              border: '1px solid #E4EDE8', boxShadow: '0 20px 40px rgba(19, 78, 57, 0.015)' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 'clamp(1.25rem, 3vw, 1.65rem)', fontWeight: '950', color: '#134E39', letterSpacing: '-0.01em' }}>Daftar Kelas Anda</h3>
                  <p style={{ margin: '0.4rem 0 0', color: '#64748B', fontSize: '0.85rem', fontWeight: 600 }}>Lanjutkan materi yang belum Anda selesaikan.</p>
                </div>
                <button 
                  onClick={() => setLmsView('catalog')}
                  style={{ 
                    background: 'rgba(19,78,57,0.05)', color: '#134E39', border: 'none', 
                    padding: '0.8rem 1.5rem', borderRadius: '14px', fontWeight: '900', 
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                    fontSize: '0.8rem', transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(19,78,57,0.1)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(19,78,57,0.05)';
                    e.currentTarget.style.transform = 'translateY(0)';
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
                      <div key={cls.id} className="class-item-card" style={{ opacity: cls.isSuspended ? 0.85 : 1 }}>
                        <div style={{ width: '90px', height: '90px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0, border: '1px solid #E4EDE8', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
                          <img src={cls.banner_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=200&auto=format&fit=crop"} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: cls.isSuspended ? 'grayscale(100%)' : 'none' }} />
                        </div>
                        <div style={{ flex: '1 1 200px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: '800', background: 'rgba(59, 130, 246, 0.08)', color: '#1e40af', padding: '2px 8px', borderRadius: '6px', textTransform: 'uppercase', letterSpacing: '0.02em', border: '1px solid rgba(59, 130, 246, 0.15)', flexShrink: 0 }}>
                              {cls.category || 'Umum'}
                            </span>
                            <span style={{ fontSize: '0.65rem', fontWeight: '800', background: 'rgba(71, 85, 105, 0.08)', color: '#475569', padding: '2px 8px', borderRadius: '6px', textTransform: 'uppercase', letterSpacing: '0.02em', border: '1px solid rgba(71, 85, 105, 0.15)', flexShrink: 0 }}>
                              {cls.level || 'Dasar'}
                            </span>
                            <div style={{ fontWeight: '950', fontSize: '1.25rem', color: cls.isSuspended ? '#64748b' : '#134E39', letterSpacing: '-0.01em' }}>{cls.title}</div>
                            {cls.isSuspended && (
                              <span style={{ fontSize: '0.65rem', fontWeight: '800', background: '#fee2e2', color: '#b91c1c', padding: '3px 8px', borderRadius: '6px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Akses Ditangguhkan</span>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', opacity: cls.isSuspended ? 0.5 : 1 }}>
                            <div style={{ flex: 1, height: '8px', background: '#F1F5F9', borderRadius: '99px', overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #134E39 0%, #1e6b52 100%)', borderRadius: '99px', transition: 'width 0.8s ease' }} />
                            </div>
                            <span style={{ fontSize: '0.9rem', fontWeight: '900', color: '#134E39', minWidth: '45px', textAlign: 'right' }}>{pct}%</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            if (cls.isSuspended) return;
                            if (pct === 100) setActiveTab(`certificate/${cls.id}`);
                            else selectClassForPlayer(cls);
                          }}
                          disabled={cls.isSuspended}
                          style={{ 
                            background: cls.isSuspended ? '#e2e8f0' : (pct === 100 ? '#D4AF37' : '#134E39'), 
                            color: cls.isSuspended ? '#94a3b8' : (pct === 100 ? '#134E39' : 'white'), 
                            border: 'none', padding: '0.9rem 1.75rem', 
                            borderRadius: '14px', fontWeight: '900', 
                            fontSize: '0.85rem', cursor: cls.isSuspended ? 'not-allowed' : 'pointer', 
                            boxShadow: cls.isSuspended ? 'none' : (pct === 100 ? '0 8px 20px rgba(212,175,55,0.25)' : '0 8px 20px rgba(19,78,57,0.15)'), 
                            transition: 'all 0.2s',
                            minWidth: '160px',
                            textAlign: 'center'
                          }}
                          onMouseEnter={e => {
                            if (cls.isSuspended) return;
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = pct === 100 ? '0 12px 25px rgba(212,175,55,0.35)' : '0 12px 25px rgba(19,78,57,0.25)';
                          }}
                          onMouseLeave={e => {
                            if (cls.isSuspended) return;
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = pct === 100 ? '0 8px 20px rgba(212,175,55,0.25)' : '0 8px 20px rgba(19,78,57,0.15)';
                          }}
                        >
                          {cls.isSuspended ? 'DITANGGUHKAN' : (pct === 100 ? 'SERTIFIKAT' : (pct > 0 ? 'LANJUTKAN' : 'MULAI BELAJAR'))}
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ textAlign: 'center', padding: '5rem 2rem', background: '#F8FAF9', borderRadius: '16px', border: '2px dashed #E2E8F0' }}>
                     <BookOpen size={64} color="#CBD5E1" style={{ marginBottom: '1.5rem', opacity: 0.5 }} />
                     <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#134E39', marginBottom: '1rem' }}>Belum Ada Kelas</h3>
                     <p style={{ color: '#64748B', fontWeight: '600', maxWidth: '400px', margin: '0 auto 2.5rem', lineHeight: 1.6 }}>Anda belum terdaftar di kelas manapun. Silakan pilih kelas dari daftar kelas kami untuk memulai.</p>
                     <button onClick={() => setLmsView('catalog')} style={{ background: '#134E39', color: 'white', border: 'none', padding: '1.2rem 3rem', borderRadius: '12px', fontWeight: '900', cursor: 'pointer', boxShadow: '0 10px 20px rgba(19,78,57,0.2)' }}>LIHAT DAFTAR KELAS</button>
                  </div>
                )}
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
        display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 200px)', 
        background: 'white', animation: 'fadeIn 0.5s ease', justifyContent: 'center', 
        alignItems: 'center', padding: isMobile ? '1.5rem 1rem' : '2.5rem 1.5rem',
        textAlign: 'center'
      }}>
        <div style={{ 
          width: '80px', height: '80px', borderRadius: '24px', 
          background: 'rgba(212, 175, 55, 0.1)', display: 'flex', 
          alignItems: 'center', justifyContent: 'center', color: '#D4AF37', 
          marginBottom: '1.25rem' 
        }}>
          <GraduationCap size={42} />
        </div>
        
        <h1 style={{ 
          fontSize: isMobile ? '2rem' : '2.8rem', fontWeight: '900', 
          color: '#134E39', marginBottom: '0.75rem', lineHeight: 1.2 
        }}>
          Selamat Datang di <br />
          <span style={{ color: '#D4AF37' }}>Separuh Agama Academy</span>
        </h1>
        
        <p style={{ 
          fontSize: '1.1rem', color: '#64748b', lineHeight: 1.7, 
          marginBottom: '1.5rem', maxWidth: '650px', fontWeight: '500' 
        }}>
          Bekali niat suci Anda dengan ilmu syar'i tentang pernikahan dan rumah tangga sebelum melangkah menuju ikatan yang abadi di bawah ridha Allah.
        </p>
 
        <button 
          onClick={() => setLmsView('catalog')}
          style={{ 
            background: '#D4AF37', color: '#134E39', border: 'none', 
            padding: '1.25rem 3rem', borderRadius: '16px', fontWeight: '900', 
            fontSize: '1rem', cursor: 'pointer', display: 'flex', 
            alignItems: 'center', gap: '12px', boxShadow: '0 15px 35px rgba(212,175,55,0.3)',
            transition: 'all 0.3s'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          MULAI BELAJAR SEKARANG <ArrowRight size={22} />
        </button>
      </div>
    );
  }

  // ============================
  // VIEW: CATALOG
  // ============================
  if (lmsView === 'catalog') {
    const filteredClasses = classes.filter(cls => {
      const matchesSearch = cls.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (cls.description && cls.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || (cls.category || 'Umum').toLowerCase() === selectedCategory.toLowerCase();
      const matchesLevel = selectedLevel === 'all' || (cls.level || 'Dasar').toLowerCase() === selectedLevel.toLowerCase();

      const clsLessonsCount = cls.modules.reduce((a, m) => a + m.items.length, 0);
      const clsDoneCount = cls.modules.reduce((a, m) => a + m.items.filter(i => i.done).length, 0);
      const isFinished = clsLessonsCount > 0 && clsLessonsCount === clsDoneCount;
      
      let matchesFilter = true;
      if (activeFilter === 'enrolled') {
        matchesFilter = cls.isEnrolled && !isFinished;
      } else if (activeFilter === 'completed') {
        matchesFilter = isFinished;
      }
      return matchesSearch && matchesCategory && matchesLevel && matchesFilter;
    });

    return (
      <div key="academy-catalog" className="academy-catalog-container">
        <style>{`
          .academy-catalog-container {
            display: flex;
            flex-direction: column;
            min-height: 100vh;
            background: white;
            animation: fadeIn 0.5s ease;
          }
          .catalog-hero-section {
            padding: 2.5rem 5% 1.5rem;
            background: white;
            border-bottom: 1px solid #E4EDE8;
            position: relative;
            overflow: hidden;
            flex-shrink: 0;
          }
          .catalog-filter-bar {
            padding: 2rem 5% 1.5rem;
            display: flex;
            gap: 20px;
            align-items: center;
            background: white;
            flex-wrap: wrap;
            flex-shrink: 0;
          }
          .catalog-grid-wrapper {
            padding: 0 5% 4rem;
            flex: 1 0 auto;
            background: white;
          }
          .catalog-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            gap: 2rem;
          }
          .catalog-card {
            border-radius: 24px;
            overflow: hidden;
            border: 1px solid #E4EDE8;
            background: white;
            display: flex;
            flex-direction: column;
            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            box-shadow: 0 4px 20px rgba(19, 78, 57, 0.02);
            position: relative;
          }
          .catalog-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 20px 40px rgba(19, 78, 57, 0.08);
            border-color: rgba(19, 78, 57, 0.15);
          }
          .catalog-card-banner {
            position: relative;
            height: 220px;
            overflow: hidden;
            background: #F1F5F9;
          }
          .catalog-card-banner img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
          }
          .catalog-card:hover .catalog-card-banner img {
            transform: scale(1.08);
          }
          .catalog-card-content {
            padding: 2rem;
            flex: 1;
            display: flex;
            flex-direction: column;
          }

          @media (max-width: 768px) {
            .catalog-hero-section {
              padding: 2rem 1.25rem 1.5rem !important;
            }
            .catalog-hero-section h1 {
              font-size: 1.75rem !important;
            }
            .catalog-hero-section p {
              font-size: 0.95rem !important;
              margin-top: 0.75rem !important;
            }
            .catalog-filter-bar {
              padding: 1.5rem 1.25rem 1.5rem !important;
              gap: 15px !important;
            }
            .catalog-grid-wrapper {
              padding: 0 1.25rem 3rem !important;
            }
            .catalog-grid {
              grid-template-columns: 1fr !important;
              gap: 1.5rem !important;
            }
            .catalog-card {
              border-radius: 20px !important;
            }
            .catalog-card-banner {
              height: 180px !important;
            }
            .catalog-card-content {
              padding: 1.5rem !important;
            }
          }
        `}</style>
        
        <div className="catalog-hero-section">
          {/* Decorative Elements */}
          <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '300px', height: '300px', background: 'rgba(212,175,55,0.05)', borderRadius: '50%', filter: 'blur(60px)' }}></div>
          
          <button 
            onClick={() => setLmsView('welcome')}
            style={{ 
              background: 'white', border: '1px solid #e2e8f0', color: '#134E39', 
              padding: '0.6rem 1.2rem', borderRadius: '10px', fontSize: '0.75rem', 
              fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', 
              gap: '8px', marginBottom: '1.25rem', boxShadow: '0 2px 5px rgba(0,0,0,0.02)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateX(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}
          >
            <ChevronLeft size={16} /> KEMBALI KE BERANDA
          </button>

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(19,78,57,0.05)', color: '#134E39', fontSize: '0.7rem', fontWeight: '900', letterSpacing: '0.15em', textTransform: 'uppercase', padding: '8px 18px', borderRadius: '99px', marginBottom: '0.75rem' }}>
              <Zap size={14} fill="#134E39" /> KURIKULUM TAARUF
            </div>
            
            <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: '950', margin: 0, lineHeight: 1.1, color: '#134E39', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
              DAFTAR <span style={{ color: '#D4AF37' }}>KELAS</span> 
            </h1>
            <p style={{ fontSize: '1.25rem', color: '#64748b', marginTop: '0.75rem', maxWidth: '700px', lineHeight: 1.6, fontWeight: 500 }}>
              Persiapkan diri menuju pernikahan sakinah mawaddah warahmah dengan kurikulum terbaik kami.
            </p>
          </div>
        </div>

        {/* ⚪️ SEARCH & FILTER BAR ⚪️ */}
        <div className="catalog-filter-bar" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap', width: '100%' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '280px', maxWidth: '400px' }}>
              <Search size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input 
                type="text" 
                placeholder="Cari kursus..." 
                value={searchQuery || ''}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '0.9rem 1rem 0.9rem 3.2rem', 
                  borderRadius: '14px', 
                  border: '1.5px solid #E2E8F0', 
                  background: 'white', 
                  fontSize: '0.9rem', 
                  fontWeight: '600', 
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#134E39';
                  e.target.style.boxShadow = '0 4px 12px rgba(19, 78, 57, 0.06)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#E2E8F0';
                  e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)';
                }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: 'Semua Kelas' },
                { id: 'enrolled', label: 'Sedang Diikuti' },
                { id: 'completed', label: 'Selesai' }
              ].map(filter => (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  style={{
                    padding: '0.8rem 1.5rem',
                    borderRadius: '99px',
                    border: 'none',
                    fontWeight: '800',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    background: activeFilter === filter.id ? '#134E39' : 'rgba(19, 78, 57, 0.05)',
                    color: activeFilter === filter.id ? 'white' : '#134E39',
                    boxShadow: activeFilter === filter.id ? '0 8px 16px rgba(19, 78, 57, 0.15)' : 'none',
                    transform: activeFilter === filter.id ? 'scale(1.02)' : 'none'
                  }}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Kategori & Level Pills */}
          {categories.length > 0 && (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'row', 
              flexWrap: 'wrap',
              gap: '1.75rem', 
              width: '100%', 
              borderTop: '1px solid #f1f5f9', 
              paddingTop: '1.25rem', 
              marginTop: '0.5rem',
              textAlign: 'left'
            }}>
              {/* Kategori Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1 1 auto', minWidth: '290px' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>Kategori</span>
                  <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#cbd5e1' }}></span>
                  <span style={{ fontWeight: '500', textTransform: 'none', color: '#cbd5e1' }}>Pilih bidang studi</span>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {['all', ...categories.map(c => c.name)].map(cat => {
                    const isActive = selectedCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        style={{
                          padding: '0.45rem 1.1rem',
                          borderRadius: '99px',
                          border: '1px solid ' + (isActive ? '#134E39' : '#e2e8f0'),
                          fontWeight: '700',
                          fontSize: '0.72rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                          background: isActive ? '#134E39' : '#ffffff',
                          color: isActive ? '#ffffff' : '#64748b',
                          boxShadow: isActive ? '0 4px 12px rgba(19, 78, 57, 0.15)' : 'none',
                        }}
                        onMouseEnter={e => {
                          if (!isActive) {
                            e.currentTarget.style.borderColor = '#cbd5e1';
                            e.currentTarget.style.background = '#f8fafc';
                            e.currentTarget.style.color = '#1e293b';
                          }
                        }}
                        onMouseLeave={e => {
                          if (!isActive) {
                            e.currentTarget.style.borderColor = '#e2e8f0';
                            e.currentTarget.style.background = '#ffffff';
                            e.currentTarget.style.color = '#64748b';
                          }
                        }}
                      >
                        {cat === 'all' ? 'Semua Kategori' : cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Level Column */}
              {levels.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1 1 auto', minWidth: '220px' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>Tingkatan</span>
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#cbd5e1' }}></span>
                    <span style={{ fontWeight: '500', textTransform: 'none', color: '#cbd5e1' }}>Pilih tingkat kesulitan</span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {['all', ...levels.map(l => l.name)].map(lvl => {
                      const isActive = selectedLevel === lvl;
                      return (
                        <button
                          key={lvl}
                          onClick={() => setSelectedLevel(lvl)}
                          style={{
                            padding: '0.45rem 1.1rem',
                            borderRadius: '99px',
                            border: '1px solid ' + (isActive ? '#475569' : '#e2e8f0'),
                            fontWeight: '700',
                            fontSize: '0.72rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                            background: isActive ? '#475569' : '#ffffff',
                            color: isActive ? '#ffffff' : '#64748b',
                            boxShadow: isActive ? '0 4px 12px rgba(71, 85, 105, 0.15)' : 'none',
                          }}
                          onMouseEnter={e => {
                            if (!isActive) {
                              e.currentTarget.style.borderColor = '#cbd5e1';
                              e.currentTarget.style.background = '#f8fafc';
                              e.currentTarget.style.color = '#1e293b';
                            }
                          }}
                          onMouseLeave={e => {
                            if (!isActive) {
                              e.currentTarget.style.borderColor = '#e2e8f0';
                              e.currentTarget.style.background = '#ffffff';
                              e.currentTarget.style.color = '#64748b';
                            }
                          }}
                        >
                          {lvl === 'all' ? 'Semua Level' : lvl}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ⚪️ CLASS GRID ⚪️ */}
        <div className="catalog-grid-wrapper">
          <div className="catalog-grid">
            {filteredClasses.length > 0 ? (
              filteredClasses.map(cls => {
                const clsLessonsCount = cls.modules.reduce((a, m) => a + m.items.length, 0);
                const clsDoneCount = cls.modules.reduce((a, m) => a + m.items.filter(i => i.done).length, 0);
                const isFinished = clsLessonsCount > 0 && clsLessonsCount === clsDoneCount;
                const pct = clsLessonsCount > 0 ? Math.round((clsDoneCount / clsLessonsCount) * 100) : 0;
                
                const totalModules = cls.modules.length;
                
                return (
                  <div key={cls.id} className="catalog-card">
                    {/* Banner Image */}
                    <div className="catalog-card-banner">
                      <img src={cls.banner_url || "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop"} alt={cls.title} style={{ filter: cls.isSuspended ? 'grayscale(100%)' : 'none' }} />
                      {cls.isSuspended ? (
                        <div style={{ 
                          position: 'absolute', top: '1rem', right: '1rem', 
                          background: 'rgba(239, 68, 68, 0.95)', 
                          backdropFilter: 'blur(8px)',
                          color: 'white', padding: '6px 14px', borderRadius: '99px', 
                          fontSize: '0.65rem', fontWeight: '900', letterSpacing: '0.05em',
                          boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)',
                          display: 'flex', alignItems: 'center', gap: '4px', zIndex: 2
                        }}>
                          <AlertCircle size={12} fill="white" /> DITANGGUHKAN
                        </div>
                      ) : isFinished ? (
                        <div style={{ 
                          position: 'absolute', top: '1rem', right: '1rem', 
                          background: 'rgba(212, 175, 55, 0.95)', 
                          backdropFilter: 'blur(8px)',
                          color: 'white', padding: '6px 14px', borderRadius: '99px', 
                          fontSize: '0.65rem', fontWeight: '900', letterSpacing: '0.05em',
                          boxShadow: '0 4px 15px rgba(212, 175, 55, 0.3)',
                          display: 'flex', alignItems: 'center', gap: '4px', zIndex: 2
                        }}>
                          <Award size={12} fill="white" /> SELESAI
                        </div>
                      ) : cls.isEnrolled && (
                        <div style={{ 
                          position: 'absolute', top: '1rem', right: '1rem', 
                          background: 'rgba(19, 78, 57, 0.95)', 
                          backdropFilter: 'blur(8px)',
                          color: 'white', padding: '6px 14px', borderRadius: '99px', 
                          fontSize: '0.65rem', fontWeight: '900', letterSpacing: '0.05em',
                          boxShadow: '0 4px 15px rgba(19, 78, 57, 0.3)',
                          display: 'flex', alignItems: 'center', gap: '4px', zIndex: 2
                        }}>
                          <PlayCircle size={12} fill="white" /> DIIKUTI
                        </div>
                      )}
                    </div>
                    
                    {/* Content Area */}
                    <div className="catalog-card-content">
                      {/* Category, Modul & Materi badges */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: '800', background: 'rgba(59, 130, 246, 0.08)', color: '#1e40af', padding: '4px 10px', borderRadius: '6px', textTransform: 'uppercase', letterSpacing: '0.02em', border: '1px solid rgba(59, 130, 246, 0.15)' }}>
                          {cls.category || 'Umum'}
                        </span>
                        <span style={{ fontSize: '0.7rem', fontWeight: '800', background: 'rgba(71, 85, 105, 0.08)', color: '#475569', padding: '4px 10px', borderRadius: '6px', textTransform: 'uppercase', letterSpacing: '0.02em', border: '1px solid rgba(71, 85, 105, 0.15)' }}>
                          {cls.level || 'Dasar'}
                        </span>
                        <span style={{ fontSize: '0.7rem', fontWeight: '800', background: 'rgba(19, 78, 57, 0.06)', color: '#134E39', padding: '4px 10px', borderRadius: '6px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                          {totalModules} Modul
                        </span>
                        <span style={{ fontSize: '0.7rem', fontWeight: '800', background: 'rgba(212, 175, 55, 0.08)', color: '#B59220', padding: '4px 10px', borderRadius: '6px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                          {clsLessonsCount} Materi
                        </span>
                      </div>

                      <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#134E39', marginBottom: '0.75rem', lineHeight: 1.3, letterSpacing: '-0.01em' }}>{cls.title}</h3>
                      <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem', lineHeight: 1.5, flex: 1, fontWeight: '500' }}>
                        {cls.description || "Program intensif persiapan menuju keluarga sakinah mawaddah warahmah."}
                      </p>
                      
                      {/* Progres Belajar for Enrolled Classes */}
                      {cls.isEnrolled && !isFinished && (
                        <div style={{ marginBottom: '1.5rem', background: '#F8FAF9', padding: '12px', borderRadius: '12px', border: '1px solid #E4EDE8' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b' }}>Progres Belajar</span>
                            <span style={{ fontSize: '0.75rem', fontWeight: '900', color: '#134E39' }}>{pct}%</span>
                          </div>
                          <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '99px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #134E39 0%, #1e6b52 100%)', borderRadius: '99px', transition: 'width 0.8s ease' }} />
                          </div>
                        </div>
                      )}

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto' }}>
                        <button 
                          onClick={() => {
                            if (cls.isSuspended) return;
                            cls.isEnrolled ? selectClassForPlayer(cls) : enrollClass(cls.id);
                          }} 
                          disabled={cls.isSuspended}
                          style={{ 
                            width: '100%', 
                            background: cls.isSuspended 
                              ? '#e2e8f0' 
                              : (isFinished ? 'rgba(19, 78, 57, 0.08)' : 'linear-gradient(135deg, #134E39 0%, #1e6b52 100%)'), 
                            color: cls.isSuspended ? '#94a3b8' : (isFinished ? '#134E39' : 'white'), 
                            padding: '0.95rem', 
                            borderRadius: '14px', 
                            fontSize: '0.85rem', 
                            fontWeight: '900', 
                            border: 'none', 
                            cursor: cls.isSuspended ? 'not-allowed' : 'pointer', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            gap: '8px',
                            boxShadow: cls.isSuspended ? 'none' : (isFinished ? 'none' : '0 6px 20px rgba(19, 78, 57, 0.15)'),
                            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                          }}
                          onMouseEnter={e => {
                            if (cls.isSuspended) return;
                            if (!isFinished) {
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.boxShadow = '0 10px 25px rgba(19, 78, 57, 0.25)';
                            } else {
                              e.currentTarget.style.background = 'rgba(19, 78, 57, 0.12)';
                            }
                          }}
                          onMouseLeave={e => {
                            if (cls.isSuspended) return;
                            if (!isFinished) {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 6px 20px rgba(19, 78, 57, 0.15)';
                            } else {
                              e.currentTarget.style.background = 'rgba(19, 78, 57, 0.08)';
                            }
                          }}
                        >
                          {cls.isSuspended ? <AlertCircle size={18} /> : (isFinished ? <PlayCircle size={18} /> : (cls.isEnrolled ? <PlayCircle size={18} /> : <ArrowRight size={18} />))}
                          {cls.isSuspended ? 'AKSES DITANGGUHKAN' : (isFinished ? 'MULAI LAGI' : (cls.isEnrolled ? (clsDoneCount > 0 ? 'LANJUTKAN' : 'MULAI BELAJAR') : 'IKUTI KELAS'))}
                        </button>
                        
                        {isFinished && (
                          <button 
                            onClick={() => setActiveTab(`certificate/${cls.id}`)} 
                            style={{ 
                              width: '100%', 
                              background: 'linear-gradient(135deg, #D4AF37 0%, #C59B27 100%)', 
                              color: 'white', 
                              padding: '0.95rem', 
                              borderRadius: '14px', 
                              fontSize: '0.85rem', 
                              fontWeight: '900', 
                              border: 'none', 
                              cursor: 'pointer', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              gap: '8px',
                              boxShadow: '0 6px 20px rgba(212, 175, 55, 0.2)',
                              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.boxShadow = '0 10px 25px rgba(212, 175, 55, 0.3)';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 6px 20px rgba(212, 175, 55, 0.2)';
                            }}
                          >
                            <Award size={18} /> DOWNLOAD SERTIFIKAT
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ 
                gridColumn: '1 / -1', 
                textAlign: 'center', 
                padding: '5rem 2rem', 
                background: 'white', 
                borderRadius: '24px', 
                border: '2px dashed #E4EDE8',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem'
              }}>
                <Search size={48} color="#94A3B8" style={{ opacity: 0.6 }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#134E39', margin: 0 }}>
                  Tidak Ada Kelas Ditemukan
                </h3>
                <p style={{ color: '#64748B', fontSize: '0.9rem', fontWeight: '600', maxWidth: '350px', margin: 0 }}>
                  Afwan, kami tidak menemukan kelas yang sesuai dengan kata kunci atau filter pencarian Anda.
                </p>
                <button 
                  onClick={() => {
                    setSearchQuery('');
                    setActiveFilter('all');
                  }}
                  style={{
                    background: '#134E39',
                    color: 'white',
                    border: 'none',
                    padding: '0.8rem 2rem',
                    borderRadius: '12px',
                    fontWeight: '800',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    marginTop: '0.5rem',
                    boxShadow: '0 4px 12px rgba(19, 78, 57, 0.15)'
                  }}
                >
                  Reset Pencarian
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }


  // ============================
  // VIEW: PLAYER (FULLSCREEN STYLE)
  // ============================
  if (activeClass?.isSuspended) {
    const activeCs = (csContacts || []).filter(c => c.is_active);
    const waMessage = `Assalamu'alaikum, saya ingin menanyakan status akses kelas "${activeClass.title}" saya.`;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: '3rem 2rem', textAlign: 'center', background: '#FFFFFF', borderRadius: '24px', border: '1px solid #fee2e2', margin: '2rem auto', maxWidth: '650px', animation: 'fadeIn 0.5s ease', boxShadow: 'none' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', marginBottom: '2rem', border: '1px solid #fca5a5' }}>
          <AlertCircle size={36} />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#b91c1c', marginBottom: '1rem', letterSpacing: '-0.02em' }}>Akses Kelas Ditangguhkan</h2>
        <p style={{ fontSize: '0.95rem', color: '#64748b', lineHeight: '1.7', maxWidth: '450px', margin: '0 auto 2rem', fontWeight: '600' }}>
          Afwan, akses Anda untuk kelas <strong>{activeClass.title}</strong> sedang ditangguhkan oleh admin akademi. Silakan hubungi Customer Service untuk informasi selengkapnya.
        </p>

        {/* CS Contacts Section */}
        {activeCs.length > 0 && (
          <div style={{ width: '100%', maxWidth: '420px', marginBottom: '2rem' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Hubungi Customer Service</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {activeCs.map(cs => (
                <a
                  key={cs.id}
                  href={`https://wa.me/${cs.phone_number.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(waMessage)}`}
                  target="_blank" rel="noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '0.85rem 1.25rem', borderRadius: '12px',
                    background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                    color: 'white', textDecoration: 'none',
                    transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(37,211,102,0.25)'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(37,211,102,0.35)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(37,211,102,0.25)'; }}
                >
                  <MessageCircle size={20} />
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: '800' }}>{cs.name}</div>
                    <div style={{ fontSize: '0.7rem', opacity: 0.85, fontWeight: '600' }}>{cs.phone_number} • {cs.label}</div>
                  </div>
                  <span style={{ fontSize: '0.65rem', fontWeight: '800', opacity: 0.9, textTransform: 'uppercase' }}>Chat</span>
                </a>
              ))}
            </div>
          </div>
        )}

        <button onClick={() => setLmsView('dashboard')} style={{ background: '#134E39', color: '#ffffff', border: 'none', padding: '0.85rem 2.25rem', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', transition: 'background 0.2s' }}>Kembali ke Dashboard</button>
      </div>
    );
  }

  return (
    <div className="lms-player" style={{ 
      height: isMobile ? 'calc(100dvh - 80px)' : 'calc(100vh - 100px)', 
      display: 'flex', 
      background: '#fff', 
      position: 'relative',
      overflow: 'hidden',
      borderRadius: '16px',
      border: '1px solid #F1F5F9'
    }}>
        {/* Sidebar Overlay */}
        {isLmsSidebarOpen && <div className="lms-overlay" onClick={() => setIsLmsSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(19,78,57,0.3)', backdropFilter: 'blur(4px)', zIndex: 190 }}></div>}
        
        <div className={`lms-sidebar ${isLmsSidebarOpen ? 'open' : ''}`} style={{ 
          width: isSidebarHidden ? '0' : (isMobile ? '85%' : '340px'), 
          maxWidth: isMobile ? '340px' : 'none',
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

          <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 0 5rem', WebkitOverflowScrolling: 'touch' }} className="custom-scrollbar">
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
                        padding: '1rem 1.75rem', margin: '0.25rem 1rem', borderRadius: '10px',
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
                  background: '#f8fafc', border: '1px solid #e2e8f0', padding: '10px', 
                  borderRadius: '12px', cursor: 'pointer', display: isMobile ? 'flex' : 'none',
                  alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
                }}
              >
                <Menu size={22} color="#134E39" />
              </button>
              <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ fontSize: '0.6rem', fontWeight: '900', color: '#D4AF37', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{activeClass?.title}</div>
                <div className="lms-lesson-title" style={{ fontSize: '1.1rem', fontWeight: '900', color: '#134E39', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{activeLesson?.title}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div className="hide-on-mobile" style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '150px' }}>
              </div>
              


              {activeLesson?.done && (
                <div className="hide-on-tiny" style={{ 
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', 
                  background: '#F0FDF4', color: '#10B981', border: '1px solid #DCFCE7', 
                  borderRadius: '10px', fontSize: '0.7rem', fontWeight: '900'
                }}>
                  <CheckCircle size={14} /> <span className="hide-on-mobile">SELESAI</span>
                </div>
              )}
              <button onClick={() => setIsSidebarHidden(!isSidebarHidden)} className="hide-on-mobile" style={{ background: 'white', border: '1px solid #F1F5F9', color: '#94A3B8', cursor: 'pointer', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isSidebarHidden ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
              </button>
            </div>
          </div>

          <div className="lms-player-content custom-scrollbar" style={{ 
            flex: 1, 
            overflowY: 'auto', 
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y',
            padding: isMobile ? '1.5rem 1rem 100px' : '2rem 1.5rem', 
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
                          borderRadius: '12px', boxShadow: '0 30px 60px rgba(0,0,0,0.1)',
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
                      <div style={{ padding: isMobile ? '0' : '0 1rem', marginBottom: '5rem', textAlign: 'left' }}>
                        <div className="prose-modern" dangerouslySetInnerHTML={{ __html: activeLesson.content }} style={{ fontSize: '1.1rem', lineHeight: 1.8, color: '#2D3748' }} />
                      </div>
                    </>
                  )}

                  {activeLesson.type === 'quiz' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px', margin: '0 auto' }}>
                      {quizSubmitted ? (
                        <div style={{ textAlign: 'center', padding: '5rem 3rem', background: 'white', borderRadius: '18px', border: '1px solid #E4EDE8', boxShadow: '0 20px 40px rgba(0,0,0,0.02)' }}>
                           <div style={{ width: 100, height: 100, borderRadius: '16px', background: quizPassed ? '#F0FDF4' : '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2.5rem', color: quizPassed ? '#10B981' : '#EF4444', boxShadow: '0 15px 30px rgba(0,0,0,0.05)' }}>
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
                        <div style={{ padding: '5rem 3rem', background: 'white', borderRadius: '18px', textAlign: 'center', border: '1px solid #E4EDE8', boxShadow: '0 20px 40px rgba(0,0,0,0.02)' }}>
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
                            <div key={i} style={{ background: 'white', padding: '2.5rem', borderRadius: '14px', border: '1px solid #E4EDE8', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
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

              {/* Navigation Buttons at the bottom of content */}
              {activeLesson && activeLesson.type !== 'quiz' && (
                <div style={{ 
                  display: 'flex', 
                  flexDirection: isMobile ? 'column-reverse' : 'row',
                  justifyContent: 'space-between', 
                  alignItems: isMobile ? 'stretch' : 'center', 
                  marginTop: '4rem', 
                  padding: '2.5rem 0',
                  borderTop: '1px solid #F1F5F9',
                  gap: '1.25rem'
                }}>
                  <div style={{ display: 'flex', flex: isMobile ? 1 : 'none' }}>
                    {currentLessonIdx > 0 && (
                      <button 
                        onClick={() => goToLesson(allItems[currentLessonIdx - 1], true)}
                        style={{ 
                          flex: isMobile ? 1 : 'none',
                          background: 'white', border: '1.5px solid #E2E8F0', color: '#64748B', 
                          padding: isMobile ? '1.2rem' : '0.8rem 1.5rem', borderRadius: '12px', fontWeight: '800', 
                          fontSize: isMobile ? '0.8rem' : '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                          transition: 'all 0.2s'
                        }}
                      >
                        <ChevronLeft size={isMobile ? 18 : 20} /> MATERI SEBELUMNYA
                      </button>
                    )}
                  </div>

                  <button 
                    onClick={activeLesson.done ? goNext : handleMarkDone}
                    disabled={activeLesson.done && currentLessonIdx === allItems.length - 1}
                    style={{ 
                      background: activeLesson.done ? '#F0FDF4' : '#134E39', 
                      color: activeLesson.done ? '#10B981' : 'white', 
                      padding: isMobile ? '1.2rem' : '1rem 2.5rem', borderRadius: '14px', 
                      fontWeight: '900', fontSize: isMobile ? '0.85rem' : '0.9rem', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', border: 'none',
                      boxShadow: activeLesson.done ? 'none' : '0 10px 20px rgba(19,78,57,0.15)',
                      transition: 'all 0.3s'
                    }}
                  >
                    {activeLesson.done ? 'SUDAH SELESAI' : 'TANDAI SELESAI & LANJUT'} <ArrowRight size={isMobile ? 18 : 20} />
                  </button>
                </div>
              )}
            </div>
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
        .lms-sidebar.open { transform: translateX(0) !important; display: flex !important; }
        @media (max-width: 1024px) {
          .lms-sidebar { position: fixed; top: 0; left: 0; height: 100dvh !important; transform: translateX(-100%); box-shadow: 20px 0 50px rgba(0,0,0,0.15); }
          .lms-player-content { padding: 2rem 1rem !important; }
          .mobile-only-btn { display: flex !important; }
          .hide-on-mobile { display: none !important; }
          .lms-lesson-title { font-size: 1rem !important; }
          .lms-top-bar { height: 64px !important; padding: 0 1rem !important; }
          .lms-done-btn { padding: 0.75rem 1.25rem !important; }
          .lms-progress-info { gap: 0.5rem !important; }
        }
        @media (max-width: 480px) {
          .hide-on-tiny { display: none !important; }
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
        .prose-modern {
          text-align: justify;
          hyphens: auto;
        }
        .prose-modern p {
          margin-bottom: 1.5rem;
        }
        .prose-modern h1, .prose-modern h2, .prose-modern h3 {
          margin-top: 2rem;
          margin-bottom: 1rem;
          color: #134E39;
          font-weight: 900;
        }
        .prose-modern ul, .prose-modern ol {
          margin-bottom: 1.5rem;
          padding-left: 1.5rem;
        }
        .prose-modern li {
          margin-bottom: 0.5rem;
        }
      `}</style>
    </div>
  );
}
