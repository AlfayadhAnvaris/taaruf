import React, { useContext, useEffect, useState, useMemo } from 'react';
import { AppContext } from '../../App';
import { supabase } from '../../supabase';
import { 
  Users, Activity, TrendingUp, MapPin, Award, Clock, 
  UserCheck, PieChart as PieChartIcon, Filter, Layers, 
  BarChart2, GraduationCap 
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
  LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar 
} from 'recharts';

export default function AdminHomeTab() {
  const { cvs, taarufRequests, usersDb } = useContext(AppContext);
  const [growthData, setGrowthData] = useState([]);
  const [dynamicChartData, setDynamicChartData] = useState([]);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);

  // Filter States
  const [chartsGender, setChartsGender] = useState('all');
  const [timeRange, setTimeRange] = useState('6m');
  const [distributionType, setDistributionType] = useState('gender'); // 'gender', 'region', 'education', 'course'

  // Standard Stats (Non-filtered)
  const totalUsers = usersDb ? usersDb.filter(u => u.role === 'user').length : 0;
  const totalApproved = cvs.filter(cv => cv.status === 'approved').length;
  const completeProfiles = usersDb ? usersDb.filter(u => u.role === 'user' && u.profile_complete).length : 0;
  const incompleteProfiles = totalUsers - completeProfiles;

  const COLORS = ['#134E39', '#D4AF37', '#0ea5e9', '#ec4899', '#94a3b8', '#8b5cf6'];

  useEffect(() => {
    const processAnalytics = async () => {
      if (!usersDb || usersDb.length === 0) return;

      const filteredByGender = usersDb.filter(u => chartsGender === 'all' || u.gender === chartsGender);

      // --- 📈 PROSES DATA PERTUMBUHAN (CHART 1) ---
      const months = {};
      const now = new Date();
      const monthsToShow = timeRange === '3m' ? 3 : (timeRange === '12m' ? 12 : 6);

      for (let i = monthsToShow - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.toLocaleString('id-ID', { month: 'short' });
        months[key] = 0;
      }

      filteredByGender.forEach(u => {
        const d = new Date(u.created_at);
        const key = d.toLocaleString('id-ID', { month: 'short' });
        if (months[key] !== undefined) months[key]++;
      });

      let cumulative = 0;
      const trend = Object.keys(months).map(key => {
        cumulative += months[key];
        return { name: key, users: months[key], total: cumulative };
      });
      setGrowthData(trend);

      // --- 📊 PROSES DATA DINAMIS (CHART 2) ---
      if (distributionType === 'gender') {
        const m = filteredByGender.filter(u => u.gender === 'ikhwan').length;
        const f = filteredByGender.filter(u => u.gender === 'akhwat').length;
        const u = filteredByGender.filter(u => !u.gender || u.gender === '').length;
        setDynamicChartData([
          { name: 'Ikhwan', value: m },
          { name: 'Akhwat', value: f },
          { name: 'Lainnya', value: u }
        ].filter(d => d.value > 0));
      } 
      else if (distributionType === 'region') {
        const regions = {};
        filteredByGender.forEach(u => {
          const reg = u.domisili_provinsi || 'Tidak Diketahui';
          regions[reg] = (regions[reg] || 0) + 1;
        });
        setDynamicChartData(Object.keys(regions)
          .map(name => ({ name, value: regions[name] }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 6));
      }
      else if (distributionType === 'education') {
        const edus = {};
        filteredByGender.forEach(u => {
          const e = u.pendidikan_terakhir || 'N/A';
          edus[e] = (edus[e] || 0) + 1;
        });
        setDynamicChartData(Object.keys(edus).map(name => ({ name, value: edus[name] })));
      }
      else if (distributionType === 'course') {
        try {
          const { data: progress } = await supabase
            .from('user_lesson_progress')
            .select('user_id, lesson_id, lessons(courses(lms_classes(title)))')
            .eq('completed', true);
          
          const stats = {};
          if (progress && progress.length > 0) {
            progress.forEach(p => {
               if (chartsGender !== 'all') {
                 const user = usersDb.find(u => u.id === p.user_id);
                 if (user?.gender !== chartsGender) return;
               }
               // Correct path from UserDashboard: lessons -> courses -> lms_classes
               const title = p.lessons?.courses?.lms_classes?.title || 'Umum';
               stats[title] = (stats[title] || 0) + 1;
            });
            const result = Object.keys(stats)
              .map(name => ({ 
                name: name.length > 12 ? name.substring(0, 10) + '...' : name, 
                full: name,
                value: stats[name] 
              }))
              .sort((a,b) => b.value - a.value)
              .slice(0, 6);
            setDynamicChartData(result);
          } else {
            setDynamicChartData([]);
          }
        } catch (err) { 
          console.error('Kursus Analytics Error:', err); 
          setDynamicChartData([]);
        }
      }

      setIsLoadingAnalytics(false);
    };

    processAnalytics();
  }, [usersDb, chartsGender, timeRange, distributionType]);

  return (
    <div style={{ animation: 'fadeIn 0.5s ease', paddingBottom: '3rem' }}>
      
      {/* 🟢 STATS GRID */}
      <div className="dashboard-grid" style={{ marginTop: 0, marginBottom: '2.5rem' }}>
        <StatCard Icon={UserCheck} label="Kandidat Disetujui" value={totalApproved} color="#134E39" bg="rgba(19, 78, 57, 0.1)" />
        <StatCard Icon={Activity} label="Taaruf Berlangsung" value={taarufRequests.length} color="#D4AF37" bg="rgba(212, 175, 55, 0.1)" />
        <StatCard Icon={Users} label="Total User Terdaftar" value={totalUsers} color="#0ea5e9" bg="rgba(14, 165, 233, 0.1)" />
        <StatCard Icon={Clock} label="Belum Lengkap (Inaktif)" value={incompleteProfiles} color="#94a3b8" bg="rgba(148, 163, 184, 0.1)" />
      </div>

      {/* 🟢 INTEGRATED FILTER BAR 🟢 */}
      <div style={{ 
        background: 'white', padding: '1.25rem 2rem', borderRadius: '28px', 
        marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', 
        alignItems: 'center', border: '1px solid #f1f5f9', flexWrap: 'wrap', gap: '1.5rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: 44, height: 44, borderRadius: '14px', background: '#134E39', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(19,78,57,0.15)' }}>
            <Layers size={22} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '900', color: '#134E39' }}>Dashboard Visualisasi</h4>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600' }}>Tentukan parameter data yang ingin dianalisis</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
           <div className="filter-group">
             <label style={{ fontSize: '0.65rem', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Gender</label>
             <select className="premium-select-sm" value={chartsGender} onChange={(e) => setChartsGender(e.target.value)}>
               <option value="all">Semua</option>
               <option value="ikhwan">Ikhwan</option>
               <option value="akhwat">Akhwat</option>
             </select>
           </div>

           <div className="filter-group">
             <label style={{ fontSize: '0.65rem', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Rentang</label>
             <select className="premium-select-sm" value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
               <option value="3m">3 Bulan</option>
               <option value="6m">6 Bulan</option>
               <option value="12m">1 Tahun</option>
             </select>
           </div>

           <div className="filter-group">
             <label style={{ fontSize: '0.65rem', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Analisis Distribusi</label>
             <select className="premium-select-sm" value={distributionType} onChange={(e) => setDistributionType(e.target.value)} style={{ borderColor: '#D4AF37', borderStyle: 'dashed' }}>
               <option value="gender">Rasio Gender</option>
               <option value="region">Persebaran Daerah</option>
               <option value="education">Level Pendidikan</option>
               <option value="course">Kursus Terpopuler</option>
             </select>
           </div>
        </div>
      </div>

      {/* 🟢 TWO-CHART MAIN LAYOUT 🟢 */}
      <div className="admin-charts-grid">
        
        {/* 📈 CHART 1: TIME SERIES GROWTH */}
        <div className="card admin-chart-card">
          <ChartHeader Icon={TrendingUp} title="Tren Pertumbuhan User" subtitle="Akumulasi pendaftaran kandidat Separuh Agama" />
          <div className="admin-chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  dy={10}
                  style={{ fontSize: '11px', fill: '#64748b', fontWeight: '700', textTransform: 'uppercase' }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  dx={-10}
                  style={{ fontSize: '11px', fill: '#94a3b8', fontWeight: '600' }} 
                />
                <RechartsTooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', padding: '16px' }} />
                <Line type="monotone" dataKey="users" name="Baru" stroke="#134E39" strokeWidth={5} dot={{ r: 6, fill: '#134E39', strokeWidth: 3, stroke: '#fff' }} activeDot={{ r: 9, strokeWidth: 0 }} />
                <Line type="monotone" dataKey="total" name="Total" stroke="#D4AF37" strokeWidth={2} strokeDasharray="6 6" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 📊 CHART 2: DYNAMIC DISTRIBUTION */}
        <div className="card admin-chart-card">
          <ChartHeader 
            Icon={distributionType === 'gender' ? PieChartIcon : (distributionType === 'region' ? MapPin : (distributionType === 'education' ? GraduationCap : Award))} 
            title={`Analisis ${distributionType === 'gender' ? 'Gender' : (distributionType === 'region' ? 'Wilayah' : (distributionType === 'education' ? 'Pendidikan' : 'LMS'))}`}
            subtitle={distributionType === 'course' ? 'Materi kursus paling banyak diselesaikan' : 'Distribusi data berdasarkan filter terpilih'} 
          />
          <div className="admin-chart-container" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             {dynamicChartData.length === 0 ? (
               <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease', width: '100%' }}>
                  <div style={{ background: '#f8fafc', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                    <BarChart2 size={30} opacity={0.3} color="#134E39" />
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#64748b', whiteSpace: 'nowrap' }}>Belum ada data tersedia</div>
                  <p style={{ fontSize: '0.7rem', margin: '4px 0 0', opacity: 0.6, fontWeight: '600' }}>Silakan sesuaikan filter atau rentang waktu</p>
               </div>
             ) : (
               <ResponsiveContainer width="100%" height="100%">
                 {distributionType === 'gender' ? (
                   <PieChart>
                      <Pie data={dynamicChartData} cx="50%" cy="50%" innerRadius={85} outerRadius={115} paddingAngle={10} dataKey="value" stroke="none" >
                        {dynamicChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={10} />)}
                      </Pie>
                      <RechartsTooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 15px 40px rgba(0,0,0,0.1)' }} />
                      <Legend verticalAlign="bottom" align="center" iconType="circle" iconSize={12} wrapperStyle={{ paddingTop: '20px', fontWeight: '800', fontSize: '0.85rem' }} />
                   </PieChart>
                 ) : (
                   <BarChart data={dynamicChartData} layout={distributionType === 'region' ? 'vertical' : 'horizontal'}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={distributionType !== 'region'} horizontal={distributionType === 'region'} />
                      {distributionType === 'region' ? (
                        <>
                          <XAxis type="number" hide />
                          <YAxis 
                            dataKey="name" 
                            type="category" 
                            axisLine={false} 
                            tickLine={false} 
                            style={{ fontSize: '11px', fill: '#1e293b', fontWeight: '700' }} 
                            width={100} 
                          />
                        </>
                      ) : (
                        <>
                          <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            dy={10}
                            style={{ fontSize: '11px', fill: '#64748b', fontWeight: '700' }} 
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            dx={-10}
                            style={{ fontSize: '11px', fill: '#94a3b8', fontWeight: '600' }} 
                          />
                        </>
                      )}
                      <RechartsTooltip 
                        cursor={{ fill: 'rgba(19, 78, 57, 0.03)' }} 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 15px 40px rgba(0,0,0,0.1)' }} 
                        formatter={(v, name, props) => [v, 'Penyelesaian']}
                        labelFormatter={(label, payload) => payload[0]?.payload?.full || label}
                      />
                      <Bar dataKey="value" name="Jumlah" fill="#134E39" radius={distributionType === 'region' ? [0, 10, 10, 0] : [10, 10, 0, 0]} barSize={25}>
                        {dynamicChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Bar>
                   </BarChart>
                 )}
               </ResponsiveContainer>
             )}
            
            {distributionType === 'gender' && (
              <div style={{ position: 'absolute', top: '42%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>Filter</div>
                <div className="dynamic-center-value">{dynamicChartData.reduce((acc, curr) => acc + curr.value, 0)}</div>
                <div style={{ fontSize: '0.6rem', fontWeight: '900', color: '#D4AF37' }}>Kandidat</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .premium-select-sm {
          padding: 0.6rem 1rem;
          border-radius: 12px;
          border: 1.5px solid #f1f5f9;
          background: #fcfcfc;
          font-size: 0.8rem;
          font-weight: 800;
          color: #1e293b;
          outline: none;
          cursor: pointer;
          transition: all 0.2s;
          min-width: 140px;
        }
        .premium-select-sm:focus { border-color: #134E39; background: white; }
        
        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1.5rem;
        }

        .admin-charts-grid {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 2rem;
          margin-top: 1rem;
        }

        .admin-chart-card {
          padding: 2.5rem;
          border: 1px solid #f1f5f9;
          borderRadius: 32px;
          background: white;
          min-width: 0; /* Prevents chart overflow in flex/grid */
        }

        .admin-chart-container {
          height: 350px;
          marginTop: 2rem;
        }

        .dynamic-center-value {
          fontSize: 2rem;
          fontWeight: 900;
          color: #134E39;
        }

        @media (max-width: 1200px) {
          .admin-charts-grid {
            grid-template-columns: 1fr;
          }
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
      `}</style>
    </div>
  );
}

// ─── STYLED SUB-COMPONENTS ──────────────────────────────────────────────────

function StatCard({ Icon, label, value, color, bg }) {
  return (
    <div style={{ 
      background: 'white', padding: '1.5rem', borderRadius: '24px', 
      border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '1.25rem',
      boxShadow: '0 4px 12px rgba(0,0,0,0.02)', transition: 'all 0.3s'
    }}>
      <div style={{ background: bg, color: color, padding: '1rem', borderRadius: '18px' }}><Icon size={24} /></div>
      <div>
        <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#64748b', marginBottom: '0.25rem' }}>{label}</div>
        <div style={{ fontSize: '1.75rem', fontWeight: '900', color: '#1e293b' }}>{value}</div>
      </div>
    </div>
  );
}

function ChartHeader({ Icon, title, subtitle }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <div style={{ background: 'rgba(19, 78, 57, 0.05)', color: '#134E39', padding: '0.8rem', borderRadius: '16px' }}><Icon size={22} /></div>
      <div>
        <h3 style={{ fontSize: '1.15rem', fontWeight: '900', color: '#1e293b', margin: 0 }}>{title}</h3>
        <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '4px 0 0', fontWeight: '500' }}>{subtitle}</p>
      </div>
    </div>
  );
}
