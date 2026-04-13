import React, { useContext, useState } from 'react';
import { AppContext } from '../App';
import { FileText, Search, UserCheck, Send, Filter, Clock, MessageCircle, Users, CheckCircle, XCircle, User, MapPin, Briefcase, GraduationCap, Heart } from 'lucide-react';

export default function UserDashboard({ activeTab, setActiveTab }) {
  const { user, cvs, setCvs, taarufRequests, setTaarufRequests, showAlert } = useContext(AppContext);

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

  const myExistingCv = cvs.find(cv => cv.email === user.email);
  const hasSubmittedCv = !!myExistingCv;

  // Filter state
  const [filters, setFilters] = useState({
    gender: 'Semua', // Semua, Ikhwan, Akhwat
    location: '',
    suku: '',
    hobi: '',
    poligami: 'Semua'
  });

  const [viewingCv, setViewingCv] = useState(null);

  const handleCvSubmit = (e) => {
    e.preventDefault();
    setCvs([...cvs, { ...myCv, email: user.email, id: Date.now(), status: 'pending', requestedBy: null }]);
  };

  const handleAjukanTaaruf = (targetCv) => {
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

    const newReq = {
      id: Date.now(),
      senderEmail: user.email,
      senderAlias: user.name, // Idealnya ambil dari data CV dia sendiri jika punya
      targetCvId: targetCv.id,
      targetAlias: targetCv.alias,
      status: 'pending_admin',
      updatedAt: new Date().toISOString()
    };
    
    setTaarufRequests([...taarufRequests, newReq]);
    showAlert('Pengajuan Berhasil', 'Alhamdulillah, pengajuan berhasil! Silakan pantau di tab Status Taaruf.', 'success');
    setActiveTab('status');
  };

  const applyFilters = (cvList) => {
    return cvList.filter(cv => {
      // Don't show non-approved CVs or your own
      if (cv.status !== 'approved' || cv.alias === user.name) return false;
      
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
      <div className="hero-section">
        <div className="hero-text">
          <h1 className="hero-title">Ahlan wa Sahlan, {user.name}!</h1>
          <p className="hero-subtitle">Mari menjemput jodoh dengan ikhtiar yang syar'i. Jaga niat, perbaiki diri, dan percayakan proses mediasi kepada ustadz kami.</p>
        </div>
      </div>

      {activeTab === 'my_cv' && (
        <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div className="card-header" style={{ marginBottom: '2rem' }}>
            <h3 className="card-title">Pembuatan CV Taaruf</h3>
          </div>
          {hasSubmittedCv ? (
            <div className="empty-state">
              {myExistingCv.status === 'approved' ? (
                <>
                  <CheckCircle size={64} color="var(--success)" style={{ display: 'block', margin: '0 auto 1rem' }} />
                  <h3>CV Telah Diverifikasi</h3>
                  <p style={{ color: 'var(--text-muted)' }}>Status CV Anda: <strong>Approved</strong>. Anda sudah bisa mengajukan taaruf ke kandidat lainnya.</p>
                </>
              ) : (
                <>
                  <FileText size={64} color="var(--primary)" style={{ display: 'block', margin: '0 auto 1rem' }} />
                  <h3>Alhamdulillah, CV Berhasil Dikirim</h3>
                  <p style={{ color: 'var(--text-muted)' }}>CV Anda sedang ditinjau oleh Ustadz/Admin. Jika disetujui, Anda dapat menjemput jodoh!</p>
                </>
              )}
            </div>
          ) : (
            <form onSubmit={handleCvSubmit}>
              {/* Stepper Header */}
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

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
                {cvStep > 1 ? (
                  <button type="button" className="btn btn-outline" onClick={() => setCvStep(cvStep - 1)}>Kembali</button>
                ) : <div></div>}
                
                {cvStep < totalSteps ? (
                  <button type="button" className="btn btn-primary" onClick={() => setCvStep(cvStep + 1)}>Selanjutnya</button>
                ) : (
                  <button type="submit" className="btn btn-success" style={{ padding: '0.8rem 1.75rem' }}>Kirim CV</button>
                )}
              </div>
            </form>
          )}
        </div>
      )}

      {activeTab === 'find' && (
        <div style={{ animation: 'fadeIn 0.5s ease' }}>
          {viewingCv ? (
            <div className="cv-detail-view" style={{ animation: 'fadeIn 0.3s ease' }}>
              <button 
                className="btn btn-outline" 
                onClick={() => setViewingCv(null)} 
                style={{ marginBottom: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '8px', border: 'none', paddingLeft: 0 }}
              >
                &larr; Kembali ke Daftar Pencarian
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

                <button className="btn btn-primary" style={{ width: '100%', fontSize: '1.1rem', padding: '1rem' }} onClick={() => handleAjukanTaaruf(viewingCv)}>
                  <Send size={20} style={{ marginRight: '0.5rem' }} /> Bismillah, Ajukan Taaruf
                </button>
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
                  <option value="Madura">Madura</option>
                  <option value="Betawi">Betawi</option>
                  <option value="Minang">Minang</option>
                  <option value="Bugis">Bugis</option>
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
          <h2 style={{ marginBottom: '1.5rem' }}>Status Pengajuan Taaruf Saya</h2>
          
          {taarufRequests.filter(req => req.senderEmail === user.email).length === 0 ? (
            <div className="card empty-state" style={{ maxWidth: '600px', margin: '0 auto' }}>
               <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(44, 95, 77, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                 <UserCheck size={40} color="var(--primary)" />
               </div>
               <h3>Belum Ada Pengajuan</h3>
               <p style={{ color: 'var(--text-muted)' }}>Anda belum mengajukan taaruf ke kandidat manapun.</p>
               <button className="btn btn-outline" style={{ marginTop: '1rem' }} onClick={() => setActiveTab('find')}>Cari Pasangan</button>
            </div>
          ) : (
            taarufRequests.filter(req => req.senderEmail === user.email).map(req => {
              
              // Helper to generate stepper state
              const getStepClass = (stepIndex, status) => {
                const stages = ['pending_admin', 'pending_target', 'qna', 'wali_process', 'meet', 'completed'];
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
                      <h3 className="card-title">Pengajuan ke {req.targetAlias}</h3>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Update terakhir: {new Date(req.updatedAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric'})}</p>
                    </div>
                    {req.status === 'rejected' && <span className="badge badge-warning">Ditolak</span>}
                  </div>

                  <div className="stepper-container">
                    <div className="stepper">
                      <div className={`step ${getStepClass(0, req.status)}`}>
                        <div className="step-icon">1</div>
                        <span className="step-label">Review<br/>Ustadz</span>
                      </div>
                      <div className={`step ${getStepClass(1, req.status)}`}>
                        <div className="step-icon">2</div>
                        <span className="step-label">Tunggu<br/>Calon</span>
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
                    {req.status === 'pending_admin' && <p>Ustadz/Admin sedang meninjau kelayakan pengajuan Anda. Mohon bersabar.</p>}
                    {req.status === 'pending_target' && <p>Pengajuan telah disetujui Admin. Saat ini sedang diteruskan ke pihak {req.targetAlias} untuk dipertimbangkan.</p>}
                    {req.status === 'qna' && <p>Alhamdulillah, {req.targetAlias} bersedia lanjut. Sesi tanya jawab melalui platform dibuka. Silakan masuk ke fitur Chat Tersistem.</p>}
                    {req.status === 'wali_process' && <p>Tanya jawab selesai. Ustadz akan menghubungi wali/pendamping dari {req.targetAlias}.</p>}
                    {req.status === 'rejected' && <p>Mohon maaf, proses taaruf ini tidak dapat dilanjutkan karena ketidakcocokan kriteria. Tetap semangat menjemput jodoh!</p>}

                    {req.status === 'qna' && (
                      <button className="btn btn-primary" style={{ marginTop: '1rem' }}><MessageCircle size={18} style={{ marginRight: '0.5rem' }}/> Masuk Sesi Q&A</button>
                    )}
                  </div>
                </div>
              );
            })
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
    </div>
  );
}
