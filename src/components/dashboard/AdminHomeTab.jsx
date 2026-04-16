import React, { useContext } from 'react';
import { AppContext } from '../../App';
import { Users, Activity, FileText, UserCheck, BarChart2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

export default function AdminHomeTab() {
  const { cvs, taarufRequests, usersDb } = useContext(AppContext);

  const pendingCvs = cvs.filter(cv => cv.status === 'pending');
  const totalApproved = cvs.filter(cv => cv.status === 'approved').length;
  
  const totalUsers = usersDb ? usersDb.filter(u => u.role === 'user').length : 0;
  const totalIkhwan = usersDb ? usersDb.filter(u => u.role === 'user' && u.gender === 'ikhwan').length : 0;
  const totalAkhwat = usersDb ? usersDb.filter(u => u.role === 'user' && u.gender === 'akhwat').length : 0;
  const incompleteProfiles = totalUsers - (totalIkhwan + totalAkhwat);

  const chartData = [
    { name: 'Ikhwan', value: totalIkhwan },
    { name: 'Akhwat', value: totalAkhwat },
    { name: 'Belum Lengkap', value: incompleteProfiles },
  ].filter(d => d.value > 0);

  const COLORS = ['#0ea5e9', '#ec4899', '#94a3b8'];

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      <div className="dashboard-grid" style={{ marginTop: 0, marginBottom: '2rem' }}>
        {/* Card 1: Pending CV */}
        <div className="stat-card" style={{ borderLeft: '4px solid #E63946' }}>
          <div className="stat-icon" style={{ background: 'rgba(230, 57, 70, 0.1)', color: '#E63946' }}><FileText /></div>
          <div className="stat-info">
            <h4>CV Perlu Validasi</h4>
            <p style={{ color: '#E63946' }}>{pendingCvs.length}</p>
          </div>
        </div>

        {/* Card 2: Active Candidates */}
        <div className="stat-card" style={{ borderLeft: '4px solid var(--success)' }}>
          <div className="stat-icon success"><UserCheck /></div>
          <div className="stat-info">
            <h4>Kandidat Disetujui</h4>
            <p>{totalApproved}</p>
          </div>
        </div>

        {/* Card 3: Taaruf Ongoing */}
        <div className="stat-card" style={{ borderLeft: '4px solid var(--secondary)' }}>
          <div className="stat-icon secondary"><Activity /></div>
          <div className="stat-info">
            <h4>Taaruf Berlangsung</h4>
            <p>{taarufRequests.length}</p>
          </div>
        </div>

        {/* Card 4: Total Registrants */}
        <div className="stat-card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div className="stat-icon primary"><Users /></div>
          <div className="stat-info">
            <h4>Total Pendaftar</h4>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '1.75rem', fontWeight: '800' }}>{totalUsers}</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Akun</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Statistics Chart */}
        <div className="card">
          <div className="card-header" style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><BarChart2 size={20} /> Distribusi Pendaftar</h3>
          </div>
          <div style={{ height: '300px', position: 'relative' }}>
             {totalUsers > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={chartData}
                     cx="50%"
                     cy="50%"
                     innerRadius={70}
                     outerRadius={100}
                     paddingAngle={8}
                     dataKey="value"
                     stroke="none"
                   >
                     {chartData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={4} />
                     ))}
                   </Pie>
                   <RechartsTooltip 
                     contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                   />
                   <Legend verticalAlign="bottom" height={36}/>
                 </PieChart>
               </ResponsiveContainer>
             ) : (
               <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                 Belum ada data pendaftar
               </div>
             )}
          </div>
        </div>

        {/* Summary Table */}
        <div className="card">
          <div className="card-header" style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Activity size={20} /> Ringkasan Detail</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { label: 'Total User Terdaftar', value: totalUsers, color: 'var(--text-main)' },
              { label: 'Jumlah Ikhwan', value: totalIkhwan, color: '#0ea5e9', sub: 'Sudah pilih gender' },
              { label: 'Jumlah Akhwat', value: totalAkhwat, color: '#ec4899', sub: 'Sudah pilih gender' },
              { label: 'Belum Lengkapi Profil', value: incompleteProfiles, color: '#94a3b8', sub: 'Belum pilih gender' },
              { label: 'Permintaan Taaruf', value: taarufRequests.length, color: 'var(--secondary)' },
            ].map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-color)', borderRadius: '12px' }}>
                <div>
                  <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{item.label}</div>
                  {item.sub && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.sub}</div>}
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: '800', color: item.color }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
