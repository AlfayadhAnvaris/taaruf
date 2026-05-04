import React from 'react';
import { 
  Sparkles, FileText, GraduationCap, Users, Heart, Star, 
  Activity, CheckCircle, Compass, ShieldCheck 
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export default function HomeTab({
  user, greeting, candidateCount, myActiveRequests,
  getAcademyBadge, academyLevels, activityData,
  chartFilter, setChartFilter, onboardingPct, checks,
  setActiveTab, navigate
}) {
  return (
    <div key="tab-container-home" className="home-content">
      {/* ✨ HERO SECTION LIGHT (GRAY) ✨ */}
      <div className="animate-up" style={{
        background: 'white',
        borderRadius: '32px', padding: '2.5rem', marginBottom: '2.5rem',
        position: 'relative', overflow: 'hidden', color: '#1e293b',
        border: '1px solid #f1f5f9', boxShadow: '0 4px 15px rgba(0,0,0,0.01)'
      }}>
        <div className="animate-float" style={{ position: 'absolute', bottom: '40px', right: '10%', opacity: 0.04 }}><Sparkles size={160} color="#134E39" /></div>
        
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '2rem', flexWrap: 'wrap' }}>
             <div style={{ background: 'rgba(19,78,57,0.05)', color: '#134E39', padding: '6px 16px', borderRadius: '99px', fontSize: '0.7rem', fontWeight: '900', letterSpacing: '0.05em', border: '1px solid rgba(19,78,57,0.1)' }}>DASHBOARD UTAMA</div>
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: '900', color: '#134E39', margin: '0 0 1rem', lineHeight: 1.1, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{greeting}, {user?.name}!</h1>
          <p style={{ fontSize: '1.1rem', color: '#64748b', maxWidth: '600px', margin: '0 0 2.5rem', lineHeight: 1.6, fontWeight: '500' }}>
            Bismillah, mari temukan jodoh impian yang syar'i dan berkah di platform Separuh Agama.
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
             <button 
               onClick={() => setActiveTab('my_cv')}
               style={{ background: '#134E39', color: 'white', border: 'none', padding: '1.2rem 2.5rem', borderRadius: '20px', fontWeight: '900', fontSize: '1rem', cursor: 'pointer', boxShadow: '0 15px 35px rgba(19,78,57,0.2)', transition: 'all 0.3s' }}
               onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
               onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
             >
               Kelola CV Taaruf
             </button>
             <button 
               onClick={() => navigate('/app/materi')}
               style={{ background: 'white', color: '#134E39', border: '1.5px solid #E2E8F0', borderRadius: '16px', padding: '0.8rem 1.5rem', fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}
               onMouseEnter={e => { e.currentTarget.style.borderColor = '#134E39'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
               onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.transform = 'translateY(0)'; }}
             >
               <GraduationCap size={18} /> Akademi Belajar
             </button>
          </div>
        </div>
      </div>

      {/* 🧩 STATS GRID SOLID 🧩 */}
      <div className="dashboard-grid animate-up stagger-1" style={{ marginBottom: '3rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {[
          { label: 'Kandidat Cocok', value: candidateCount, color: '#134E39', icon: <Users size={24} />, sub: 'Tersedia di lokasi Anda', tab: 'find' },
          { label: 'Prosedur Aktif', value: myActiveRequests, color: '#134E39', icon: <Heart size={24} />, sub: 'Pengajuan berjalan', tab: 'status' },
          { 
            label: 'Badge Akademi', 
            value: getAcademyBadge(academyLevels[String(user.id)])?.label.split(' ')[0] || 'Aktif', 
            color: '#134E39', 
            icon: getAcademyBadge(academyLevels[String(user.id)])?.icon || <Star size={24} />, 
            sub: getAcademyBadge(academyLevels[String(user.id)]) ? 'Level Keilmuan Anda' : 'Status Akun Pengguna', 
            tab: 'materi' 
          },
        ].map((stat, i) => (
          <div key={i} onClick={() => setActiveTab(stat.tab)} style={{ 
            background: 'white', borderRadius: '30px', padding: '2rem', 
            cursor: 'pointer', border: '1px solid rgba(0,0,0,0.03)',
            boxShadow: '0 15px 35px rgba(0,0,0,0.02)', display: 'flex', 
            alignItems: 'center', gap: '1.5rem', transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
          }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = '0 25px 45px rgba(0,0,0,0.05)'; e.currentTarget.style.borderColor = 'rgba(19,78,57,0.1)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 15px 35px rgba(0,0,0,0.02)'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.03)'; }}>
            <div style={{ width: '70px', height: '70px', borderRadius: '22px', background: `${stat.color}08`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color, flexShrink: 0, transition: 'all 0.3s' }}>{stat.icon}</div>
            <div>
              <div style={{ fontSize: '1.85rem', fontWeight: '800', color: '#0f172a', lineHeight: 1, marginBottom: '0.4rem' }}>{stat.value}</div>
              <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#64748b', marginBottom: '0.2rem' }}>{stat.label}</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600' }}>{stat.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 📈 ACTIVITY CHART 📈 */}
      <div className="animate-up stagger-2" style={{ background: 'white', borderRadius: '32px', padding: '2.5rem', border: '1px solid #f1f5f9', marginBottom: '1.5rem', boxShadow: '0 4px 15px rgba(0,0,0,0.01)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#134E39', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Activity size={20} /> Aktivitas Pembelajaran
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>Statistik interaksi dan progres Anda di platform.</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', background: '#f8fafc', padding: '6px', borderRadius: '100px', border: '1px solid #e2e8f0' }}>
            {['7_hari', '1_bulan', '6_bulan'].map(f => (
               <button 
                 key={f}
                 onClick={() => setChartFilter(f)}
                 style={{ 
                   padding: '6px 16px', 
                   background: chartFilter === f ? 'white' : 'transparent', 
                   borderRadius: '99px', 
                   color: chartFilter === f ? '#134E39' : '#64748b', 
                   fontWeight: chartFilter === f ? '900' : '700', 
                   fontSize: '0.75rem',
                   border: 'none',
                   cursor: 'pointer',
                   transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                   boxShadow: chartFilter === f ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
                 }}
               >
                 {f === '7_hari' ? '7 Hari' : f === '1_bulan' ? '1 Bulan' : '6 Bulan'}
               </button>
            ))}
          </div>
        </div>
        <div style={{ height: '300px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAktivitas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#134E39" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#134E39" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }} />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', fontWeight: 700 }}
                itemStyle={{ color: '#134E39' }}
              />
              <Area type="monotone" dataKey="aktivitas" stroke="#134E39" strokeWidth={3} fillOpacity={1} fill="url(#colorAktivitas)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="dashboard-main-grid animate-up stagger-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
        <div style={{ background: 'white', borderRadius: '24px', padding: '1.5rem', border: '1px solid #f1f5f9' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '900', color: '#134E39', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
               <CheckCircle size={18} /> Checklist Persiapan Taaruf
            </h3>
            <div style={{ background: 'rgba(19,78,57,0.03)', padding: '1rem', borderRadius: '16px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
               <div style={{ position: 'relative', width: '48px', height: '48px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                  <span style={{ fontWeight: '900', color: '#134E39', fontSize: '0.9rem' }}>{onboardingPct}%</span>
               </div>
               <div>
                  <div style={{ fontWeight: '800', color: '#134E39', fontSize: '0.85rem' }}>Progres Onboarding</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Lengkapi langkah berikut untuk memulai pencarian.</div>
               </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
               {checks.map((check, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '12px', background: check.done ? '#f0fdf4' : '#f8fafc', border: check.done ? '1px solid #bbf7d0' : '1px solid #f1f5f9', transition: 'all 0.3s' }}>
                     <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: check.done ? '#166534' : '#e2e8f0', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {check.done ? <CheckCircle size={14} /> : check.icon}
                     </div>
                     <div style={{ flex: 1, fontWeight: '700', fontSize: '0.8rem', color: check.done ? '#166534' : '#64748b' }}>{check.label}</div>
                     {check.done ? (
                        <span style={{ fontSize: '0.65rem', fontWeight: '800', color: '#166534', background: '#dcfce7', padding: '2px 8px', borderRadius: '99px' }}>SELESAI</span>
                     ) : (
                        <button onClick={() => idx === 1 ? setActiveTab('my_cv') : navigate('/app/find')} style={{ background: 'none', border: 'none', color: '#134E39', fontWeight: '800', fontSize: '0.7rem', cursor: 'pointer', textDecoration: 'underline' }}>LAKUKAN</button>
                     )}
                  </div>
               ))}
            </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
           <div style={{ background: 'white', borderRadius: '32px', padding: '2rem', color: '#1e293b', position: 'relative', overflow: 'hidden', border: '1px solid #E2E8F0', boxShadow: '0 4px 15px rgba(0,0,0,0.01)' }}>
              <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.05 }}><Compass size={100} color="#134E39" /></div>
              <h4 style={{ margin: '0 0 1.5rem', fontSize: '1rem', fontWeight: '900', color: '#134E39' }}>Alur Taaruf Syar'i</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                 {[
                    'Cari & Pilih Kandidat Sesuai Kriteria',
                    'Pertukaran Kurikulum Vitae (CV) Taaruf',
                    'Nadzhor & Komunikasi Melalui Mediator',
                    'Khitbah & Akad Nikah Berkati'
                 ].map((t, i) => (
                    <div key={i} style={{ display: 'flex', gap: '15px', fontSize: '0.85rem', lineHeight: 1.5, alignItems: 'center' }}>
                       <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(19,78,57,0.05)', color: '#134E39', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', flexShrink: 0, fontSize: '0.75rem', border: '1px solid rgba(19,78,57,0.1)' }}>{i+1}</div>
                       <div style={{ fontWeight: 600, color: '#475569' }}>{t}</div>
                    </div>
                 ))}
              </div>
           </div>

           <div style={{ background: 'white', borderRadius: '32px', padding: '1.5rem', border: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                 <ShieldCheck size={18} color="#134E39" />
                 <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '900', color: '#134E39' }}>Keamanan & Adab</h4>
              </div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', lineHeight: 1.6 }}>Semua interaksi dipantau oleh admin untuk menjaga kualitas dan adab Islami selama proses Taaruf berlangsung.</p>
           </div>
        </div>
      </div>
    </div>
  );
}
