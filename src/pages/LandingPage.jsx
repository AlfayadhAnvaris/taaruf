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
      <nav className="landing-nav" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '80px', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(44,95,77,0.08)', zIndex: 1000, display: 'flex', alignItems: 'center', padding: 0 }}>
        <div style={{ maxWidth: '1280px', width: '100%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="navbar-brand" style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '800', fontSize: 'clamp(1.1rem, 3vw, 1.4rem)', color: 'var(--primary)', letterSpacing: '-0.02em' }}>
            <img src="/assets/logo.svg" alt="Separuh Agama Logo" style={{ width: '40px', height: '40px' }} />
            Separuh Agama
          </div>
          <Link to="/login" className="btn btn-primary" style={{ padding: '0.7rem 1.8rem', borderRadius: '14px', fontSize: '0.9rem', fontWeight: '700', textDecoration: 'none', boxShadow: '0 8px 20px rgba(44,95,77,0.2)' }}>Masuk / Daftar</Link>
        </div>
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
                  <h3 style={{ fontSize: '2rem', marginBottom: '1.2rem', color: 'white', fontWeight: '800' }}>Separuh Agama Academy</h3>
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

        {/* TESTIMONIALS SECTION */}
        <section className="landing-section-full reveal" style={{ 
          background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)', 
          flexDirection: 'column',
          padding: '8rem 5% 10rem',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Decorative background elements */}
          <div style={{ position: 'absolute', top: '10%', right: '-5%', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(44,95,77,0.03)', filter: 'blur(60px)' }}></div>
          <div style={{ position: 'absolute', bottom: '5%', left: '-5%', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(212,175,55,0.03)', filter: 'blur(80px)' }}></div>

          <div style={{ textAlign: 'center', marginBottom: '4rem', position: 'relative', zIndex: 2 }}>
            <span style={{ color: 'var(--secondary)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.25em', fontSize: '0.7rem' }}>Cerita Bahagia</span>
            <h2 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', fontWeight: '900', color: '#1A2E25', margin: '1rem 0', letterSpacing: '-0.02em' }}>
              Kisah Berkah <span style={{ color: 'var(--primary)', position: 'relative' }}>
                Separuh Agama
                <svg style={{ position: 'absolute', bottom: '-8px', left: 0, width: '100%', height: '8px' }} viewBox="0 0 100 10" preserveAspectRatio="none">
                  <path d="M0 5 Q 25 0, 50 5 T 100 5" fill="none" stroke="var(--secondary)" strokeWidth="4" strokeLinecap="round" opacity="0.3" />
                </svg>
              </span>
            </h2>
            <p style={{ color: '#64748b', maxWidth: '600px', margin: '0 auto', fontSize: '1.1rem', lineHeight: '1.6', fontWeight: '500' }}>
              Mereka yang telah menemukan ketenangan hati dan melengkapi separuh agama melalui ikhtiar yang terjaga.
            </p>
          </div>
          

          <div className="testimonial-grid auto-grid" style={{ position: 'relative', zIndex: 2, marginTop: '3rem' }}>
            {testimonials.length > 0 ? (
              testimonials.map((t, idx) => (
                  <div 
                    key={t.id} 
                    className="testi-card animate-up" 
                    style={{ 
                      animationDelay: `${idx * 0.1}s`,
                      background: 'rgba(255, 255, 255, 0.7)',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255, 255, 255, 0.8)',
                      borderRadius: '32px',
                      padding: '2.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.04)',
                      transition: 'all 0.4s ease',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', opacity: 0.05, transform: 'rotate(15deg)' }}>
                      <Quote size={80} color="var(--primary)" fill="currentColor" />
                    </div>

                    <div style={{ display: 'flex', gap: '3px', marginBottom: '1.5rem', position: 'relative', zIndex: 1 }}>
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={16} fill={i < (t.rating || 5) ? '#D4AF37' : 'none'} color={i < (t.rating || 5) ? '#D4AF37' : '#e2e8f0'} />
                      ))}
                    </div>

                    <p className="testi-text" style={{ 
                      fontSize: '1.1rem', 
                      color: '#334155', 
                      fontWeight: '500', 
                      lineHeight: '1.8',
                      marginBottom: '2rem',
                      position: 'relative',
                      zIndex: 1,
                      minHeight: '100px'
                    }}>
                      "{t.content}"
                    </p>

                    <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative', zIndex: 1 }}>
                      <div style={{ 
                        width: '52px', 
                        height: '52px', 
                        borderRadius: '16px', 
                        background: 'linear-gradient(135deg, var(--primary), #2C5F4D)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '900',
                        fontSize: '1.2rem',
                        boxShadow: '0 8px 16px rgba(44,95,77,0.2)'
                      }}>
                        {t.name.charAt(0)}
                      </div>
                      <div>
                        <strong style={{ display: 'block', color: '#1A2E25', fontSize: '1rem', fontWeight: '800' }}>{t.name}</strong>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {t.role || 'Alumni'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ 
                  gridColumn: '1/-1', 
                  textAlign: 'center', 
                  padding: '5rem 2rem', 
                  background: 'rgba(255,255,255,0.5)', 
                  backdropFilter: 'blur(10px)',
                  border: '2px dashed #e2e8f0', 
                  borderRadius: '40px' 
                }}>
                  <div style={{ width: 80, height: 80, background: '#f8fafc', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                    <Quote size={40} color="#cbd5e1" />
                  </div>
                  <h4 style={{ margin: '0 0 0.5rem', color: '#1e293b', fontWeight: '800' }}>Belum Ada Testimoni</h4>
                  <p style={{ color: '#94a3b8', fontWeight: '600', maxWidth: '300px', margin: '0 auto' }}>Kisah sukses baru akan segera hadir di sini.</p>
                </div>
            )}

            {/* Fallback Static Testimonials (If DB empty) */}
            {testimonials.length === 0 && (
              <>
                {[
                  { name: 'Hamba Allah', role: 'Ikhwan, Menikah 2025', content: 'Sangat membantu! Apalagi ada mediasi chat yang diawasi ustadz dan ada akademi untuk belajar ilmu nikah sebelum lanjut.' },
                  { name: 'Ukhti Fulanah', role: 'Akhwat, Menikah 2026', content: 'Sistem academy-nya juara. Izzah terjaga, ilmu juga nambah banyak sebelum masuk rumah tangga.' }
                ].map((st, i) => (
                  <div key={i} style={{ 
                    background: 'rgba(255, 255, 255, 0.7)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.8)',
                    borderRadius: '32px',
                    padding: '2.5rem',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.04)'
                  }}>
                    <Quote size={32} color="var(--primary)" style={{ marginBottom: '1.5rem', opacity: 0.1 }} fill="currentColor" />
                    <p style={{ fontSize: '1.1rem', color: '#334155', fontWeight: '500', lineHeight: '1.8', marginBottom: '2rem' }}>"{st.content}"</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900' }}>{st.name.charAt(0)}</div>
                      <div>
                        <strong style={{ display: 'block', color: '#1A2E25', fontWeight: '800' }}>{st.name}</strong>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700' }}>{st.role}</span>
                      </div>
                    </div>
                  </div>
                ))}
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

      <footer className="landing-footer" style={{ padding: '4rem 2rem 2rem', color: 'var(--text-muted)', background: 'white', borderTop: '1px solid var(--border)' }}>
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
