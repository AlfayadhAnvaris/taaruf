import React, { useContext, useState, useEffect, useRef } from 'react';
import { AppContext } from '../App';
import { FileText, Search, UserCheck, Send, Clock, MessageCircle, Users, CheckCircle, XCircle, User, MapPin, Briefcase, GraduationCap, Heart, PlayCircle, BookOpen, ShieldAlert, AlertCircle, ChevronDown, ChevronRight, Lock, Award, BarChart2, Star } from 'lucide-react';
import { supabase } from '../supabase';

export default function UserDashboard({ activeTab, setActiveTab }) {
  const { user, cvs, setCvs, taarufRequests, setTaarufRequests, showAlert, addNotification, messages, setMessages } = useContext(AppContext);

  const [activeChatId, setActiveChatId] = useState(null);
  const [chatInput, setChatInput] = useState('');

  // My CV form state
  const [myCv, setMyCv] = useState({
    alias: user.name,
    gender: user.gender || 'ikhwan', // Default or could be derived
    age: '',
    location: '',
    education: '',
    job: '',
    worship: '', 
    about: '', // Visi pernikahan
    criteria: '',
    suku: '',
    hobi: '',
    poligami: 'Tidak Bersedia',
    salary: '',
    address: '',
    marital_status: 'Lajang',
    tinggi_berat: '',
    kesehatan: '',
    kajian: '',
    karakter: ''
  });

  const [cvStep, setCvStep] = useState(1);
  const totalSteps = 6;

  const [isEditingCv, setIsEditingCv] = useState(false);
  const myExistingCv = cvs.find(cv => cv.user_id === user.id);
  const hasSubmittedCv = !!myExistingCv && !isEditingCv;

  // Filter state
  const [filters, setFilters] = useState({
    gender: 'Semua',
    location: '',
    suku: '',
    hobi: '',
    poligami: 'Semua'
  });

  const [viewingCv, setViewingCv] = useState(null);

  // === LMS Learning State ===
  const lmsCurriculum = [
    {
      id: 1, title: 'Modul 1: Fondasi Pernikahan Islami', expanded: true,
      items: [
        { id: 'v1-1', type: 'video', title: 'Materi 1: Makna Taaruf yang Sesungguhnya', duration: '18:24', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', done: true },
        { id: 'v1-2', type: 'video', title: 'Materi 2: Fiqih Memilih Pasangan', duration: '25:10', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', done: true },
        { id: 'q1-1', type: 'quiz', title: 'Latihan Kuis Modul 1', questions: 10, done: false },
        { id: 'v1-3', type: 'video', title: 'Materi Baru: Kedudukan Wali dalam Islam', duration: '20:00', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', done: false },
      ]
    },
    {
      id: 2, title: 'Modul 2: Hak & Kewajiban Suami Istri', expanded: false,
      items: [
        { id: 'v2-1', type: 'video', title: 'Materi 1: Hak Nafkah dan Tanggung Jawab', duration: '30:15', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', done: false },
        { id: 'v2-2', type: 'video', title: 'Materi 2: Membangun Komunikasi Sehat', duration: '22:40', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', done: false },
        { id: 'q2-1', type: 'quiz', title: 'Latihan Kuis Modul 2', questions: 8, done: false },
      ]
    },
    {
      id: 3, title: 'Modul 3: Bekal Finansial Rumah Tangga', expanded: false,
      items: [
        { id: 'v3-1', type: 'video', title: 'Materi 1: Manajemen Keuangan Islami', duration: '35:00', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', done: false },
        { id: 'q3-1', type: 'quiz', title: 'Latihan Kuis Modul 3', questions: 12, done: false },
      ]
    },
  ];

  const [curriculum, setCurriculum] = useState(lmsCurriculum);
  const [activeLesson, setActiveLesson] = useState(lmsCurriculum[0].items[0]);

  const toggleModule = (moduleId) => {
    setCurriculum(prev => prev.map(m => m.id === moduleId ? { ...m, expanded: !m.expanded } : m));
  };

  const markLessonDone = (lessonId) => {
    setCurriculum(prev => prev.map(m => ({
      ...m,
      items: m.items.map(item => item.id === lessonId ? { ...item, done: true } : item)
    })));
  };

  const totalLessons = curriculum.reduce((acc, m) => acc + m.items.length, 0);
  const doneLessons = curriculum.reduce((acc, m) => acc + m.items.filter(i => i.done).length, 0);
  const progressPercent = Math.round((doneLessons / totalLessons) * 100);

  const handleCvSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    
    if (cvStep !== totalSteps) {
      setCvStep(cvStep + 1);
      return;
    }

    // Manual Validation for required fields across all steps
    if (!myCv.job || !myCv.location || !myCv.education || !myCv.worship || !myCv.about || !myCv.criteria || !myCv.marital_status || !myCv.age) {
        showAlert('Data Belum Lengkap', 'Mohon lengkapi semua field yang wajib diisi pada setiap tahapan (Step 1-6).', 'error');
        return;
    }

    try {
      const cvPayload = {
        user_id: user.id,
        alias: myCv.alias,
        gender: myCv.gender,
        age: parseInt(myCv.age) || null,
        location: myCv.location,
        education: myCv.education,
        job: myCv.job,
        worship: myCv.worship,
        about: myCv.about,
        criteria: myCv.criteria,
        suku: myCv.suku,
        hobi: myCv.hobi,
        poligami: myCv.poligami,
        salary: myCv.salary,
        address: myCv.address,
        marital_status: myCv.marital_status,
        tinggi_berat: myCv.tinggi_berat,
        kesehatan: myCv.kesehatan,
        kajian: myCv.kajian,
        karakter: myCv.karakter,
        status: 'approved' // Langsung publish otomatis
      };

      if (isEditingCv && myExistingCv) {
        const { data, error } = await supabase.from('cv_profiles').update(cvPayload).eq('id', myExistingCv.id).select();
        if (error || !data || data.length === 0) {
          console.error(error || 'Tidak ada data diperbarui');
          showAlert('Error', 'Gagal memperbarui CV. ' + (error ? error.message : ''), 'error');
          return;
        }
        setCvs(cvs.map(cv => cv.id === myExistingCv.id ? data[0] : cv));
        addNotification('Alhamdulillah, CV berhasil diperbarui!');
        setCvStep(7); // Go to success step instead of closing immediately
      } else {
        const { data, error } = await supabase.from('cv_profiles').insert(cvPayload).select();
        if (error || !data || data.length === 0) {
          console.error(error);
          showAlert('Error', 'Gagal mengirim CV. ' + (error ? error.message : ''), 'error');
          return;
        }
        setCvs([...cvs, data[0]]);
        addNotification('Alhamdulillah, CV berhasil disubmit!');
        setCvStep(7);
      }
    } catch (err) {
      console.error(err);
      showAlert('Error', 'Kesalahan sistem saat mengirim CV.', 'error');
    }
  };

  const handleAjukanTaaruf = async (targetCv) => {
    if (!myExistingCv) {
      showAlert('CV Belum Lengkap', 'Maaf, Anda wajib melengkapi dan mengirimkan CV Taaruf di tab "CV Saya" sebelum bisa mengajukan.', 'error');
      setActiveTab('my_cv');
      return;
    }

    if (myExistingCv.status !== 'approved') {
      showAlert('CV Menunggu Verifikasi', 'CV Taaruf Anda saat ini berstatus PENDING. Harap tunggu verifikasi Ustadz/Admin sebelum mengajukan.', 'info');
      return;
    }

    // Cek apakah sudah pernah mengajukan ke kandidat ini yang belum ditolak
    const existingReq = taarufRequests.find(req => 
      req.senderEmail === user.email && req.targetCvId === targetCv.id && req.status !== 'rejected'
    );
    if(existingReq) {
      showAlert('Pengajuan Sudah Ada', 'Anda sudah memiliki proses pengajuan berjalan untuk kandidat ini.', 'info');
      return;
    }

    // Aturan Pembatasan Poligami & Multiple Requests
    const activeRequests = taarufRequests.filter(req => req.senderEmail === user.email && req.status !== 'rejected');
    
    if (activeRequests.length >= 1) {
      if (user.gender === 'akhwat') {
        showAlert('Batas Pengajuan', 'Ukhti hanya dapat menjalani 1 proses taaruf dalam satu waktu. Selesaikan atau batalkan proses sebelumnya.', 'error');
        return;
      } else if (user.gender === 'ikhwan') {
        // Cek apakah kandidat target saat ini TIDAK bersedia poligami
        if (targetCv.poligami === 'Tidak Bersedia') {
          showAlert('Pengajuan Ditolak', 'Kandidat akhwat ini berstatus "Tidak Bersedia" dipoligami. Anda tidak dapat mengajukan taaruf karena masih memiliki proses aktif dengan kandidat lain.', 'error');
          return;
        }

        // Cek apakah ada proses aktif sebelumnya dengan kandidat yang TIDAK bersedia poligami.
        // Jika ada proses berjalan dgn akhwat yg tdk mau poligami, dia tidak boleh nambah cabang.
        const existingAntiPoligami = activeRequests.some(req => {
          const cv = cvs.find(c => c.id === req.targetCvId);
          return cv && cv.poligami === 'Tidak Bersedia';
        });

        if (existingAntiPoligami) {
          showAlert('Pengajuan Ditolak', 'Anda sedang menjalani proses taaruf dengan akhwat yang berstatus "Tidak Bersedia" dipoligami. Harap hargai komitmen dan batalkan/selesaikan proses tersebut sebelum mengajukan ke kandidat lain.', 'error');
          return;
        }
      }
    }

    const newReq = {
      sender_id: user.id,
      target_cv_id: targetCv.id,
      target_user_id: targetCv.user_id,
      status: 'pending_target'
    };

    try {
      const { data, error } = await supabase.from('taaruf_requests')
        .insert(newReq)
        .select('*, sender:sender_id(email, name), target:target_cv_id(*), target_user:target_user_id(email, name)')
        .single();
        
      if (error) {
        console.error(error);
        showAlert('Error', 'Gagal melakukan pengajuan.', 'error');
        return;
      }
      
      const mappedReq = {
        id: data.id,
        senderEmail: data.sender.email,
        senderAlias: data.sender.name,
        targetCvId: data.target_cv_id,
        targetAlias: data.target.alias,
        targetEmail: data.target_user?.email,
        status: data.status,
        updatedAt: data.updated_at
      };
      
      setTaarufRequests([...taarufRequests, mappedReq]);
      showAlert('Pengajuan Berhasil', 'Alhamdulillah, pengajuan berhasil! Silakan pantau di tab Status Taaruf.', 'success');
      addNotification(`Pengajuan taaruf kepada ${targetCv.alias} berhasil dikirim.`);
      setActiveTab('status');
    } catch (err) {
      console.error(err);
      showAlert('Error', 'Kesalahan sistem saat mengajukan taaruf.', 'error');
    }
  };

  const applyFilters = (cvList) => {
    return cvList.filter(cv => {
      // Don't show non-approved CVs or your own
      if (cv.status !== 'approved' || cv.user_id === user.id) return false;
      
      // Strict Opposites Gender Filter
      if (user.gender === 'ikhwan' && cv.gender !== 'akhwat') return false;
      if (user.gender === 'akhwat' && cv.gender !== 'ikhwan') return false;

      // Gender Filter
      if (filters.gender !== 'Semua') {
        if (filters.gender.toLowerCase() !== cv.gender) return false;
      }
      
      // Location Filter
      if (filters.location && !cv.location.toLowerCase().includes(filters.location.toLowerCase())) return false;
      
      // Suku Filter
      if (filters.suku && (!cv.suku || !cv.suku.toLowerCase().includes(filters.suku.toLowerCase()))) return false;
      
      // Hobi Filter
      if (filters.hobi && (!cv.hobi || !cv.hobi.toLowerCase().includes(filters.hobi.toLowerCase()))) return false;
      
      // Poligami Filter
      if (filters.poligami !== 'Semua') {
        if (cv.poligami !== filters.poligami && cv.poligami !== 'Semua') return false; 
      }
      
      return true;
    });
  };

  const filteredCvs = applyFilters(cvs);

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>

      {/* ===== HOME / OVERVIEW TAB ===== */}
      {activeTab === 'home' && (
        <div style={{ animation: 'fadeIn 0.5s ease' }}>
          {/* Welcome Hero */}


          {/* Quick Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
            {[
              { label: 'Kandidat Tersedia', value: cvs.filter(cv => cv.status === 'approved' && cv.user_id !== user.id).length, color: 'var(--primary)', icon: <Users size={22} /> },
              { label: 'Proses Taaruf', value: taarufRequests.filter(r => r.senderEmail === user.email).length, color: 'var(--secondary)', icon: <Heart size={22} /> },
              { label: 'CV Saya', value: myExistingCv ? '✓ Aktif' : 'Belum Ada', color: myExistingCv ? 'var(--success)' : 'var(--danger)', icon: <FileText size={22} /> },
              { label: 'Materi Selesai', value: `${doneLessons}/${totalLessons}`, color: '#8b5cf6', icon: <BookOpen size={22} /> },
            ].map((stat, i) => (
              <div key={i} className="card" style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: `${stat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem', color: stat.color }}>
                  {stat.icon}
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem', fontWeight: '500' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Feature Cards */}
          <h2 style={{ marginBottom: '1.25rem', fontSize: '1.3rem' }}>Jelajahi Fitur Platform</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {[
              {
                title: 'CV Taaruf Saya',
                tab: 'my_cv',
                icon: <FileText size={28} />,
                color: 'var(--primary)',
                bg: 'rgba(44,95,77,0.08)',
                desc: 'Buat dan kelola CV taaruf Anda. Profil Anda akan dipublish setelah diisi dan terverifikasi agar dapat dilihat kandidat lain.',
                status: myExistingCv ? '✓ CV Sudah Ada' : 'Belum dibuat',
                statusColor: myExistingCv ? 'var(--success)' : 'var(--danger)',
                cta: myExistingCv ? 'Lihat CV Saya' : 'Buat CV Sekarang'
              },
              {
                title: 'Pencarian Kandidat',
                tab: 'find',
                icon: <Search size={28} />,
                color: '#0ea5e9',
                bg: 'rgba(14,165,233,0.08)',
                desc: 'Telusuri profil kandidat yang tersedia dengan filter lokasi, suku, dan kriteria lainnya. Ajukan taaruf langsung dari halaman profil.',
                status: `${cvs.filter(cv => cv.status === 'approved' && cv.user_id !== user.id).length} kandidat tersedia`,
                statusColor: '#0ea5e9',
                cta: 'Cari Sekarang'
              },
              {
                title: 'Status Taaruf',
                tab: 'status',
                icon: <UserCheck size={28} />,
                color: 'var(--secondary)',
                bg: 'rgba(212,175,55,0.08)',
                desc: 'Pantau setiap tahapan proses taaruf Anda secara real-time — mulai dari pengajuan, persetujuan target, review ustadz, hingga sesi Q&A.',
                status: `${taarufRequests.filter(r => r.senderEmail === user.email).length} pengajuan aktif`,
                statusColor: 'var(--secondary)',
                cta: 'Cek Status'
              },
              {
                title: 'Pembelajaran Pra-Nikah',
                tab: 'materi',
                icon: <BookOpen size={28} />,
                color: '#8b5cf6',
                bg: 'rgba(139,92,246,0.08)',
                desc: 'Ikuti kursus terstruktur, tonton materi video, dan kerjakan kuis untuk mempersiapkan diri secara ilmu sebelum memasuki jenjang pernikahan.',
                status: `${progressPercent}% selesai`,
                statusColor: '#8b5cf6',
                cta: 'Mulai Belajar'
              },
            ].map((feat, i) => (
              <div key={i} onClick={() => setActiveTab(feat.tab)} className="card" style={{ cursor: 'pointer', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: feat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: feat.color }}>
                    {feat.icon}
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', padding: '0.3rem 0.75rem', borderRadius: '99px', background: feat.bg, color: feat.statusColor }}>
                    {feat.status}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>{feat.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6', flex: 1, marginBottom: '1.25rem' }}>{feat.desc}</p>
                <button className="btn btn-outline" style={{ width: '100%', color: feat.color, borderColor: feat.color, fontSize: '0.9rem' }}>
                  {feat.cta} →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legacy hero only shown on non-home tabs */}


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
                      <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>Kandidat lain sudah bisa melihat profil Anda di halaman pencarian.</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => {
                        setMyCv({
                          alias: myExistingCv.alias || '',
                          gender: myExistingCv.gender || 'ikhwan',
                          age: myExistingCv.age || '',
                          location: myExistingCv.location || '',
                          education: myExistingCv.education || '',
                          job: myExistingCv.job || '',
                          worship: myExistingCv.worship || '',
                          about: myExistingCv.about || '',
                          criteria: myExistingCv.criteria || '',
                          suku: myExistingCv.suku || '',
                          hobi: myExistingCv.hobi || '',
                          poligami: myExistingCv.poligami || 'Tidak Bersedia',
                          salary: myExistingCv.salary || '',
                          address: myExistingCv.address || '',
                          marital_status: myExistingCv.marital_status || 'Lajang',
                          tinggi_berat: myExistingCv.tinggi_berat || '',
                          kesehatan: myExistingCv.kesehatan || '',
                          kajian: myExistingCv.kajian || '',
                          karakter: myExistingCv.karakter || ''
                        });
                        setCvStep(1);
                        setIsEditingCv(true);
                    }}>
                      <FileText size={18} style={{ marginRight: '0.5rem' }}/> Edit Data CV
                    </button>
                  </div>
                  
                  <div style={{ background: 'rgba(44, 95, 77, 0.03)', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem', border: '1px solid rgba(44, 95, 77, 0.08)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.2rem', color: 'var(--text-main)', fontSize: '1rem' }}>
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
                    <h4 style={{ marginBottom: '0.5rem', color: 'var(--primary)', marginTop: '1.5rem' }}>Kriteria Pasangan Harapan</h4>
                    <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>{myExistingCv.criteria || 'Belum diisi.'}</p>
                  </div>
                  
                  <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                    <button className="btn btn-outline" style={{ color: 'var(--primary)', borderColor: 'var(--primary)' }} onClick={() => { setViewingCv(myExistingCv); setActiveTab('find'); }}>
                      <Search size={18} style={{ marginRight: '0.5rem' }} /> Lihat Tampilan Full CV Saya
                    </button>
                  </div>
                </div>
              </div>
          ) : (
            <div className="cv-form-container">
              {/* Stepper Header */}
              {cvStep < 7 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', borderBottom: '2px solid var(--border)', paddingBottom: '1rem' }}>
                {[1,2,3,4,5,6].map(step => (
                  <div key={step} style={{ 
                    width: '30px', height: '30px', borderRadius: '50%', 
                    background: cvStep >= step ? 'var(--primary)' : 'var(--border)', 
                    color: cvStep >= step ? 'white' : 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                  }}>
                    {step}
                  </div>
                ))}
              </div>
              )}

              {cvStep === 1 && (
                <div className="animation-fade">
                  <h4 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>1. Data Pribadi</h4>
                  <div className="form-group">
                    <label className="form-label">Nama Alias / Samaran</label>
                    <input type="text" className="form-control" value={myCv.alias} onChange={e => setMyCv({...myCv, alias: e.target.value})} />
                    <small style={{color: 'var(--primary)', marginTop: '0.2rem', display: 'block'}}>*Gunakan nama samaran (contoh: Ikhwan 01, Hamba Allah)</small>
                  </div>
                  <div className="dashboard-grid" style={{ marginTop: 0, gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Usia</label>
                      <input type="number" className="form-control" required value={myCv.age} onChange={e => setMyCv({...myCv, age: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Jenis Kelamin</label>
                      <select className="form-control" value={myCv.gender} disabled>
                        <option value="ikhwan">Ikhwan (Pria)</option>
                        <option value="akhwat">Akhwat (Wanita)</option>
                      </select>
                    </div>
                  </div>
                  <div className="dashboard-grid" style={{ marginTop: '1rem', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Tinggi / Berat Badan</label>
                      <input type="text" className="form-control" value={myCv.tinggi_berat} onChange={e => setMyCv({...myCv, tinggi_berat: e.target.value})} placeholder="Contoh: 170cm / 65kg" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Kondisi Kesehatan / Penyakit Bawaan</label>
                      <input type="text" className="form-control" value={myCv.kesehatan} onChange={e => setMyCv({...myCv, kesehatan: e.target.value})} placeholder="Contoh: Sehat walafiat, riwayat asma ringan..." />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Suku Bangsa</label>
                    <input type="text" className="form-control" value={myCv.suku} onChange={e => setMyCv({...myCv, suku: e.target.value})} placeholder="Contoh: Jawa, Sunda..." />
                  </div>
                </div>
              )}

              {cvStep === 2 && (
                <div className="animation-fade">
                  <h4 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>2. Pekerjaan & Gaji</h4>
                  <div className="form-group">
                    <label className="form-label">Pekerjaan Saat Ini</label>
                    <input type="text" className="form-control" required value={myCv.job} onChange={e => setMyCv({...myCv, job: e.target.value})} placeholder="Contoh: Guru, Software Engineer..." />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Gaji / Penghasilan per Bulan (Opsional)</label>
                    <select className="form-control" value={myCv.salary} onChange={e => setMyCv({...myCv, salary: e.target.value})}>
                      <option value="">Rahasia / Tidak Ingin Menjawab</option>
                      <option value="< 3 Juta">Kurang dari Rp 3 Juta</option>
                      <option value="3 - 5 Juta">Rp 3 - 5 Juta</option>
                      <option value="5 - 10 Juta">Rp 5 - 10 Juta</option>
                      <option value="> 10 Juta">Lebih dari Rp 10 Juta</option>
                    </select>
                  </div>
                </div>
              )}

              {cvStep === 3 && (
                <div className="animation-fade">
                  <h4 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>3. Alamat Domisili</h4>
                  <div className="form-group">
                    <label className="form-label">Domisili Kota</label>
                    <input type="text" className="form-control" required value={myCv.location} onChange={e => setMyCv({...myCv, location: e.target.value})} placeholder="Contoh: Jakarta Selatan" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Alamat Lengkap (Disembunyikan dari Publik)</label>
                    <textarea className="form-control" rows="2" value={myCv.address} onChange={e => setMyCv({...myCv, address: e.target.value})} placeholder="Jalan, RT/RW, Kelurahan..."></textarea>
                  </div>
                </div>
              )}

              {cvStep === 4 && (
                <div className="animation-fade">
                  <h4 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>4. Status Pernikahan & Pendidikan</h4>
                  <div className="form-group">
                    <label className="form-label">Status Pernikahan</label>
                    <select className="form-control" required value={myCv.marital_status} onChange={e => setMyCv({...myCv, marital_status: e.target.value})}>
                      <option value="Lajang">Lajang (Belum Pernah Menikah)</option>
                      <option value="Duda/Janda">Duda / Janda</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Pendidikan Terakhir</label>
                    <select className="form-control" required value={myCv.education} onChange={e => setMyCv({...myCv, education: e.target.value})}>
                      <option value="">Pilih Pendidikan...</option>
                      <option value="SMA/SMK">SMA / SMK Sederajat</option>
                      <option value="D3">Diploma (D3)</option>
                      <option value="S1">Sarjana (S1)</option>
                      <option value="S2/S3">Pascasarjana (S2/S3)</option>
                    </select>
                  </div>
                </div>
              )}

              {cvStep === 5 && (
                <div className="animation-fade">
                  <h4 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>5. Informasi Keagamaan</h4>
                  <div className="form-group">
                    <label className="form-label">Kebiasaan Ibadah (Shalat Fardhu/Sunnah, Tilawah)</label>
                    <textarea className="form-control" rows="3" required value={myCv.worship} onChange={e => setMyCv({...myCv, worship: e.target.value})} placeholder="Contoh: Shalat fardhu jamaah di masjid (ikhwan), tilawah 1 juz/hari..."></textarea>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Visi Poligami</label>
                    <select className="form-control" value={myCv.poligami} onChange={e => setMyCv({...myCv, poligami: e.target.value})}>
                      <option value="Tidak Bersedia">Tidak Bersedia</option>
                      <option value="Mungkin">Mungkin</option>
                      <option value="Bersedia">Bersedia</option>
                      <option value="Semua">Semua (Bebas)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Rujukan Kajian / Ustadz Favorit</label>
                    <textarea className="form-control" rows="2" value={myCv.kajian} onChange={e => setMyCv({...myCv, kajian: e.target.value})} placeholder="Contoh: Kajian rutin masjid X, rutin mendengar Ustadz Y..."></textarea>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Visi Pernikahan</label>
                    <textarea className="form-control" rows="2" required value={myCv.about} onChange={e => setMyCv({...myCv, about: e.target.value})} placeholder="Tujuan dan harapan Anda dalam membangun rumah tangga..."></textarea>
                  </div>
                </div>
              )}

              {cvStep === 6 && (
                <div className="animation-fade">
                  <h4 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>6. Karakter & Informasi Tambahan</h4>
                  <div className="form-group">
                    <label className="form-label">Kelebihan & Kekurangan Karakter Diri</label>
                    <textarea className="form-control" rows="3" value={myCv.karakter} onChange={e => setMyCv({...myCv, karakter: e.target.value})} placeholder="Sebutkan 3 sifat positif dan 3 hal yang masih perlu Anda perbaiki secara jujur..."></textarea>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Hobi / Aktivitas Waktu Luang (Opsional)</label>
                    <input type="text" className="form-control" value={myCv.hobi} onChange={e => setMyCv({...myCv, hobi: e.target.value})} placeholder="Contoh: Membaca, Olahraga..." />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Kriteria Pasangan yang Diharapkan</label>
                    <textarea className="form-control" rows="3" required value={myCv.criteria} onChange={e => setMyCv({...myCv, criteria: e.target.value})} placeholder="Syarat-syarat yang menjadi prioritas dari calon (contoh: Tidak merokok, pendidikan minimal S1)..."></textarea>
                  </div>
                </div>
              )}

              {cvStep === 7 && (
                <div className="animation-fade empty-state">
                  <CheckCircle size={64} color="var(--success)" style={{ display: 'block', margin: '0 auto 1rem' }} />
                  <h3>Alhamdulillah, Proses Selesai</h3>
                  <p style={{ color: 'var(--text-muted)' }}>Data CV Anda berhasil disimpan dan langsung dipublish ke dalam sistem.</p>
                  <button type="button" className="btn btn-primary" style={{ marginTop: '1.5rem' }} onClick={() => {
                     setIsEditingCv(false);
                     setCvStep(1);
                  }}>Lihat Status CV &rarr;</button>
                </div>
              )}

              {cvStep < 7 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
                {cvStep > 1 ? (
                  <button type="button" className="btn btn-outline" onClick={() => setCvStep(cvStep - 1)}>Kembali</button>
                ) : isEditingCv ? (
                  <button type="button" className="btn btn-outline" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => setIsEditingCv(false)}>Batal Edit</button>
                ) : <div></div>}
                
                {cvStep < totalSteps ? (
                  <button type="button" className="btn btn-primary" onClick={() => setCvStep(cvStep + 1)}>Selanjutnya</button>
                ) : (
                  <button type="button" className="btn btn-success" style={{ padding: '0.8rem 1.75rem' }} onClick={handleCvSubmit}>{isEditingCv ? 'Simpan Perubahan' : 'Kirim CV'}</button>
                )}
              </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'find' && (
        <div style={{ animation: 'fadeIn 0.5s ease' }}>
          {!myExistingCv ? (
            <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem', borderTop: '4px solid var(--danger)', maxWidth: '600px', margin: '2rem auto' }}>
              <AlertCircle size={64} color="var(--danger)" style={{ margin: '0 auto 1.5rem', opacity: 0.8 }} />
              <h3 style={{ marginBottom: '1rem' }}>CV Belum Dibuat</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '2.5rem', lineHeight: '1.6' }}>
                Anda wajib melengkapi form CV Taaruf terlebih dahulu sebelum dapat melihat daftar kandidat. Hal ini bertujuan untuk menjaga keseriusan tujuan dan privasi pada platform.
              </p>
              <button className="btn btn-primary" onClick={() => setActiveTab('my_cv')} style={{ width: '100%', maxWidth: '300px' }}>
                Lengkapi CV Sekarang
              </button>
            </div>
          ) : viewingCv ? (
            <div className="cv-detail-view" style={{ animation: 'fadeIn 0.3s ease' }}>
              <button 
                className="btn btn-outline" 
                onClick={() => {
                  if (viewingCv.user_id === user.id) {
                    setViewingCv(null);
                    setActiveTab('my_cv');
                  } else {
                    setViewingCv(null);
                  }
                }} 
                style={{ marginBottom: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '8px', border: 'none', paddingLeft: 0 }}
              >
                &larr; {viewingCv.user_id === user.id ? 'Kembali ke CV Saya' : 'Kembali ke Daftar Pencarian'}
              </button>
              
              <div className="card" style={{ maxWidth: '800px', margin: '0 auto', display: 'block' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                      <User size={32} />
                    </div>
                    <div>
                      <h3 className="card-title" style={{ fontSize: '1.5rem', margin: 0 }}>{viewingCv.alias}</h3>
                      <span className={`badge ${viewingCv.gender === 'ikhwan' ? 'badge-info' : 'badge-warning'}`} style={{ textTransform: 'capitalize', marginTop: '0.3rem', display: 'inline-block' }}>{viewingCv.gender}</span>
                    </div>
                  </div>
                  <span className="badge badge-success">Terverifikasi Admin</span>
                </div>
                
                <h4 style={{ color: 'var(--primary)', marginBottom: '1rem', fontSize: '1.1rem' }}>Informasi Dasar</h4>
                <div style={{ background: 'rgba(44, 95, 77, 0.03)', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem', border: '1px solid rgba(44, 95, 77, 0.08)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.2rem', color: 'var(--text-main)', fontSize: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><User size={18} color="var(--primary)" /> <span><strong>Usia:</strong> {viewingCv.age} Thn ({viewingCv.marital_status || 'Lajang'})</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><MapPin size={18} color="var(--primary)" /> <span><strong>Domisili:</strong> {viewingCv.location}</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Briefcase size={18} color="var(--primary)" /> <span><strong>Pekerjaan:</strong> {viewingCv.job || '-'}</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><GraduationCap size={18} color="var(--primary)" /> <span><strong>Pendidikan:</strong> {viewingCv.education}</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Users size={18} color="var(--primary)" /> <span><strong>Suku:</strong> {viewingCv.suku || '-'}</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Heart size={18} color={viewingCv.poligami === 'Bersedia' ? 'var(--success)' : 'var(--primary)'} /> <span><strong>Poligami:</strong> <span style={{ color: viewingCv.poligami === 'Bersedia' ? 'var(--success)' : 'inherit', fontWeight: viewingCv.poligami === 'Bersedia' ? 'bold' : 'normal' }}>{viewingCv.poligami}</span></span></div>
                  </div>
                  <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem', color: 'var(--text-main)', fontSize: '0.95rem' }}>
                    <p style={{ margin: '0 0 0.5rem 0' }}><strong>Tinggi / Berat Badan:</strong> {viewingCv.tinggi_berat || 'Tidak dikonfirmasi'}</p>
                    <p style={{ margin: 0 }}><strong>Riwayat Kesehatan:</strong> {viewingCv.kesehatan || 'Tidak dikonfirmasi'}</p>
                  </div>
                </div>

                <h4 style={{ color: 'var(--primary)', marginBottom: '1rem', fontSize: '1.1rem' }}>Detail Visi & Harapan</h4>
                <div style={{ marginBottom: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {viewingCv.worship && (
                    <div>
                      <h5 style={{ color: 'var(--text-main)', marginBottom: '0.4rem', fontSize: '1rem' }}>Kualitas Ibadah & Rujukan Kajian</h5>
                      <p style={{ fontSize: '1rem', color: 'var(--text-muted)', lineHeight: '1.6', margin: 0, padding: '1rem', background: '#f8fafc', borderRadius: '8px', borderLeft: '4px solid var(--primary-light)' }}>
                        <strong>Ibadah Harian:</strong><br/>{viewingCv.worship}
                        {viewingCv.kajian && <><br/><br/><strong>Rujukan Kajian/Ustadz:</strong><br/>{viewingCv.kajian}</>}
                      </p>
                    </div>
                  )}
                  {viewingCv.karakter && (
                    <div>
                      <h5 style={{ color: 'var(--text-main)', marginBottom: '0.4rem', fontSize: '1rem' }}>Karakter Diri</h5>
                      <p style={{ fontSize: '1rem', color: 'var(--text-muted)', lineHeight: '1.6', margin: 0, padding: '1rem', background: '#f8fafc', borderRadius: '8px', borderLeft: '4px solid var(--primary-light)' }}>{viewingCv.karakter}</p>
                    </div>
                  )}
                  {viewingCv.about && (
                    <div>
                      <h5 style={{ color: 'var(--text-main)', marginBottom: '0.4rem', fontSize: '1rem' }}>Visi Pernikahan</h5>
                      <p style={{ fontSize: '1rem', color: 'var(--text-muted)', lineHeight: '1.6', margin: 0, padding: '1rem', background: '#f8fafc', borderRadius: '8px', borderLeft: '4px solid var(--primary-light)' }}>{viewingCv.about}</p>
                    </div>
                  )}
                  {viewingCv.criteria && (
                    <div>
                      <h5 style={{ color: 'var(--text-main)', marginBottom: '0.4rem', fontSize: '1rem' }}>Kriteria Pasangan Harapan</h5>
                      <p style={{ fontSize: '1rem', color: 'var(--text-muted)', lineHeight: '1.6', margin: 0, padding: '1rem', background: '#f8fafc', borderRadius: '8px', borderLeft: '4px solid var(--secondary)' }}>{viewingCv.criteria}</p>
                    </div>
                  )}
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
              {/* Custom Filter Bar based on user UI */}
          <div className="filter-panel">
            <div className="filter-row">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">DOMISILI</label>
                <select 
                  className="form-control" 
                  value={filters.location}
                  onChange={e => setFilters({...filters, location: e.target.value})}
                >
                  <option value="">Semua Kota</option>
                  <option value="Jakarta">Jakarta</option>
                  <option value="Bandung">Bandung</option>
                  <option value="Surabaya">Surabaya</option>
                  <option value="Yogyakarta">Yogyakarta</option>
                  <option value="Medan">Medan</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">SUKU BANGSA</label>
                <select 
                  className="form-control" 
                  value={filters.suku}
                  onChange={e => setFilters({...filters, suku: e.target.value})}
                >
                  <option value="">Semua Suku</option>
                  <option value="Jawa">Jawa</option>
                  <option value="Sunda">Sunda</option>
                  <option value="Batak">Batak</option>
                  <option value="Minang">Minangkabau (Minang)</option>
                  <option value="Betawi">Betawi</option>
                  <option value="Bugis">Bugis</option>
                  <option value="Madura">Madura</option>
                  <option value="Banjar">Banjar</option>
                  <option value="Bali">Bali</option>
                  <option value="Sasak">Sasak</option>
                  <option value="Dayak">Dayak</option>
                  <option value="Makassar">Makassar</option>
                  <option value="Cirebon">Cirebon</option>
                  <option value="Ambon">Ambon</option>
                  <option value="Minahasa">Minahasa</option>
                  <option value="Melayu">Melayu</option>
                  <option value="Banten">Banten</option>
                  <option value="Nias">Nias</option>
                  <option value="Sumbawa">Sumbawa</option>
                  <option value="Lainnya">Lainnya...</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">KATEGORI HOBI</label>
                <select 
                  className="form-control" 
                  value={filters.hobi}
                  onChange={e => setFilters({...filters, hobi: e.target.value})}
                >
                  <option value="">Semua Hobi</option>
                  <option value="Membaca">Membaca</option>
                  <option value="Olahraga">Olahraga</option>
                  <option value="Memasak">Memasak</option>
                  <option value="Berdakwah">Berdakwah</option>
                  <option value="Menulis">Menulis</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">VISI POLIGAMI</label>
                <select 
                  className="form-control"
                  value={filters.poligami}
                  onChange={e => setFilters({...filters, poligami: e.target.value})}
                >
                  <option value="Semua">Semua</option>
                  <option value="Tidak Bersedia">Tidak Bersedia</option>
                  <option value="Mungkin">Mungkin</option>
                  <option value="Bersedia">Bersedia</option>
                </select>
              </div>
            </div>

            <div className="filter-divider"></div>

            <div className="filter-bottom">
              <div className="result-count" style={{ marginLeft: 'auto' }}>
                Ditemukan {filteredCvs.length} Calon
              </div>
            </div>
          </div>

          <div className="dashboard-grid" style={{ marginTop: '0' }}>
            {filteredCvs.length > 0 ? (
              filteredCvs.map(cv => (
                <div key={cv.id} className="card cv-item" style={{ display: 'block' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <h4 className="card-title" style={{ fontSize: '1.3rem', margin: 0 }}>{cv.alias}</h4>
                      <span className={`badge ${cv.gender === 'ikhwan' ? 'badge-info' : 'badge-warning'}`} style={{ textTransform: 'capitalize' }}>{cv.gender}</span>
                    </div>
                    <span className="badge badge-success">Terverifikasi</span>
                  </div>
                  
                  <div style={{ background: 'rgba(44, 95, 77, 0.03)', borderRadius: '12px', padding: '1.2rem', marginBottom: '1.5rem', border: '1px solid rgba(44, 95, 77, 0.08)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', color: 'var(--text-main)', fontSize: '0.95rem' }}>
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
              ))
            ) : (
               <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>
                 <Search size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
                 <h3>Tidak Ditemukan</h3>
                 <p style={{ color: 'var(--text-muted)' }}>Belum ada kandidat yang cocok dengan kriteria pencarian Anda saat ini.</p>
               </div>
            )}
          </div>
          </>
          )}
        </div>
      )}

      {activeTab === 'status' && (
        <div className="status-container" style={{ animation: 'fadeIn 0.5s ease' }}>
          {activeChatId ? (() => {
            const req = taarufRequests.find(r => r.id === activeChatId);
            const chatData = messages.find(m => m.taarufId === activeChatId);
            const isSender = req.senderEmail === user.email;
            const myAlias = isSender ? req.senderAlias : req.targetAlias;
            const targetAlias = isSender ? req.targetAlias : req.senderAlias;

            const handleSendMessage = async (e) => {
              e.preventDefault();
              if (!chatInput.trim()) return;

              try {
                const { data, error } = await supabase.from('messages').insert({
                  taaruf_request_id: activeChatId,
                  sender_id: user.id,
                  text: chatInput
                }).select('*, sender:sender_id(email, name)').single();
                
                if (error) {
                  console.error(error);
                  showAlert('Gagal Kirim Pesan', error.message, 'error');
                  return;
                }

                const newMsg = {
                  id: data.id,
                  sender: data.sender.email,
                  senderAlias: data.sender.name,
                  text: data.text,
                  timestamp: data.created_at
                };

                let newChats = chatData ? [...chatData.chats] : [];
                newChats.push(newMsg);

                if (chatData) {
                  setMessages(messages.map(m => m.taarufId === activeChatId ? { ...m, chats: newChats } : m));
                } else {
                  setMessages([...messages, { taarufId: activeChatId, chats: newChats }]);
                }
                setChatInput('');
              } catch (err) {
                console.error('Error send message: ', err);
                showAlert('Gagal Sistem', 'Terjadi kesalahan sistem saat mengirim pesan.', 'error');
              }
            };

            return (
              <div className="card card-no-hover" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="modal-header info" style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', flexDirection: 'row', justifyContent: 'space-between', background: 'var(--bg-light)' }}>
                  <div style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', border: 'none' }} onClick={() => setActiveChatId(null)}>
                      &larr; Kembali
                    </button>
                    <div>
                      <h3 style={{ fontSize: '1.1rem' }}>Ruang Q&A dengan {targetAlias}</h3>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}><ShieldAlert size={14} style={{ position: 'relative', top: '2px' }}/> Percakapan diawasi oleh Ustadz</p>
                    </div>
                  </div>
                </div>

                <div className="chat-container" style={{ borderTop: 'none', borderRadius: '0 0 var(--radius-lg) var(--radius-lg)', boxShadow: 'none' }}>
                  <div className="chat-history">
                    {(!chatData || chatData.chats.length === 0) ? (
                      <div className="empty-state" style={{ padding: '2rem' }}>
                        <MessageCircle size={40} color="var(--border-color)" />
                        <p style={{ marginTop: '1rem' }}>Sesi Q&A baru dimulai. Ucapkan salam dengan sopan.</p>
                      </div>
                    ) : (
                      chatData.chats.map(msg => {
                        const isMe = msg.sender === user.email;
                        const isAdmin = msg.sender.includes('admin');
                        return (
                          <div key={msg.id} className={`chat-bubble ${isAdmin ? 'admin' : (isMe ? 'right' : 'left')}`} style={isAdmin ? { alignSelf: 'center', background: 'var(--bg-card)', border: '1px solid var(--secondary)', textAlign: 'center' } : {}}>
                            <span className="chat-sender-name" style={isAdmin ? { color: 'var(--secondary)' } : {}}>{isAdmin ? 'Ustadz / Admin' : msg.senderAlias}</span>
                            {msg.text}
                            <span className="chat-meta">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                  
                  <form onSubmit={handleSendMessage} className="chat-input-area">
                    <input 
                      type="text" 
                      className="chat-input-field"
                      placeholder="Ketik pertanyaan atau balasan Anda..." 
                      value={chatInput} 
                      onChange={e => setChatInput(e.target.value)} 
                    />
                    <button type="submit" className="chat-send-btn">
                      <Send size={20} />
                    </button>
                  </form>
                </div>
              </div>
            );
          })() : (
            <>
          <h2 style={{ marginBottom: '1.5rem' }}>Status Pengajuan Taaruf Saya</h2>
          
          {taarufRequests.filter(req => req.senderEmail === user.email || (myExistingCv && req.targetCvId === myExistingCv.id)).length === 0 ? (
            <div className="card empty-state" style={{ maxWidth: '600px', margin: '0 auto' }}>
               <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(44, 95, 77, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                 <UserCheck size={40} color="var(--primary)" />
               </div>
               <h3>Belum Ada Pengajuan</h3>
               <p style={{ color: 'var(--text-muted)' }}>Anda belum mengajukan taaruf ke kandidat manapun.</p>
               <button className="btn btn-outline" style={{ marginTop: '1rem' }} onClick={() => setActiveTab('find')}>Cari Pasangan</button>
            </div>
          ) : (
            taarufRequests.filter(req => req.senderEmail === user.email || (myExistingCv && req.targetCvId === myExistingCv.id)).map(req => {
              
              // Helper to generate stepper state
              const getStepClass = (stepIndex, status) => {
                const stages = ['pending_target', 'pending_admin', 'qna', 'wali_process', 'meet', 'completed'];
                const currentIndex = stages.indexOf(status);
                
                if (status === 'rejected') {
                   // If rejected, steps before are completed, this step is error, future are grey
                   // We'll just simplify it:
                   return 'rejected'; 
                }
                
                if (currentIndex > stepIndex) return 'completed';
                if (currentIndex === stepIndex) return 'active';
                return '';
              }

              return (
                <div key={req.id} className="card" style={{ marginBottom: '1.5rem' }}>
                  <div className="card-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <h3 className="card-title">{req.senderEmail === user.email ? `Pengajuan ke ${req.targetAlias}` : `Pengajuan dari ${req.senderAlias}`}</h3>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Update terakhir: {new Date(req.updatedAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric'})}</p>
                    </div>
                    {req.status === 'rejected' && <span className="badge badge-warning">Ditolak</span>}
                  </div>

                  <div className="stepper-container">
                    <div className="stepper">
                      <div className={`step ${getStepClass(0, req.status)}`}>
                        <div className="step-icon">1</div>
                        <span className="step-label">Tunggu<br/>Calon</span>
                      </div>
                      <div className={`step ${getStepClass(1, req.status)}`}>
                        <div className="step-icon">2</div>
                        <span className="step-label">Review<br/>Ustadz</span>
                      </div>
                      <div className={`step ${getStepClass(2, req.status)}`}>
                        <div className="step-icon"><MessageCircle size={18} /></div>
                        <span className="step-label">Fase Q&A</span>
                      </div>
                      <div className={`step ${getStepClass(3, req.status)}`}>
                        <div className="step-icon"><Users size={18} /></div>
                        <span className="step-label">Proses Wali</span>
                      </div>
                      <div className={`step ${getStepClass(4, req.status)}`}>
                        <div className="step-icon">5</div>
                        <span className="step-label">Pertemuan</span>
                      </div>
                      <div className={`step ${getStepClass(5, req.status)}`}>
                        <div className="step-icon"><CheckCircle size={18} /></div>
                        <span className="step-label">Khitbah /<br/>Nikah</span>
                      </div>
                    </div>
                  </div>

                  <div className="empty-state" style={{ background: 'var(--bg-light)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', marginTop: '1rem', textAlign: 'left' }}>
                    <h4 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Clock size={18} color="var(--primary)" /> Status Saat Ini:
                    </h4>
                    {req.status === 'pending_target' && <p>{req.senderEmail === user.email ? 'Pengajuan Anda sedang dipertimbangkan oleh calon. Mohon doanya.' : 'Ada pengajuan masuk untuk Anda. Silakan pelajari profilnya dan putuskan apakah Anda bersedia.'}</p>}
                    
                    {req.status === 'pending_target' && req.senderEmail !== user.email && (
                      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button className="btn btn-primary" onClick={async () => {
                          const { error } = await supabase.from('taaruf_requests').update({ status: 'pending_admin', updated_at: new Date().toISOString() }).eq('id', req.id);
                          if (error) {
                            showAlert('Error', error.message, 'error');
                            return;
                          }
                          setTaarufRequests(taarufRequests.map(r => r.id === req.id ? {...r, status: 'pending_admin'} : r));
                          addNotification('Alhamdulillah, Anda menyetujui pengajuan. Menunggu verifikasi Ustadz sebelum Q&A.');
                        }}><CheckCircle size={18}/> Bismillah, Saya Setuju</button>
                        <button className="btn btn-outline" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={async () => {
                          const { error } = await supabase.from('taaruf_requests').update({ status: 'rejected', updated_at: new Date().toISOString() }).eq('id', req.id);
                          if (error) {
                            showAlert('Error', error.message, 'error');
                            return;
                          }
                          setTaarufRequests(taarufRequests.map(r => r.id === req.id ? {...r, status: 'rejected'} : r));
                          addNotification('Anda telah menolak pengajuan. Semoga Allah berikan yang lebih baik.');
                        }}><XCircle size={18}/> Maaf, Kurang Cocok</button>
                      </div>
                    )}

                    {req.status === 'pending_admin' && <p>{req.senderEmail === user.email ? 'Kandidat telah setuju! Saat ini Ustadz sedang memverifikasi sebelum membuka Ruang Q&A.' : 'Anda telah setuju. Menunggu Ustadz memverifikasi dan membuka Ruang Q&A untuk Anda berdua.'}</p>}
                    
                    {req.status === 'qna' && <p>Alhamdulillah, sesi tanya jawab telah dibuka. Silakan masuk ke fitur Chat Tersistem untuk berkomunikasi dengan adab yang baik.</p>}
                    {req.status === 'wali_process' && <p>Sesi tanya jawab telah dirasa cukup. Ustadz akan segera menjembatani proses wali dan merencanakan nazhar/pertemuan.</p>}
                    {req.status === 'rejected' && <p>Mohon maaf, proses taaruf ini tidak dapat dilanjutkan karena ketidakcocokan kriteria. Tetap semangat menjemput jodoh!</p>}

                    {req.status === 'qna' && (
                      <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setActiveChatId(req.id)}><MessageCircle size={18} style={{ marginRight: '0.5rem' }}/> Masuk Sesi Q&A</button>
                    )}
                  </div>
                </div>
              );
            })
          )}
          </>
          )}
        </div>
      )}

      {activeTab === 'account' && (
        <div className="card" style={{ maxWidth: '600px', margin: '0 auto', animation: 'fadeIn 0.5s ease' }}>
          <div className="card-header" style={{ marginBottom: '2rem', textAlign: 'center' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '2rem', fontWeight: 'bold' }}>
              {user.name.charAt(0)}
            </div>
            <h3 className="card-title">{user.name}</h3>
            <span className="badge badge-success" style={{ marginTop: '0.5rem', display: 'inline-block' }}>Akun Terverifikasi</span>
          </div>
          
          <div className="form-group" style={{ textAlign: 'left', marginBottom: '1rem' }}>
            <label className="form-label">Email / No HP</label>
            <input type="text" className="form-control" value={user.email} disabled />
          </div>
          
          <div className="form-group" style={{ textAlign: 'left', marginBottom: '1rem' }}>
            <label className="form-label">Jenis Kelamin Terdaftar</label>
            <input type="text" className="form-control" value={user.gender === 'ikhwan' ? 'Ikhwan (Pria)' : 'Akhwat (Wanita)'} disabled style={{ textTransform: 'capitalize' }} />
          </div>

          <div className="form-group" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
            <label className="form-label">No Whatsapp Wali</label>
            <input type="text" className="form-control" value={user.waliPhone || 'Belum diatur'} disabled />
          </div>

          <div style={{ height: '1px', background: 'var(--border)', margin: '1.5rem 0' }}></div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button className="btn btn-outline" onClick={() => showAlert('Fitur Terkunci', 'Fitur edit profil segera hadir!', 'info')}>Edit Profil</button>
            <button className="btn btn-outline" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => showAlert('Keamanan', 'Hubungi Admin untuk menghapus akun demi alasan keamanan.', 'error')}>
              Hapus Akun
            </button>
          </div>
        </div>
      )}

      {activeTab === 'materi' && (
        <div style={{ animation: 'fadeIn 0.5s ease' }}>
          {/* LMS Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <span style={{ cursor: 'pointer', color: 'var(--primary)' }} onClick={() => setActiveTab('home')}>Home Portal</span>
            <ChevronRight size={14} />
            <span>Daftar Kursus</span>
          </div>

          <div className="lms-layout" style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>

            {/* === LEFT SIDEBAR: Curriculum === */}
            <div className="lms-sidebar" style={{ width: '300px', flexShrink: 0, background: 'white', borderRadius: '16px', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
              {/* Course Title */}
              <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', background: 'linear-gradient(135deg, var(--primary), #1e4537)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Award size={16} color="var(--secondary)" />
                  <span style={{ color: 'var(--secondary)', fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Kursus Pra-Nikah</span>
                </div>
                <div style={{ color: 'white', fontWeight: '700', fontSize: '0.95rem', marginBottom: '0.75rem', lineHeight: '1.4' }}>Panduan Lengkap Taaruf & Pernikahan Islami</div>
                {/* Progress Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>PROGRESS</span>
                  <span style={{ color: 'white', fontSize: '0.75rem', fontWeight: '700' }}>{doneLessons}/{totalLessons}</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '99px', height: '6px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${progressPercent}%`, background: 'var(--secondary)', borderRadius: '99px', transition: 'width 0.5s ease' }} />
                </div>
              </div>

              {/* Sequential Info */}
              <div style={{ padding: '0.8rem 1.25rem', background: 'rgba(44,95,77,0.04)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <Lock size={12} color="var(--primary)" />
                <span style={{ fontWeight: '600', color: 'var(--primary)' }}>STRICT SEQUENTIAL</span>
                <span>ACTIVE</span>
              </div>

              {/* Module List */}
              <div style={{ overflowY: 'auto', maxHeight: '520px' }}>
                {curriculum.map((module, mIdx) => (
                  <div key={module.id}>
                    {/* Module Header */}
                    <button
                      onClick={() => toggleModule(module.id)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '1rem 1.25rem', background: 'none', border: 'none',
                        borderBottom: '1px solid var(--border)', cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <span style={{ fontWeight: '700', fontSize: '0.85rem', color: 'var(--text-main)' }}>{mIdx + 1} {module.title.replace(`Modul ${mIdx+1}: `, '')}</span>
                      {module.expanded ? <ChevronDown size={16} color="var(--text-muted)" /> : <ChevronRight size={16} color="var(--text-muted)" />}
                    </button>

                    {/* Module Items */}
                    {module.expanded && (
                      <div>
                        {module.items.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => setActiveLesson(item)}
                            style={{
                              width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem',
                              padding: '0.75rem 1.25rem 0.75rem 2rem',
                              background: activeLesson?.id === item.id ? 'rgba(44,95,77,0.08)' : 'none',
                              border: 'none', borderBottom: '1px solid rgba(44,95,77,0.05)',
                              cursor: 'pointer', textAlign: 'left',
                              borderLeft: activeLesson?.id === item.id ? '3px solid var(--primary)' : '3px solid transparent',
                            }}
                          >
                            {item.done
                              ? <CheckCircle size={16} color="var(--success)" style={{ flexShrink: 0 }} />
                              : item.type === 'quiz'
                                ? <BarChart2 size={16} color="#8b5cf6" style={{ flexShrink: 0 }} />
                                : <PlayCircle size={16} color={activeLesson?.id === item.id ? 'var(--primary)' : 'var(--text-muted)'} style={{ flexShrink: 0 }} />
                            }
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '0.8rem', fontWeight: activeLesson?.id === item.id ? '700' : '500', color: activeLesson?.id === item.id ? 'var(--primary)' : 'var(--text-main)', lineHeight: '1.3', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {item.title}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                {item.type === 'quiz' ? `Kuis • ${item.questions} soal` : item.duration}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* === RIGHT: Main Content === */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Breadcrumb */}
              <div style={{ marginBottom: '0.75rem', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <span style={{ color: 'var(--primary)' }}>MATERI</span>
                <span style={{ margin: '0 0.4rem' }}>›</span>
                <span>{activeLesson?.title?.toUpperCase()}</span>
              </div>

              {/* Done Badge */}
              {activeLesson?.done && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
                  <span style={{ background: 'rgba(42,157,143,0.1)', color: 'var(--success)', padding: '0.4rem 1rem', borderRadius: '99px', fontSize: '0.8rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.4rem', border: '1px solid rgba(42,157,143,0.2)' }}>
                    <CheckCircle size={14} /> SUDAH SELESAI
                  </span>
                </div>
              )}

              {/* Content Area */}
              {activeLesson?.type === 'video' ? (
                <div>
                  {/* Video Player */}
                  <div style={{
                    borderRadius: '16px', overflow: 'hidden', position: 'relative',
                    background: '#0f172a', boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
                    marginBottom: '1.5rem', aspectRatio: '16/9'
                  }}>
                    <iframe
                      width="100%" height="100%"
                      src={activeLesson.videoUrl}
                      title={activeLesson.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      style={{ display: 'block', width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
                    />
                  </div>

                  {/* Title & Info */}
                  <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', border: '1px solid var(--border)', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                      <div>
                        <h2 style={{ fontSize: '1.3rem', marginBottom: '0.4rem' }}>{activeLesson.title}</h2>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={13} /> {activeLesson.duration}</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}><Star size={13} color="var(--secondary)" /> Materi Pilihan Ustadz</span>
                        </div>
                      </div>
                      {!activeLesson.done && (
                        <button className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '0.6rem 1.25rem' }} onClick={() => { markLessonDone(activeLesson.id); }}>
                          <CheckCircle size={15} /> Tandai Selesai
                        </button>
                      )}
                    </div>
                    <hr style={{ margin: '1.25rem 0', borderColor: 'var(--border)' }} />
                    <p style={{ color: 'var(--text-muted)', lineHeight: '1.7', fontSize: '0.95rem' }}>
                      Materi ini membahas secara mendalam tentang <strong>{activeLesson.title.toLowerCase()}</strong> berdasarkan Al-Quran dan Sunnah yang shahih. Tonton hingga selesai dan klik "Tandai Selesai" untuk melanjutkan ke materi berikutnya.
                    </p>
                  </div>
                </div>
              ) : (
                /* Quiz View */
                <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', border: '1px solid var(--border)', textAlign: 'center' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: '#8b5cf6' }}>
                    <BarChart2 size={40} />
                  </div>
                  <h2 style={{ marginBottom: '0.5rem' }}>{activeLesson?.title}</h2>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{activeLesson?.questions} soal pilihan ganda</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '2rem', maxWidth: '400px', margin: '0 auto 2rem' }}>
                    Uji pemahaman Anda terhadap materi yang telah ditonton. Nilai minimum kelulusan adalah 70.
                  </p>
                  <button className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', boxShadow: '0 4px 15px rgba(139,92,246,0.3)' }} onClick={() => { markLessonDone(activeLesson.id); alert('Selamat! Kuis berhasil diselesaikan.'); }}>
                    <BarChart2 size={18} /> Mulai Kuis Sekarang
                  </button>
                </div>
              )}

              {/* Navigation Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
                <button
                  className="btn btn-outline"
                  onClick={() => {
                    const allItems = curriculum.flatMap(m => m.items);
                    const idx = allItems.findIndex(i => i.id === activeLesson?.id);
                    if (idx > 0) setActiveLesson(allItems[idx - 1]);
                  }}
                >
                  ← Sebelumnya
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    const allItems = curriculum.flatMap(m => m.items);
                    const idx = allItems.findIndex(i => i.id === activeLesson?.id);
                    if (idx < allItems.length - 1) setActiveLesson(allItems[idx + 1]);
                  }}
                >
                  Selanjutnya →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
