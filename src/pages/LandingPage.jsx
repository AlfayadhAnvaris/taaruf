import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { useNavigate, Link } from 'react-router-dom';
import { Heart, ShieldCheck, UserCheck, MessageCircle, ArrowRight, CheckCircle, Users, Star, Quote, BookOpen, GraduationCap, Shield } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  const [testimonials, setTestimonials] = useState([]);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const { data } = await supabase
          .from('testimonials')
          .select('*')
          .eq('is_published', true)
          .order('created_at', { ascending: false });
        if (data && data.length > 0) setTestimonials(data);
      } catch (err) {
        console.error('Testimonial fetch error:', err);
      }
    };
    fetchTestimonials();

    const observerOptions = {
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, observerOptions);

    const elements = document.querySelectorAll('.reveal');
    elements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing-container">
      {/* NAVBAR */}
      <nav className="landing-nav" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '80px', padding: '0 5%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(44,95,77,0.08)', zIndex: 1000 }}>
        <div className="navbar-brand" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', fontSize: 'clamp(1rem, 3vw, 1.4rem)', color: 'var(--primary)' }}>
          <img src="/assets/logo.svg" alt="Separuh Agama Logo" style={{ width: '42px', height: '42px' }} />
          Separuh Agama
        </div>
        <Link to="/login" className="btn btn-primary" style={{ padding: '0.6rem 1.5rem', borderRadius: '12px', fontSize: '0.9rem', fontWeight: '600', textDecoration: 'none' }}>Masuk / Daftar</Link>
      </nav>

      <main>
        {/* HERO SECTION */}
        <section className="landing-section-full landing-split-hero reveal">
          <div className="landing-hero-text">
            <div className="badge" style={{ background: 'rgba(44,95,77,0.08)', color: 'var(--primary)', padding: '0.5rem 1rem', borderRadius: '99px', fontSize: '0.8rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem' }}>
               <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)' }}></div> #1 Platform Taaruf Syar'i
            </div>
            <h1 className="landing-title" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', lineHeight: '1.1', fontWeight: '700' }}>Menjemput Jodoh<br /><span style={{ color: 'var(--secondary)' }}>Sesuai Sunnah</span></h1>
            <p className="landing-subtitle" style={{ fontSize: '1.1rem', maxWidth: '540px', lineHeight: '1.7', color: '#475569', margin: '1.5rem 0 2.5rem' }}>
              Platform mediasi taaruf online yang mengutamakan privasi, menjaga izzah dan iffah, serta didampingi penuh oleh Asatidzah berpengalaman.
            </p>
            <div className="landing-cta" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
              <Link to="/daftar" className="btn btn-primary" style={{ padding: '1rem 2rem', borderRadius: '14px', fontSize: '1.05rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
                Mulai Ikhtiar <ArrowRight size={20} />
              </Link>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.9rem', fontWeight: '600' }}>
                <ShieldCheck size={18} color="var(--success)" /> Privasi Terjamin
              </div>
            </div>
          </div>
          
          <div className="landing-hero-visual">
            <div className="glass-card mockup-card" style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid white', boxShadow: '0 30px 60px rgba(0,0,0,0.12)', borderRadius: '24px', padding: '1.5rem' }}>
              <div className="mockup-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.25rem' }}>
                <div style={{ width: 40, height: 40, borderRadius: '12px', background: 'rgba(44,95,77,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck color="var(--primary)" size={24} />
                </div>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '700' }}>Mediasi Sedang Berlangsung</h4>
              </div>
              <div className="mockup-body">
                <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: '1.6' }}><strong>Ustadz Pembimbing</strong> telah membuka ruang diskusi. Silakan sampaikan pertanyaan Anda kepada kandidat sesuai koridor syariat.</p>
                <div style={{ marginTop: '1.25rem', height: '1px', background: '#f1f5f9', width: '100%' }}></div>
                <button className="btn btn-primary" style={{ width: '100%', marginTop: '1.25rem', padding: '0.8rem', borderRadius: '12px' }} onClick={() => navigate('/login')}>Masuk Ruang Mediasi</button>
              </div>
            </div>
            <div className="glass-card stat-bubble stat-1" style={{ right: '-20px', top: '15%' }}>
              <Users size={20} color="var(--primary)" />
              <div>
                <strong style={{ display: 'block' }}>1,200+</strong>
                <span style={{ fontSize: '0.7rem' }}>Ikhwan & Akhwat</span>
              </div>
            </div>
            <div className="geometric-bg"></div>
          </div>
        </section>

        {/* DALIL SECTION */}
        <section className="landing-section-full reveal" style={{ background: 'var(--primary)', color: 'white', textAlign: 'center' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <Quote size={40} color="var(--secondary)" style={{ margin: '0 auto 2rem', opacity: 0.6 }} />
            <p style={{ fontSize: '2rem', lineHeight: '1.6', fontFamily: 'serif', marginBottom: '2rem', fontWeight: '700', direction: 'rtl' }}>
              وَمِنْ ءَايَٰتِهِۦٓ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَٰجًا لِّتَسْكُنُوٓا۟ إِلَيْهَا ...
            </p>
            <p style={{ fontSize: '1.2rem', lineHeight: '1.8', fontStyle: 'italic', opacity: '0.9' }}>
              "Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu pasangan-pasangan dari jenismu sendiri, supaya kamu cenderung dan merasa tenteram kepadanya..." (QS. Ar-Rum: 21)
            </p>
          </div>
        </section>

        {/* WHY Separuh Agama & ACADEMY SECTION */}
        <section className="landing-section-full reveal" style={{ background: '#fff' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
              <span style={{ color: 'var(--secondary)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: '0.75rem' }}>Keunggulan Platform</span>
              <h2 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', fontWeight: '900', color: '#1A2E25', margin: '1rem 0' }}>Kenapa Ikhtiar di Separuh Agama?</h2>
              <p style={{ color: '#64748b', maxWidth: '600px', margin: '0 auto', fontSize: '1.1rem', lineHeight: '1.6' }}>Satu-satunya platform taaruf yang membekali Anda dengan ilmu, keamanan, dan pendampingan syar'i.</p>
            </div>

            <div className="landing-academy-grid auto-grid">
              {/* Card 1: Academy */}
              <div style={{ padding: '3.5rem 2.5rem', borderRadius: '40px', background: 'linear-gradient(145deg, var(--primary), #1A2E25)', color: 'white', position: 'relative', overflow: 'hidden', boxShadow: '0 30px 60px rgba(44,95,77,0.25)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.15 }}><BookOpen size={160} /></div>
                <div style={{ flex: 1, position: 'relative', zIndex: 2 }}>
                  <div style={{ display: 'inline-block', padding: '0.4rem 1.2rem', background: 'var(--secondary)', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '900', color: '#1A2E25', marginBottom: '2rem' }}>PROGRAM AKADEMI</div>
                  <h3 style={{ fontSize: '2rem', marginBottom: '1.2rem', color: 'white', fontWeight: '800' }}>Akademi Separuh Agama</h3>
                  <p style={{ opacity: 0.9, lineHeight: '1.8', marginBottom: '2.5rem', fontSize: '1.05rem' }}>Bekali diri Anda lewat kurikulum video eksklusif, kuis pemahaman, dan raih E-Sertifikat Kelulusan Resmi sebelum melangkah ke jenjang pernikahan.</p>
                </div>
                <button className="btn btn-secondary" style={{ width: '100%', padding: '1rem', borderRadius: '16px', fontWeight: '900', color: '#1A2E25' }} onClick={() => navigate('/login')}>Mulai Belajar Sekarang</button>
              </div>

              {/* Card 2: Security */}
                <div style={{ padding: 'clamp(1.5rem, 5vw, 3.5rem) clamp(1rem, 5vw, 2.5rem)', borderRadius: '40px', background: '#FDFBF7', border: '1px solid #F3EDE2', display: 'flex', flexDirection: 'column' }}>
                <div style={{ width: '70px', height: '70px', borderRadius: '24px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem', boxShadow: '0 15px 35px rgba(0,0,0,0.06)' }}>
                  <ShieldCheck size={36} color="var(--primary)" />
                </div>
                <h3 style={{ fontSize: '1.6rem', marginBottom: '1.2rem', color: '#1A2E25', fontWeight: '800' }}>Proteksi Izzah & Iffah</h3>
                <p style={{ color: '#64748b', lineHeight: '1.8', fontSize: '1.05rem' }}>Data diri dan foto wajah dirahasiakan sepenuhnya.  memastikan kehormatan Anda terjaga hingga kedua belah pihak sepakat.</p>
              </div>

              {/* Card 3: Guidance */}
                <div style={{ padding: 'clamp(1.5rem, 5vw, 3.5rem) clamp(1rem, 5vw, 2.5rem)', borderRadius: '40px', background: '#FDFBF7', border: '1px solid #F3EDE2', display: 'flex', flexDirection: 'column' }}>
                <div style={{ width: '70px', height: '70px', borderRadius: '24px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem', boxShadow: '0 15px 35px rgba(0,0,0,0.06)' }}>
                  <UserCheck size={36} color="var(--primary)" />
                </div>
                <h3 style={{ fontSize: '1.6rem', marginBottom: '1.2rem', color: '#1A2E25', fontWeight: '800' }}>Didampingi Asatidzah</h3>
                <p style={{ color: '#64748b', lineHeight: '1.8', fontSize: '1.05rem' }}>Proses mediasi, tanya-jawab visi misi, hingga pertemuan diawasi penuh oleh tim asatidzah berkompeten untuk menjaga niat dan keberkahan.</p>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="landing-section-full reveal" style={{ background: '#f8fafc', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1.5rem' }}>Alur Proses Taaruf</h2>
          <p className="section-desc" style={{ marginBottom: '4rem' }}>Langkah demi langkah yang teratur, mencegah harapan palsu (*ghosting*) dan memperjelas arah.</p>
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
              <p>Jika serasi, nomor kontak wali perempuan diambil oleh ikhwan untuk menjadwalkan Nadzhor.</p>
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="landing-section-full reveal" style={{ background: '#fff', flexDirection: 'column' }}>
          <h2>Kisah Berkah Separuh Agama</h2>
          <div className="testimonial-grid auto-grid">
            {testimonials.length > 0 ? (
              testimonials.map(t => (
                <div key={t.id} className="testi-card">
                  <div style={{ display: 'flex', gap: '2px', marginBottom: '1rem' }}>
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} fill={i < t.rating ? '#D4AF37' : 'none'} color={i < t.rating ? '#D4AF37' : '#e2e8f0'} />
                    ))}
                  </div>
                  <p className="testi-text">"{t.content}"</p>
                  <div className="testi-author">
                    <strong>{t.name}</strong>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.role}</span>
                  </div>
                </div>
              ))
            ) : (
              // Fallback default testimonials
              <>
                <div className="testi-card">
                  <Quote size={32} color="var(--primary-light)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
                  <p className="testi-text">"Sangat membantu! Apalagi ada mediasi chat yang diawasi ustadz dan ada akademi untuk belajar ilmu nikah sebelum lanjut."</p>
                  <div className="testi-author">
                    <strong>Hamba Allah</strong>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Ikhwan, Menikah 2025</span>
                  </div>
                </div>
                <div className="testi-card">
                  <Quote size={32} color="var(--primary-light)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
                  <p className="testi-text">"Sistem academy-nya juara. Izzah terjaga, ilmu juga nambah banyak sebelum masuk rumah tangga."</p>
                  <div className="testi-author">
                    <strong>Ukhti Fulanah</strong>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Akhwat, Menikah 2026</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        {/* CTA BANNER */}
        <section className="landing-section-full reveal" style={{ background: '#fdfdfd' }}>
          <div className="landing-cta-banner" style={{ background: 'var(--primary)', color: 'white', padding: '6rem 2rem', textAlign: 'center', borderRadius: '40px', margin: '0 5%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '90%' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1.2rem', color: 'white' }}>Siap Menjemput Jodoh Anda?</h2>
          <p style={{ opacity: 0.9, marginBottom: '2.5rem', fontSize: '1.1rem' }}>Daftarkan diri secara gratis dan mulai perjalanan ibadah Anda sekarang.</p>
          <button className="btn btn-secondary btn-large" onClick={() => navigate('/daftar')} style={{ color: '#1A2E25', fontWeight: '900', padding: '1.2rem 3rem', borderRadius: '16px', boxShadow: '0 15px 30px rgba(0,0,0,0.2)' }}>
            Mulai Sekarang
          </button>
          </div>
        </section>
      </main>

      <footer className="landing-footer landing-section-snap" style={{ padding: '4rem 2rem 2rem', color: 'var(--text-muted)', background: 'white', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'space-between' }}>
          <div>
            <div className="navbar-brand" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', fontSize: '1.2rem', color: 'var(--primary)' }}>
              <Heart size={24} color="var(--primary)" /> Separuh Agama
            </div>
            <p style={{ maxWidth: '300px', fontSize: '0.9rem', lineHeight: '1.6' }}>Platform Taaruf Syar'i terpercaya yang diawasi oleh asatidzah berkompeten.</p>
          </div>
          <div>
            <h4 style={{ color: 'var(--text-main)', marginBottom: '1rem' }}>Yayasan Keluarga Sakinah</h4>
            <p style={{ fontSize: '0.9rem' }}>Jakarta Selatan, Indonesia</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
