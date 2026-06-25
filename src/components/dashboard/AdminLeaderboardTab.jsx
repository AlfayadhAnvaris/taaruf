import React, { useState, useEffect, useMemo } from 'react';
import { Award, BookOpen, Search, Trophy, X, Eye, Trash2, ShieldAlert, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';

export default function AdminLeaderboardTab() {
  const { setConfirmState } = useAppContext();
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [detailUser, setDetailUser] = useState(null);
  
  // LMS Metadata
  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [progressList, setProgressList] = useState([]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // 1. Fetch LMS structure
      const { data: cls } = await supabase.from('lms_classes').select('id, title');
      const { data: crs } = await supabase.from('courses').select('id, class_id, title');
      const { data: les } = await supabase.from('lessons').select('id, course_id, title').eq('is_published', true);
      
      setClasses(cls || []);
      setCourses(crs || []);
      setLessons(les || []);

      // 2. Fetch leaderboard view
      const { data: board, error: bErr } = await supabase
        .from('academy_leaderboard')
        .select('*')
        .order('completed_lessons_count', { ascending: false })
        .order('last_completed_at', { ascending: true });
      
      if (bErr) throw bErr;

      // 3. Fetch user real profiles for admin management mapping
      const userIds = (board || []).map(b => b.user_id);
      let userMap = {};
      if (userIds.length > 0) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, name, email')
          .in('id', userIds);
        
        profs?.forEach(p => {
          userMap[p.id] = { name: p.name, email: p.email };
        });
      }

      // 4. Combine view data with real profile data for admin view
      const combined = (board || []).map((item, idx) => {
        const realInfo = userMap[item.user_id] || { name: 'Kandidat', email: '-' };
        return {
          ...item,
          rank: idx + 1,
          realName: realInfo.name,
          realEmail: realInfo.email
        };
      });

      setLeaderboardData(combined);

      // 5. Fetch all completions for detailed modal view
      const { data: prog } = await supabase
        .from('user_lesson_progress')
        .select('user_id, lesson_id, completed, score, completed_at')
        .eq('completed', true);
      
      setProgressList(prog || []);

    } catch (err) {
      console.error("Error fetching admin leaderboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const filteredData = useMemo(() => {
    return leaderboardData.filter(item => {
      const matchesSearch = 
        item.alias.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.realName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.realEmail.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesGender = genderFilter === 'all' || item.gender === genderFilter;

      return matchesSearch && matchesGender;
    });
  }, [leaderboardData, searchQuery, genderFilter]);

  const handleResetProgress = (student) => {
    setConfirmState({
      isOpen: true,
      title: 'Reset Progres Belajar?',
      message: `Apakah Anda yakin ingin menghapus seluruh riwayat penyelesaian materi untuk ${student.realName} (${student.alias})? Tindakan ini tidak dapat dibatalkan.`,
      onConfirm: async () => {
        try {
          const { error: resetErr } = await supabase
            .from('user_lesson_progress')
            .delete()
            .eq('user_id', student.user_id);
          
          if (resetErr) throw resetErr;

          setConfirmState(p => ({ ...p, isOpen: false }));
          setDetailUser(null);
          alert('Progres belajar berhasil di-reset!');
          fetchAllData();
        } catch (err) {
          alert('Gagal mereset progres: ' + err.message);
        }
      }
    });
  };

  return (
    <div style={{ padding: '1rem', width: '100%', boxSizing: 'border-box' }}>
      <style>{`
        .admin-table {
          width: 100%;
          border-collapse: collapse;
        }
        .admin-table th {
          background: #f8fafc;
          border-bottom: 1.5px solid #e2e8f0;
          padding: 1rem 1.5rem;
          text-align: left;
          font-size: 0.75rem;
          color: #64748b;
          font-weight: 800;
          text-transform: uppercase;
        }
        .admin-table td {
          padding: 1rem 1.5rem;
          border-bottom: 1px solid #f1f5f9;
          font-size: 0.85rem;
        }
        .gender-badge {
          font-size: 0.7rem;
          fontWeight: 800;
          text-transform: uppercase;
          padding: 4px 8px;
          border-radius: 8px;
        }
        .action-btn-circle {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border: 1px solid #e2e8f0;
          background: white;
          color: #475569;
          transition: all 0.2s;
        }
        .action-btn-circle:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }
        .action-btn-circle.danger:hover {
          background: #fee2e2;
          border-color: #fca5a5;
          color: #dc2626;
        }
      `}</style>

      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '950', color: '#134E39', letterSpacing: '-0.02em' }}>Kelola Peringkat Akademi</h3>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>
            Memantau dan mengelola peringkat keaktifan belajar {leaderboardData.length} kandidat terdaftar.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input 
            type="text" 
            placeholder="Cari berdasarkan nama alias, nama asli, atau email..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', height: '46px', padding: '0 1rem 0 2.5rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.875rem', background: '#fff', boxSizing: 'border-box', fontWeight: '600' }} 
          />
        </div>
        <select 
          value={genderFilter}
          onChange={(e) => setGenderFilter(e.target.value)}
          style={{ padding: '0 1rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.875rem', height: '46px', background: '#fff', cursor: 'pointer', fontWeight: '700', color: '#475569' }}
        >
          <option value="all">Semua Gender</option>
          <option value="ikhwan">Ikhwan</option>
          <option value="akhwat">Akhwat</option>
        </select>
      </div>

      {/* Leaderboard Table Grid */}
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.01)' }}>
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center' }}>
            <Loader className="animate-spin" size={28} style={{ color: '#134E39', margin: '0 auto 1rem' }} />
            <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: '600' }}>Memuat data peringkat belajar...</span>
          </div>
        ) : filteredData.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem', fontWeight: '600' }}>
            Tidak ada data peringkat yang cocok.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>Rank</th>
                  <th>Kandidat (Alias)</th>
                  <th>Nama Asli & Email</th>
                  <th>Gender</th>
                  <th style={{ textAlign: 'center' }}>Selesai</th>
                  <th style={{ width: '120px', textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((student, idx) => (
                  <tr key={`${student.user_id}-${idx}`}>
                    <td style={{ fontWeight: '900', color: student.rank <= 3 ? '#D4AF37' : '#64748b' }}>
                      #{student.rank}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {student.foto_url ? (
                          <img src={student.foto_url} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', color: '#475569', fontSize: '0.75rem' }}>
                            {student.alias?.substring(0, 2).toUpperCase() || 'SA'}
                          </div>
                        )}
                        <span style={{ fontWeight: '750', color: '#134E39' }}>{student.alias}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: '700', color: '#1e293b' }}>{student.realName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>{student.realEmail}</div>
                    </td>
                    <td>
                      <span className="gender-badge" style={{
                        background: student.gender === 'ikhwan' ? '#e0f2fe' : '#fce7f3',
                        color: student.gender === 'ikhwan' ? '#0369a1' : '#be185d'
                      }}>
                        {student.gender}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: '800', color: '#134E39' }}>
                      {student.completed_lessons_count} <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>/ {lessons.length}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button 
                          title="Detail Progres" 
                          onClick={() => setDetailUser(student)}
                          className="action-btn-circle"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          title="Reset Progres" 
                          onClick={() => handleResetProgress(student)}
                          className="action-btn-circle danger"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detailed Modal Progress */}
      {detailUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }} onClick={() => setDetailUser(null)}>
          <div style={{ background: 'white', borderRadius: '24px', maxWidth: '600px', width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }} onClick={e => e.stopPropagation()}>
            <div style={{ borderBottom: '1px solid #f1f5f9', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '900', color: '#134E39' }}>Detail Progres Belajar</h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>
                  {detailUser.realName} ({detailUser.realEmail})
                </p>
              </div>
              <button onClick={() => setDetailUser(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1.5rem', flex: 1, overflowY: 'auto' }} className="custom-scrollbar">
              {classes.map(cls => {
                const clsCourses = courses.filter(c => c.class_id === cls.id);
                const clsLessons = lessons.filter(l => clsCourses.some(c => c.id === l.course_id));
                const userCompletedInCls = progressList.filter(p => p.user_id === detailUser.user_id && clsLessons.some(l => l.id === p.lesson_id));
                const pct = clsLessons.length > 0 ? Math.round((userCompletedInCls.length / clsLessons.length) * 100) : 0;
                
                return (
                  <div key={cls.id} style={{ marginBottom: '1.5rem', background: '#f8fafc', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BookOpen size={16} color="#134E39" />
                        <span style={{ fontWeight: '800', color: '#1e293b', fontSize: '0.9rem' }}>{cls.title}</span>
                      </div>
                      <span style={{ fontWeight: '900', color: '#134E39', fontSize: '0.9rem' }}>{pct}%</span>
                    </div>

                    <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '99px', overflow: 'hidden', marginBottom: '1rem' }}>
                      <div style={{ height: '100%', background: '#134E39', width: `${pct}%`, transition: 'width 0.4s' }} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {clsCourses.map(course => {
                        const courseLessons = lessons.filter(l => l.course_id === course.id);
                        const doneInCourse = progressList.filter(p => p.user_id === detailUser.user_id && courseLessons.some(l => l.id === p.lesson_id));
                        
                        return (
                          <div key={course.id} style={{ background: 'white', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>{course.title}</span>
                            <span style={{ fontSize: '0.72rem', fontWeight: '800', color: doneInCourse.length === courseLessons.length && courseLessons.length > 0 ? '#10b981' : '#94a3b8' }}>
                              {doneInCourse.length}/{courseLessons.length} Selesai
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ borderTop: '1px solid #f1f5f9', padding: '1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button onClick={() => handleResetProgress(detailUser)} style={{ border: 'none', background: '#fee2e2', color: '#dc2626', padding: '0.75rem 1.25rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Trash2 size={16} /> RESET PROGRES
              </button>
              <button onClick={() => setDetailUser(null)} style={{ border: '1px solid #cbd5e1', background: 'white', color: '#475569', padding: '0.75rem 1.5rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '800', cursor: 'pointer' }}>
                TUTUP
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
