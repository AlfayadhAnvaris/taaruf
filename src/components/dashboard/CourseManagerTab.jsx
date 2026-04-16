import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import {
  BookOpen, Plus, Trash2, Edit3, Save, X, ChevronDown,
  PlayCircle, FileQuestion, GraduationCap, CheckCircle,
  AlertCircle, Loader, ToggleLeft, ToggleRight, ArrowUp, ArrowDown,
  Activity, Zap, Upload
} from 'lucide-react';

// ─── tiny helpers ────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9);
const CARD = { borderRadius: '14px', border: '1px solid var(--border)', background: 'white', padding: '1.25rem 1.5rem', marginBottom: '1rem' };
const BTN_SM = (extra = {}) => ({
  display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
  padding: '0.4rem 0.85rem', borderRadius: '8px', fontSize: '0.8rem',
  fontWeight: '700', cursor: 'pointer', border: 'none', transition: 'all 0.15s',
  ...extra
});

export default function CourseManagerTab() {
  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // Modal states (using new view/editor system for class/course)
  const [lessonModal, setLessonModal] = useState(null);   // null | { courseId, lesson? }
  const [quizModal, setQuizModal] = useState(null);       // null | { lessonId, question? }

  // Form states
  const [classForm, setClassForm] = useState({ title: '', description: '', banner_url: '' });
  const [courseForm, setCourseForm] = useState({ title: '', description: '', thumbnail_url: '' });
  const [lessonForm, setLessonForm] = useState({ id: '', title: '', type: 'video', video_url: '', duration: '' });
  const [quizForm, setQuizForm] = useState({ question_text: '', options: ['', '', '', ''], correct_index: 0 });
  
  // UI states
  const [view, setView] = useState('list'); // 'list' | 'class-editor' | 'course-editor'
  const [activeClassEdit, setActiveClassEdit] = useState(null); // 'new' | class-obj
  const [activeCourseEdit, setActiveCourseEdit] = useState(null); // { classId, course? }

  const [expandedClass, setExpandedClass] = useState(null);
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [expandedLesson, setExpandedLesson] = useState(null);
  const [subTab, setSubTab] = useState('curriculum'); // 'curriculum' | 'progress'
  const [userProgressList, setUserProgressList] = useState([]);
  const [progressLoading, setProgressLoading] = useState(false);

  // Image states
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const bannerInputRef = React.useRef(null);

  const [courseFile, setCourseFile] = useState(null);
  const [coursePreview, setCoursePreview] = useState(null);
  const courseInputRef = React.useRef(null);

  // ─── Fetch ────────────────────────────────────────────────────────────────
  const fetchAll = async () => {
    setLoading(true);
    const [cl, c, l, q] = await Promise.all([
      supabase.from('lms_classes').select('*').order('order_index'),
      supabase.from('courses').select('*').order('order_index'),
      supabase.from('lessons').select('*').order('order_index'),
      supabase.from('quiz_questions').select('*').order('order_index'),
    ]);
    setClasses(cl.data || []);
    setCourses(c.data || []);
    setLessons(l.data || []);
    setQuizQuestions(q.data || []);
    setLoading(false);
  };

  const fetchUserProgress = async () => {
    setProgressLoading(true);
    try {
      // 1. Ambil jumlah total lesson yang aktif
      const { data: activeLessonsData } = await supabase.from('lessons').select('id');
      const totalLessonsCount = activeLessonsData?.length || 0;

      // 2. Ambil semua profiles candidate
      const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('id, name, gender, email')
        .eq('role', 'user');
        
      if (pErr) throw pErr;

      // 3. Ambil semua progress (Admin butuh policy RLS agar bisa baca ini)
      // Jika hasil masih [], berarti kebijakan RLS di Supabase perlu diperbarui
      const { data: progressData, error: prErr } = await supabase
        .from('user_lesson_progress')
        .select('user_id, lesson_id');
        
      if (prErr) throw prErr;
      
      console.log('Total Records Progress:', progressData?.length);

      const combined = (profiles || []).map(p => {
        // Cocokkan berdasarkan user_id (UUID)
        const userProgress = (progressData || []).filter(up => up.user_id === p.id);
        const percent = totalLessonsCount > 0 ? Math.round((userProgress.length / totalLessonsCount) * 100) : 0;
        return {
          ...p,
          completedCount: userProgress.length,
          totalCount: totalLessonsCount,
          percent
        };
      });
      setUserProgressList(combined);
    } catch (err) {
      console.error('Error fetch progress:', err);
      showToast('Gagal sinkronisasi: ' + err.message, 'error');
    }
    setProgressLoading(false);
  };

  useEffect(() => { 
    if (subTab === 'curriculum') fetchAll(); 
    if (subTab === 'progress') fetchUserProgress();
  }, [subTab]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ─── Class CRUD (NEW) ─────────────────────────────────────────────────────
  const openNewClass = () => {
    setClassForm({ title: '', description: '', banner_url: '' });
    setBannerFile(null);
    setBannerPreview(null);
    setActiveClassEdit('new');
    setView('class-editor');
  };
  const openEditClass = (cls) => {
    setClassForm({ title: cls.title, description: cls.description || '', banner_url: cls.banner_url || '' });
    setBannerFile(null);
    setBannerPreview(null);
    setActiveClassEdit(cls);
    setView('class-editor');
  };

  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const handleCourseImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCourseFile(file);
      setCoursePreview(URL.createObjectURL(file));
    }
  };

  const saveClass = async () => {
    if (!classForm.title.trim()) return showToast('Judul kelas wajib diisi!', 'error');
    setSaving(true);
    
    let finalBannerUrl = classForm.banner_url;

    // Upload banner if file selected
    if (bannerFile) {
      const fileName = `${Date.now()}-${bannerFile.name}`;
      const { data, error: uploadErr } = await supabase.storage
        .from('lms-banners')
        .upload(fileName, bannerFile);
      
      if (uploadErr) {
        showToast('Gagal upload banner: ' + uploadErr.message, 'error');
      } else {
        const { data } = supabase.storage.from('lms-banners').getPublicUrl(fileName);
        finalBannerUrl = data.publicUrl;
      }
    }

    const payload = {
      title: classForm.title.trim(),
      description: classForm.description.trim() || null,
      banner_url: finalBannerUrl || null,
    };

    if (activeClassEdit === 'new') {
      const maxOrder = classes.length > 0 ? Math.max(...classes.map(c => c.order_index)) : 0;
      const { error } = await supabase.from('lms_classes').insert({ ...payload, order_index: maxOrder + 1 });
      if (error) showToast('Gagal simpan kelas: ' + error.message, 'error');
      else showToast('Kelas baru berhasil ditambahkan!');
    } else {
      const { error } = await supabase.from('lms_classes').update(payload).eq('id', activeClassEdit.id);
      if (error) showToast('Gagal update kelas: ' + error.message, 'error');
      else showToast('Kelas berhasil diperbarui!');
    }
    
    setView('list');
    setActiveClassEdit(null);
    setSaving(false);
    fetchAll();
  };

  const deleteClass = async (id) => {
    if (!window.confirm('Hapus kelas ini? Semua modul & materi di dalamnya akan ikut terhapus.')) return;
    setSaving(true);
    await supabase.from('lms_classes').delete().eq('id', id);
    showToast('Kelas dihapus.');
    setSaving(false);
    fetchAll();
  };

  // ─── Course CRUD (Modul) ──────────────────────────────────────────────────
  const openNewCourse = (classId) => {
    setCourseForm({ title: '', description: '', thumbnail_url: '' });
    setCourseFile(null);
    setCoursePreview(null);
    setActiveCourseEdit({ classId });
    setView('course-editor');
  };
  const openEditCourse = (course) => {
    setCourseForm({ 
      title: course.title, 
      description: course.description || '',
      thumbnail_url: course.thumbnail_url || ''
    });
    setCourseFile(null);
    setCoursePreview(null);
    setActiveCourseEdit({ classId: course.class_id, course });
    setView('course-editor');
  };
  const saveCourse = async () => {
    if (!courseForm.title.trim()) return showToast('Judul modul wajib diisi!', 'error');
    setSaving(true);

    let finalThumbnailUrl = courseForm.thumbnail_url;

    // Upload thumbnail if file selected
    if (courseFile) {
      const fileName = `${Date.now()}-mod-${courseFile.name}`;
      const { error: uploadErr } = await supabase.storage
        .from('lms-banners')
        .upload(fileName, courseFile);
      
      if (uploadErr) {
        showToast('Gagal upload gambar: ' + uploadErr.message, 'error');
      } else {
        const { data } = supabase.storage.from('lms-banners').getPublicUrl(fileName);
        finalThumbnailUrl = data.publicUrl;
      }
    }

    const classCourses = courses.filter(c => c.class_id === activeCourseEdit.classId);
    const maxOrder = classCourses.length > 0 ? Math.max(...classCourses.map(c => c.order_index)) : 0;
    
    const payload = {
      class_id: activeCourseEdit.classId,
      title: courseForm.title.trim(),
      description: courseForm.description.trim() || null,
      thumbnail_url: finalThumbnailUrl || null,
    };

    if (activeCourseEdit.course) {
      const { error } = await supabase.from('courses').update(payload).eq('id', activeCourseEdit.course.id);
      if (error) showToast('Gagal update: ' + error.message, 'error');
      else showToast('Modul berhasil diperbarui!');
    } else {
      const { error } = await supabase.from('courses').insert({ ...payload, order_index: maxOrder + 1, is_active: true });
      if (error) showToast('Gagal simpan: ' + error.message, 'error');
      else showToast('Modul berhasil ditambahkan!');
    }
    setView('list');
    setActiveCourseEdit(null);
    setSaving(false);
    fetchAll();
  };
  const deleteCourse = async (id) => {
    if (!window.confirm('Hapus modul ini? Semua lesson di dalamnya juga akan terhapus.')) return;
    setSaving(true);
    await supabase.from('courses').delete().eq('id', id);
    showToast('Modul dihapus.');
    setSaving(false);
    fetchAll();
  };
  const toggleCourseActive = async (course) => {
    await supabase.from('courses').update({ is_active: !course.is_active }).eq('id', course.id);
    setCourses(prev => prev.map(c => c.id === course.id ? { ...c, is_active: !c.is_active } : c));
  };

  // ─── Lesson CRUD ──────────────────────────────────────────────────────────
  const openNewLesson = (courseId) => {
    setLessonForm({ id: `${courseId}-${uid()}`, title: '', type: 'video', video_url: '', duration: '' });
    setLessonModal({ courseId });
  };
  const openEditLesson = (lesson) => {
    setLessonForm({ id: lesson.id, title: lesson.title, type: lesson.type, video_url: lesson.video_url || '', duration: lesson.duration || '' });
    setLessonModal({ courseId: lesson.course_id, lesson });
  };
  const saveLesson = async () => {
    if (!lessonForm.title.trim()) return showToast('Judul lesson wajib diisi!', 'error');
    if (!lessonForm.id.trim()) return showToast('ID lesson wajib diisi!', 'error');
    setSaving(true);
    const courseLessons = lessons.filter(l => l.course_id === lessonModal.courseId);
    const maxOrder = courseLessons.length > 0 ? Math.max(...courseLessons.map(l => l.order_index)) : 0;
    const payload = {
      id: lessonForm.id.trim(),
      course_id: lessonModal.courseId,
      title: lessonForm.title.trim(),
      type: lessonForm.type,
      video_url: lessonForm.type === 'video' ? (lessonForm.video_url.trim() || null) : null,
      duration: lessonForm.type === 'video' ? (lessonForm.duration.trim() || null) : null,
      order_index: lessonModal.lesson ? lessonModal.lesson.order_index : maxOrder + 1,
    };
    if (lessonModal.lesson) {
      const { error } = await supabase.from('lessons').update(payload).eq('id', lessonModal.lesson.id);
      if (error) showToast('Gagal update lesson: ' + error.message, 'error');
      else showToast('Lesson berhasil diperbarui!');
    } else {
      const { error } = await supabase.from('lessons').insert(payload);
      if (error) showToast('Gagal simpan lesson: ' + error.message, 'error');
      else showToast('Lesson berhasil ditambahkan!');
    }
    setLessonModal(null);
    setSaving(false);
    fetchAll();
  };
  const deleteLesson = async (id) => {
    if (!window.confirm('Hapus lesson ini? Soal quiz di dalamnya juga akan terhapus.')) return;
    setSaving(true);
    await supabase.from('lessons').delete().eq('id', id);
    showToast('Lesson dihapus.');
    setSaving(false);
    fetchAll();
  };

  // ─── Quiz CRUD ────────────────────────────────────────────────────────────
  const openNewQuiz = (lessonId) => {
    setQuizForm({ question_text: '', options: ['', '', '', ''], correct_index: 0 });
    setQuizModal({ lessonId });
  };
  const openEditQuiz = (q) => {
    // options from DB is already parsed JSON array
    const opts = Array.isArray(q.options) ? q.options : JSON.parse(q.options);
    setQuizForm({ question_text: q.question_text, options: opts, correct_index: q.correct_index });
    setQuizModal({ lessonId: q.lesson_id, question: q });
  };
  const saveQuiz = async () => {
    if (!quizForm.question_text.trim()) return showToast('Pertanyaan wajib diisi!', 'error');
    if (quizForm.options.some(o => !o.trim())) return showToast('Semua opsi jawaban wajib diisi!', 'error');
    setSaving(true);
    const lessonQuestions = quizQuestions.filter(q => q.lesson_id === quizModal.lessonId);
    const maxOrder = lessonQuestions.length > 0 ? Math.max(...lessonQuestions.map(q => q.order_index)) : 0;
    const payload = {
      lesson_id: quizModal.lessonId,
      question_text: quizForm.question_text.trim(),
      options: quizForm.options.map(o => o.trim()),
      correct_index: Number(quizForm.correct_index),
      order_index: quizModal.question ? quizModal.question.order_index : maxOrder + 1,
    };
    if (quizModal.question) {
      const { error } = await supabase.from('quiz_questions').update(payload).eq('id', quizModal.question.id);
      if (error) showToast('Gagal update soal: ' + error.message, 'error');
      else showToast('Soal berhasil diperbarui!');
    } else {
      const { error } = await supabase.from('quiz_questions').insert(payload);
      if (error) showToast('Gagal simpan soal: ' + error.message, 'error');
      else showToast('Soal berhasil ditambahkan!');
    }
    setQuizModal(null);
    setSaving(false);
    fetchAll();
  };
  const deleteQuiz = async (id) => {
    if (!window.confirm('Hapus soal ini?')) return;
    await supabase.from('quiz_questions').delete().eq('id', id);
    showToast('Soal dihapus.');
    fetchAll();
  };

  // ─── Reorder helpers ──────────────────────────────────────────────────────
  const reorderCourse = async (course, dir) => {
    const sorted = [...courses].sort((a, b) => a.order_index - b.order_index);
    const idx = sorted.findIndex(c => c.id === course.id);
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const swap = sorted[swapIdx];
    await Promise.all([
      supabase.from('courses').update({ order_index: swap.order_index }).eq('id', course.id),
      supabase.from('courses').update({ order_index: course.order_index }).eq('id', swap.id),
    ]);
    fetchAll();
  };

  const seedModul6 = async () => {
    if (!window.confirm('Ingin menambahkan Modul 6 secara otomatis?')) return;
    setSaving(true);
    try {
      // 1. Course
      await supabase.from('courses').upsert({ id: 6, title: 'Modul 6: Etika Pernikahan dalam Islam', order_index: 6, is_active: true });
      // 2. Lessons
      await supabase.from('lessons').upsert([
        { id: 'v6-1', course_id: 6, title: 'Etika Pernikahan & Adab Malam Pertama', type: 'video', video_url: 'https://www.youtube.com/embed/bWZyWAnIMpU', duration: '15:00', order_index: 1 },
        { id: 'q6-1', course_id: 6, title: 'Kuis Modul 6: Etika Pernikahan', type: 'quiz', order_index: 2 }
      ]);
      // 3. Quiz Questions
      await supabase.from('quiz_questions').delete().eq('lesson_id', 'q6-1');
      await supabase.from('quiz_questions').insert([
        { lesson_id: 'q6-1', question_text: 'Apa niat utama seorang muslim dalam melangsungkan pernikahan?', options: ['Mencari kekayaan pasangan', 'Mengikuti tren sosial semata', 'Ibadah kepada Allah', 'Sekadar memenuhi keinginan ortu'], correct_index: 2, order_index: 1 },
        { lesson_id: 'q6-1', question_text: 'Apa yang disunnahkan saat masuk kamar pengantin?', options: ['Diskusi keuangan', 'Bersikap lembut & suguhan ringan', 'Bersikap tegas', 'Tuntut hak'], correct_index: 1, order_index: 2 }
      ]);
      showToast('Modul 6 Berhasil Ditambahkan!');
      fetchAll();
    } catch (err) { showToast('Gagal: ' + err.message, 'error'); }
    setSaving(false);
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  if (loading && !courses.length) return (
    <div style={{ padding: '4rem', textAlign: 'center' }}>
      <Loader size={40} style={{ animation: 'spin 1s linear infinite' }} color="var(--primary)" />
      <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Memuat data akademi...</p>
    </div>
  );

  const sortedCourses = [...courses].sort((a, b) => a.order_index - b.order_index);

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      {/* ── Sub Tabs ── */}
      <div style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid var(--border)', marginBottom: '2rem' }}>
        <button 
          onClick={() => setSubTab('curriculum')}
          style={{
            padding: '1rem 0.5rem', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '1rem', fontWeight: '700', color: subTab === 'curriculum' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: subTab === 'curriculum' ? '3px solid var(--primary)' : '3px solid transparent',
            transition: 'all 0.2s'
          }}
        >
          Kelola Kurikulum
        </button>
        <button 
          onClick={() => setSubTab('progress')}
          style={{
            padding: '1rem 0.5rem', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '1rem', fontWeight: '700', color: subTab === 'progress' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: subTab === 'progress' ? '3px solid var(--primary)' : '3px solid transparent',
            transition: 'all 0.2s'
          }}
        >
          Progres Belajar User
        </button>
      </div>

      {toast && (
        <div style={{
          position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 9999,
          padding: '0.85rem 1.5rem', borderRadius: '12px', fontWeight: '700',
          fontSize: '0.875rem', boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          background: toast.type === 'error' ? '#E63946' : 'var(--primary)',
          color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem',
          animation: 'fadeIn 0.3s ease'
        }}>
          {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* ── LIST VIEW ── */}
      {view === 'list' && (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          {subTab === 'curriculum' ? (
            <>
              {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.1rem' }}>
                <GraduationCap size={20} color="var(--primary)" /> Manajemen Kelas & Kursus
              </h3>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {classes.length} Kelas · {courses.length} Modul · {lessons.length} Lesson
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <button
                onClick={openNewClass}
                style={BTN_SM({ background: 'linear-gradient(135deg, var(--primary), var(--primary-light))', color: 'white', padding: '0.6rem 1.25rem', borderRadius: '10px', fontSize: '0.875rem' })}
              >
                <Plus size={16} /> Tambah Kelas Baru
              </button>
            </div>
          </div>

          {/* Classes list */}
          {classes.length === 0 && (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
              <Zap size={48} strokeWidth={1.2} style={{ opacity: 0.4, marginBottom: '1rem' }} />
              <p>Belum ada kelas. Klik "Tambah Kelas Baru" untuk mulai.</p>
            </div>
          )}

          {classes.sort((a,b) => a.order_index - b.order_index).map((cls) => {
            const isClassExpanded = expandedClass === cls.id;
            const classModules = courses.filter(c => c.class_id === cls.id).sort((a,b) => a.order_index - b.order_index);
            
            return (
              <div key={cls.id} style={{ ...CARD, padding: 0, overflow: 'hidden', border: isClassExpanded ? '2px solid var(--primary-light)' : '1px solid var(--border)' }}>
                {/* Class Header */}
                <div 
                  onClick={() => setExpandedClass(isClassExpanded ? null : cls.id)}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.25rem 1.5rem', 
                    cursor: 'pointer', background: isClassExpanded ? 'rgba(44,95,77,0.03)' : 'white' 
                  }}
                >
                  <div style={{ width: 120, height: 70, borderRadius: '10px', overflow: 'hidden', background: '#f1f5f9', border: '1px solid var(--border)', flexShrink: 0 }}>
                    {cls.banner_url ? (
                      <img src={cls.banner_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1' }}><BookOpen size={24}/></div>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>{cls.title}</h4>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{classModules.length} Modul Terdaftar</p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => openEditClass(cls)} style={BTN_SM({ background: 'rgba(44,95,77,0.07)', color: 'var(--primary)' })}><Edit3 size={15} /></button>
                    <button onClick={() => deleteClass(cls.id)} style={BTN_SM({ background: 'rgba(230,57,70,0.07)', color: '#E63946' })}><Trash2 size={15} /></button>
                    <div style={{ width: '1px', height: '20px', background: 'var(--border)', margin: '0 0.5rem' }} />
                    <ChevronDown size={20} color="var(--text-muted)" style={{ transform: isClassExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                  </div>
                </div>

                {/* Modules inside Class */}
                {isClassExpanded && (
                  <div style={{ padding: '0 1.5rem 1.5rem', background: 'rgba(0,0,0,0.01)' }}>
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h5 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Daftar Modul</h5>
                        <button onClick={() => openNewCourse(cls.id)} style={BTN_SM({ background: 'var(--primary)', color: 'white' })}>
                          <Plus size={14} /> Tambah Modul
                        </button>
                      </div>

                      {classModules.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '2rem', background: 'white', borderRadius: '12px', border: '1px dashed var(--border)' }}>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Belum ada modul di kelas ini.</p>
                        </div>
                      )}

                      {classModules.map((course) => {
                        const courseLessons = lessons.filter(l => l.course_id === course.id).sort((a,b) => a.order_index - b.order_index);
                        const isCourseExpanded = expandedCourse === course.id;
                        return (
                          <div key={course.id} style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '0.75rem', overflow: 'hidden' }}>
                            <div 
                              onClick={() => setExpandedCourse(isCourseExpanded ? null : course.id)}
                              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1rem', cursor: 'pointer' }}
                            >
                              <div style={{ width: 40, height: 40, borderRadius: '8px', overflow: 'hidden', background: '#f1f5f9', flexShrink: 0 }}>
                                {course.thumbnail_url ? <img src={course.thumbnail_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <BookOpen size={16} color="#cbd5e1" style={{ margin: '12px' }} />}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-main)' }}>{course.title}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{courseLessons.length} Lesson</div>
                              </div>
                              <div style={{ display: 'flex', gap: '0.4rem' }} onClick={e => e.stopPropagation()}>
                                <button onClick={() => openEditCourse(course)} style={BTN_SM({ background: 'rgba(0,0,0,0.03)' })}><Edit3 size={12} /></button>
                                <button onClick={() => openNewLesson(course.id)} style={BTN_SM({ background: 'var(--bg-light)', color: 'var(--primary)' })}><Plus size={12} /> Add Lesson</button>
                              </div>
                            </div>

                            {isCourseExpanded && (
                              <div style={{ padding: '0.5rem 1rem 1rem', borderTop: '1px solid #f1f5f9' }}>
                                 {courseLessons.map(lesson => {
                                    const isQuiz = lesson.type === 'quiz';
                                    const isLessonExt = expandedLesson === lesson.id;
                                    const questions = (quizQuestions || []).filter(q => q.lesson_id === lesson.id);

                                    return (
                                      <div key={lesson.id} style={{ marginBottom: '0.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '10px', background: isLessonExt ? 'rgba(184,134,30,0.05)' : 'var(--bg-light)', border: isLessonExt ? '1px solid rgba(184,134,30,0.2)' : '1px solid transparent' }}>
                                          {isQuiz ? <FileQuestion size={16} color="#b8861e" /> : <PlayCircle size={16} color="var(--primary)" />}
                                          <span style={{ flex: 1, fontSize: '0.85rem', fontWeight: '700' }}>{lesson.title}</span>
                                          <div style={{ display: 'flex', gap: '0.35rem' }}>
                                            {isQuiz && (
                                              <button 
                                                onClick={() => setExpandedLesson(isLessonExt ? null : lesson.id)} 
                                                style={BTN_SM({ background: isLessonExt ? '#b8861e' : 'white', color: isLessonExt ? 'white' : '#b8861e', border: '1px solid #b8861e' })}
                                              >
                                                <Zap size={12} /> {isLessonExt ? 'Tutup Soal' : 'Kelola Soal'}
                                              </button>
                                            )}
                                            <button onClick={() => openEditLesson(lesson)} style={BTN_SM({ background: 'white', border: '1px solid var(--border)' })}><Edit3 size={13} /></button>
                                            <button onClick={() => deleteLesson(lesson.id)} style={BTN_SM({ background: 'white', border: '1px solid var(--border)', color: '#E63946' })}><Trash2 size={13} /></button>
                                          </div>
                                        </div>

                                        {isQuiz && isLessonExt && (
                                          <div style={{ padding: '1rem', background: 'white', border: '1px solid #f1f5f9', borderTop: 'none', borderRadius: '0 0 10px 10px', marginLeft: '0.5rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                               <h6 style={{ margin: 0, fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Daftar Soal ({questions.length})</h6>
                                               <button onClick={() => openNewQuiz(lesson.id)} style={BTN_SM({ background: 'rgba(184,134,30,0.1)', color: '#b8861e' })}>
                                                 <Plus size={12} /> Tambah Soal
                                               </button>
                                            </div>

                                            {questions.length === 0 ? (
                                              <div style={{ padding: '1.5rem', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                                                <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>Belum ada soal kuis.</p>
                                              </div>
                                            ) : (
                                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                {questions.map((q, qi) => (
                                                  <div key={q.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                                                     <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: '800' }}>{qi+1}</div>
                                                     <div style={{ flex: 1, fontSize: '0.8rem', fontWeight: '600' }}>{q.question_text}</div>
                                                     <div style={{ display: 'flex', gap: '0.35rem' }}>
                                                       <button onClick={() => openEditQuiz(q)} style={BTN_SM({ padding: '6px', background: 'white' })}><Edit3 size={12} /></button>
                                                       <button onClick={() => deleteQuiz(q.id)} style={BTN_SM({ padding: '6px', background: 'white', color: '#E63946' })}><Trash2 size={12} /></button>
                                                     </div>
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
            </>
          ) : (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
             <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0 }}>Progres Belajar Calon Kandidat</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Memantau aktivitas {userProgressList.length} orang candidate aktif.</p>
             </div>
             <button 
               className="btn btn-outline" 
               onClick={fetchUserProgress} 
               disabled={progressLoading}
               style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
             >
               <Activity size={16} className={progressLoading ? 'spin' : ''} />
               {progressLoading ? 'Menyinkronkan...' : 'Refresh Data Real-Time'}
             </button>
          </div>

          <div style={{ ...CARD, padding: 0 }}>
             <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                     <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)' }}>NAMA USER</th>
                     <th style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)' }}>GENDER</th>
                     <th style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)' }}>PROGRESS</th>
                     <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', textAlign: 'right' }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {progressLoading ? (
                    <tr><td colSpan={4} style={{ padding: '3rem', textAlign: 'center' }}><Loader className="spin" size={20} /></td></tr>
                  ) : userProgressList.length === 0 ? (
                    <tr><td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada data progres kandidat.</td></tr>
                  ) : userProgressList.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                       <td style={{ padding: '1rem 1.5rem' }}>
                          <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{item.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.email}</div>
                       </td>
                       <td style={{ padding: '1rem' }}>
                          <span style={{ 
                            fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase',
                            color: item.gender === 'ikhwan' ? '#0ea5e9' : '#ec4899',
                            background: item.gender === 'ikhwan' ? 'rgba(14,165,233,0.1)' : 'rgba(236,72,153,0.1)',
                            padding: '3px 8px', borderRadius: '4px'
                          }}>
                            {item.gender || '-'}
                          </span>
                       </td>
                       <td style={{ padding: '1rem', width: '30%' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px', fontWeight: '700' }}>
                             <span>{item.percent}% Selesai</span>
                             <span>{item.completedCount}/{item.totalCount}</span>
                          </div>
                          <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden' }}>
                             <div style={{ width: `${item.percent}%`, height: '100%', background: 'var(--primary)', borderRadius: '10px' }}></div>
                          </div>
                       </td>
                       <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                          {item.percent === 100 ? (
                            <span style={{ color: 'var(--success)', fontWeight: '700', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                              Lulus <CheckCircle size={14} />
                            </span>
                          ) : (
                            <span style={{ color: '#94a3b8', fontWeight: '700', fontSize: '0.75rem' }}>In Progress</span>
                          )}
                       </td>
                    </tr>
                  ))}
                </tbody>
             </table>
            </div>
          </div>
        )}
      </div>
    )}

      {/* ── EDITOR VIEW: Class ── */}
      {view === 'class-editor' && (
        <div style={{ animation: 'fadeInUp 0.4s ease', maxWidth: '800px', margin: '0 auto', padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <button onClick={() => setView('list')} style={BTN_SM({ background: 'white', border: '1px solid var(--border)' })}>
              <ArrowUp size={18} style={{ transform: 'rotate(-90deg)' }} /> Kembali
            </button>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0 }}>
              {activeClassEdit === 'new' ? 'Tambah Kelas Baru' : 'Edit Detail Kelas'}
            </h2>
          </div>

          <div style={{ ...CARD, padding: '2rem', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Judul Kelas/Course <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input className="form-control" style={{ fontSize: '1.1rem', padding: '1rem' }} value={classForm.title} onChange={e => setClassForm(p => ({ ...p, title: e.target.value }))} placeholder="contoh: Akademi Persiapan Pernikahan Dasar" />
              </div>
              
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Banner Kelas (Image)</label>
                <div 
                  onClick={() => bannerInputRef.current?.click()}
                  style={{ 
                    width: '100%', height: '320px', borderRadius: '16px', border: '2px dashed var(--border)', 
                    background: '#f8fafc', cursor: 'pointer', overflow: 'hidden', position: 'relative',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  {bannerPreview || classForm.banner_url ? (
                    <>
                      <img src={bannerPreview || classForm.banner_url} alt="Banner Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', opacity: 0, transition: '0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                        Klik untuk Ganti Gambar
                      </div>
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      <Upload size={48} style={{ marginBottom: '1rem' }} />
                      <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>Pilih File Gambar Banner Utama</div>
                      <div style={{ fontSize: '0.8rem' }}>Rekomendasi ukuran 1200x600 px</div>
                    </div>
                  )}
                </div>
                <input ref={bannerInputRef} type="file" accept="image/*" onChange={handleBannerChange} style={{ display: 'none' }} />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Deskripsi Lengkap Kelas</label>
                <textarea className="form-control" rows={8} value={classForm.description} onChange={e => setClassForm(p => ({ ...p, description: e.target.value }))} placeholder="Berikan gambaran mendalam tentang apa yang akan dipelajari di kelas ini..." />
              </div>
            </div>

            <div style={{ marginTop: '2.5rem', paddingTop: '2rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button className="btn btn-outline" style={{ padding: '0.8rem 2rem' }} onClick={() => setView('list')}>Batal</button>
              <button className="btn btn-primary" style={{ padding: '0.8rem 2.5rem' }} onClick={saveClass} disabled={saving}>
                {saving ? <Loader size={18} className="spin" /> : <Save size={18} />} {activeClassEdit === 'new' ? 'Buat Kelas Sekarang' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── EDITOR VIEW: Course (Modul) ── */}
      {view === 'course-editor' && (
        <div style={{ animation: 'fadeInUp 0.4s ease', maxWidth: '800px', margin: '0 auto', padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <button onClick={() => setView('list')} style={BTN_SM({ background: 'white', border: '1px solid var(--border)' })}>
              <ArrowUp size={18} style={{ transform: 'rotate(-90deg)' }} /> Kembali
            </button>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0 }}>
              {activeCourseEdit.course ? 'Edit Detail Modul' : 'Tambah Modul Baru'}
            </h2>
          </div>

          <div style={{ ...CARD, padding: '2rem', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Judul Modul <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input className="form-control" style={{ fontSize: '1.1rem', padding: '1rem' }} value={courseForm.title} onChange={e => setCourseForm(p => ({ ...p, title: e.target.value }))} placeholder="contoh: Modul 1: Fondasi Pernikahan" />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Gambar Sampul Modul</label>
                <div 
                  onClick={() => courseInputRef.current?.click()}
                  style={{ 
                    width: '100%', height: '240px', borderRadius: '16px', border: '2px dashed var(--border)', 
                    background: '#f8fafc', cursor: 'pointer', overflow: 'hidden', position: 'relative',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  {coursePreview || courseForm.thumbnail_url ? (
                    <>
                      <img src={coursePreview || courseForm.thumbnail_url} alt="Course Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', opacity: 0, transition: '0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                        Klik untuk Ganti Gambar
                      </div>
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      <Upload size={40} style={{ marginBottom: '0.8rem' }} />
                      <div style={{ fontSize: '0.95rem', fontWeight: 'bold' }}>Klik untuk Pilih Gambar Thumbnail</div>
                    </div>
                  )}
                </div>
                <input ref={courseInputRef} type="file" accept="image/*" onChange={handleCourseImageChange} style={{ display: 'none' }} />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Deskripsi Ringkas</label>
                <textarea className="form-control" rows={5} value={courseForm.description} onChange={e => setCourseForm(p => ({ ...p, description: e.target.value }))} placeholder="Akan membahas apa saja di modul ini?" />
              </div>
            </div>

            <div style={{ marginTop: '2.5rem', paddingTop: '2rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button className="btn btn-outline" style={{ padding: '0.8rem 2rem' }} onClick={() => setView('list')}>Batal</button>
              <button className="btn btn-primary" style={{ padding: '0.8rem 2.5rem' }} onClick={saveCourse} disabled={saving}>
                {saving ? <Loader size={18} className="spin" /> : <Save size={18} />} Simpan Modul
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Lesson ──────────────────────────────────────────────────── */}
      {lessonModal && (
        <div className="modal-overlay modal-overlay-dark" onClick={() => setLessonModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '540px', width: '90%' }}>
            <div className="modal-header info" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', flexDirection: 'row', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>{lessonModal.lesson ? 'Edit Lesson' : 'Tambah Lesson Baru'}</h3>
              <button onClick={() => setLessonModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">ID Unik Lesson <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input className="form-control" value={lessonForm.id} onChange={e => setLessonForm(p => ({ ...p, id: e.target.value }))} placeholder="contoh: v1-3 atau q2-1" disabled={!!lessonModal.lesson} />
                <small style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Tidak bisa diubah setelah disimpan.</small>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Judul Lesson <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input className="form-control" value={lessonForm.title} onChange={e => setLessonForm(p => ({ ...p, title: e.target.value }))} placeholder="contoh: Materi 3: Komunikasi dalam Keluarga" />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Tipe Lesson</label>
                <select className="form-control" value={lessonForm.type} onChange={e => setLessonForm(p => ({ ...p, type: e.target.value }))}>
                  <option value="video">🎬 Video</option>
                  <option value="quiz">📝 Quiz</option>
                </select>
              </div>
              {lessonForm.type === 'video' && (
                <>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">URL Video (YouTube Embed)</label>
                    <input className="form-control" value={lessonForm.video_url} onChange={e => setLessonForm(p => ({ ...p, video_url: e.target.value }))} placeholder="https://www.youtube.com/embed/xxxx" />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Durasi</label>
                    <input className="form-control" value={lessonForm.duration} onChange={e => setLessonForm(p => ({ ...p, duration: e.target.value }))} placeholder="contoh: 21:30" />
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer" style={{ justifyContent: 'flex-end', gap: '0.75rem', padding: '1rem 1.5rem', borderTop: '1px solid var(--border)' }}>
              <button className="btn btn-outline" onClick={() => setLessonModal(null)}>Batal</button>
              <button className="btn btn-primary" onClick={saveLesson} disabled={saving}>
                {saving ? <Loader size={15} className="spin" /> : <Save size={15} />} Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Quiz Question ───────────────────────────────────────────── */}
      {quizModal && (
        <div className="modal-overlay" onClick={() => setQuizModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '560px', width: '95%' }}>
            <div className="modal-header info" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', flexDirection: 'row', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>{quizModal.question ? 'Edit Soal Quiz' : 'Tambah Soal Quiz'}</h3>
              <button onClick={() => setQuizModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Pertanyaan <span style={{ color: 'var(--danger)' }}>*</span></label>
                <textarea className="form-control" rows={3} value={quizForm.question_text} onChange={e => setQuizForm(p => ({ ...p, question_text: e.target.value }))} placeholder="Tulis pertanyaan di sini..." />
              </div>
              <div>
                <label className="form-label" style={{ marginBottom: '0.6rem', display: 'block' }}>Opsi Jawaban <span style={{ color: 'var(--danger)' }}>*</span></label>
                {quizForm.options.map((opt, oi) => (
                  <div key={oi} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                    <input
                      type="radio"
                      name="correct"
                      checked={Number(quizForm.correct_index) === oi}
                      onChange={() => setQuizForm(p => ({ ...p, correct_index: oi }))}
                      id={`opt-${oi}`}
                      style={{ flexShrink: 0, accentColor: 'var(--primary)', width: 16, height: 16 }}
                    />
                    <label htmlFor={`opt-${oi}`} style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', flexShrink: 0, minWidth: 20 }}>
                      {String.fromCharCode(65 + oi)}.
                    </label>
                    <input
                      className="form-control"
                      value={opt}
                      onChange={e => {
                        const opts = [...quizForm.options];
                        opts[oi] = e.target.value;
                        setQuizForm(p => ({ ...p, options: opts }));
                      }}
                      placeholder={`Opsi ${String.fromCharCode(65 + oi)}`}
                      style={{ flex: 1, border: Number(quizForm.correct_index) === oi ? '2px solid var(--success)' : undefined }}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer" style={{ justifyContent: 'flex-end', gap: '0.75rem', padding: '1rem 1.5rem', borderTop: '1px solid var(--border)' }}>
              <button className="btn btn-outline" onClick={() => setQuizModal(null)}>Batal</button>
              <button className="btn btn-primary" onClick={saveQuiz} disabled={saving}>
                {saving ? <Loader size={15} className="spin" /> : <Save size={15} />} Simpan Soal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
