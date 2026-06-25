import React, { useState, useEffect, useMemo } from 'react';
import { Award, BookOpen, Search, Trophy, ChevronLeft, Sparkles, User, Medal, Star } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';

export default function LeaderboardTab({ setActiveTab }) {
  const { user, leaderboard, fetchLeaderboard, getAcademyBadge } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [totalLessons, setTotalLessons] = useState(0);

  useEffect(() => {
    if (fetchLeaderboard) {
      fetchLeaderboard();
    }
  }, [fetchLeaderboard]);

  useEffect(() => {
    const fetchTotalLessons = async () => {
      try {
        const { data, error } = await supabase.from('lessons').select('id').eq('is_published', true);
        if (!error && data) {
          setTotalLessons(data.length);
        }
      } catch (e) {
        console.warn("Error fetching total lessons:", e);
      }
    };
    fetchTotalLessons();
  }, []);

  const filteredLeaderboard = useMemo(() => {
    if (!searchQuery.trim()) return leaderboard;
    return leaderboard.filter(item => 
      item.alias.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [leaderboard, searchQuery]);

  // Find current user's rank
  const currentUserRank = useMemo(() => {
    const idx = leaderboard.findIndex(item => item.user_id === user?.id);
    return idx !== -1 ? idx + 1 : null;
  }, [leaderboard, user?.id]);

  const currentUserData = useMemo(() => {
    return leaderboard.find(item => item.user_id === user?.id);
  }, [leaderboard, user?.id]);

  // Top 3 for Podium
  const topThree = useMemo(() => {
    const top = filteredLeaderboard.slice(0, 3);
    // Arrange as [2nd, 1st, 3rd] for visual podium layout
    const arranged = [];
    if (top[1]) arranged.push({ ...top[1], rank: 2 });
    if (top[0]) arranged.push({ ...top[0], rank: 1 });
    if (top[2]) arranged.push({ ...top[2], rank: 3 });
    return arranged;
  }, [filteredLeaderboard]);

  const remainingList = useMemo(() => {
    return filteredLeaderboard.slice(3, 50);
  }, [filteredLeaderboard]);

  return (
    <div style={{ padding: '2rem 4%', background: 'white', animation: 'fadeIn 0.5s ease', boxSizing: 'border-box', width: '100%' }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes crownPulse {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-4px) scale(1.05); }
        }
        .podium-card {
          background: white;
          border: 1px solid #E4EDE8;
          border-radius: 24px;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          transition: all 0.3s ease;
          box-shadow: 0 10px 30px rgba(19, 78, 57, 0.01);
        }
        .podium-card.rank-1 {
          order: 2;
        }
        .podium-card.rank-2 {
          order: 1;
        }
        .podium-card.rank-3 {
          order: 3;
        }
        .podium-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px rgba(19, 78, 57, 0.04);
          border-color: #D4AF37;
        }
        .leaderboard-row {
          display: grid;
          grid-template-columns: 80px 1fr 200px 120px;
          align-items: center;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid #f1f5f9;
          transition: all 0.2s;
        }
        .leaderboard-row:hover {
          background: #F8FAF9;
        }
        @media (max-width: 768px) {
          .podium-card.rank-1 {
            order: 1 !important;
          }
          .podium-card.rank-2 {
            order: 2 !important;
          }
          .podium-card.rank-3 {
            order: 3 !important;
          }
          .leaderboard-row {
            grid-template-columns: 60px 1fr 100px;
            padding: 1rem 0.75rem;
            gap: 8px;
          }
          .badge-col {
            display: none !important;
          }
        }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div>
          {setActiveTab && (
            <button 
              onClick={() => setActiveTab('home')}
              style={{ 
                background: 'white', border: '1px solid #e2e8f0', color: '#134E39', 
                padding: '0.6rem 1.2rem', borderRadius: '10px', fontSize: '0.75rem', 
                fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', 
                gap: '8px', marginBottom: '1.25rem', boxShadow: '0 2px 5px rgba(0,0,0,0.02)',
                transition: 'all 0.2s'
              }}
            >
              <ChevronLeft size={16} /> KEMBALI KE BERANDA
            </button>
          )}
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: '950', margin: 0, color: '#134E39', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            Peringkat <span style={{ color: '#D4AF37' }}>Belajar</span>
          </h1>
          <p style={{ margin: '0.5rem 0 0', color: '#64748b', fontSize: '0.95rem', fontWeight: '500' }}>
            Lihat keaktifan belajar Anda dibandingkan kandidat akademi taaruf lainnya.
          </p>
        </div>

        <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input 
            type="text" 
            placeholder="Cari kandidat..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              width: '100%', height: '48px', padding: '0 1rem 0 2.75rem', 
              borderRadius: '12px', border: '1px solid #cbd5e1', 
              fontSize: '0.9rem', outline: 'none', background: 'white',
              boxSizing: 'border-box', fontWeight: '600'
            }}
          />
        </div>
      </div>

      {/* Top 3 Podium */}
      {filteredLeaderboard.length > 0 && !searchQuery && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
          gap: '2rem', 
          marginBottom: '3.5rem',
          alignItems: 'end',
          boxSizing: 'border-box'
        }}>
          {topThree.map((item) => {
            const isSelf = item.user_id === user?.id;
            const badge = getAcademyBadge ? getAcademyBadge(item.completed_lessons_count) : null;
            
            // Placement config
            let scale = 'scale(1)';
            let minHeight = '220px';
            let trophyColor = '#EAB308';
            let rankLabel = '1st Place';
            let rankColor = '#D4AF37';

            if (item.rank === 1) {
              scale = 'scale(1.05)';
              minHeight = '260px';
              trophyColor = '#EAB308';
              rankLabel = 'Juara 1';
              rankColor = '#EAB308';
            } else if (item.rank === 2) {
              minHeight = '230px';
              trophyColor = '#94A3B8';
              rankLabel = 'Juara 2';
              rankColor = '#94A3B8';
            } else if (item.rank === 3) {
              minHeight = '210px';
              trophyColor = '#D97706';
              rankLabel = 'Juara 3';
              rankColor = '#D97706';
            }

            return (
              <div 
                key={item.user_id} 
                className={`podium-card rank-${item.rank}`} 
                style={{ 
                  transform: scale, 
                  minHeight: minHeight,
                  border: isSelf ? '2px solid #134E39' : '1px solid #E4EDE8',
                  background: isSelf ? '#F0FDF4' : 'white'
                }}
              >
                {/* Crown for First Place */}
                {item.rank === 1 && (
                  <div style={{ position: 'absolute', top: '-25px', zIndex: 10, animation: 'crownPulse 2s infinite ease-in-out' }}>
                    <Trophy size={42} color="#EAB308" fill="#EAB308" />
                  </div>
                )}

                {/* Avatar / Initials */}
                <div style={{ position: 'relative', marginBottom: '1.25rem', marginTop: item.rank === 1 ? '1.5rem' : '0' }}>
                  {item.foto_url ? (
                    <img 
                      src={item.foto_url} 
                      alt="" 
                      style={{ 
                        width: item.rank === 1 ? '80px' : '70px', 
                        height: item.rank === 1 ? '80px' : '70px', 
                        borderRadius: '50%', 
                        objectFit: 'cover', 
                        border: `3px solid ${rankColor}`,
                        boxShadow: '0 8px 20px rgba(0,0,0,0.05)'
                      }} 
                    />
                  ) : (
                    <div style={{ 
                      width: item.rank === 1 ? '80px' : '70px', 
                      height: item.rank === 1 ? '80px' : '70px', 
                      borderRadius: '50%', 
                      background: item.gender === 'akhwat' ? '#FDF2F8' : '#F0FDF4', 
                      color: item.gender === 'akhwat' ? '#DB2777' : '#16A34A', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontWeight: '900',
                      fontSize: item.rank === 1 ? '1.5rem' : '1.25rem',
                      border: `3px dashed ${item.gender === 'akhwat' ? '#FBCFE8' : '#BBF7D0'}`,
                      boxShadow: '0 8px 20px rgba(0,0,0,0.02)'
                    }}>
                      {item.alias ? item.alias.substring(0, 2).toUpperCase() : 'SA'}
                    </div>
                  )}
                  <div style={{ 
                    position: 'absolute', bottom: '-8px', right: '-8px', 
                    width: '28px', height: '28px', borderRadius: '50%', 
                    background: rankColor, color: 'white', display: 'flex', 
                    alignItems: 'center', justifyContent: 'center', fontWeight: '950', fontSize: '0.8rem',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                  }}>
                    {item.rank}
                  </div>
                </div>

                <div style={{ fontWeight: '900', color: '#134E39', fontSize: '1.05rem', textAlign: 'center', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {item.alias}
                  {isSelf && <span style={{ fontSize: '0.6rem', background: '#134E39', color: 'white', padding: '1px 5px', borderRadius: '4px', fontWeight: '900' }}>ANDA</span>}
                </div>

                <div style={{ fontSize: '0.72rem', color: '#64748B', textTransform: 'capitalize', fontWeight: '700', marginTop: '4px' }}>
                  {item.gender}
                </div>

                {/* Badge */}
                <div style={{ marginTop: '0.75rem', minHeight: '30px' }}>
                  {badge ? (
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: `${badge.color}12`,
                      color: badge.color,
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '0.68rem',
                      fontWeight: '800',
                      border: `1px solid ${badge.color}25`
                    }}>
                      {badge.icon}
                      <span>{badge.label.split(' ')[0]}</span>
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.68rem', color: '#94A3B8', fontStyle: 'italic', fontWeight: '500' }}>Belum memiliki badge</span>
                  )}
                </div>

                <div style={{ marginTop: '1rem', background: '#F8FAF9', padding: '6px 14px', borderRadius: '12px', border: '1px solid #E4EDE8', width: '100%', boxSizing: 'border-box', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', color: '#94A3B8', fontWeight: '800', textTransform: 'uppercase' }}>Materi Selesai</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: '950', color: '#134E39', marginTop: '2px' }}>
                    {item.completed_lessons_count} <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: '700' }}>/ {totalLessons}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Leaderboard List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
        {filteredLeaderboard.length > 0 ? (
          <div style={{ border: '1px solid #E4EDE8', borderRadius: '20px', overflow: 'hidden', background: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.01)' }}>
            {/* Header Row */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '80px 1fr 200px 120px', 
              background: '#F8FAF9', 
              padding: '1.25rem 1.5rem', 
              borderBottom: '1px solid #E4EDE8',
              fontWeight: '800',
              color: '#134E39',
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }} className="leaderboard-row">
              <div>Posisi</div>
              <div>Kandidat / Siswa</div>
              <div className="badge-col">Lencana Keilmuan</div>
              <div style={{ textAlign: 'right' }}>Materi Selesai</div>
            </div>

            {/* List Rows */}
            {(!searchQuery ? remainingList : filteredLeaderboard).map((item, idx) => {
              const originalIdx = leaderboard.findIndex(x => x.user_id === item.user_id);
              const rank = originalIdx !== -1 ? originalIdx + 1 : (!searchQuery ? idx + 4 : idx + 1);
              const isSelf = item.user_id === user?.id;
              const badge = getAcademyBadge ? getAcademyBadge(item.completed_lessons_count) : null;
              
              let rankBg = '#f1f5f9';
              let rankColor = '#475569';
              if (rank === 1) { rankBg = 'linear-gradient(135deg, #FDE047 0%, #EAB308 100%)'; rankColor = 'white'; }
              else if (rank === 2) { rankBg = 'linear-gradient(135deg, #E2E8F0 0%, #94A3B8 100%)'; rankColor = 'white'; }
              else if (rank === 3) { rankBg = 'linear-gradient(135deg, #FFEDD5 0%, #D97706 100%)'; rankColor = 'white'; }

              return (
                <div 
                  key={item.user_id} 
                  className="leaderboard-row" 
                  style={{ 
                    background: isSelf ? '#F0FDF4' : 'transparent',
                    borderLeft: isSelf ? '4px solid #134E39' : '4px solid transparent'
                  }}
                >
                  {/* Position */}
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ 
                      width: '32px', height: '32px', borderRadius: '50%', 
                      background: rankBg, color: rankColor, 
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: '900', fontSize: '0.85rem'
                    }}>
                      {rank}
                    </div>
                  </div>

                  {/* Candidate Details */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {item.foto_url ? (
                      <img 
                        src={item.foto_url} 
                        alt="" 
                        style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #E4EDE8' }} 
                      />
                    ) : (
                      <div style={{ 
                        width: '40px', height: '40px', borderRadius: '50%', 
                        background: item.gender === 'akhwat' ? '#FDF2F8' : '#F0FDF4', 
                        color: item.gender === 'akhwat' ? '#DB2777' : '#16A34A', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: '900', fontSize: '0.8rem',
                        border: '1px dashed ' + (item.gender === 'akhwat' ? '#FBCFE8' : '#BBF7D0')
                      }}>
                        {item.alias ? item.alias.substring(0, 2).toUpperCase() : 'SA'}
                      </div>
                    )}
                    <div>
                      <div style={{ fontWeight: '800', color: '#134E39', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {item.alias}
                        {isSelf && <span style={{ fontSize: '0.65rem', background: '#134E39', color: 'white', padding: '1px 6px', borderRadius: '4px', fontWeight: '900' }}>ANDA</span>}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B', textTransform: 'capitalize', fontWeight: '600', marginTop: '2px' }}>
                        {item.gender}
                      </div>
                    </div>
                  </div>

                  {/* Scientific Badge */}
                  <div className="badge-col">
                    {badge ? (
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: `${badge.color}12`,
                        color: badge.color,
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.7rem',
                        fontWeight: '800',
                        border: `1.5px solid ${badge.color}25`
                      }}>
                        {badge.icon}
                        <span>{badge.label.split(' ')[0]}</span>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.7rem', color: '#cbd5e1', fontStyle: 'italic', fontWeight: '500' }}>Belum memiliki badge</span>
                    )}
                  </div>

                  {/* Progress Counter */}
                  <div style={{ textAlign: 'right', fontWeight: '900', color: '#134E39', fontSize: '0.9rem' }}>
                    {item.completed_lessons_count} <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: '700' }}>/ {totalLessons}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '5rem 2rem', background: '#F8FAF9', borderRadius: '20px', border: '2px dashed #E2E8F0' }}>
             <Award size={64} color="#CBD5E1" style={{ marginBottom: '1.5rem', opacity: 0.5 }} />
             <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#134E39', marginBottom: '0.5rem' }}>Belum Ada Peringkat</h3>
             <p style={{ color: '#64748B', fontWeight: '600', maxWidth: '400px', margin: '0 auto', lineHeight: 1.6, fontSize: '0.9rem' }}>
               {searchQuery ? 'Tidak ada kandidat dengan nama alias tersebut.' : 'Jadilah orang pertama yang menyelesaikan kelas dan menduduki peringkat teratas belajar akademi!'}
             </p>
          </div>
        )}

        {/* Sticky User Progress Summary */}
        {currentUserRank && currentUserData && (
          <div style={{ 
            background: 'linear-gradient(135deg, #134E39 0%, #1a5d46 100%)', 
            color: 'white', 
            padding: '1.25rem 2rem', 
            borderRadius: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 12px 30px rgba(19, 78, 57, 0.15)',
            border: '1px solid rgba(255,255,255,0.05)',
            marginTop: '1.5rem',
            flexWrap: 'wrap',
            gap: '1rem',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ 
                width: '44px', 
                height: '44px', 
                borderRadius: '50%', 
                background: 'rgba(255, 255, 255, 0.15)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontWeight: '900',
                fontSize: '1.1rem',
                border: '1px solid rgba(255,255,255,0.25)',
                color: '#D4AF37'
              }}>
                #{currentUserRank}
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '900', color: 'white' }}>Posisi Belajar Anda</h4>
                <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>
                  Terus tingkatkan progres belajar Anda untuk menduduki posisi puncak.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              {getAcademyBadge && getAcademyBadge(currentUserData.completed_lessons_count) && (
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(255,255,255,0.1)',
                  color: '#D4AF37',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: '900',
                  border: '1px solid rgba(255,255,255,0.15)'
                }}>
                  {getAcademyBadge(currentUserData.completed_lessons_count).icon}
                  <span>{getAcademyBadge(currentUserData.completed_lessons_count).label.split(' ')[0]}</span>
                </div>
              )}
              <div style={{ fontSize: '1.25rem', fontWeight: '950', color: '#D4AF37' }}>
                {currentUserData.completed_lessons_count} <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', fontWeight: '700' }}>/ {totalLessons} Materi</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
