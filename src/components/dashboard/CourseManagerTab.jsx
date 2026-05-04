import React, { useState, useEffect, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { AppContext } from '../../App';
import { supabase } from '../../supabase';
import {
  BookOpen, Plus, Trash2, Edit3, Save, X, ChevronDown, ChevronLeft, ChevronRight,
  PlayCircle, FileQuestion, GraduationCap, CheckCircle, FileText,
  AlertCircle, Loader, ToggleLeft, ToggleRight, ArrowUp, ArrowDown,
  Activity, Zap, Upload, GripVertical, Search, RefreshCw, Eye, XCircle
} from 'lucide-react';
import AdminEnrollmentTab from './AdminEnrollmentTab';

// ─── tiny helpers ────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9);
const CARD = { borderRadius: '14px', border: '1px solid var(--border)', background: 'white', padding: '1.25rem 1.5rem', marginBottom: '1rem' };
const BTN_SM = (extra = {}) => ({
  display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
  padding: '0.4rem 0.85rem', borderRadius: '8px', fontSize: '0.8rem',
  fontWeight: '700', cursor: 'pointer', border: 'none', transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  ...extra
});

export default function CourseManagerTab() {
  const { setConfirmState } = useContext(AppContext);
  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  const [toast, setToast] = useState(null);

  // Modal states (using new view/editor system for class/course)
  const [lessonModal, setLessonModal] = useState(null);   // null | { courseId, lesson? }
  const [quizModal, setQuizModal] = useState(null);       // null | { lessonId, question? }

  // Form states
  const [classForm, setClassForm] = useState({ title: '', description: '', banner_url: '' });
  const [courseForm, setCourseForm] = useState({ title: '', description: '', thumbnail_url: '' });
  const [lessonForm, setLessonForm] = useState({ id: '', title: '', type: 'video', video_url: '', duration: '', content: '' });
  const [quizForm, setQuizForm] = useState({ question_text: '', options: ['', '', '', ''], correct_index: 0 });
  
  // UI states
  const [view, setView] = useState('list'); // 'list' | 'class-editor' | 'course-editor'
  const [activeClassEdit, setActiveClassEdit] = useState(null); // 'new' | class-obj
  const [activeCourseEdit, setActiveCourseEdit] = useState(null); // { classId, course? }

  const [expandedClass, setExpandedClass] = useState(null);
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [expandedLesson, setExpandedLesson] = useState(null);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const subTab = searchParams.get('sub') || 'curriculum';
  
  const [userProgressList, setUserProgressList] = useState([]);
  const [progressLoading, setProgressLoading] = useState(false);
  const [progPage, setProgPage] = useState(1);
  const [progSearch, setProgSearch] = useState('');
  const [progGender, setProgGender] = useState('all');
  const [detailUser, setDetailUser] = useState(null);
  const [academyMeta, setAcademyMeta] = useState({ classes: [], courses: [], lessons: [] });
  const progPerPage = 10;

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    const lessonData = l.data || [];
    setLessons(lessonData);
    setQuizQuestions(q.data || []);
    setLoading(false);
  };

  const fetchUserProgress = async () => {
    setProgressLoading(true);
    try {
      const { data: allClasses } = await supabase.from('lms_classes').select('id, title');
      const { data: allCourses } = await supabase.from('courses').select('id, class_id, title');
      const { data: allLessons } = await supabase.from('lessons').select('id, course_id');
      
      const classRequiredLessons = {}; 
      allCourses?.forEach(c => {
        const courseLessons = allLessons?.filter(l => l.course_id === c.id) || [];
        if (!classRequiredLessons[c.class_id]) classRequiredLessons[c.class_id] = new Set();
        courseLessons.forEach(l => classRequiredLessons[c.class_id].add(l.id));
      });

      const { data: profiles, error: pErr } = await supabase.from('profiles').select('id, name, gender, email').eq('role', 'user');
      if (pErr) throw pErr;

      const { data: progressData, error: prErr } = await supabase.from('user_lesson_progress').select('user_id, lesson_id').eq('completed', true);
      if (prErr) throw prErr;

      const combined = (profiles || []).map(p => {
        const userDoneLessons = new Set((progressData || []).filter(up => up.user_id === p.id).map(up => up.lesson_id));
        const earnedCertificates = [];
        allClasses?.forEach(cls => {
           const requiredIds = Array.from(classRequiredLessons[cls.id] || []);
           if (requiredIds.length > 0 && requiredIds.every(lid => userDoneLessons.has(lid))) {
             earnedCertificates.push(cls.title);
           }
        });
        const totalClasses = allClasses?.length || 0;
        return {
          ...p,
          certificatesCount: earnedCertificates.length,
          earnedCertificates,
          totalCourses: totalClasses,
          percent: totalClasses > 0 ? Math.round((earnedCertificates.length / totalClasses) * 100) : 0,
          doneLessonIds: Array.from(userDoneLessons)
        };
      });
      setAcademyMeta({ classes: allClasses || [], courses: allCourses || [], lessons: allLessons || [] });
      setUserProgressList(combined);
    } catch (err) {
      console.error('Error fetch progress:', err);
      showToast('Gagal sinkronisasi: ' + err.message, 'error');
    }
    setProgressLoading(false);
  };

  useEffect(() => { 
    if (subTab === 'curriculum') {
      fetchAll(); 
    } else {
      setLoading(false);
      if (subTab === 'progress') fetchUserProgress();
    }
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
      const { error } = await supabase.from('lms_classes').insert({ ...payload, order_index: maxOrder + 1, is_published: false });
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

  const deleteClass = (id) => {
    setConfirmState({
      isOpen: true,
      title: 'Hapus Kelas?',
      message: 'Semua modul & materi di dalamnya akan ikut terhapus secara permanen.',
      onConfirm: async () => {
        setSaving(true);
        await supabase.from('lms_classes').delete().eq('id', id);
        showToast('Kelas dihapus.');
        setSaving(false);
        setConfirmState(p => ({ ...p, isOpen: false }));
        fetchAll();
      }
    });
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
      const { error } = await supabase.from('courses').insert({ ...payload, order_index: maxOrder + 1, is_active: false });
      if (error) showToast('Gagal simpan: ' + error.message, 'error');
      else showToast('Modul berhasil ditambahkan!');
    }
    setView('list');
    setActiveCourseEdit(null);
    setSaving(false);
    fetchAll();
  };
  const deleteCourse = (id) => {
    setConfirmState({
      isOpen: true,
      title: 'Hapus Modul?',
      message: 'Semua materi di dalam modul ini akan ikut terhapus.',
      onConfirm: async () => {
        setSaving(true);
        await supabase.from('courses').delete().eq('id', id);
        showToast('Modul dihapus.');
        setSaving(false);
        setConfirmState(p => ({ ...p, isOpen: false }));
        fetchAll();
      }
    });
  };
  const toggleCourseActive = async (course) => {
    await supabase.from('courses').update({ is_active: !course.is_active }).eq('id', course.id);
    setCourses(prev => prev.map(c => c.id === course.id ? { ...c, is_active: !c.is_active } : c));
  };

  const toggleClassPublished = async (cls) => {
    const newVal = !cls.is_published;
    const { error } = await supabase.from('lms_classes').update({ is_published: newVal }).eq('id', cls.id);
    if (error) showToast('Gagal update status: ' + error.message, 'error');
    else setClasses(prev => prev.map(c => c.id === cls.id ? { ...c, is_published: newVal } : c));
  };

  const toggleLessonPublished = async (lesson) => {
    const newVal = !lesson.is_published;
    const { error } = await supabase.from('lessons').update({ is_published: newVal }).eq('id', lesson.id);
    if (error) showToast('Gagal update status: ' + error.message, 'error');
    else setLessons(prev => prev.map(l => l.id === lesson.id ? { ...l, is_published: newVal } : l));
  };

  // ─── Lesson CRUD ──────────────────────────────────────────────────────────
  const openNewLesson = (courseId) => {
    setLessonForm({ id: `${courseId}-${uid()}`, title: '', type: 'video', video_url: '', duration: '', content: '' });
    setLessonModal({ courseId });
  };
  const openEditLesson = (lesson) => {
    setLessonForm({ id: lesson.id, title: lesson.title, type: lesson.type, video_url: lesson.video_url || '', duration: lesson.duration || '', content: lesson.content || '' });
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
      content: lessonForm.content.trim() || null,
      order_index: lessonModal.lesson ? lessonModal.lesson.order_index : maxOrder + 1,
    };
    if (lessonModal.lesson) {
      const { error } = await supabase.from('lessons').update(payload).eq('id', lessonModal.lesson.id);
      if (error) {
        console.error('Supabase Update Error:', error);
        showToast('Gagal update lesson: ' + error.message, 'error');
      } else {
        showToast('Lesson berhasil diperbarui!');
      }
    } else {
      // Logic to handle missing default ID in database
      let finalId = lessonForm.id.trim();
      
      // If existing IDs are numbers, we must send a number
      const numericIds = lessons.map(l => Number(l.id)).filter(n => !isNaN(n));
      if (numericIds.length > 0) {
        // Use max ID + 1 if the table seems to use numeric IDs
        const maxId = Math.max(...numericIds);
        finalId = maxId + 1;
      }
      
      const { error } = await supabase.from('lessons').insert({ ...payload, id: finalId, is_published: false });
      if (error) {
        console.error('Supabase Insert Error:', error);
        showToast('Gagal simpan lesson: ' + error.message, 'error');
      } else {
        showToast('Lesson berhasil ditambahkan!');
      }
    }
    setLessonModal(null);
    setSaving(false);
    fetchAll();
  };
  const handleDragStart = (e, item) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
    e.target.style.opacity = '0.4';
    console.log('Drag Start:', item.id);
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedItem(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    return false;
  };

  const handleDrop = async (e, targetLesson) => {
    e.preventDefault();
    if (!draggedItem) return;
    
    // Compare as Strings to avoid type mismatch (string vs number)
    const dragId = String(draggedItem.id);
    const targetId = String(targetLesson.id);

    if (dragId === targetId) return;
    if (draggedItem.course_id !== targetLesson.course_id) return;

    console.log('Dropping', dragId, 'onto', targetId);

    const courseLessons = [...lessons]
      .filter(l => l.course_id === targetLesson.course_id)
      .sort((a, b) => a.order_index - b.order_index);
    
    const dragIdx = courseLessons.findIndex(l => String(l.id) === dragId);
    const dropIdx = courseLessons.findIndex(l => String(l.id) === targetId);
    
    if (dragIdx < 0 || dropIdx < 0) return;

    const newItems = [...courseLessons];
    const [removed] = newItems.splice(dragIdx, 1);
    newItems.splice(dropIdx, 0, removed);

    // Instant local update
    const finalLessons = lessons.map(l => {
      const matchIdx = newItems.findIndex(ni => String(ni.id) === String(l.id));
      if (matchIdx !== -1) return { ...l, order_index: matchIdx + 1 };
      return l;
    });
    setLessons(finalLessons);

    try {
      const updates = newItems.map((item, idx) => ({
        id: item.id,
        course_id: item.course_id,
        title: item.title,
        type: item.type,
        order_index: idx + 1
      }));
      const { error } = await supabase.from('lessons').upsert(updates);
      if (error) throw error;
      showToast('Urutan materi diperbarui');
    } catch (err) {
      console.error('Drop Error:', err);
      showToast('Gagal update database', 'error');
      fetchAll();
    }
  };

  const handleCourseDragStart = (e, course) => {
    setDraggedItem(course);
    e.dataTransfer.effectAllowed = 'move';
    e.target.style.opacity = '0.4';
    console.log('Course Drag Start:', course.id);
  };

  const handleCourseDrop = async (e, targetCourse) => {
    e.preventDefault();
    if (!draggedItem) return;

    const dragId = String(draggedItem.id);
    const targetId = String(targetCourse.id);

    if (dragId === targetId) return;
    if (draggedItem.class_id !== targetCourse.class_id) return;

    console.log('Dropping Module', dragId, 'onto', targetId);

    const classCourses = [...courses]
      .filter(c => c.class_id === targetCourse.class_id)
      .sort((a, b) => a.order_index - b.order_index);
    
    const dragIdx = classCourses.findIndex(c => String(c.id) === dragId);
    const dropIdx = classCourses.findIndex(c => String(c.id) === targetId);
    
    if (dragIdx < 0 || dropIdx < 0) return;

    const newItems = [...classCourses];
    const [removed] = newItems.splice(dragIdx, 1);
    newItems.splice(dropIdx, 0, removed);

    // Local update
    const finalCourses = courses.map(c => {
      const matchIdx = newItems.findIndex(ni => String(ni.id) === String(c.id));
      if (matchIdx !== -1) return { ...c, order_index: matchIdx + 1 };
      return c;
    });
    setCourses(finalCourses);

    try {
      const updates = newItems.map((item, idx) => ({
        id: item.id,
        class_id: item.class_id,
        title: item.title,
        order_index: idx + 1
      }));
      const { error } = await supabase.from('courses').upsert(updates);
      if (error) throw error;
      showToast('Urutan modul diperbarui');
    } catch (err) {
      console.error('Course Drop Error:', err);
      showToast('Gagal update urutan', 'error');
      fetchAll();
    }
  };

  const deleteLesson = (id) => {
    setConfirmState({
      isOpen: true,
      title: 'Hapus Materi?',
      message: 'Soal kuis di dalamnya juga akan terhapus.',
      onConfirm: async () => {
        setSaving(true);
        await supabase.from('lessons').delete().eq('id', id);
        showToast('Materi dihapus.');
        setConfirmState(p => ({ ...p, isOpen: false }));
        setSaving(false);
        fetchAll();
      }
    });
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
  const deleteQuiz = (id) => {
    setConfirmState({
      isOpen: true,
      title: 'Hapus Soal?',
      message: 'Hapus pertanyaan kuis ini?',
      onConfirm: async () => {
        await supabase.from('quiz_questions').delete().eq('id', id);
        showToast('Soal dihapus.');
        setConfirmState(p => ({ ...p, isOpen: false }));
        fetchAll();
      }
    });
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

  const reorderLesson = async (lesson, dir) => {
    const courseLessons = lessons.filter(l => l.course_id === lesson.course_id).sort((a,b) => a.order_index - b.order_index);
    const idx = courseLessons.findIndex(l => l.id === lesson.id);
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= courseLessons.length) return;
    const swap = courseLessons[swapIdx];
    await Promise.all([
      supabase.from('lessons').update({ order_index: swap.order_index }).eq('id', lesson.id),
      supabase.from('lessons').update({ order_index: lesson.order_index }).eq('id', swap.id),
    ]);
    fetchAll();
  };

  const seedModul6 = async () => {
    setConfirmState({
      isOpen: true,
      title: 'Seed Data?',
      message: 'Ingin menambahkan Modul 6 secara otomatis?',
      onConfirm: async () => {
        setConfirmState(p => ({ ...p, isOpen: false }));
        setSaving(true);
        try {
          // 1. Course (Upsert map: class_id is needed if it's a new schema)
          // Find the first class ID
          const firstClassId = classes.length > 0 ? classes[0].id : 1;
          
          await supabase.from('courses').upsert({ 
            id: 6, 
            class_id: firstClassId,
            title: 'Modul 6: Etika Pernikahan dalam Islam', 
            order_index: 6, 
            is_active: true 
          });
          
          // 2. Lessons
          await supabase.from('lessons').upsert([
            { id: 'v6-1', course_id: 6, title: 'Etika Pernikahan & Adab Malam Pertama', type: 'video', video_url: 'https://www.youtube.com/embed/bWZyWAnIMpU', duration: '15:00', order_index: 1, is_published: true },
            { id: 'q6-1', course_id: 6, title: 'Kuis Modul 6: Etika Pernikahan', type: 'quiz', order_index: 2, is_published: true }
          ]);
          
          // 3. Quiz Questions
          await supabase.from('quiz_questions').delete().eq('lesson_id', 'q6-1');
          await supabase.from('quiz_questions').insert([
            { lesson_id: 'q6-1', question_text: 'Apa niat utama seorang muslim dalam melangsungkan pernikahan?', options: ['Mencari kekayaan pasangan', 'Mengikuti tren sosial semata', 'Ibadah kepada Allah', 'Sekadar memenuhi keinginan ortu'], correct_index: 2, order_index: 1 },
            { lesson_id: 'q6-1', question_text: 'Apa yang disunnahkan saat masuk kamar pengantin?', options: ['Diskusi keuangan', 'Bersikap lembut & suguhan ringan', 'Bersikap tegas', 'Tuntut hak'], correct_index: 1, order_index: 2 }
          ]);
          
          showToast('Modul 6 Berhasil Ditambahkan!');
          fetchAll();
        } catch (err) { 
          showToast('Gagal: ' + err.message, 'error'); 
        } finally {
          setSaving(false);
        }
      }
    });
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
    <>
      <div style={{ animation: 'fadeIn 0.4s ease' }}>
      {/* Academy sub-tabs and title have been moved to the global top header for a cleaner UI */}

      {/* Sub-tabs have been moved to the global top header for better accessibility */}

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
          {subTab === 'enrollment' ? (
             <div style={{ animation: 'fadeIn 0.3s ease' }}>
                <div style={{ marginBottom: '2rem', padding: isMobile ? '0 1rem' : '0 1.5rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '950', color: '#134E39', letterSpacing: '-0.02em' }}>Manajemen Pendaftaran Kelas</h3>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>Kelola akses pengguna ke berbagai kelas akademi.</p>
                </div>
                <AdminEnrollmentTab showAlert={(t, m, s) => showToast(m, s)} />
             </div>
           ) : subTab === 'curriculum' ? (
            <>
          {/* Header */}
          <div style={{ 
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between', 
            alignItems: isMobile ? 'flex-start' : 'center', 
            maxWidth: '1000px',
            margin: isMobile ? '0 0 1.5rem 0' : '1.5rem auto',
            background: 'white', 
            padding: isMobile ? '1.5rem' : '1.25rem 2rem', 
            borderRadius: isMobile ? '16px' : '24px', 
            border: '1px solid #f1f5f9', 
            boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
            gap: isMobile ? '1.25rem' : '0'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <div style={{ width: 40, height: 40, borderRadius: '12px', background: 'rgba(19,78,57,0.1)', color: '#134E39', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <BookOpen size={20} />
                </div>
                <h3 style={{ margin: 0, fontSize: isMobile ? '1.4rem' : '1.75rem', fontWeight: '950', color: '#134E39', letterSpacing: '-0.02em' }}>Manajemen Kurikulum</h3>
              </div>
              <div style={{ display: 'flex', gap: isMobile ? '12px' : '16px', alignItems: 'center', paddingLeft: isMobile ? '0' : '52px', marginTop: isMobile ? '1rem' : '0', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#64748b', fontWeight: '700' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#134E39' }} /> {classes.length} Kelas
                </div>
                {!isMobile && <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#e2e8f0' }} />}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#64748b', fontWeight: '700' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#D4AF37' }} /> {courses.length} Modul
                </div>
                {!isMobile && <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#e2e8f0' }} />}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#64748b', fontWeight: '700' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6' }} /> {lessons.length} Materi
                </div>
              </div>
            </div>
            <div style={{ width: isMobile ? '100%' : 'auto' }}>
              <button
                onClick={openNewClass}
                style={{ 
                  background: '#134E39', color: 'white', border: 'none', 
                  padding: '0.85rem 1.75rem', borderRadius: '16px', 
                  fontWeight: '900', fontSize: '0.85rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '10px',
                  boxShadow: '0 10px 20px rgba(19,78,57,0.2)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  width: isMobile ? '100%' : 'auto',
                  justifyContent: 'center'
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 25px rgba(19,78,57,0.25)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(19,78,57,0.2)'; }}
              >
                <Plus size={20} strokeWidth={3} /> TAMBAH KELAS BARU
              </button>
            </div>
          </div>

          {/* Classes list */}
          {classes.length === 0 && (
            <div style={{ textAlign: 'center', padding: '6rem 2rem', background: 'white', borderRadius: '32px', border: '2px dashed #e2e8f0' }}>
              <div style={{ width: 80, height: 80, borderRadius: '24px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <BookOpen size={40} color="#cbd5e1" strokeWidth={1.5} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#1e293b', marginBottom: '0.5rem' }}>Belum Ada Kurikulum</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto 2rem', fontWeight: '600', lineHeight: '1.6' }}>
                Mulai bangun akademi Anda dengan menambahkan kelas pertama. Anda bisa menambahkan modul dan materi setelah kelas dibuat.
              </p>
              <button
                onClick={openNewClass}
                style={{ 
                  background: '#134E39', color: 'white', border: 'none', 
                  padding: '0.85rem 2rem', borderRadius: '14px', 
                  fontWeight: '900', fontSize: '0.85rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '10px', margin: '0 auto',
                  boxShadow: '0 10px 20px rgba(19,78,57,0.15)'
                }}
              >
                <Plus size={20} strokeWidth={3} /> MULAI BUAT KELAS
              </button>
            </div>
          )}

          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: '1.25rem',
            maxWidth: '1000px',
            margin: '0 auto',
            width: '100%'
          }}>
            {classes.sort((a,b) => a.order_index - b.order_index).map((cls) => {
            const isClassExpanded = expandedClass === cls.id;
            const classModules = courses.filter(c => c.class_id === cls.id).sort((a,b) => a.order_index - b.order_index);
            
            return (
              <div key={cls.id} style={{ 
                ...CARD, padding: 0, overflow: 'hidden', 
                border: 'none',
                boxShadow: isClassExpanded ? '0 20px 40px rgba(0,0,0,0.06)' : '0 4px 12px rgba(0,0,0,0.02)',
                marginBottom: '1.5rem',
                borderRadius: '24px',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                background: 'white'
              }}>
                {/* Class Header */}
                <div 
                  onClick={() => setExpandedClass(isClassExpanded ? null : cls.id)}
                  style={{ 
                    display: 'flex', 
                    flexDirection: isMobile ? 'column' : 'row',
                    alignItems: isMobile ? 'flex-start' : 'center', 
                    gap: '1.25rem', 
                    padding: '1.25rem', 
                    cursor: 'pointer', 
                    background: isClassExpanded ? 'rgba(44,95,77,0.03)' : 'white' 
                  }}
                >
                  {/* Banner Image */}
                  <div style={{ width: isMobile ? '100%' : 140, height: isMobile ? 180 : 85, borderRadius: '16px', overflow: 'hidden', background: '#f8fafc', border: '1.5px solid #f1f5f9', flexShrink: 0, position: 'relative' }}>
                    {cls.banner_url ? (
                      <img src={cls.banner_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', background: '#f1f5f9' }}><BookOpen size={isMobile ? 40 : 28} opacity={0.5}/></div>
                    )}
                  </div>

                  {/* Content Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ 
                        fontSize: '0.65rem', fontWeight: '900', padding: '3px 8px', borderRadius: '6px',
                        background: cls.is_published ? '#f0fdf4' : '#f8fafc',
                        color: cls.is_published ? '#166534' : '#64748b',
                        border: `1px solid ${cls.is_published ? '#bbf7d0' : '#e2e8f0'}`
                      }}>
                        {cls.is_published ? 'PUBLISHED' : 'DRAFT'}
                      </span>
                      <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#94a3b8' }}>ID: {String(cls.id).slice(0,8)}</span>
                    </div>
                    <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '950', color: '#1e293b', letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cls.title}</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                       <span style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--primary)', background: 'rgba(19,78,57,0.06)', padding: '2px 8px', borderRadius: '6px' }}>{classModules.length} MODUL</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => openEditClass(cls)} style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', width: 34, height: 34, borderRadius: '10px', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}><Edit3 size={14} /></button>
                    <button onClick={() => deleteClass(cls.id)} style={{ background: '#fff1f2', border: '1.5px solid #ffe4e6', width: 34, height: 34, borderRadius: '10px', color: '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}><Trash2 size={14} /></button>
                    <ChevronDown size={18} color="#94a3b8" style={{ transform: isClassExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: '0.3s', marginLeft: '4px' }} />
                  </div>
                </div>


                {/* Modules inside Class */}
                {isClassExpanded && (
                  <div style={{ padding: '0 1.5rem 1.5rem', background: 'rgba(0,0,0,0.01)' }}>
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h5 style={{ margin: 0, fontSize: '0.85rem', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Zap size={14} color="#D4AF37" /> STRUKTUR KURIKULUM
                        </h5>
                        <button onClick={() => openNewCourse(cls.id)} style={{ ...BTN_SM({ background: '#134E39', color: 'white' }), padding: '0.6rem 1.25rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(19,78,57,0.1)' }}>
                          <Plus size={16} /> TAMBAH MODUL
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
                          <div 
                            key={course.id} 
                            style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '0.75rem', overflow: 'hidden' }}
                            draggable
                            onDragStart={(e) => handleCourseDragStart(e, course)}
                            onDragEnd={handleDragEnd}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleCourseDrop(e, course)}
                          >
                            <div 
                              onClick={() => setExpandedCourse(isCourseExpanded ? null : course.id)}
                              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1rem', cursor: 'grab' }}
                            >
                              <GripVertical size={14} color="#94a3b8" />
                              <div style={{ width: 44, height: 44, borderRadius: '12px', overflow: 'hidden', background: '#f8fafc', flexShrink: 0, border: '1px solid #f1f5f9' }}>
                                {course.thumbnail_url ? <img src={course.thumbnail_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <BookOpen size={18} color="#cbd5e1" style={{ margin: '13px' }} />}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#1e293b' }}>{course.title}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                                  <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#94a3b8' }}>{courseLessons.length} MATERI</span>
                                  {course.is_active ? <span style={{ fontSize: '0.65rem', fontWeight: '900', color: '#059669', background: '#ecfdf5', padding: '1px 6px', borderRadius: '4px' }}>AKTIF</span> : <span style={{ fontSize: '0.65rem', fontWeight: '900', color: '#94a3b8', background: '#f1f5f9', padding: '1px 6px', borderRadius: '4px' }}>DRAF</span>}
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                                <button onClick={() => openEditCourse(course)} style={{ width: 34, height: 34, borderRadius: '8px', border: 'none', background: '#f8fafc', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Edit3 size={14} /></button>
                                <button onClick={() => deleteCourse(course.id)} style={{ width: 34, height: 34, borderRadius: '8px', border: 'none', background: 'rgba(230,57,70,0.05)', color: '#E63946', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Trash2 size={14} /></button>
                                <div style={{ width: '1px', height: '20px', background: '#f1f5f9', margin: '0 4px' }} />
                                <button onClick={() => openNewLesson(course.id)} style={{ ...BTN_SM({ background: 'rgba(19,78,57,0.05)', color: '#134E39' }), padding: '0.5rem 0.85rem' }}><Plus size={14} /> MATERI</button>
                                <div style={{ marginLeft: '4px' }}>
                                  <ChevronRight size={18} color="#94a3b8" style={{ transform: isCourseExpanded ? 'rotate(90deg)' : 'none', transition: '0.3s' }} />
                                </div>
                              </div>
                            </div>

                            {isCourseExpanded && (
                              <div style={{ padding: '0.5rem 1rem 1rem', borderTop: '1px solid #f1f5f9' }}>
                                 {courseLessons.map(lesson => {
                                    const isQuiz = lesson.type === 'quiz';
                                    const isLessonExt = expandedLesson === lesson.id;
                                    const questions = (quizQuestions || []).filter(q => q.lesson_id === lesson.id);

                                    return (
                                      <div 
                                        key={lesson.id} 
                                        style={{ marginBottom: '0.5rem' }}
                                        draggable
                                        onDragStart={(e) => {
                                          e.stopPropagation();
                                          handleDragStart(e, lesson);
                                        }}
                                        onDragEnd={handleDragEnd}
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => {
                                          e.stopPropagation();
                                          handleDrop(e, lesson);
                                        }}
                                      >
                                        <div style={{ 
                                          display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', 
                                          borderRadius: '14px', background: isLessonExt ? 'rgba(212,175,55,0.05)' : '#f8fafc', 
                                          border: isLessonExt ? '1px solid rgba(212,175,55,0.3)' : '1px solid #f1f5f9', 
                                          cursor: 'grab', transition: 'all 0.3s' 
                                        }}>
                                          <GripVertical size={14} color="#cbd5e1" />
                                          <div style={{ width: 32, height: 32, borderRadius: '8px', background: isQuiz ? 'rgba(212,175,55,0.1)' : 'rgba(19,78,57,0.06)', color: isQuiz ? '#b8861e' : '#134E39', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {isQuiz ? <Zap size={16} /> : (lesson.type === 'video' ? <PlayCircle size={16} /> : <FileText size={16} />)}
                                          </div>
                                          <span style={{ flex: 1, fontSize: '0.85rem', fontWeight: '800', color: '#334155' }}>{lesson.title}</span>
                                          <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                                            <button 
                                              onClick={() => toggleLessonPublished(lesson)}
                                              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                                              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                              style={BTN_SM({ 
                                                background: lesson.is_published ? 'rgba(44,95,77,0.12)' : 'rgba(0,0,0,0.05)',
                                                color: lesson.is_published ? 'var(--primary)' : '#94a3b8',
                                                padding: '0.3rem 0.5rem',
                                                borderRadius: '8px'
                                              })}
                                              title={lesson.is_published ? 'Unpublish' : 'Publish'}
                                            >
                                              {lesson.is_published ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                                            </button>
                                            <div style={{ width: '1px', background: '#e2e8f0', margin: '0 4px', height: '14px' }} />
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
          </div>
            </>
           ) : null}
        </div>
      )}

      {/* ── PROGRESS VIEW ── */}
      {subTab === 'progress' && view === 'list' && (
        <div style={{ animation: 'fadeIn 0.3s ease', width: '100%', overflowX: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', padding: isMobile ? '0 1rem' : '0 1.5rem' }}>
             <div>
                <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '950', color: '#134E39', letterSpacing: '-0.02em' }}>Progres Belajar Calon Kandidat</h3>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>Memantau aktivitas {userProgressList.length} orang candidate aktif.</p>
             </div>
          </div>

          <div style={{ 
            ...CARD, 
            padding: 0, 
            overflow: 'hidden', 
            background: isMobile ? 'transparent' : 'white',
            border: isMobile ? 'none' : '1px solid var(--border)',
            boxShadow: isMobile ? 'none' : undefined,
            width: '100%'
          }}>
            {!isMobile ? (
              <div className="table-responsive">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
                      <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>Nama User</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>Gender</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>Sertifikat & Modul</th>
                      <th style={{ padding: '1rem 1.5rem', textAlign: 'right', fontSize: '0.75rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>Progres</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ background: '#fff', borderBottom: '1px solid #f1f5f9' }}>
                      <td colSpan={4} style={{ padding: '1rem 1.5rem' }}>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                          <div style={{ position: 'relative', flex: 1 }}>
                            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input 
                              type="text" 
                              placeholder="Cari nama atau email..." 
                              style={{ width: '100%', height: '50px', padding: '0 1rem 0 2.75rem', borderRadius: '14px', border: '1px solid #e2e8f0', fontSize: '0.9rem', background: '#fff', boxSizing: 'border-box' }} 
                              value={progSearch}
                              onChange={(e) => { setProgSearch(e.target.value); setProgPage(1); }}
                            />
                          </div>
                          <select 
                            style={{ padding: '0 1rem', borderRadius: '14px', border: '1px solid #e2e8f0', fontSize: '0.9rem', height: '50px', flexShrink: 0, background: '#fff', cursor: 'pointer', boxSizing: 'border-box' }}
                            value={progGender}
                            onChange={(e) => { setProgGender(e.target.value); setProgPage(1); }}
                          >
                            <option value="all">Semua Gender</option>
                            <option value="ikhwan">Ikhwan</option>
                            <option value="akhwat">Akhwat</option>
                          </select>
                        </div>
                      </td>
                    </tr>

                    {progressLoading ? (
                      <tr><td colSpan={4} style={{ padding: '3rem', textAlign: 'center' }}><Loader className="animate-spin" size={24} /></td></tr>
                    ) : (() => {
                      const filteredList = userProgressList.filter(item => (item.name + item.email).toLowerCase().includes(progSearch.toLowerCase()) && (progGender === 'all' || item.gender === progGender));
                      const startIndex = (progPage - 1) * progPerPage;
                      const paginatedList = filteredList.slice(startIndex, startIndex + progPerPage);
                      const totalPages = Math.ceil(filteredList.length / progPerPage);

                      if (filteredList.length === 0) return <tr><td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Tidak ada data ditemukan.</td></tr>;

                      return (
                        <>
                          {paginatedList.map((item, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '1rem 1.5rem' }}>
                                <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{item.name}</div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.email}</div>
                              </td>
                              <td style={{ padding: '1rem' }}>
                                <span style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', padding: '4px 8px', borderRadius: '8px', background: item.gender === 'ikhwan' ? '#e0f2fe' : '#fce7f3', color: item.gender === 'ikhwan' ? '#0369a1' : '#be185d' }}>
                                  {item.gender || '-'}
                                </span>
                              </td>
                              <td style={{ padding: '1rem' }}>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                  {item.earnedCertificates.length > 0 ? item.earnedCertificates.map((c, ci) => (
                                    <span key={ci} style={{ background: '#f0fdf4', color: '#166534', padding: '2px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: '800', border: '1px solid #bbf7d0' }}>{c}</span>
                                  )) : <span style={{ fontSize: '0.7rem', color: '#cbd5e1', fontStyle: 'italic' }}>Belum ada sertifikat</span>}
                                </div>
                              </td>
                              <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                                 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '1.5rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                      <div style={{ fontSize: '0.85rem', fontWeight: '900', color: item.percent === 100 ? 'var(--success)' : '#1e293b' }}>{item.percent}%</div>
                                      <div style={{ width: '100px', height: '6px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden' }}>
                                        <div style={{ width: `${item.percent}%`, height: '100%', background: 'var(--primary)' }} />
                                      </div>
                                      <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{item.certificatesCount} / {item.totalCourses} Selesai</div>
                                    </div>
                                    <button 
                                      onClick={() => setDetailUser(item)}
                                      style={{ padding: '0.6rem 1rem', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#134E39', fontWeight: '800', fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.2s' }}
                                      onMouseEnter={e => { e.currentTarget.style.background = '#134E39'; e.currentTarget.style.color = 'white'; }}
                                      onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#134E39'; }}
                                    >
                                      DETAIL
                                    </button>
                                 </div>
                              </td>
                            </tr>
                          ))}
                          {filteredList.length > progPerPage && (
                            <tr>
                              <td colSpan={4} style={{ padding: '1rem 1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                                  {[...Array(totalPages)].map((_, i) => (
                                    <button key={i} onClick={() => setProgPage(i+1)} className={`pagination-btn ${progPage === i+1 ? 'active' : ''}`}>{i+1}</button>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ width: '100%', padding: '0 0.5rem', boxSizing: 'border-box' }}>
                {/* Mobile Header Filters */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem', width: '100%', boxSizing: 'border-box' }}>
                  <div style={{ position: 'relative', width: '100%', boxSizing: 'border-box' }}>
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input 
                      type="text" 
                      placeholder="Cari nama atau email..." 
                      style={{ width: '100%', height: '50px', padding: '0 1rem 0 2.75rem', borderRadius: '14px', border: '1px solid #e2e8f0', fontSize: '0.9rem', background: '#fff', boxSizing: 'border-box' }} 
                      value={progSearch}
                      onChange={(e) => { setProgSearch(e.target.value); setProgPage(1); }}
                    />
                  </div>
                  <select 
                    style={{ width: '100%', padding: '0 1rem', borderRadius: '14px', border: '1px solid #e2e8f0', fontSize: '0.9rem', height: '50px', background: '#fff', cursor: 'pointer', boxSizing: 'border-box' }}
                    value={progGender}
                    onChange={(e) => { setProgGender(e.target.value); setProgPage(1); }}
                  >
                    <option value="all">Semua Gender</option>
                    <option value="ikhwan">Ikhwan</option>
                    <option value="akhwat">Akhwat</option>
                  </select>
                </div>

                {progressLoading ? (
                  <div style={{ padding: '3rem', textAlign: 'center' }}><Loader className="animate-spin" size={24} /></div>
                ) : (() => {
                  const filteredList = userProgressList.filter(item => (item.name + item.email).toLowerCase().includes(progSearch.toLowerCase()) && (progGender === 'all' || item.gender === progGender));
                  const startIndex = (progPage - 1) * progPerPage;
                  const paginatedList = filteredList.slice(startIndex, startIndex + progPerPage);
                  const totalPages = Math.ceil(filteredList.length / progPerPage);

                  if (filteredList.length === 0) return <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Tidak ada data ditemukan.</div>;

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', width: '100%', boxSizing: 'border-box' }}>
                      {paginatedList.map((item, idx) => (
                        <div key={idx} style={{ 
                          background: 'white', border: '1px solid #f1f5f9', borderRadius: '20px', 
                          padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                          width: '100%', boxSizing: 'border-box'
                        }}>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1, boxSizing: 'border-box' }}>
                              <div style={{ 
                                width: '44px', height: '44px', borderRadius: '14px', 
                                background: item.gender === 'ikhwan' ? '#e0f2fe' : '#fce7f3',
                                color: item.gender === 'ikhwan' ? '#0369a1' : '#be185d',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: '900', fontSize: '1.1rem', flexShrink: 0
                              }}>
                                {item.name?.charAt(0).toUpperCase()}
                              </div>
                              <div style={{ minWidth: 0, flex: 1, boxSizing: 'border-box' }}>
                                 <div style={{ fontWeight: '800', color: '#1e293b', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', boxSizing: 'border-box' }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: '900', color: item.percent === 100 ? '#059669' : '#134E39', flexShrink: 0 }}>{item.percent}%</div>
                                    <div style={{ width: '100%', maxWidth: '80px', height: '4px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden' }}>
                                       <div style={{ width: `${item.percent}%`, height: '100%', background: item.percent === 100 ? '#059669' : '#134E39' }} />
                                    </div>
                                 </div>
                              </div>
                           </div>

                           <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, boxSizing: 'border-box' }}>
                              <button 
                                onClick={() => setDetailUser(item)}
                                style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#f8fafc', border: '1.5px solid #f1f5f9', color: '#134E39', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                              >
                                <Eye size={18} />
                              </button>
                           </div>
                        </div>
                      ))}
                      {filteredList.length > progPerPage && (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem', paddingBottom: '1rem' }}>
                          {[...Array(totalPages)].map((_, i) => (
                            <button key={i} onClick={() => setProgPage(i+1)} className={`pagination-btn ${progPage === i+1 ? 'active' : ''}`}>{i+1}</button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}


      {/* ── EDITOR VIEW: Class ── */}
      {view === 'class-editor' && (
        <div style={{ animation: 'fadeInUp 0.4s ease', maxWidth: '800px', margin: '0 auto', padding: '1rem' }}>
          <div style={{ marginBottom: '2rem' }}>
            <button 
              onClick={() => setView('list')} 
              style={{ 
                background: 'white', border: '1px solid #e2e8f0', 
                borderRadius: '12px', padding: '0.6rem 1rem', 
                fontWeight: '700', color: '#64748b', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px',
                marginBottom: '1.5rem'
              }}
            >
              <ChevronLeft size={18} /> Kembali ke Daftar
            </button>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '900', color: '#134E39', margin: 0 }}>
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
                <label className="form-label">Judul Lesson <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input className="form-control" value={lessonForm.title} onChange={e => setLessonForm(p => ({ ...p, title: e.target.value }))} placeholder="contoh: Materi 3: Komunikasi dalam Keluarga" />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Tipe Lesson</label>
                <select className="form-control" value={lessonForm.type} onChange={e => setLessonForm(p => ({ ...p, type: e.target.value }))}>
                  <option value="video">🎬 Video</option>
                  <option value="text">📄 Text (Ringkasan)</option>
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
              {(lessonForm.type === 'video' || lessonForm.type === 'text') && (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Konten Teks / Ringkasan</label>
                  <textarea className="form-control" rows={10} value={lessonForm.content} onChange={e => setLessonForm(p => ({ ...p, content: e.target.value }))} placeholder="Tuliskan ringkasan materi atau konten teks di sini..." />
                </div>
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

      {/* ── MODAL: User Progress Detail ────────────────────────────────────── */}
      {detailUser && (
        <div className="modal-overlay" onClick={() => setDetailUser(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px', width: '95%', maxHeight: '90vh' }}>
            <div className="modal-header" style={{ padding: '1.5rem', borderBottom: '1px solid #f1f5f9', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ textAlign: 'left' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '900', color: '#134E39' }}>Detail Progres Belajar</h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>{detailUser.name} ({detailUser.email})</p>
              </div>
              <button onClick={() => setDetailUser(null)} style={{ background: '#f8fafc', border: 'none', width: 36, height: 36, borderRadius: '10px', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
               {/* User Basic Info (Mobile specifically) */}
               {isMobile && (
                 <div style={{ background: '#134E39', color: 'white', padding: '1.5rem', borderRadius: '24px', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                       <div style={{ fontSize: '0.65rem', fontWeight: '800', opacity: 0.7, textTransform: 'uppercase' }}>Total Penyelesaian</div>
                       <div style={{ fontSize: '1.75rem', fontWeight: '950' }}>{detailUser.percent}%</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                       <div style={{ fontSize: '0.65rem', fontWeight: '800', opacity: 0.7, textTransform: 'uppercase' }}>Sertifikat</div>
                       <div style={{ fontSize: '1.25rem', fontWeight: '900' }}>{detailUser.certificatesCount} <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>/ {detailUser.totalCourses}</span></div>
                    </div>
                 </div>
               )}

               {academyMeta.classes.map(cls => {
                  const clsCourses = academyMeta.courses.filter(c => c.class_id === cls.id);
                  const clsLessons = academyMeta.lessons.filter(l => clsCourses.some(c => c.id === l.course_id));
                  const doneInCls = clsLessons.filter(l => detailUser.doneLessonIds.includes(String(l.id)) || detailUser.doneLessonIds.includes(Number(l.id)));
                  const isClsDone = clsLessons.length > 0 && doneInCls.length === clsLessons.length;
                  const clsPercent = clsLessons.length > 0 ? Math.round((doneInCls.length / clsLessons.length) * 100) : 0;

                  return (
                    <div key={cls.id} style={{ marginBottom: '2rem', background: '#f8fafc', borderRadius: '20px', border: '1px solid #f1f5f9', padding: '1.25rem' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                             <div style={{ width: 36, height: 36, borderRadius: '10px', background: isClsDone ? '#10b981' : '#134E39', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <BookOpen size={18} />
                             </div>
                             <div style={{ maxWidth: isMobile ? '160px' : 'auto' }}>
                                <div style={{ fontSize: '0.95rem', fontWeight: '900', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cls.title}</div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>{doneInCls.length}/{clsLessons.length} Materi</div>
                             </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                             <div style={{ fontSize: '1rem', fontWeight: '950', color: isClsDone ? '#10b981' : '#134E39' }}>{clsPercent}%</div>
                          </div>
                       </div>

                       <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {clsCourses.map(course => {
                             const courseLessons = academyMeta.lessons.filter(l => l.course_id === course.id);
                             const doneInCourse = courseLessons.filter(l => detailUser.doneLessonIds.includes(String(l.id)) || detailUser.doneLessonIds.includes(Number(l.id)));
                             const isCourseDone = courseLessons.length > 0 && doneInCourse.length === courseLessons.length;

                             return (
                               <div key={course.id} style={{ background: 'white', padding: '1rem', borderRadius: '14px', border: '1px solid #f1f5f9' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                     <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#475569', maxWidth: isMobile ? '180px' : 'auto', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{course.title}</div>
                                     <div style={{ fontSize: '0.7rem', fontWeight: '800', color: isCourseDone ? '#10b981' : '#94a3b8' }}>
                                        {isCourseDone ? 'SELESAI' : `${doneInCourse.length}/${courseLessons.length}`}
                                     </div>
                                  </div>
                                  <div style={{ height: '4px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden' }}>
                                     <div style={{ height: '100%', background: isCourseDone ? '#10b981' : '#134E39', width: `${courseLessons.length > 0 ? (doneInCourse.length / courseLessons.length) * 100 : 0}%`, transition: 'width 0.4s' }} />
                                  </div>
                               </div>
                             )
                          })}
                       </div>
                    </div>
                  )
               })}
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid #f1f5f9', padding: '1.25rem' }}>
               <button className="btn btn-primary" onClick={() => setDetailUser(null)} style={{ width: '100%', borderRadius: '12px' }}>Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }

        @media (max-width: 768px) {
          .admin-chart-card {
            padding: 1.5rem;
            border-radius: 24px;
          }
          .admin-chart-container {
            height: 280px;
          }
          .dynamic-center-value {
            font-size: 1.5rem;
          }
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
        }

        .pagination-btn {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
          background: white;
          color: #64748b;
          font-size: 0.85rem;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .pagination-btn:hover:not(:disabled) {
          border-color: var(--primary);
          color: var(--primary);
          background: rgba(44,95,77,0.05);
          transform: translateY(-2px);
        }
        .pagination-btn.active {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
          box-shadow: 0 4px 12px rgba(44,95,77,0.25);
        }
        .pagination-btn:disabled {
          cursor: not-allowed;
          background: #f8fafc;
        }

        /* 🪄 HIDE SCROLLBAR BUT KEEP SCROLLING */
        ::-webkit-scrollbar {
          width: 0px;
          background: transparent;
        }
        * {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
      `}</style>
    </>
  );
}
