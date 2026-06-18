"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Heart, ShieldCheck, UserCheck, MessageCircle, ArrowRight, CheckCircle, Users, Star, Quote, BookOpen, GraduationCap, Shield, LayoutDashboard, Bell, X, Trash2, ChevronDown, Settings, LogOut } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
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
      <nav className="landing-nav" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '80px', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(44,95,77,0.08)', zIndex: 1000, display: 'flex', alignItems: 'center' }}>
        <div style={{ maxWidth: '1280px', width: '100%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 clamp(1rem, 5vw, 2rem)' }}>
          <div className="navbar-brand" style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '800', fontSize: 'clamp(1.1rem, 3vw, 1.4rem)', color: 'var(--primary)', letterSpacing: '-0.02em' }}>
            <img src="/assets/logo.svg" alt="Separuh Agama Logo" style={{ width: 'clamp(36px, 6vw, 44px)', height: 'clamp(36px, 6vw, 44px)' }} />
            Separuh Agama
          </div>
          <Link href="/login" className="btn btn-primary" style={{ padding: '0.7rem 1.8rem', borderRadius: '10px', fontSize: '0.9rem', fontWeight: '700', textDecoration: 'none', boxShadow: '0 8px 20px rgba(44,95,77,0.2)' }}>Masuk / Daftar</Link>
        </div>
      </nav>

      <main style={{ paddingTop: '80px' }}>
        {/* HERO SECTION */}
        <section className="landing-section-full landing-split-hero reveal" style={{ padding: 'clamp(3rem, 10vw, 8rem) clamp(1rem, 5vw, 2.5rem)' }}>
          <div className="landing-hero-text">
            <div className="badge" style={{ background: 'rgba(44,95,77,0.08)', color: 'var(--primary)', padding: '0.5rem 1rem', borderRadius: '99px', fontSize: '0.8rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem' }}>
               <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)' }}></div> #1 Platform Taaruf Syar'i
            </div>
            <h1 className="landing-title" style={{ fontSize: 'clamp(2.5rem, 7vw, 4.5rem)', lineHeight: '1.05', fontWeight: '900', letterSpacing: '-0.04em' }}>Menjemput Jodoh<br /><span style={{ color: 'var(--secondary)' }}>Sesuai Sunnah</span></h1>
            <p className="landing-subtitle" style={{ fontSize: '1.1rem', maxWidth: '540px', lineHeight: '1.7', color: '#475569', margin: '1.5rem 0 2.5rem' }}>
              Platform mediasi taaruf online yang mengutamakan privasi, menjaga izzah dan iffah, serta didampingi penuh oleh Asatidzah berpengalaman.
            </p>
            <div className="landing-cta" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
              <Link href="/daftar" className="btn btn-primary" style={{ padding: '1rem 2rem', borderRadius: '10px', fontSize: '1.05rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
                Mulai Ikhtiar <ArrowRight size={20} />
              </Link>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.9rem', fontWeight: '600' }}>
                <ShieldCheck size={18} color="var(--success)" /> Privasi Terjamin
              </div>
            </div>
          </div>
          
          <div className="landing-hero-visual">
            <div className="glass-card mockup-card" style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid white', boxShadow: '0 30px 60px rgba(0,0,0,0.12)', borderRadius: '16px', padding: '1.5rem' }}>
              <div className="mockup-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.25rem' }}>
                <div style={{ width: 40, height: 40, borderRadius: '8px', background: 'rgba(44,95,77,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck color="var(--primary)" size={24} />
                </div>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '700' }}>Mediasi Sedang Berlangsung</h4>
              </div>
              <div className="mockup-body">
                <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: '1.6' }}><strong>Ustadz Pembimbing</strong> telah membuka ruang diskusi. Silakan sampaikan pertanyaan Anda kepada kandidat sesuai koridor syariat.</p>
                <div style={{ marginTop: '1.25rem', height: '1px', background: '#f1f5f9', width: '100%' }}></div>
                <button className="btn btn-primary" style={{ width: '100%', marginTop: '1.25rem', padding: '0.8rem', borderRadius: '8px' }} onClick={() => router.push('/login')}>Masuk Ruang Mediasi</button>
              </div>
            </div>
            <div className="glass-card stat-bubble stat-1" style={{ right: '-20px', top: '15%' }}>
              <ShieldCheck size={20} color="var(--primary)" />
              <div>
                <strong style={{ display: 'block' }}>Proses Syar'i</strong>
                <span style={{ fontSize: '0.7rem' }}>Dibimbing Asatidzah</span>
              </div>
            </div>
            <div className="geometric-bg"></div>
          </div>
        </section>

        {/* DALIL SECTION */}
        <section className="landing-section-full reveal" style={{ background: 'var(--primary)', color: 'white', textAlign: 'center', padding: '6rem 1.5rem' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <Quote size={40} color="var(--secondary)" style={{ margin: '0 auto 2rem', opacity: 0.6 }} />
            <p style={{ fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', lineHeight: '1.6', fontFamily: 'serif', marginBottom: '2.5rem', fontWeight: '700', direction: 'rtl' }}>
              وَمِنْ ءَايَٰتِهِۦٓ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَٰجًا لِّتَسْكُنُوٓا۟ إِلَيْهَا ...
            </p>
            <p style={{ fontSize: '1.15rem', lineHeight: '1.8', fontStyle: 'italic', opacity: '0.9', maxWidth: '700px', margin: '0 auto' }}>
              "Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu pasangan-pasangan dari jenismu sendiri, supaya kamu cenderung dan merasa tenteram kepadanya..." (QS. Ar-Rum: 21)
            </p>
          </div>
        </section>

        {/* WHY SECTION */}
        <section className="landing-section-full reveal" style={{ background: '#fff', padding: 'clamp(4rem, 10vw, 8rem) clamp(1rem, 5vw, 2.5rem)' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
              <span style={{ color: 'var(--secondary)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: '0.75rem' }}>Keunggulan Platform</span>
              <h2 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', fontWeight: '900', color: '#1A2E25', margin: '1rem 0' }}>Kenapa Ikhtiar di Separuh Agama?</h2>
              <p style={{ color: '#64748b', maxWidth: '600px', margin: '0 auto', fontSize: '1.1rem', lineHeight: '1.6' }}>Satu-satunya platform taaruf yang membekali Anda dengan ilmu, keamanan, dan pendampingan syar'i.</p>
            </div>

            <div className="landing-academy-grid auto-grid">
              <div style={{ padding: 'clamp(2rem, 5vw, 3.5rem) clamp(1.5rem, 5vw, 2.5rem)', borderRadius: '16px', background: 'linear-gradient(145deg, var(--primary), #1A2E25)', color: 'white', position: 'relative', overflow: 'hidden', boxShadow: '0 30px 60px rgba(44,95,77,0.25)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.15 }}><BookOpen size={160} /></div>
                <div style={{ flex: 1, position: 'relative', zIndex: 2 }}>
                  <div style={{ display: 'inline-block', padding: '0.4rem 1.2rem', background: 'var(--secondary)', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '900', color: '#1A2E25', marginBottom: '2rem' }}>PROGRAM AKADEMI</div>
                  <h3 style={{ fontSize: '2rem', marginBottom: '1.2rem', color: 'white', fontWeight: '800' }}>Separuh Agama Academy</h3>
                  <p style={{ opacity: 0.9, lineHeight: '1.8', marginBottom: '2.5rem', fontSize: '1.05rem' }}>Bekali diri Anda lewat kurikulum video eksklusif, kuis pemahaman, dan raih E-Sertifikat Kelulusan Resmi sebelum melangkah ke jenjang pernikahan.</p>
                </div>
                <button className="btn btn-secondary" style={{ width: '100%', padding: '1rem', borderRadius: '10px', fontWeight: '900', color: '#1A2E25' }} onClick={() => router.push('/login')}>Mulai Belajar Sekarang</button>
              </div>

              <div style={{ padding: 'clamp(2rem, 5vw, 3.5rem) clamp(1.5rem, 5vw, 2.5rem)', borderRadius: '16px', background: '#FDFBF7', border: '1px solid #F3EDE2', display: 'flex', flexDirection: 'column' }}>
                <div style={{ width: '70px', height: '70px', borderRadius: '12px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem', boxShadow: '0 15px 35px rgba(0,0,0,0.06)' }}>
                  <ShieldCheck size={36} color="var(--primary)" />
                </div>
                <h3 style={{ fontSize: '1.6rem', marginBottom: '1.2rem', color: '#1A2E25', fontWeight: '800' }}>Proteksi Izzah & Iffah</h3>
                <p style={{ color: '#64748b', lineHeight: '1.8', fontSize: '1.05rem' }}>Data diri dan foto wajah dirahasiakan sepenuhnya. Memastikan kehormatan Anda terjaga hingga kedua belah pihak sepakat.</p>
              </div>

              <div style={{ padding: 'clamp(2rem, 5vw, 3.5rem) clamp(1.5rem, 5vw, 2.5rem)', borderRadius: '16px', background: '#FDFBF7', border: '1px solid #F3EDE2', display: 'flex', flexDirection: 'column' }}>
                <div style={{ width: '70px', height: '70px', borderRadius: '12px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem', boxShadow: '0 15px 35px rgba(0,0,0,0.06)' }}>
                  <UserCheck size={36} color="var(--primary)" />
                </div>
                <h3 style={{ fontSize: '1.6rem', marginBottom: '1.2rem', color: '#1A2E25', fontWeight: '800' }}>Didampingi Asatidzah</h3>
                <p style={{ color: '#64748b', lineHeight: '1.8', fontSize: '1.05rem' }}>Proses mediasi, tanya-jawab visi misi, hingga pertemuan diawasi penuh oleh tim asatidzah berkompeten untuk menjaga niat dan keberkahan.</p>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="landing-section-full reveal" style={{ background: '#f8fafc', flexDirection: 'column', padding: '6rem 1.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.5rem)', marginBottom: '1rem', fontWeight: '800' }}>Alur Proses Taaruf</h2>
            <p className="section-desc" style={{ color: '#64748b', fontSize: '1.1rem' }}>Langkah demi langkah yang teratur, mencegah harapan palsu (*ghosting*) dan memperjelas arah.</p>
          </div>
          <div className="process-timeline">
            <div className="process-step">
              <div className="step-number">1</div>
              <h4>Daftar & Isi CV</h4>
              <p>Mengisi data secara komprehensif dan melewati screening aqidah dasar secara otomatis.</p>
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
        <section className="landing-section-full reveal" style={{ 
          background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)', 
          flexDirection: 'column',
          padding: 'clamp(4rem, 10vw, 8rem) 5%',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <style>{`
            @keyframes infiniteScroll {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            .testimonial-marquee-container {
              width: 100%;
              overflow: hidden;
              position: relative;
              padding: 2rem 0;
            }
            .testimonial-marquee-track {
              display: flex;
              gap: 2rem;
              width: max-content;
              animation: infiniteScroll 40s linear infinite;
            }
            .testi-card {
              flex: 0 0 auto;
              width: 320px;
              max-width: 85vw;
              min-height: 360px;
              background: white;
              border: 1px solid #f1f5f9;
              border-radius: 18px;
              padding: 2.5rem;
              display: flex;
              flex-direction: column;
              box-shadow: 0 15px 35px rgba(0,0,0,0.03);
              transition: all 0.4s ease;
              position: relative;
            }
            @media (min-width: 1025px) {
              .testimonial-marquee-container {
                max-width: 1200px;
                margin: 0 auto;
                overflow: visible;
              }
              .testimonial-marquee-track {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                width: 100%;
                animation: none;
                gap: 2rem;
              }
              .testi-card { width: 100%; flex: 1; }
              .marquee-duplicate { display: none !important; }
            }
            @media (max-width: 768px) {
              .testi-card { width: 280px; padding: 1.5rem !important; min-height: 320px; }
            }
          `}</style>

          <div style={{ textAlign: 'center', marginBottom: '4rem', position: 'relative', zIndex: 2 }}>
            <span style={{ color: 'var(--secondary)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.25em', fontSize: '0.7rem' }}>Visi & Ikhtiar</span>
            <h2 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', fontWeight: '900', color: '#1A2E25', margin: '1rem 0' }}>Membangun Keluarga Sakinah</h2>
            <p style={{ color: '#64748b', maxWidth: '600px', margin: '0 auto', fontSize: '1.1rem', lineHeight: '1.6' }}>Bergabunglah bersama komunitas yang mengutamakan adab dan ilmu dalam menjemput jodoh.</p>
          </div>

          <div className="testimonial-marquee-container" style={{ position: 'relative', zIndex: 2 }}>
            <div className="testimonial-marquee-track">
              {(testimonials.length > 0 ? testimonials : [
                { id: 'f1', name: 'Early Adopter', role: 'Kandidat Ikhwan', content: 'Sistem academy-nya sangat membantu untuk membekali diri sebelum melangkah lebih jauh. Sangat merekomendasikan!' },
                { id: 'f2', name: 'Member Beta', role: 'Kandidat Akhwat', content: 'Privasi benar-benar terjaga. Merasa lebih tenang karena ada asatidzah yang mendampingi setiap proses.' },
                { id: 'f3', name: 'Peserta Akademi', role: 'Pencari Ilmu', content: 'Kurikulumnya sangat lengkap. Menjawab banyak keraguan tentang bagaimana proses taaruf yang benar.' }
              ]).map((t, idx) => (
                <div key={`${t.id}-${idx}`} className="testi-card">
                  <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', opacity: 0.05 }}>
                    <Quote size={60} color="var(--primary)" fill="currentColor" />
                  </div>
                  <p style={{ fontSize: '1rem', color: '#475569', fontWeight: '500', lineHeight: '1.7', marginBottom: '2rem', flex: 1 }}>"{t.content}"</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900' }}>{t.name.charAt(0)}</div>
                    <div>
                      <strong style={{ display: 'block', color: '#1A2E25' }}>{t.name}</strong>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{t.role}</span>
                    </div>
                  </div>
                </div>
              ))}
              {/* Duplicate for marquee */}
              {(testimonials.length > 0 ? testimonials : [
                { id: 'f1', name: 'Early Adopter', role: 'Kandidat Ikhwan', content: 'Sistem academy-nya sangat membantu untuk membekali diri sebelum melangkah lebih jauh. Sangat merekomendasikan!' },
                { id: 'f2', name: 'Member Beta', role: 'Kandidat Akhwat', content: 'Privasi benar-benar terjaga. Merasa lebih tenang karena ada asatidzah yang mendampingi setiap proses.' },
                { id: 'f3', name: 'Peserta Akademi', role: 'Pencari Ilmu', content: 'Kurikulumnya sangat lengkap. Menjawab banyak keraguan tentang bagaimana proses taaruf yang benar.' }
              ]).map((t, idx) => (
                <div key={`${t.id}-dup-${idx}`} className="testi-card marquee-duplicate">
                  <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', opacity: 0.05 }}>
                    <Quote size={60} color="var(--primary)" fill="currentColor" />
                  </div>
                  <p style={{ fontSize: '1rem', color: '#475569', fontWeight: '500', lineHeight: '1.7', marginBottom: '2rem', flex: 1 }}>"{t.content}"</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900' }}>{t.name.charAt(0)}</div>
                    <div>
                      <strong style={{ display: 'block', color: '#1A2E25' }}>{t.name}</strong>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{t.role}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA BANNER */}
        <section className="landing-section-full reveal" style={{ background: '#fdfdfd', padding: '4rem 1.5rem' }}>
          <div className="landing-cta-banner" style={{ background: 'var(--primary)', color: 'white', padding: 'clamp(3rem, 8vw, 6rem) 2rem', textAlign: 'center', borderRadius: '24px', maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <h2 style={{ fontSize: 'clamp(1.8rem, 5vw, 2.8rem)', marginBottom: '1.2rem', color: 'white', fontWeight: '800' }}>Siap Menjemput Jodoh Anda?</h2>
            <p style={{ opacity: 0.9, marginBottom: '2.5rem', fontSize: '1.1rem', maxWidth: '600px' }}>Daftarkan diri secara gratis dan mulai perjalanan ibadah Anda sekarang dengan cara yang terjaga.</p>
            <button className="btn btn-secondary btn-large" style={{ padding: '1.2rem 3.5rem', borderRadius: '12px', fontSize: '1.1rem', fontWeight: '900', color: 'var(--primary)', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }} onClick={() => router.push('/daftar')}>Mulai Sekarang</button>
          </div>
        </section>
      </main>

      <footer className="landing-footer" style={{ padding: '6rem 1.5rem 3rem', color: 'var(--text-muted)', background: 'white', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '4rem', justifyContent: 'space-between' }}>
          <div style={{ flex: '1', minWidth: '280px' }}>
            <div className="navbar-brand" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '800', fontSize: '1.4rem', color: 'var(--primary)' }}>
              <img src="/assets/logo.svg" alt="Logo" style={{ width: '32px' }} /> Separuh Agama
            </div>
            <p style={{ maxWidth: '360px', fontSize: '0.95rem', lineHeight: '1.7' }}>Platform Taaruf Syar'i terpercaya yang mengedepankan adab dan bimbingan asatidzah untuk membantu Anda melengkapi separuh agama.</p>
          </div>
          <div style={{ display: 'flex', gap: '4rem', flexWrap: 'wrap' }}>
             <div>
                <h4 style={{ color: '#1A2E25', marginBottom: '1.5rem', fontWeight: '800' }}>Layanan</h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.9rem' }}>
                   <li><Link href="/login" style={{ color: 'inherit', textDecoration: 'none' }}>Taaruf Mediasi</Link></li>
                   <li><Link href="/login" style={{ color: 'inherit', textDecoration: 'none' }}>Academy</Link></li>
                   <li><Link href="/login" style={{ color: 'inherit', textDecoration: 'none' }}>Konsultasi</Link></li>
                </ul>
             </div>
             <div>
                <h4 style={{ color: '#1A2E25', marginBottom: '1.5rem', fontWeight: '800' }}>Tentang</h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.9rem' }}>
                   <li><Link href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Visi & Misi</Link></li>
                   <li><Link href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Syarat & Ketentuan</Link></li>
                   <li><Link href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Kebijakan Privasi</Link></li>
                </ul>
             </div>
          </div>
        </div>
        <div style={{ maxWidth: '1200px', margin: '4rem auto 0', paddingTop: '2rem', borderTop: '1px solid #f1f5f9', textAlign: 'center', fontSize: '0.85rem' }}>
           © {new Date().getFullYear()} Separuh Agama. Dikelola oleh Yayasan Keluarga Sakinah. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
