import React from 'react';
import { Heart, ShieldCheck, UserCheck, MessageCircle, ArrowRight, CheckCircle, Users, Star, Quote, BookOpen } from 'lucide-react';

export default function LandingPage({ onEnter }) {
  return (
    <div className="landing-container">
      <nav className="landing-nav sticky-nav">
        <div className="navbar-brand">
          <Heart size={28} />
          Mawaddah Match
        </div>
        <button className="btn btn-outline" onClick={onEnter}>Masuk / Daftar</button>
      </nav>

      <main>
        {/* HERO SECTION */}
        <div className="landing-split-hero">
          <div className="landing-hero-text">
            <div className="badge badge-success mb-4" style={{ display: 'inline-block', marginBottom: '1.5rem', padding: '0.5rem 1rem' }}>#1 Platform Taaruf Syar'i</div>
            <h1 className="landing-title">Menjemput Jodoh<br /><span style={{ color: 'var(--primary)' }}>Sesuai Sunnah</span></h1>
            <p className="landing-subtitle">
              Platform taaruf online yang mengutamakan privasi, menjaga izzah dan iffah, serta diawasi sepenuhnya oleh Ustadz dan Moderator berpengalaman.
            </p>
            <div className="landing-cta">
              <button className="btn btn-primary btn-large" onClick={onEnter}>
                Mulai Ikhtiar <ArrowRight size={20} />
              </button>
              <span className="info-text"><CheckCircle size={14} /> Gratis & Privasi Terjamin</span>
            </div>
          </div>
          
          <div className="landing-hero-visual">
            <div className="glass-card mockup-card">
              <div className="mockup-header">
                <ShieldCheck fill="white" color="var(--primary)" size={28} />
                <h4>Notifikasi Mediasi Sistem</h4>
              </div>
              <div className="mockup-body">
                <p><strong>Ustadz Fulan</strong> menyetujui proses Taaruf Anda dengan kandidat terpilih. Ruang Mediasi Sesi Q&A telah dibuka. Harap perhatikan batasan syariat.</p>
                <button className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '0.8rem' }} onClick={onEnter}>Masuk Ruang Mediasi</button>
              </div>
            </div>
            
            <div className="glass-card stat-bubble stat-1">
              <Users size={24} color="var(--primary)" />
              <div>
                <strong>1,200+</strong>
                <span>Pendaftar Aktif</span>
              </div>
            </div>
            <div className="glass-card stat-bubble stat-2">
              <Heart size={24} color="var(--danger)" />
              <div>
                <strong>300+</strong>
                <span>Pasangan Bertemu</span>
              </div>
            </div>
            
            <div className="geometric-bg"></div>
          </div>
        </div>

        {/* FEATURES SECTION */}
        <section className="landing-section bg-white">
          <h2>Kenapa Memilih Mawaddah Match?</h2>
          <p className="section-desc">Dibangun dengan teliti agar tidak menjadi *dating app* berkedok agama. Murni platform mediasi sesuai syariat Islam.</p>
          <div className="landing-features" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div className="feature-card">
              <ShieldCheck size={40} color="var(--secondary)" />
              <h3>Privasi Kunci Utama</h3>
              <p>Data diri dan foto wajah (CV) Anda dirahasiakan ke publik. Sistem blur foto diterapkan sampai disepakati tukar profil.</p>
            </div>
            <div className="feature-card">
              <UserCheck size={40} color="var(--primary)" />
              <h3>Pengawasan Super Ketat</h3>
              <p>Semua interaksi dipantau oleh admin/moderator khusus, menutup celah masuknya fitnah kholwat di ranah digital.</p>
            </div>
            <div className="feature-card">
              <MessageCircle size={40} color="var(--success)" />
              <h3>Q&A Terstruktur</h3>
              <p>Tidak ada *free chat*. Komunikasi dikunci dengan tanya-jawab template untuk mengukur kecocokan visi misi keluarga.</p>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="landing-section">
          <h2>Alur Proses Taaruf</h2>
          <p className="section-desc">Langkah demi langkah yang teratur, mencegah harapan palsu (*ghosting*) dan memperjelas arah.</p>
          <div className="process-timeline">
            <div className="process-step">
              <div className="step-number">1</div>
              <h4>Daftar & Isi CV</h4>
              <p>Mengisi data secara komprehensif dan menunggu persetujuan kelayakan dari Ustadz.</p>
            </div>
            <div className="process-step">
              <div className="step-number">2</div>
              <h4>Pencarian Match</h4>
              <p>Ikhwan/Akhwat dapat saling melihat profil anonim. Mengajukan minat pada satu kandidat.</p>
            </div>
            <div className="process-step">
              <div className="step-number">3</div>
              <h4>Mediasi Q&A</h4>
              <p>Menjawab form template visi-misi secara virtual. Admin ada di ruang chat yang sama.</p>
            </div>
            <div className="process-step">
              <div className="step-number">4</div>
              <h4>Libatkan Wali</h4>
              <p>Jika serasi, nomor kontak wali perempuan diambil oleh ikhwan untuk menjadwalkan Nadzhor/Pertemuan.</p>
            </div>
          </div>
        </section>

        {/* MENTOR SECTION */}
        <section className="landing-section bg-white">
          <h2>Ustadz & Pembimbing Mediasi</h2>
          <p className="section-desc">Proses mediasi taaruf Anda akan diedukasi dan diawasi langsung oleh Ustadz-ustadz bersanad dan berpengalaman.</p>
          <div className="mentor-grid" style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
            <div className="mentor-card">
              <div className="mentor-avatar bg-primary" style={{ backgroundColor: 'var(--primary-light)' }}></div>
              <h4>Ustadz Abdullah, Lc.</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Alumni Al-Azhar. Fokus Bimbingan Fiqih Keluarga.</p>
            </div>
            <div className="mentor-card">
              <div className="mentor-avatar bg-secondary" style={{ backgroundColor: '#D4AF37' }}></div>
              <h4>Ustadz Abdurrahman, M.A.</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Konsultan Pernikahan Syar'i dengan pengalaman luas.</p>
            </div>
            <div className="mentor-card">
              <div className="mentor-avatar bg-info" style={{ backgroundColor: 'var(--success)' }}></div>
              <h4>Ustadzah Aisyah</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Pembimbing khusus akhwat & persiapan kerumahtanggaan.</p>
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="landing-section">
          <h2>Kisah Berkah Mawaddah Match</h2>
          <p className="section-desc">Alhamdulillah, telah banyak yang menemukan pasangan seiman melalui wasilah platform ini sesuai koridor syariat.</p>
          <div className="testimonial-grid" style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
            <div className="testi-card">
              <Quote size={32} color="var(--primary-light)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <p className="testi-text">"Sangat membantu! Apalagi ada mediasi chat yang diawasi Ustadz sehingga interaksi terfokus pada pertanyaan visi dan misi pernikahan. InsyaAllah terhindar dari khalwat online."</p>
              <div className="testi-author">
                <div style={{ display: 'flex', gap: '2px', marginBottom: '4px' }}>
                  <Star fill="var(--secondary)" color="var(--secondary)" size={16} /><Star fill="var(--secondary)" color="var(--secondary)" size={16} /><Star fill="var(--secondary)" color="var(--secondary)" size={16} /><Star fill="var(--secondary)" color="var(--secondary)" size={16} /><Star fill="var(--secondary)" color="var(--secondary)" size={16} />
                </div>
                <strong>Hamba Allah (Ikhwan)</strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Menikah 2025</span>
              </div>
            </div>
            <div className="testi-card">
              <Quote size={32} color="var(--primary-light)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <p className="testi-text">"MasyaAllah, sistem blur fotonya sangat menjaga izzah dan iffah kami sebagai akhwat. Tidak perlu takut foto tersebar luas, hanya dibuka ketika sama-sama sepakat untuk lanjut."</p>
              <div className="testi-author">
                <div style={{ display: 'flex', gap: '2px', marginBottom: '4px' }}>
                  <Star fill="var(--secondary)" color="var(--secondary)" size={16} /><Star fill="var(--secondary)" color="var(--secondary)" size={16} /><Star fill="var(--secondary)" color="var(--secondary)" size={16} /><Star fill="var(--secondary)" color="var(--secondary)" size={16} /><Star fill="var(--secondary)" color="var(--secondary)" size={16} />
                </div>
                <strong>Ukhti Fulanah (Akhwat)</strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Menikah 2026</span>
              </div>
            </div>
            <div className="testi-card">
              <Quote size={32} color="var(--primary-light)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <p className="testi-text">"Platform yang sangat ditunggu umat. Saya wali dari pendaftar akhwat merasa tenang karena semua data anak saya diverifikasi dan dilindungi oleh Yayasan yang amanah."</p>
              <div className="testi-author">
                <div style={{ display: 'flex', gap: '2px', marginBottom: '4px' }}>
                  <Star fill="var(--secondary)" color="var(--secondary)" size={16} /><Star fill="var(--secondary)" color="var(--secondary)" size={16} /><Star fill="var(--secondary)" color="var(--secondary)" size={16} /><Star fill="var(--secondary)" color="var(--secondary)" size={16} /><Star fill="var(--secondary)" color="var(--secondary)" size={16} />
                </div>
                <strong>Bapak Abu (Wali)</strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mendampingi Nadzhor</span>
              </div>
            </div>
          </div>
        </section>

        {/* CTA BANNER */}
        <section className="landing-cta-banner">
          <h2>Siap Menjemput Jodoh Anda Sekarang?</h2>
          <p>Daftarkan diri Anda, niatkan ibadah, dan izinkan sistem ami menjadi *wasilah* kebaikan hidup Anda.</p>
          <button className="btn btn-secondary btn-large" onClick={onEnter} style={{ margin: '2rem auto 0', color: 'var(--text-main)' }}>
            Buat Akun Gratis Sekarang
          </button>
        </section>
      </main>

      <footer className="landing-footer" style={{ padding: '4rem 2rem 2rem', color: 'var(--text-muted)', background: 'white', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'space-between', marginBottom: '3rem', textAlign: 'left' }}>
          <div style={{ flex: '1', minWidth: '250px' }}>
            <div className="navbar-brand" style={{ marginBottom: '1rem' }}>
              <Heart size={24} /> Mawaddah Match
            </div>
            <p style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>Platform Taaruf Syar'i terpercaya di Indonesia yang menghubungkan ikhwan dan akhwat dengan penuh berkah dan keamanan, langsung diawasi oleh asatidzah.</p>
          </div>
          <div style={{ flex: '1', minWidth: '250px' }}>
            <h4 style={{ color: 'var(--text-main)', marginBottom: '1.2rem', fontSize: '1.1rem' }}>Informasi Yayasan</h4>
            <p style={{ fontSize: '0.95rem', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px' }}><BookOpen size={18} color="var(--primary)" /> <strong>Yayasan Keluarga Sakinah</strong></p>
            <p style={{ fontSize: '0.95rem', marginBottom: '0.8rem', lineHeight: '1.5' }}>Gedung Islamic Center, Lt. 2<br/>Jl. Sunnah Raya No. 1, Jakarta Selatan<br/>DKI Jakarta, Indonesia</p>
            <p style={{ fontSize: '0.85rem', color: '#9CA3AF' }}>SK Kemenkumham: AHU-12345.01.02.Tahun 2026</p>
          </div>
        </div>
        <div align="center" style={{ borderTop: '1px solid var(--border)', paddingTop: '2rem' }}>
          <p>&copy; 2026 Yayasan Keluarga Sakinah - Mawaddah Match. Seluruh hak cipta dilindungi.</p>
        </div>
      </footer>
    </div>
  );
}
