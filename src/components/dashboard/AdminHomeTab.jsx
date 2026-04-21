import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../App';
import { supabase } from '../../supabase';
import { Users, Activity, FileText, UserCheck, BarChart2, TrendingUp, MapPin, Award, Search, Loader, User, Mail, Phone, Calendar, Briefcase, GraduationCap, UserCircle, X, Clock, ShieldCheck, CheckCircle, PieChart as PieChartIcon } from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
  LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar 
} from 'recharts';

export default function AdminHomeTab() {
  const { cvs, taarufRequests, usersDb, setUsersDb, addNotification } = useContext(AppContext);
  const [growthData, setGrowthData] = useState([]);
  const [regionData, setRegionData] = useState([]);
  const [coursePopularity, setCoursePopularity] = useState([]);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGender, setFilterGender] = useState('all');
  const [filterAge, setFilterAge] = useState('all');
  const [filterEducation, setFilterEducation] = useState('all');
  const [filterProvince, setFilterProvince] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 5;

  const totalApproved = cvs.filter(cv => cv.status === 'approved').length;
  
  const calculateAge = (birthDate) => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const filteredUsers = (usersDb || [])
    .filter(u => u.role === 'user')
    .filter(u => {
      // Search Term
      const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           (u.domisili_provinsi || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      // Gender Filter
      const matchesGender = filterGender === 'all' || u.gender === filterGender;

      // Age Filter
      const age = calculateAge(u.tgl_lahir);
      let matchesAge = true;
      if (filterAge === '18-25') matchesAge = age >= 18 && age <= 25;
      else if (filterAge === '26-35') matchesAge = age >= 26 && age <= 35;
      else if (filterAge === '36-45') matchesAge = age >= 36 && age <= 45;
      else if (filterAge === '46+') matchesAge = age >= 46;

      // Education Filter
      const matchesEducation = filterEducation === 'all' || u.pendidikan_terakhir === filterEducation;

      // Province Filter
      const matchesProvince = filterProvince === 'all' || u.domisili_provinsi === filterProvince;

      return matchesSearch && matchesGender && matchesAge && matchesEducation && matchesProvince;
    });

  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / usersPerPage));
  const startIndex = (currentPage - 1) * usersPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + usersPerPage);

  // Dynamic filter options
  const provinces = [...new Set((usersDb || []).filter(u => u.domisili_provinsi).map(u => u.domisili_provinsi))].sort();
  const educations = [...new Set((usersDb || []).filter(u => u.pendidikan_terakhir).map(u => u.pendidikan_terakhir))].sort();

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterGender, filterAge, filterEducation, filterProvince]);

  const totalUsers = usersDb ? usersDb.filter(u => u.role === 'user').length : 0;
  const totalIkhwan = usersDb ? usersDb.filter(u => u.role === 'user' && u.gender === 'ikhwan').length : 0;
  const totalAkhwat = usersDb ? usersDb.filter(u => u.role === 'user' && u.gender === 'akhwat').length : 0;
  const incompleteProfiles = totalUsers - (totalIkhwan + totalAkhwat);

  const genderData = [
    { name: 'Ikhwan', value: totalIkhwan },
    { name: 'Akhwat', value: totalAkhwat },
    { name: 'Belum Lengkap', value: incompleteProfiles },
  ].filter(d => d.value > 0);

  const GENDER_COLORS = ['#0ea5e9', '#ec4899', '#94a3b8'];

  const checkProfileCompleteness = (u) => {
    if (!u) return false;
    const isAkhwat = u.gender === 'akhwat';
    const isBasicComplete = u.name && u.gender && u.phone_wa && u.domisili_kota && u.domisili_provinsi;
    const isWaliComplete = !isAkhwat || (u.wali_name && u.wali_phone);
    return isBasicComplete && isWaliComplete;
  };

  const handleToggleVerification = async (u) => {
    if (!u) return;
    setIsVerifying(true);
    try {
      const newStatus = !u.is_verified;
      const { error } = await supabase
        .from('profiles')
        .update({ is_verified: newStatus })
        .eq('id', u.id);

      if (error) throw error;
      
      // Kirim notifikasi jika diverifikasi
      if (newStatus) {
        await addNotification(
          "Barakallahu fiikum! Profil Anda telah berhasil diverifikasi oleh Admin. Anda sekarang dapat mulai mencari pasangan dan mengajukan taaruf.",
          u.id
        );
      }
      
      // Update local and global state
      setSelectedUser({ ...u, is_verified: newStatus });
      if (setUsersDb) {
        setUsersDb(prev => prev.map(user => user.id === u.id ? { ...user, is_verified: newStatus } : user));
      }
    } catch (err) {
      console.error('Verification error:', err);
      alert('Gagal memperbarui status verifikasi: ' + err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    const processAnalytics = async () => {
      if (!usersDb || usersDb.length === 0) return;

      // 1. User Growth Trend (Last 6 Months)
      const months = {};
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.toLocaleString('id-ID', { month: 'short' });
        months[key] = 0;
      }

      usersDb.forEach(u => {
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

      // 2. Region Distribution
      const regions = {};
      usersDb.forEach(u => {
        const reg = u.domisili_provinsi || 'Tidak Diketahui';
        regions[reg] = (regions[reg] || 0) + 1;
      });
      const regList = Object.keys(regions)
        .map(name => ({ name, count: regions[name] }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5); // Top 5
      setRegionData(regList);

      // 3. Popular Courses (Join via courses table)
      try {
        const { data: progress } = await supabase
          .from('user_lesson_progress')
          .select(`
            lesson_id, 
            lessons(
              course_id, 
              courses(
                class_id, 
                lms_classes(title)
              )
            )
          `)
          .eq('completed', true);
        
        if (progress) {
          const stats = {};
          progress.forEach(p => {
             const title = p.lessons?.courses?.lms_classes?.title || 'Umum';
             stats[title] = (stats[title] || 0) + 1;
          });
          const popList = Object.keys(stats)
            .map(name => ({ name: name.length > 20 ? name.substring(0, 17) + '...' : name, full: name, count: stats[name] }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
          setCoursePopularity(popList);
        }
      } catch (err) {
        console.error('Error fetching course popularity:', err);
      }

      setIsLoadingAnalytics(false);
    };

    processAnalytics();
  }, [usersDb]);

  return (
    <div style={{ animation: 'fadeIn 0.5s ease', paddingBottom: '3rem' }}>
      {/* 🟢 TOP LEVEL STATS */}
      <div className="dashboard-grid" style={{ marginTop: 0, marginBottom: '2.5rem' }}>
        <StatCard Icon={UserCheck} label="Kandidat Disetujui" value={totalApproved} color="#134E39" bg="rgba(19, 78, 57, 0.1)" />
        <StatCard Icon={Activity} label="Taaruf Berlangsung" value={taarufRequests.length} color="#D4AF37" bg="rgba(212, 175, 55, 0.1)" />
        <StatCard Icon={Users} label="Total User Terdaftar" value={totalUsers} color="#0ea5e9" bg="rgba(14, 165, 233, 0.1)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '2rem', marginBottom: '2.5rem' }}>
        
        {/* 📈 GROWTH TREND */}
        <div className="card" style={{ padding: '2rem', border: '1px solid #f1f5f9', borderRadius: '24px' }}>
          <ChartHeader Icon={TrendingUp} title="Tren Pertumbuhan User" subtitle="Data pendaftaran 6 bulan terakhir" />
          <div style={{ height: '300px', marginTop: '1.5rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} style={{ fontSize: '0.75rem', fill: '#94a3b8', fontWeight: '800' }} />
                <YAxis axisLine={false} tickLine={false} style={{ fontSize: '0.75rem', fill: '#94a3b8', fontWeight: '800' }} />
                <RechartsTooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 15px 40px rgba(0,0,0,0.1)', padding: '12px' }} />
                <Line type="monotone" dataKey="users" name="Baru" stroke="#134E39" strokeWidth={4} dot={{ r: 6, fill: '#134E39', strokeWidth: 3, stroke: '#fff' }} activeDot={{ r: 8, strokeWidth: 0 }} />
                <Line type="monotone" dataKey="total" name="Total" stroke="#D4AF37" strokeWidth={2} strokeDasharray="6 6" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 🗺️ REGION DISTRIBUTION */}
        <div className="card" style={{ padding: '2rem', border: '1px solid #f1f5f9', borderRadius: '24px' }}>
          <ChartHeader Icon={MapPin} title="Persebaran Daerah" subtitle="Top 5 provinsi pendaftar terbanyak" />
          <div style={{ height: '300px', marginTop: '1.5rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regionData} layout="vertical" margin={{ left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} style={{ fontSize: '0.8rem', fill: '#1e293b', fontWeight: '900' }} />
                <RechartsTooltip cursor={{ fill: 'rgba(19, 78, 57, 0.03)' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 15px 40px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="count" name="User" fill="#134E39" radius={[0, 10, 10, 0]} barSize={24}>
                  {regionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#134E39' : '#2C5F4D'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 🎓 COURSE POPULARITY */}
        <div className="card" style={{ padding: '2rem', border: '1px solid #f1f5f9', borderRadius: '24px' }}>
          <ChartHeader Icon={Award} title="Kursus Terpopuler" subtitle="Berdasarkan jumlah kelulusan materi" />
          <div style={{ height: '300px', marginTop: '1.5rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={coursePopularity}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} style={{ fontSize: '0.7rem', fill: '#64748b', fontWeight: '800' }} />
                <YAxis axisLine={false} tickLine={false} style={{ fontSize: '0.75rem', fill: '#94a3b8', fontWeight: '800' }} />
                <RechartsTooltip cursor={{ fill: 'rgba(212, 175, 55, 0.05)' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 15px 40px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="count" name="Selesai" fill="#D4AF37" radius={[10, 10, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 🚻 GENDER RATIO */}
        <div className="card" style={{ padding: '2rem', border: '1px solid #f1f5f9', borderRadius: '24px' }}>
          <ChartHeader Icon={PieChartIcon} title="Rasio Gender" subtitle="Distribusi Ikhwan & Akhwat" />
          <div style={{ height: '300px', marginTop: '1.5rem' }}>
            {totalUsers > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={genderData} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={10} dataKey="value" stroke="none" >
                    {genderData.map((entry, index) => <Cell key={`cell-${index}`} fill={GENDER_COLORS[index % GENDER_COLORS.length]} cornerRadius={8} />)}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 15px 40px rgba(0,0,0,0.1)' }} />
                  <Legend verticalAlign="bottom" align="center" iconType="circle" iconSize={10} wrapperStyle={{ paddingTop: '20px', fontWeight: '800', fontSize: '0.85rem' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>Belum ada data</div>
            )}
          </div>
        </div>
      </div>

      {/* 👥 KELOLA USER & PROGRESS BELAJAR */}
      <div className="card" style={{ padding: '2rem', border: '1px solid #f1f5f9', borderRadius: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <ChartHeader Icon={Users} title="Kelola Pengguna Taaruf" subtitle="Manajemen data dan verifikasi pendaftar" />
          </div>
          
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
             {/* Filter Gender */}
             <div style={{ position: 'relative' }}>
               <select 
                 value={filterGender} 
                 onChange={(e) => setFilterGender(e.target.value)}
                 style={{ 
                   padding: '0.75rem 1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0', 
                   fontSize: '0.85rem', fontWeight: '700', color: '#1e293b', background: 'white', 
                   outline: 'none', cursor: 'pointer', appearance: 'none', minWidth: '140px',
                   boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: 'all 0.2s'
                 }}
                 onMouseEnter={e => e.target.style.borderColor = '#cbd5e1'}
                 onMouseLeave={e => e.target.style.borderColor = '#e2e8f0'}
               >
                 <option value="all">Semua Gender</option>
                 <option value="ikhwan">Ikhwan</option>
                 <option value="akhwat">Akhwat</option>
               </select>
             </div>

             {/* Filter Usia */}
             <select 
               value={filterAge} 
               onChange={(e) => setFilterAge(e.target.value)}
               style={{ 
                 padding: '0.75rem 1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0', 
                 fontSize: '0.85rem', fontWeight: '700', color: '#1e293b', background: 'white', 
                 outline: 'none', cursor: 'pointer', appearance: 'none',
                 boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: 'all 0.2s'
               }}
               onMouseEnter={e => e.target.style.borderColor = '#cbd5e1'}
               onMouseLeave={e => e.target.style.borderColor = '#e2e8f0'}
             >
               <option value="all">Semua Usia</option>
               <option value="18-25">18 - 25 Tahun</option>
               <option value="26-35">26 - 35 Tahun</option>
               <option value="36-45">36 - 45 Tahun</option>
               <option value="46+">46+ Tahun</option>
             </select>

             {/* Filter Pendidikan */}
             <select 
               value={filterEducation} 
               onChange={(e) => setFilterEducation(e.target.value)}
               style={{ 
                 padding: '0.75rem 1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0', 
                 fontSize: '0.85rem', fontWeight: '700', color: '#1e293b', background: 'white', 
                 outline: 'none', cursor: 'pointer', minWidth: '140px',
                 boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: 'all 0.2s'
               }}
               onMouseEnter={e => e.target.style.borderColor = '#cbd5e1'}
               onMouseLeave={e => e.target.style.borderColor = '#e2e8f0'}
             >
               <option value="all">Pendidikan</option>
               {educations.map(edu => <option key={edu} value={edu}>{edu}</option>)}
             </select>

             {/* Filter Provinsi */}
             <select 
               value={filterProvince} 
               onChange={(e) => setFilterProvince(e.target.value)}
               style={{ 
                 padding: '0.75rem 1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0', 
                 fontSize: '0.85rem', fontWeight: '700', color: '#1e293b', background: 'white', 
                 outline: 'none', cursor: 'pointer', minWidth: '140px',
                 boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: 'all 0.2s'
               }}
               onMouseEnter={e => e.target.style.borderColor = '#cbd5e1'}
               onMouseLeave={e => e.target.style.borderColor = '#e2e8f0'}
             >
               <option value="all">Provinsi</option>
               {provinces.map(prov => <option key={prov} value={prov}>{prov}</option>)}
             </select>

             <div style={{ 
               position: 'relative', width: '280px', display: 'flex', alignItems: 'center',
               background: '#f8fafc', borderRadius: '16px', border: '1.5px solid #e2e8f0',
               padding: '0 1rem', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
               boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
             }} className="admin-search-container">
                <Search size={18} color="#94a3b8" />
                <input 
                  type="text" 
                  placeholder="Cari nama atau kota..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ 
                    border: 'none', background: 'transparent', padding: '0.8rem 0.75rem',
                    fontSize: '0.9rem', fontWeight: '600', color: '#1e293b', width: '100%',
                    outline: 'none'
                  }}
                />
             </div>
          </div>
        </div>

        <div style={{ overflowX: 'auto', margin: '0 -1rem' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.75rem' }}>
            <thead>
              <tr style={{ textAlign: 'left' }}>
                <th style={{ padding: '0 1rem', fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>Pengguna</th>
                <th style={{ padding: '0 1rem', fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>Detail Kontak</th>
                <th style={{ padding: '0 1rem', fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '0 1rem', fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map(u => (
                  <tr key={u.id}>
                    <td style={{ padding: '1rem', background: '#f8fafc', borderRadius: '16px 0 0 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <div style={{ 
                          width: 52, height: 52, borderRadius: '18px', 
                          background: u.gender === 'ikhwan' ? 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)' : 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)', 
                          color: u.gender === 'ikhwan' ? '#0369a1' : '#be185d', 
                          display: 'flex', alignItems: 'center', justifyContent: 'center', 
                          fontWeight: '900', fontSize: '1.25rem', boxShadow: '0 4px 10px rgba(0,0,0,0.03)'
                        }}>
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: '800', color: '#1e293b', fontSize: '1rem', marginBottom: '2px' }}>{u.name}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                             <span style={{ 
                               fontSize: '0.7rem', fontWeight: '800', color: u.gender === 'ikhwan' ? '#0ea5e9' : '#ec4899', 
                               textTransform: 'uppercase', background: u.gender === 'ikhwan' ? 'rgba(14,165,233,0.1)' : 'rgba(236,72,153,0.1)',
                               padding: '2px 8px', borderRadius: '6px'
                             }}>
                               {u.gender || 'Belum Lengkap'}
                             </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem', background: '#f8fafc' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                        <MapPin size={14} color="#94a3b8" /> {u.domisili_kota || '-'}, {u.domisili_provinsi || '-'}
                      </div>
                      <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Mail size={12} /> {u.email}
                      </div>
                    </td>
                     <td style={{ padding: '1rem', background: '#f8fafc' }}>
                       {u.is_verified ? (
                         <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#dcfce7', color: '#15803d', padding: '6px 14px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '800', border: '1px solid rgba(22,101,52,0.1)' }}>
                           <ShieldCheck size={14} /> TERVERIFIKASI
                         </div>
                       ) : checkProfileCompleteness(u) ? (
                         <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#fef9c3', color: '#a16207', padding: '6px 14px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '800', border: '1px solid rgba(161,98,7,0.1)' }}>
                           <Clock size={14} /> SIAP VERIFIKASI
                         </div>
                       ) : (
                         <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', color: '#64748b', padding: '6px 14px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '800', border: '1px solid rgba(100,116,139,0.1)' }}>
                           <FileText size={14} /> BELUM LENGKAP
                         </div>
                       )}
                     </td>
                     <td style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0 16px 16px 0', textAlign: 'right' }}>
                        <button 
                         onClick={() => setSelectedUser(u)}
                         style={{ 
                           background: 'white', color: '#134E39', border: '1.5px solid #134E39', borderRadius: '12px', 
                           padding: '0.6rem 1.25rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '800',
                           display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s',
                           boxShadow: '0 2px 4px rgba(19, 78, 57, 0.05)'
                         }}
                         onMouseEnter={e => {
                           e.currentTarget.style.background = '#134E39';
                           e.currentTarget.style.color = 'white';
                         }}
                         onMouseLeave={e => {
                           e.currentTarget.style.background = 'white';
                           e.currentTarget.style.color = '#134E39';
                         }}
                        >
                          Lihat Detail
                        </button>
                     </td>
                   </tr>
                ))}
            </tbody>
          </table>
          
          {/* 🔢 PAGINATION UI */}
          {filteredUsers.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', padding: '1.25rem 1.5rem', background: '#f8fafc', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '700' }}>
                Menampilkan <span style={{ color: '#134E39' }}>{startIndex + 1} - {Math.min(startIndex + usersPerPage, filteredUsers.length)}</span> dari <span style={{ color: '#134E39' }}>{filteredUsers.length}</span> User
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  style={{ 
                    padding: '0.6rem 1.25rem', borderRadius: '14px', border: '1px solid #e2e8f0', 
                    background: 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', 
                    fontSize: '0.8rem', fontWeight: '800', color: currentPage === 1 ? '#cbd5e1' : '#134E39',
                    transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                  }}
                  onMouseEnter={e => !e.target.disabled && (e.target.style.background = '#f8fafc')}
                  onMouseLeave={e => !e.target.disabled && (e.target.style.background = 'white')}
                >
                  Sebelumnya
                </button>
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  {[...Array(totalPages)].map((_, i) => (
                    <button 
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      style={{ 
                        width: '36px', height: '36px', borderRadius: '12px', 
                        border: 'none', 
                        background: currentPage === i + 1 ? '#134E39' : 'transparent',
                        color: currentPage === i + 1 ? 'white' : '#64748b',
                        fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  style={{ 
                    padding: '0.6rem 1.25rem', borderRadius: '14px', border: '1px solid #e2e8f0', 
                    background: 'white', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', 
                    fontSize: '0.8rem', fontWeight: '800', color: currentPage === totalPages ? '#cbd5e1' : '#134E39',
                    transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                  }}
                  onMouseEnter={e => !e.target.disabled && (e.target.style.background = '#f8fafc')}
                  onMouseLeave={e => !e.target.disabled && (e.target.style.background = 'white')}
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          )}

          {filteredUsers.length === 0 && (
            <div style={{ padding: '4rem 2rem', textAlign: 'center', background: '#f8fafc', borderRadius: '24px', margin: '1rem 0' }}>
              <Users size={48} color="#cbd5e1" style={{ marginBottom: '1rem' }} />
              <h4 style={{ margin: 0, color: '#64748b' }}>User tidak ditemukan</h4>
              <p style={{ margin: '0.5rem 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>Coba ubah kata kunci pencarian Anda.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL: DETAIL USER ── */}
      {selectedUser && (() => {
        const calculateAge = (birthDate) => {
          if (!birthDate) return '-';
          const birth = new Date(birthDate);
          const now = new Date();
          let age = now.getFullYear() - birth.getFullYear();
          const m = now.getMonth() - birth.getMonth();
          if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
          return age + ' Tahun';
        };

        return (
          <div className="modal-overlay modal-overlay-dark" onClick={() => setSelectedUser(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: 'white', maxWidth: '540px', width: '90%', borderRadius: '32px', overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.2)', animation: 'modalFadeIn 0.3s ease' }}>
              {/* Header / Avatar Section */}
              <div style={{ position: 'relative', padding: '2rem', background: 'linear-gradient(135deg, #134E39 0%, #206B52 100%)', color: 'white', textAlign: 'center' }}>
                 <button onClick={() => setSelectedUser(null)} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', padding: '8px', color: 'white', cursor: 'pointer', display: 'flex' }}>
                   <X size={20} />
                 </button>

                 <div style={{ width: 90, height: 90, borderRadius: '28px', background: 'white', margin: '0 auto 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                   <UserCircle size={56} color="#134E39" />
                 </div>
                 
                 <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem', fontWeight: '900' }}>{selectedUser.name}</h2>
                 <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.15)', padding: '4px 16px', borderRadius: '50px', fontSize: '0.8rem', fontWeight: '800', textTransform: 'capitalize' }}>
                   {selectedUser.gender} • {calculateAge(selectedUser.tgl_lahir)}
                 </div>
              </div>

              {/* Content Section */}
              <div style={{ padding: '2rem', maxHeight: '70vh', overflowY: 'auto' }}>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                    <div style={{ gridColumn: 'span 2' }}>
                      <DetailRow Icon={Mail} label="Alamat Email" value={selectedUser.email} />
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                      <DetailRow Icon={Phone} label="Nomor WhatsApp" value={selectedUser.phone_wa || 'Belum diisi'} />
                    </div>
                    
                    <DetailRow Icon={Briefcase} label="Pekerjaan" value={selectedUser.pekerjaan || 'Belum diisi'} />
                    <DetailRow Icon={GraduationCap} label="Pendidikan" value={selectedUser.pendidikan_terakhir || 'Belum diisi'} />
                    
                    <div style={{ gridColumn: 'span 2' }}>
                      <DetailRow Icon={MapPin} label="Domisili saat ini" value={`${selectedUser.domisili_kota || '-'}, ${selectedUser.domisili_provinsi || '-'}`} />
                    </div>

                    <DetailRow Icon={Calendar} label="Tanggal Daftar" value={new Date(selectedUser.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} />
                    <DetailRow 
                      Icon={CheckCircle} 
                      label="Kelengkapan Profil" 
                      value={checkProfileCompleteness(selectedUser) ? <span style={{ color: '#22c55e' }}>LENGKAP</span> : <span style={{ color: '#ef4444' }}>BELUM LENGKAP</span>} 
                    />
                 </div>

                 {selectedUser.phone_wa && (
                   <a 
                     href={`https://wa.me/${selectedUser.phone_wa.replace(/[^0-9]/g, '').replace(/^0/, '62')}`} 
                     target="_blank" 
                     rel="noopener noreferrer"
                     style={{ 
                       display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                       marginTop: '1.25rem', padding: '1rem', borderRadius: '16px', 
                       background: '#25D366', color: 'white', fontWeight: '800', 
                       textDecoration: 'none', textAlign: 'center', fontSize: '0.95rem',
                       boxShadow: '0 8px 20px rgba(37, 211, 102, 0.15)',
                       transition: 'all 0.2s'
                     }}
                   >
                     <Phone size={18} /> Hubungi via WhatsApp
                   </a>
                 )}

                 {selectedUser.tentang_saya && (
                   <div style={{ marginTop: '1.25rem', padding: '1.25rem', background: '#f8fafc', borderRadius: '20px', border: '1px solid #f1f5f9' }}>
                     <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Tentang Diri</div>
                     <div style={{ fontSize: '0.85rem', color: '#475569', lineHeight: '1.6', fontWeight: '600' }}>
                        "{selectedUser.tentang_saya}"
                     </div>
                   </div>
                 )}

                 <div style={{ padding: '1.5rem', marginTop: '1.25rem', background: '#f8fafc', borderRadius: '20px', border: '1px solid #f1f5f9' }}>
                   <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Status Verifikasi Admin</div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: selectedUser.is_verified ? '#134E39' : '#94a3b8', fontWeight: '800', fontSize: '0.95rem' }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: selectedUser.is_verified ? '#22c55e' : '#cbd5e1' }} />
                      {selectedUser.is_verified ? 'TERVERIFIKASI' : 'MENUNGGU TINJAUAN'}
                   </div>
                 </div>

                 <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button 
                      disabled={isVerifying || !checkProfileCompleteness(selectedUser)}
                      onClick={() => handleToggleVerification(selectedUser)}
                      style={{ 
                        flex: 1, padding: '1rem', borderRadius: '16px', 
                        background: selectedUser.is_verified ? '#fee2e2' : '#134E39', 
                        color: selectedUser.is_verified ? '#991b1b' : 'white', 
                        fontWeight: '800', border: 'none', cursor: (isVerifying || !checkProfileCompleteness(selectedUser)) ? 'not-allowed' : 'pointer',
                        opacity: !checkProfileCompleteness(selectedUser) ? 0.5 : 1,
                        transition: 'all 0.2s'
                      }}
                    >
                      {isVerifying ? <Loader className="spin" size={20} /> : (selectedUser.is_verified ? 'Batalkan Verifikasi' : 'Verifikasi Profil')}
                    </button>
                    
                    <button 
                       onClick={() => setSelectedUser(null)} 
                       style={{ flex: 1, padding: '1rem', borderRadius: '16px', background: '#f1f5f9', color: '#475569', fontWeight: '800', border: 'none', cursor: 'pointer' }}
                    >
                      Tutup
                    </button>
                 </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ─── STYLED SUB-COMPONENTS ──────────────────────────────────────────────────

function StatCard({ Icon, label, value, color, bg }) {
  return (
    <div style={{ 
      background: 'white', padding: '1.5rem', borderRadius: '24px', 
      border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '1.25rem',
      boxShadow: '0 4px 12px rgba(0,0,0,0.02)', transition: 'transform 0.3s'
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
      <div style={{ background: 'rgba(19, 78, 57, 0.05)', color: '#134E39', padding: '0.75rem', borderRadius: '14px' }}><Icon size={20} /></div>
      <div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '900', color: '#1e293b', margin: 0 }}>{title}</h3>
        <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '2px 0 0', fontWeight: '500' }}>{subtitle}</p>
      </div>
    </div>
  );
}

function DetailRow({ Icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <div style={{ background: '#f1f5f9', color: '#64748b', padding: '10px', borderRadius: '12px' }}><Icon size={18} /></div>
      <div>
        <div style={{ fontSize: '0.7rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '2px' }}>{label}</div>
        <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#1e293b' }}>{value}</div>
      </div>
    </div>
  );
}
