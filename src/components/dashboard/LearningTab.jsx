import React, { useState } from 'react';
import {
  CheckCircle, PlayCircle, ChevronDown, ChevronRight, ChevronLeft,
  Award, BookOpen, BarChart2, GraduationCap, Lock, ArrowRight,
  Search, ShieldCheck, Zap, Menu, X, Clock, AlertCircle
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

  const resetQuiz = () => { setQuizAnswers({}); setQuizSubmitted(false); };

  const isLessonLocked = (item) => {
    const idx = allItems.findIndex(i => i.id === item.id);
    if (idx <= 0) return false;
    return !allItems[idx - 1].done;
  };

  const goToLesson = (item, force = false) => { 
    if (!force && isLessonLocked(item)) return;
    setActiveLesson(item); 
    resetQuiz(); 
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
    await markLessonDone(activeLesson.id, quizScore);
    if (currentLessonIdx < allItems.length - 1) goNext();
  };

  const handleCertificateDownload = () => {
    setActiveTab('certificate');
  };

  // ============================
  // VIEW: CATALOG (DAFTAR KELAS)
  // ============================
  if (lmsView === 'catalog') {
    return (
      <div style={{ animation: 'fadeIn 0.4s ease', padding: '1rem' }}>
        {/* Breadcrumb */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          marginBottom: '1rem', fontSize: '0.65rem',
          color: '#94a3b8', fontWeight: '800',
          textTransform: 'uppercase', letterSpacing: '0.08em'
        }}>
          <span style={{ cursor: 'pointer' }} onClick={() => setActiveTab('home')}>HOME PORTAL</span>
          <ChevronRight size={10} />
          <span>DAFTAR KELAS & KURSUS</span>
        </div>

        <div className="card" style={{
          marginBottom: '2rem',
          background: 'linear-gradient(135deg, #1a4d35 0%, #2C5F4D 50%, #1e6b4f 100%)',
          border: 'none', color: 'white', padding: '3rem 3.5rem',
          borderRadius: '1.5rem', overflow: 'hidden', position: 'relative'
        }}>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              background: 'rgba(255,255,255,0.1)', padding: '0.3rem 0.75rem',
              borderRadius: '99px', fontSize: '0.65rem', fontWeight: '800',
              marginBottom: '1.5rem', letterSpacing: '0.05em', border: '1px solid rgba(255,255,255,0.2)'
            }}>
              <Zap size={14} fill="white" /> AKADEMI MAWADDAH
            </div>
            
            <h2 style={{ color: 'white', margin: '0 0 1rem', fontSize: '2.5rem', fontWeight: '900', letterSpacing: '-0.02em' }}>
              KURIKULUM <span style={{ color: '#D4AF37' }}>BELAJAR</span> TAARUF
            </h2>
            <p style={{ fontSize: '1.1rem', opacity: 0.9, fontWeight: '500', maxWidth: '600px' }}>
              Persiapkan mental, ilmu, dan iman Anda sebelum melangkah ke jenjang pernikahan yang suci.
            </p>
          </div>
          <div style={{ position: 'absolute', right: '5%', top: '50%', transform: 'translateY(-50%)', fontSize: '15rem', fontWeight: '900', opacity: 0.05, pointerEvents: 'none' }}>M</div>
        </div>

        {/* Classes Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
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
              <div key={cls.id} className="card" style={{ padding: 0, borderRadius: '1.5rem', overflow: 'hidden', border: isFinished ? '2px solid #D4AF37' : '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
                <div style={{ position: 'relative', height: '200px', background: '#f1f5f9' }}>
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
                        onClick={() => { selectClass(cls); handleCertificateDownload(); }}
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
    <div className="lms-player" style={{ margin: '-1rem' }}>
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
            <div key={mod.id} style={{ marginBottom: '1.5rem' }}>
              <div style={{ padding: '0 1.5rem', marginBottom: '0.75rem', fontSize: '0.7rem', fontWeight: '900', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: 20, height: 20, borderRadius: '5px', background: '#e2e8f0', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem' }}>{mi + 1}</div>
                {mod.title.toUpperCase()}
              </div>

              {mod.items.map(item => {
                const isActive = item.id === activeLesson?.id;
                const isLocked = isLessonLocked(item);
                return (
                  <button
                    key={item.id}
                    onClick={() => { if (!isLocked) { goToLesson(item); setIsLmsSidebarOpen(false); } }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1.5rem',
                      background: isActive ? '#2C5F4D' : 'transparent', border: 'none', cursor: isLocked ? 'not-allowed' : 'pointer',
                      textAlign: 'left', transition: 'all 0.15s ease', opacity: isLocked ? 0.6 : 1
                    }}
                  >
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%', background: isLocked ? '#f1f5f9' : (isActive ? 'rgba(255,255,255,0.2)' : item.done ? '#ecfdf5' : 'white'),
                      border: isActive ? 'none' : `1px solid ${item.done ? '#4ade80' : '#e2e8f0'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      {item.done ? <CheckCircle size={14} color={isActive ? 'white' : '#10b981'} /> : isLocked ? <Lock size={10} color="#94a3b8" /> : <div style={{ width: 5, height: 5, borderRadius: '50%', background: isActive ? 'white' : '#e2e8f0' }} />}
                    </div>
                    <span style={{ fontSize: '0.7rem', fontWeight: '800', color: isActive ? 'white' : isLocked ? '#94a3b8' : '#475569', letterSpacing: '0.01em' }}>{item.title.toUpperCase()}</span>
                  </button>
                );
              })}
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

        <div className="lms-player-content" style={{ flex: 1, overflowY: 'auto', padding: '2.5rem' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
            {activeLesson ? (
              <>
                <div style={{ marginBottom: '2rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '900', color: '#2C5F4D', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>MATERI KELAS</div>
                  <h2 style={{ fontSize: '1.75rem', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>{activeLesson.title.toUpperCase()}</h2>
                </div>

                <div style={{ borderRadius: '1.5rem', overflow: 'hidden', background: '#000', aspectRatio: '16/9', marginBottom: '2rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                  {activeLesson.type === 'video' ? (
                    <iframe width="100%" height="100%" src={activeLesson.videoUrl || "https://www.youtube.com/embed/dQw4w9WgXcQ"} title={activeLesson.title} frameBorder="0" allowFullScreen />
                  ) : (
                    <div style={{ height: '100%', padding: '2rem', overflowY: 'auto', background: '#f8fafc' }}>
                       <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                        {quizSubmitted ? (
                          <div style={{ textAlign: 'center', padding: '3rem', background: 'white', borderRadius: '1.5rem', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
                            <div style={{ width: 60, height: 60, borderRadius: '50%', background: quizPassed ? '#ecfdf5' : '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>{quizPassed ? <CheckCircle size={30} color="#10b981" /> : <AlertCircle size={30} color="#ef4444" />}</div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#0f172a', marginBottom: '0.5rem' }}>{quizPassed ? 'Anda Lulus!' : 'Belum Lulus'}</h2>
                            <p style={{ fontSize: '1rem', color: '#64748b', marginBottom: '2rem' }}>Skor: <span style={{ fontWeight: '800', color: quizPassed ? '#10b981' : '#ef4444' }}>{quizScore}%</span></p>
                            {quizPassed ? <button onClick={handleQuizPassed} style={{ background: '#2C5F4D', color: 'white', padding: '0.8rem 2rem', borderRadius: '12px', fontWeight: '800', border: 'none', cursor: 'pointer' }}>LANJUT MATERI</button> : <button onClick={resetQuiz} style={{ background: '#0f172a', color: 'white', padding: '0.8rem 2rem', borderRadius: '12px', fontWeight: '800', border: 'none', cursor: 'pointer' }}>COBA LAGI</button>}
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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
                            <button onClick={() => setQuizSubmitted(true)} disabled={Object.keys(quizAnswers).length < currentQuiz.length} style={{ background: '#2C5F4D', color: 'white', padding: '1rem', borderRadius: '1rem', fontWeight: '800', opacity: Object.keys(quizAnswers).length < currentQuiz.length ? 0.5 : 1, cursor: 'pointer' }}>SUBMIT KUIS</button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {activeLesson.content && (
                  <div style={{ background: 'white', padding: '2rem', borderRadius: '1.5rem', border: '1px solid #f1f5f9', marginBottom: '3rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                      <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(44,95,77,0.1)', color: '#2C5F4D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BookOpen size={20} /></div>
                      <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '900', color: '#0f172a' }}>Ringkasan Materi</h4>
                    </div>
                    <p style={{ fontSize: '0.95rem', color: '#475569', lineHeight: '1.8', margin: 0 }}>{activeLesson.content}</p>
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

        <div style={{ height: '80px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', padding: '0 4rem', justifyContent: 'space-between', background: 'white' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: '900', color: '#94a3b8' }}>PROGRES: {doneLessons}/{totalLessons} MATERI SELESAI</div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {activeLesson?.type === 'video' && (
              <button 
                onClick={handleMarkDone} 
                disabled={activeLesson.done}
                style={{ background: activeLesson.done ? '#f1f5f9' : '#0f172a', color: activeLesson.done ? '#94a3b8' : 'white', padding: '0.8rem 2rem', borderRadius: '12px', fontWeight: '800', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.75rem', border: 'none', cursor: activeLesson.done ? 'default' : 'pointer' }}
              >
                {activeLesson.done ? 'SESI SELESAI' : 'TANDAI SELESAI & LANJUT'} <ArrowRight size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
