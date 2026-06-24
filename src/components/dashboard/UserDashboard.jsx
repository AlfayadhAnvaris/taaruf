"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { User, FileText, ShieldCheck, Lock, ArrowRight } from 'lucide-react';

import dynamic from 'next/dynamic';
import AccountTab from './AccountTab';
const LearningTab = dynamic(() => import('./LearningTab'), { ssr: false });
import MyCvTab from './MyCvTab';
import CertificateTab from './CertificateTab';
import FeedbackTab from './FeedbackTab';
const HomeTab = dynamic(() => import('./HomeTab'), { ssr: false });
import FindTab from './FindTab';
import StatusTab from './StatusTab';

const RenderLockedState = ({ isProfileComplete, isCvComplete, router }) => {
  return (
    <div style={{ 
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
      minHeight: '60vh', padding: '3rem 2rem', textAlign: 'center', background: '#FFFFFF',
      borderRadius: '24px', border: '1px solid #E4EDE8', margin: '2rem auto', maxWidth: '750px',
      animation: 'fadeIn 0.5s ease', boxShadow: 'none'
    }}>
      <div style={{ 
        width: 80, height: 80, borderRadius: '50%', background: 'rgba(212,175,55,0.08)', 
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4AF37', 
        marginBottom: '2rem', border: '1px solid rgba(212,175,55,0.2)',
        boxShadow: 'none'
      }}>
        <Lock size={36} />
      </div>
      
      <h2 style={{ fontSize: '1.6rem', fontWeight: '900', color: '#134E39', marginBottom: '1rem', letterSpacing: '-0.02em' }}>
        Fitur Terkunci (Akses Terbatas)
      </h2>
      
      <p style={{ fontSize: '1rem', color: '#475569', lineHeight: '1.8', maxWidth: '500px', margin: '0 auto 2.5rem' }}>
        Anda harus mengisi data diri pada profil (menu Pengaturan Akun) dan CV Taaruf secara lengkap terlebih dahulu untuk mengakses fitur ini.
      </p>
      
      <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        {!isProfileComplete && (
          <button 
            onClick={() => router.push('/dashboard/account?edit=true')}
            style={{ 
              background: '#134E39', color: '#ffffff', border: 'none', 
              padding: '0.85rem 1.75rem', borderRadius: '12px', fontWeight: '800', 
              cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px' 
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#1E6B52'}
            onMouseLeave={e => e.currentTarget.style.background = '#134E39'}
          >
            Lengkapi Profil Akun <ArrowRight size={16} />
          </button>
        )}
        {!isCvComplete && (
          <button 
            onClick={() => router.push('/dashboard/my_cv?edit=true')}
            style={{ 
              background: '#D4AF37', color: '#134E39', border: 'none', 
              padding: '0.85rem 1.75rem', borderRadius: '12px', fontWeight: '800', 
              cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#E5C35E'}
            onMouseLeave={e => e.currentTarget.style.background = '#D4AF37'}
          >
            Lengkapi CV Taaruf <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default function UserDashboard({ activeTab, subId }) {
  const { 
    user, cvs, taarufRequests, 
    showAlert, addNotification, 
    bookmarks, setBookmarks,
    getAcademyBadge,
    lmsView, setLmsView
  } = useAppContext();
  
  const router = useRouter();
  
  // Use a ref to prevent infinite loops if needed, but for now simple state is fine
  const [activeChatId, setActiveChatId] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [viewingStatusId, setViewingStatusId] = useState(null);
  const [chartFilter, setChartFilter] = useState('7_hari');
  const [showQaTemplates, setShowQaTemplates] = useState(false);

  // ── CV State ──
  const [myCv, setMyCv] = useState({
    alias: user?.name || '', gender: user?.gender || '', age: '', location: '',
    domisili_provinsi: user?.domisili_provinsi || '', domisili_kota: user?.domisili_kota || '',
    education: '', job: '', worship: '', about: '', criteria: '', suku: '',
    hobi: '', poligami: 'Tidak Bersedia', salary: '', address: '',
    marital_status: 'Lajang', tinggi_berat: '', kesehatan: '', kajian: '', karakter: '',
    aqidah1: user?.aqidah1 || '', aqidah2: user?.aqidah2 || '', aqidah3: user?.aqidah3 || '',
    aqidah4: user?.aqidah4 || '', marriage_vision: user?.marriage_vision || '', role_view: user?.role_view || '',
    // New 12-section fields
    foto_url: '',
    tinggi_badan: '',
    berat_badan: '',
    ciri_fisik: '',
    karakter_positif: '',
    karakter_negatif: '',
    hal_disukai: '',
    hal_benci: '',
    kondisi_keluarga: '',
    pekerjaan_ortu: '',
    anak_ke_dari: '',
    riwayat_pendidikan: '',
    pengalaman_kerja: '',
    worship_wajib: '',
    worship_sunnah: '',
    baca_quran: '',
    target_menikah: '',
    rencana_nafkah: '',
    harapan_pasangan: '',
    kriteria_fisik: '',
    kriteria_non_fisik: ''
  });
  const [cvStep, setCvStep] = useState(1);
  const [isEditingCv, setIsEditingCv] = useState(false);
  const [isSubmittingCv, setIsSubmittingCv] = useState(false);
  const myExistingCv = cvs.find(cv => cv.user_id === user?.id);

  // ── LMS State ──
  const [classes, setClasses] = useState([]);
  const [activeClass, setActiveClass] = useState(null);
  const [curriculum, setCurriculum] = useState([]);
  const [activeLesson, setActiveLesson] = useState(null);
  const [lmsLoading, setLmsLoading] = useState(true);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Sync myCv if data exists
  useEffect(() => {
    if (myExistingCv) {
      setMyCv(prev => ({
        ...prev,
        ...myExistingCv,
        // Ensure specific fields are mapped
        alias: myExistingCv.alias || prev.alias,
        gender: myExistingCv.gender || prev.gender,
      }));
    }
  }, [myExistingCv]);

  // ── Filters & Locations ──
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ province: '', city: '', suku: '', minAge: '', maxAge: '', education: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [provinces, setProvinces] = useState([]);
  const [viewingCv, setViewingCv] = useState(null);

  useEffect(() => {
    fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json')
      .then(r => r.json())
      .then(data => setProvinces(data || []))
      .catch(e => console.error("Gagal ambil provinsi", e));
  }, []);

  const takenUserIds = useMemo(() => {
    // Logika menyembunyikan user yang sudah menikah dinonaktifkan sementara
    return new Set();
    /*
    return new Set(
      taarufRequests
        .filter(r => r.status === 'completed')
        .flatMap(r => [r.senderId, r.receiverId])
    );
    */
  }, []);

  const fetchCurriculum = async () => {
    if (!user) return;
    setLmsLoading(true);
    try {
      const { data: clsData } = await supabase.from('lms_classes').select('*').order('order_index');
      const { data: coursesData } = await supabase.from('courses').select('*').order('order_index');
      const { data: lessonsData } = await supabase.from('lessons').select('*').order('order_index');
      const { data: quizData } = await supabase.from('quiz_questions').select('*').order('order_index');

      const { data: progressData } = await supabase.from('user_lesson_progress').select('lesson_id, completed, score').eq('user_id', user.id);
      const doneSet = new Set((progressData || []).filter(p => p.completed).map(p => p.lesson_id));

      const { data: enrollmentData } = await supabase.from('course_enrollments').select('*').eq('user_id', user.id);
      const enrolledSet = new Set((enrollmentData || []).map(e => e.class_id));
      const suspendedSet = new Set((enrollmentData || []).filter(e => e.is_suspended).map(e => e.class_id));

      const builtClasses = (clsData || [])
        .filter(cls => cls.is_published !== false)
        .map(cls => ({
          ...cls,
          isEnrolled: enrolledSet.has(cls.id),
          isSuspended: suspendedSet.has(cls.id),
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
                  content: l.content,
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

      setClasses(builtClasses);
    } catch (err) { console.error('Error fetching curriculum:', err); }
    finally { setLmsLoading(false); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchCurriculum(); }, [user?.id]);

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
         addNotification(`Baarakallahu fiikum! Anda telah menyelesaikan seluruh materi di kelas "${activeClass.title}". Silakan unduh sertifikat Anda.`);
      }
    } catch (err) { console.error('Error saving progress:', err); }
  };

  const enrollClass = async (classId) => {
    try {
      const { error } = await supabase.from('course_enrollments').insert({ user_id: user.id, class_id: classId });
      if (error) throw error;
      setClasses(prev => prev.map(cls => cls.id === classId ? { ...cls, isEnrolled: true } : cls));
      router.push(`/dashboard/materi/${classId}`);
      addNotification('Berhasil mengikuti kelas baru!');
    } catch (err) {
      showAlert('Gagal', 'Tidak dapat mengikuti kelas: ' + err.message, 'error');
    }
  };

  const handleCvSubmit = async (silent = false) => {
    setIsSubmittingCv(true);
    try {
      const cvColumns = [
        'id', 'user_id', 'alias', 'age', 'gender', 'location', 'address', 'marital_status',
        'tinggi_berat', 'kesehatan', 'suku', 'job', 'salary', 'education', 'worship',
        'kajian', 'karakter', 'hobi', 'poligami', 'about', 'criteria', 'status',
        'domisili_provinsi', 'domisili_kota', 'foto_url', 'tinggi_badan', 'berat_badan',
        'ciri_fisik', 'karakter_positif', 'karakter_negatif', 'hal_disukai', 'hal_benci',
        'kondisi_keluarga', 'pekerjaan_ortu', 'anak_ke_dari', 'riwayat_pendidikan',
        'pengalaman_kerja', 'worship_wajib', 'worship_sunnah', 'baca_quran', 'marriage_vision',
        'role_view', 'target_menikah', 'rencana_nafkah', 'harapan_pasangan', 'kriteria_fisik',
        'kriteria_non_fisik'
      ];
      
      const cvFields = {};
      cvColumns.forEach(col => {
        if (myCv[col] !== undefined && myCv[col] !== null) {
          cvFields[col] = myCv[col];
        }
      });
      
      if (cvFields.age !== undefined && cvFields.age !== null && cvFields.age !== '') {
        cvFields.age = parseInt(cvFields.age, 10);
      }
      
      cvFields.user_id = user.id;
      cvFields.status = myExistingCv ? myExistingCv.status : 'pending';
      cvFields.updated_at = new Date().toISOString();
      
      // Ensure we update the existing CV if one exists to prevent duplicate inserts
      if (!cvFields.id) {
        if (myExistingCv?.id) {
          cvFields.id = myExistingCv.id;
        } else {
          const { data: existingDbCvs } = await supabase
            .from('cv_profiles')
            .select('id')
            .eq('user_id', user.id);
          
          if (existingDbCvs && existingDbCvs.length > 0) {
            cvFields.id = existingDbCvs[0].id;
          }
        }
      }
      
      const { error: cvError } = await supabase.from('cv_profiles').upsert(cvFields);
      if (cvError) throw cvError;
      
      const profileFields = {
        domisili_provinsi: myCv.domisili_provinsi || null,
        domisili_kota: myCv.domisili_kota || null,
        aqidah1: myCv.aqidah1 || null,
        aqidah2: myCv.aqidah2 || null,
        aqidah3: myCv.aqidah3 || null,
        aqidah4: myCv.aqidah4 || null,
        marriage_vision: myCv.marriage_vision || null,
        role_view: myCv.role_view || null,
        updated_at: new Date().toISOString()
      };
      
      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileFields)
        .eq('id', user.id);
      if (profileError) throw profileError;
      
      if (!silent) {
        showAlert('Berhasil', 'CV Anda telah berhasil disimpan.', 'success');
        // Re-fetch data to update UI
        if (typeof window !== 'undefined') window.location.reload(); 
      } else {
        if (typeof window !== 'undefined') {
          const event = new CustomEvent('refreshData');
          window.dispatchEvent(event);
        }
      }
    } catch (err) {
      console.error('Error saving CV:', err);
      if (!silent) {
        showAlert('Gagal', 'Gagal menyimpan CV: ' + (err.message || JSON.stringify(err)), 'error');
      }
      throw err;
    } finally {
      setIsSubmittingCv(false);
    }
  };

  const selectClassForPlayer = (cls) => {
    setActiveClass(cls);
    setCurriculum(cls.modules);
    setLmsView('player');
    // Auto-select first lesson if available
    if (cls.modules?.length > 0) {
      const firstModule = cls.modules[0];
      if (firstModule.items?.length > 0) {
        setActiveLesson(firstModule.items[0]);
      }
    }
  };

  const toggleModule = (moduleId) => setCurriculum(prev => prev.map(m => m.id === moduleId ? { ...m, expanded: !m.expanded } : m));

  const totalLessons = curriculum.reduce((acc, m) => acc + m.items.length, 0);
  const doneLessons = curriculum.reduce((acc, m) => acc + m.items.filter(i => i.done).length, 0);
  const progressPercent = totalLessons > 0 ? Math.round((doneLessons / totalLessons) * 100) : 0;
  const allDone = totalLessons > 0 && curriculum.flatMap(m => m.items).every(i => i.done);

  const cvProgressPct = useMemo(() => {
    if (!myExistingCv) return 0;
    const sectionsList = [
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
    
    const completedSections = sectionsList.filter(sec => 
      sec.fields.every(field => {
        const val = myExistingCv[field];
        return val !== undefined && val !== null && val !== '';
      })
    ).length;
    
    return Math.round((completedSections / sectionsList.length) * 100);
  }, [myExistingCv]);

  const checks = useMemo(() => [
    { label: 'Lengkapi Biodata & Foto', done: !!user?.profile_complete, icon: <User size={14} /> },
    { 
      label: cvProgressPct < 100 ? `Buat & Lengkapi CV (${cvProgressPct}%)` : 'Buat & Publikasikan CV', 
      done: cvProgressPct === 100, 
      icon: <FileText size={14} /> 
    }
  ], [user?.profile_complete, cvProgressPct]);

  const onboardingPct = useMemo(() => {
    const task1 = user?.profile_complete ? 1 : 0;
    const task2 = cvProgressPct / 100;
    return Math.round(((task1 + task2) / 2) * 100);
  }, [user?.profile_complete, cvProgressPct]);

  const activityData = useMemo(() => {
    const data = [];
    const now = new Date();
    const days = chartFilter === '7_hari' ? 7 : (chartFilter === '1_bulan' ? 30 : 180);
    const step = chartFilter === '6_bulan' ? 15 : 1;
    
    for (let i = days; i >= 0; i -= step) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      data.push({
        name: d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        aktivitas: Math.floor(Math.random() * 50) + 10 // Mock data for now
      });
    }
    return data;
  }, [chartFilter]);

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || !activeChatId) return;
    try {
      const { error } = await supabase.from('messages').insert({
        taaruf_request_id: activeChatId,
        sender_id: user.id,
        text: chatInput,
        created_at: new Date().toISOString()
      });
      if (error) throw error;
      setChatInput('');
      // Re-fetch messages in context
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('refreshData');
        window.dispatchEvent(event);
      }
    } catch (err) {
      showAlert('Gagal Kirim', err.message, 'error');
    }
  };

  const handleAjukanTaaruf = async (targetCv) => {
    if (!myExistingCv) {
      showAlert('Belum Ada CV', 'Anda harus melengkapi CV terlebih dahulu sebelum mengajukan taaruf.', 'warning');
      return;
    }
    try {
      const { error } = await supabase.from('taaruf_requests').insert({
        sender_id: user.id,
        receiver_id: targetCv.user_id,
        sender_alias: myExistingCv.alias,
        target_alias: targetCv.alias,
        sender_email: user.email,
        target_email: targetCv.user_email || '', // Assuming this exists or profile has it
        target_cv_id: targetCv.id,
        status: 'pending_target',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      if (error) throw error;
      showAlert('Berhasil', 'Pengajuan taaruf telah dikirim. Menunggu persetujuan target.', 'success');
      router.push('/dashboard/status');
    } catch (err) {
      showAlert('Gagal', 'Tidak dapat mengirim pengajuan: ' + err.message, 'error');
    }
  };

  return (
    <div className="dashboard-content" style={{ 
      animation: 'fadeIn 0.5s ease',
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      minHeight: 0
    }}>
      {activeTab === 'home' && (
        <HomeTab 
          greeting="Ahlan wa Sahlan"
          candidateCount={cvs.filter(c => c.user_id !== user?.id).length}
          myActiveRequests={taarufRequests.filter(r => (r.senderId === user?.id || r.receiverId === user?.id) && !['completed', 'rejected'].includes(r.status)).length}
          activityData={activityData}
          getAcademyBadge={getAcademyBadge}
          chartFilter={chartFilter}
          setChartFilter={setChartFilter}
          onboardingPct={onboardingPct}
          checks={checks}
          setActiveTab={(t) => router.push(`/dashboard/${t}`)}
        />
      )}
      {activeTab === 'find' && (
        (!user?.profile_complete || cvProgressPct < 100) ? (
          <RenderLockedState isProfileComplete={!!user?.profile_complete} isCvComplete={cvProgressPct === 100} router={router} />
        ) : (
          <FindTab 
            cvs={cvs.filter(c => c.user_id !== user?.id)}
            myExistingCv={myExistingCv}
            viewingCv={viewingCv}
            setViewingCv={setViewingCv}
            filters={filters}
            setFilters={setFilters}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            provinces={provinces}
            candidateCount={cvs.filter(c => c.user_id !== user?.id).length}
            bookmarks={bookmarks}
            setBookmarks={setBookmarks}
            getAcademyBadge={getAcademyBadge}
            takenUserIds={takenUserIds}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            itemsPerPage={itemsPerPage}
            handleAjukanTaaruf={handleAjukanTaaruf}
            setActiveTab={(t) => router.push(`/dashboard/${t}`)}
          />
        )
      )}
      {activeTab === 'status' && (
        (!user?.profile_complete || cvProgressPct < 100) ? (
          <RenderLockedState isProfileComplete={!!user?.profile_complete} isCvComplete={cvProgressPct === 100} router={router} />
        ) : (
          <StatusTab 
            myExistingCv={myExistingCv}
            viewingStatusId={viewingStatusId}
            setViewingStatusId={setViewingStatusId}
            activeChatId={activeChatId}
            setActiveChatId={setActiveChatId}
            chatInput={chatInput}
            setChatInput={setChatInput}
            handleSendMessage={handleSendMessage}
            setShowQaTemplates={setShowQaTemplates}
            setActiveTab={(t) => router.push(`/dashboard/${t}`)}
          />
        )
      )}
      {activeTab === 'my_cv' && (
        <MyCvTab 
          user={user}
          myCv={myCv} setMyCv={setMyCv} cvStep={cvStep} setCvStep={setCvStep}
          isEditingCv={isEditingCv} setIsEditingCv={setIsEditingCv}
          isSubmittingCv={isSubmittingCv} setIsSubmittingCv={setIsSubmittingCv}
          handleCvSubmit={handleCvSubmit}
          myExistingCv={myExistingCv}
          hasSubmittedCv={!!myExistingCv}
          provinces={provinces}
        />
      )}
      {activeTab === 'materi' && (
        <LearningTab 
          user={user}
          classes={classes}
          lmsLoading={lmsLoading}
          lmsView={lmsView}
          setLmsView={setLmsView}
          activeClass={activeClass}
          setActiveClass={(cls) => { setActiveClass(cls); if(cls) setCurriculum(cls.modules); }}
          curriculum={curriculum}
          activeLesson={activeLesson}
          setActiveLesson={setActiveLesson}
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
          enrollClass={enrollClass}
          selectClassForPlayer={selectClassForPlayer}
          setActiveTab={(t) => router.push(`/dashboard/${t}`)}
        />
      )}
      {activeTab === 'certificate' && (
        <CertificateTab 
          user={user}
          allClasses={classes}
          activeClass={classes?.find(c => c.id.toString() === subId?.toString())}
        />
      )}
      {activeTab === 'feedback' && <FeedbackTab user={user} showAlert={showAlert} />}
      {activeTab === 'account' && <AccountTab user={user} />}
    </div>
  );
}
