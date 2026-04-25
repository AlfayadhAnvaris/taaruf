import React, { useContext, useState } from 'react';
import { AppContext } from '../../App';
import { 
  BadgeCheck, XCircle, ShieldCheck, Clock, 
  Search, Filter, User, Phone, Check, X 
} from 'lucide-react';
import { supabase } from '../../supabase';

export default function AdminVerificationTab({ showAlert }) {
  const { usersDb, setUsersDb } = useContext(AppContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending'); // Default to pending
  const [processingId, setProcessingId] = useState(null);

  // Filter users based on verification status and search
  const filteredUsers = usersDb.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    // We only care about users who have submitted or already verified/rejected
    const isVerificationRelevant = u.verification_status && u.verification_status !== 'unverified';
    const matchesStatus = statusFilter === 'all' || u.verification_status === statusFilter;
    
    return matchesSearch && matchesStatus && u.role !== 'admin';
  });

  const handleVerify = async (userId, isApproved) => {
    setProcessingId(userId);
    try {
      const newStatus = isApproved ? 'verified' : 'unverified';
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_verified: isApproved, 
          verification_status: newStatus 
        })
        .eq('id', userId);

      if (error) throw error;

      // Update local state
      setUsersDb(usersDb.map(u => 
        u.id === userId ? { ...u, is_verified: isApproved, verification_status: newStatus } : u
      ));

      showAlert(
        isApproved ? 'Berhasil Diverifikasi' : 'Verifikasi Ditolak', 
        `Akun tersebut kini berstatus ${newStatus}.`, 
        isApproved ? 'success' : 'info'
      );
    } catch (err) {
      showAlert('Gagal Server', err.message, 'error');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      {/* Search & Filter */}
      <div className="card" style={{ marginBottom: '2rem', padding: '1.25rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '280px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder="Cari user (nama/email)..." 
              className="form-control" 
              style={{ paddingLeft: '2.5rem' }} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Filter size={18} color="#64748b" />
            <select 
              className="form-control" 
              style={{ width: '180px' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="pending">⏳ Perlu Verifikasi</option>
              <option value="verified">✅ Sudah Diverifikasi</option>
              <option value="all">Semua Data</option>
            </select>
          </div>
        </div>
      </div>

      {/* User Table / List */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(19,78,57,0.05)', borderBottom: '1px solid #f1f5f9' }}>
                <th style={{ padding: '1.25rem', fontSize: '0.8rem', color: '#64748b', fontWeight: '800' }}>PENGGUNA</th>
                <th style={{ padding: '1.25rem', fontSize: '0.8rem', color: '#64748b', fontWeight: '800' }}>KONTAK & DOMISILI</th>
                <th style={{ padding: '1.25rem', fontSize: '0.8rem', color: '#64748b', fontWeight: '800' }}>STATUS</th>
                <th style={{ padding: '1.25rem', fontSize: '0.8rem', color: '#64748b', fontWeight: '800', textAlign: 'right' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ padding: '4rem', textAlign: 'center' }}>
                    <ShieldCheck size={48} color="#f1f5f9" style={{ margin: '0 auto 1.5rem' }} />
                    <p style={{ color: '#94a3b8', margin: 0 }}>Tidak ada pengajuan verifikasi yang ditemukan.</p>
                  </td>
                </tr>
              ) : filteredUsers.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid #f8fafc', transition: 'all 0.2s' }}>
                  <td style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#134E39', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: '800', color: '#1e293b', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                           {u.name}
                           {u.is_verified && <BadgeCheck size={14} color="#10b881" fill="#10b881" className="bg-white rounded-full" />}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                       <div style={{ fontSize: '0.85rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                         <Phone size={12} /> {u.phone_wa || '-'}
                       </div>
                       <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{u.domisili_kota || '-'}, {u.domisili_provinsi || '-'}</div>
                    </div>
                  </td>
                  <td style={{ padding: '1.25rem' }}>
                    <span style={{ 
                      fontSize: '0.7rem', fontWeight: '900', padding: '6px 12px', borderRadius: '8px',
                      background: u.verification_status === 'verified' ? '#dcfce7' : (u.verification_status === 'pending' ? '#fef3c7' : '#f1f5f9'),
                      color: u.verification_status === 'verified' ? '#166534' : (u.verification_status === 'pending' ? '#92400e' : '#64748b')
                    }}>
                      {u.verification_status === 'verified' ? 'TERVERIFIKASI' : (u.verification_status === 'pending' ? 'PENDING' : 'DIBATALKAN')}
                    </span>
                  </td>
                  <td style={{ padding: '1.25rem', textAlign: 'right' }}>
                    {u.verification_status === 'pending' ? (
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => handleVerify(u.id, false)} 
                          disabled={processingId === u.id}
                          style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', width: '36px', height: '36px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          title="Reject"
                        >
                          <X size={18} />
                        </button>
                        <button 
                          onClick={() => handleVerify(u.id, true)} 
                          disabled={processingId === u.id}
                          style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', width: '36px', height: '36px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          title="Approve"
                        >
                          <Check size={18} />
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleVerify(u.id, !u.is_verified)} 
                        style={{ background: 'none', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.7rem', fontWeight: '800', padding: '6px 14px', borderRadius: '10px', cursor: 'pointer' }}
                      >
                        RE-EVALUATE
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
