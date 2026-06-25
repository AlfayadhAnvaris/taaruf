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
          <Link href="/" className="navbar-brand" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '950', fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', color: 'var(--primary)', letterSpacing: '-0.03em' }}>
            <img src="/assets/logo.svg" alt="Separuh Agama Logo" style={{ width: 'clamp(36px, 6vw, 44px)', height: 'clamp(36px, 6vw, 44px)', transition: 'transform 0.3s ease' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05) rotate(5deg)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1) rotate(0deg)'} />
            Separuh <span style={{ color: 'var(--secondary)' }}>Agama</span>
          </Link>
          <Link 
            href="/login" 
            className="btn" 
            style={{ 
              background: '#134E39',
              color: 'white',
              padding: '0.75rem 2rem', 
              borderRadius: '12px', 
              fontSize: '0.9rem', 
              fontWeight: '800', 
              textDecoration: 'none', 
              boxShadow: '0 8px 20px rgba(19, 78, 57, 0.15)',
              transition: 'all 0.2s',
              cursor: 'pointer'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.background = '#1E6B52';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.background = '#134E39';
            }}
          >
            Masuk / Daftar
          </Link>
        </div>
      </nav>
 
      <main style={{ paddingTop: '80px' }}>
        {/* HERO SECTION */}
        <section className="landing-section-full landing-split-hero reveal" style={{ padding: 'clamp(3rem, 10vw, 8rem) clamp(1rem, 5vw, 2.5rem)', position: 'relative' }}>
          <div className="landing-hero-text">
            <div className="badge" style={{ background: 'rgba(19,78,57,0.06)', color: 'var(--primary)', padding: '0.6rem 1.2rem', borderRadius: '99px', fontSize: '0.8rem', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem', border: '1px solid rgba(19,78,57,0.1)' }}>
               <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--secondary)', boxShadow: '0 0 6px var(--secondary)' }}></div> #1 Platform Taaruf Syar'i
            </div>
            <h1 className="landing-title" style={{ fontSize: 'clamp(2.6rem, 7vw, 4.5rem)', lineHeight: '1.05', fontWeight: '950', letterSpacing: '-0.04em', color: '#134E39' }}>Menjemput Jodoh<br /><span style={{ color: 'var(--secondary)' }}>Sesuai Sunnah</span></h1>
            <p className="landing-subtitle" style={{ fontSize: '1.1rem', maxWidth: '540px', lineHeight: '1.7', color: '#64748b', margin: '1.5rem 0 2.5rem', fontWeight: '600' }}>
              Platform mediasi taaruf online yang mengutamakan privasi, menjaga izzah dan iffah, serta didampingi penuh oleh Asatidzah berpengalaman.
            </p>
            <div className="landing-cta" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
              <Link 
                href="/daftar" 
                className="btn" 
                style={{ 
                  background: 'linear-gradient(135deg, #134E39 0%, #1e6b52 100%)',
                  color: 'white',
                  padding: '1.1rem 2.2rem', 
                  borderRadius: '14px', 
                  fontSize: '1.05rem', 
                  fontWeight: '800', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px', 
                  textDecoration: 'none',
                  boxShadow: '0 10px 25px rgba(19, 78, 57, 0.2)',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  cursor: 'pointer'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 15px 30px rgba(19, 78, 57, 0.3)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 10px 25px rgba(19, 78, 57, 0.2)';
                }}
              >
                Mulai Ikhtiar <ArrowRight size={20} />
              </Link>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.9rem', fontWeight: '700' }}>
                <ShieldCheck size={18} color="#10B981" /> Privasi Terjamin
              </div>
            </div>
          </div>
          
          <div className="landing-hero-visual">
            <div className="glass-card mockup-card" style={{ 
              background: 'rgba(255, 255, 255, 0.75)', 
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.5)', 
              boxShadow: '0 30px 60px rgba(19, 78, 57, 0.08)', 
              borderRadius: '24px', 
              padding: '1.75rem',
              width: '360px',
              maxWidth: '90vw'
            }}>
              <div className="mockup-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px #10B981' }}></div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: '#134E39' }}>Ruang Mediasi #084</h4>
                </div>
                <span style={{ fontSize: '0.7rem', fontWeight: '800', background: 'rgba(19,78,57,0.08)', color: '#134E39', padding: '4px 10px', borderRadius: '6px' }}>AKTIF</span>
              </div>
              <div className="mockup-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Chat Bubble 1: Ustadz */}
                <div style={{ display: 'flex', gap: '8px', alignSelf: 'flex-start', maxWidth: '85%' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#134E39', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: '800', flexShrink: 0 }}>Ust</div>
                  <div style={{ background: '#F0F5F2', padding: '10px 14px', borderRadius: '4px 16px 16px 16px', fontSize: '0.8rem', color: '#1A2E25', lineHeight: '1.4' }}>
                    <strong>Ustadz Pembimbing:</strong> Bismillah, silakan Ikhwan mulai menyampaikan visi pernikahannya.
                  </div>
                </div>
                {/* Chat Bubble 2: Ikhwan */}
                <div style={{ display: 'flex', gap: '8px', alignSelf: 'flex-end', maxWidth: '85%', flexDirection: 'row-reverse' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#D4AF37', color: '#134E39', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: '800', flexShrink: 0 }}>Ikh</div>
                  <div style={{ background: '#FFFDF9', border: '1px solid #F3EDE2', padding: '10px 14px', borderRadius: '16px 4px 16px 16px', fontSize: '0.8rem', color: '#1A2E25', lineHeight: '1.4' }}>
                    <strong>Kandidat Ikhwan:</strong> Naam Ustadz, visi saya membangun rumah tangga berlandaskan tauhid dan sunnah...
                  </div>
                </div>
                <div style={{ marginTop: '1rem', height: '1px', background: 'rgba(0,0,0,0.04)', width: '100%' }}></div>
                <button 
                  className="btn" 
                  style={{ 
                    width: '100%', 
                    padding: '0.95rem', 
                    borderRadius: '14px', 
                    fontWeight: '900', 
                    fontSize: '0.85rem',
                    background: '#134E39',
                    color: 'white',
                    border: 'none',
                    boxShadow: '0 8px 20px rgba(19, 78, 57, 0.15)',
                    transition: 'all 0.2s',
                    cursor: 'pointer'
                  }} 
                  onClick={() => router.push('/login')}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  Masuk Ruang Mediasi
                </button>
              </div>
            </div>
            <div className="glass-card stat-bubble stat-1" style={{ right: '-35px', top: '15%', background: 'white', border: '1px solid rgba(19,78,57,0.06)' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#134E39' }}>
                <ShieldCheck size={20} />
              </div>
              <div>
                <strong style={{ display: 'block', fontSize: '0.9rem', fontWeight: '800', color: '#134E39' }}>Proses Syar'i</strong>
                <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: '600' }}>Dibimbing Asatidzah</span>
              </div>
            </div>
            <div className="glass-card stat-bubble stat-2" style={{ left: '-35px', bottom: '15%', background: 'white', border: '1px solid rgba(19,78,57,0.06)' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#fefbf0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4AF37' }}>
                <Users size={20} />
              </div>
              <div>
                <strong style={{ display: 'block', fontSize: '0.9rem', fontWeight: '800', color: '#134E39' }}>1.250+ Member</strong>
                <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: '600' }}>Telah Bergabung</span>
              </div>
            </div>
            <div className="geometric-bg"></div>
          </div>
        </section>
 
        {/* DALIL SECTION */}
        <section className="landing-section-full reveal" style={{ background: 'linear-gradient(135deg, #134E39 0%, #1A2E25 100%)', color: 'white', textAlign: 'center', padding: '6rem 1.5rem', borderTop: '2px solid rgba(212,175,55,0.15)', borderBottom: '2px solid rgba(212,175,55,0.15)' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <Quote size={40} color="var(--secondary)" style={{ margin: '0 auto 2rem', opacity: 0.8 }} />
            <p style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', lineHeight: '1.6', fontFamily: 'serif', marginBottom: '2.5rem', fontWeight: '700', direction: 'rtl', letterSpacing: '0.02em', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              وَمِنْ ءَايَٰتِهِۦٓ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَٰجًا لِّتَسْكُنُوٓا۟ إِلَيْهَا ...
            </p>
            <p style={{ fontSize: '1.2rem', lineHeight: '1.8', fontStyle: 'italic', opacity: '0.95', maxWidth: '700px', margin: '0 auto', color: '#F8FAF9', fontWeight: '500' }}>
              "Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu pasangan-pasangan dari jenismu sendiri, supaya kamu cenderung dan merasa tenteram kepadanya..." (QS. Ar-Rum: 21)
            </p>
          </div>
        </section>
 
        {/* WHY SECTION */}
        <section className="landing-section-full reveal" style={{ background: '#fff', padding: 'clamp(4rem, 10vw, 8rem) clamp(1rem, 5vw, 2.5rem)' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
              <span style={{ color: 'var(--secondary)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: '0.75rem' }}>Keunggulan Platform</span>
              <h2 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', fontWeight: '950', color: '#134E39', margin: '1rem 0' }}>Kenapa Ikhtiar di Separuh Agama?</h2>
              <p style={{ color: '#64748b', maxWidth: '600px', margin: '0 auto', fontSize: '1.1rem', lineHeight: '1.6', fontWeight: '600' }}>Satu-satunya platform taaruf yang membekali Anda dengan ilmu, keamanan, dan pendampingan syar'i.</p>
            </div>
 
            <div className="landing-academy-grid auto-grid">
              <div className="academy-highlight-card">
                <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.15 }}><BookOpen size={160} /></div>
                <div style={{ flex: 1, position: 'relative', zIndex: 2 }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '0.45rem 1.2rem', background: 'var(--secondary)', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '900', color: '#1A2E25', marginBottom: '2rem', letterSpacing: '0.05em' }}>
                    <GraduationCap size={15} />
                    <span>PROGRAM AKADEMI</span>
                  </div>
                  <h3 style={{ fontSize: '2.1rem', marginBottom: '1.2rem', color: 'white', fontWeight: '900', letterSpacing: '-0.02em' }}>Separuh Agama Academy</h3>
                  <p style={{ opacity: 0.9, lineHeight: '1.8', marginBottom: '2.5rem', fontSize: '1.05rem', fontWeight: '500' }}>Bekali diri Anda lewat kurikulum video eksklusif, kuis pemahaman, dan raih E-Sertifikat Kelulusan Resmi sebelum melangkah ke jenjang pernikahan.</p>
                </div>
                <button 
                  className="btn" 
                  style={{ 
                    width: '100%', 
                    padding: '1.1rem', 
                    borderRadius: '12px', 
                    fontWeight: '900', 
                    background: 'var(--secondary)',
                    color: '#134E39',
                    border: 'none',
                    boxShadow: '0 8px 25px rgba(212, 175, 55, 0.2)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }} 
                  onClick={() => router.push('/login')}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <span>Mulai Belajar Sekarang</span>
                  <ArrowRight size={18} />
                </button>
              </div>

              <div className="why-card">
                <div style={{ width: '70px', height: '70px', borderRadius: '12px', background: 'rgba(19,78,57,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem', boxShadow: '0 10px 25px rgba(19,78,57,0.03)', border: '1px solid rgba(19,78,57,0.08)' }}>
                  <ShieldCheck size={36} color="var(--primary)" />
                </div>
                <h3 style={{ fontSize: '1.6rem', marginBottom: '1.2rem', color: '#134E39', fontWeight: '900', letterSpacing: '-0.015em' }}>Proteksi Izzah & Iffah</h3>
                <p style={{ color: '#64748b', lineHeight: '1.8', fontSize: '1.05rem', fontWeight: '500' }}>Data diri dan foto wajah dirahasiakan sepenuhnya. Memastikan kehormatan Anda terjaga hingga kedua belah pihak sepakat.</p>
              </div>
 
              <div className="why-card">
                <div style={{ width: '70px', height: '70px', borderRadius: '12px', background: 'rgba(19,78,57,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem', boxShadow: '0 10px 25px rgba(19,78,57,0.03)', border: '1px solid rgba(19,78,57,0.08)' }}>
                  <UserCheck size={36} color="var(--primary)" />
                </div>
                <h3 style={{ fontSize: '1.6rem', marginBottom: '1.2rem', color: '#134E39', fontWeight: '900', letterSpacing: '-0.015em' }}>Didampingi Asatidzah</h3>
                <p style={{ color: '#64748b', lineHeight: '1.8', fontSize: '1.05rem', fontWeight: '500' }}>Proses mediasi, tanya-jawab visi misi, hingga pertemuan diawasi penuh oleh tim asatidzah berkompeten untuk menjaga niat dan keberkahan.</p>
              </div>
            </div>
          </div>
        </section>
 
        {/* HOW IT WORKS */}
        <section className="landing-section-full reveal" style={{ background: '#f8fafc', flexDirection: 'column', padding: '6rem 1.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.5rem)', marginBottom: '1rem', fontWeight: '950', color: '#134E39', letterSpacing: '-0.02em' }}>Alur Proses Taaruf</h2>
            <p className="section-desc" style={{ color: '#64748b', fontSize: '1.1rem', fontWeight: '600' }}>Langkah demi langkah yang teratur, mencegah harapan palsu (*ghosting*) dan memperjelas arah.</p>
          </div>
          <div className="process-timeline">
            <div className="process-step">
              <div className="step-number">1</div>
              <h4 style={{ fontWeight: '900', color: '#134E39' }}>Daftar & Isi CV</h4>
              <p style={{ fontWeight: '500' }}>Mengisi data secara komprehensif dan melewati screening aqidah dasar secara otomatis.</p>
            </div>
            <div className="process-step">
              <div className="step-number">2</div>
              <h4 style={{ fontWeight: '900', color: '#134E39' }}>Pencarian Match</h4>
              <p style={{ fontWeight: '500' }}>Ikhwan/Akhwat dapat saling melihat profil anonim. Mengajukan minat pada satu kandidat.</p>
            </div>
            <div className="process-step">
              <div className="step-number">3</div>
              <h4 style={{ fontWeight: '900', color: '#134E39' }}>Mediasi Q&A</h4>
              <p style={{ fontWeight: '500' }}>Menjawab form template visi-misi secara virtual. Admin ada di ruang chat yang sama.</p>
            </div>
            <div className="process-step">
              <div className="step-number">4</div>
              <h4 style={{ fontWeight: '900', color: '#134E39' }}>Libatkan Wali</h4>
              <p style={{ fontWeight: '500' }}>Jika serasi, nomor kontak wali perempuan diambil oleh ikhwan untuk menjadwalkan Nadzhor.</p>
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
          <div style={{ textAlign: 'center', marginBottom: '4rem', position: 'relative', zIndex: 2 }}>
            <span style={{ color: 'var(--secondary)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.25em', fontSize: '0.7rem' }}>Visi & Ikhtiar</span>
            <h2 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', fontWeight: '950', color: '#134E39', margin: '1rem 0' }}>Membangun Keluarga Sakinah</h2>
            <p style={{ color: '#64748b', maxWidth: '600px', margin: '0 auto', fontSize: '1.1rem', lineHeight: '1.6', fontWeight: '600' }}>Bergabunglah bersama komunitas yang mengutamakan adab dan ilmu dalam menjemput jodoh.</p>
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
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '1.25rem', color: '#D4AF37' }}>
                    <Star size={16} fill="#D4AF37" stroke="none" />
                    <Star size={16} fill="#D4AF37" stroke="none" />
                    <Star size={16} fill="#D4AF37" stroke="none" />
                    <Star size={16} fill="#D4AF37" stroke="none" />
                    <Star size={16} fill="#D4AF37" stroke="none" />
                  </div>
                  <p style={{ fontSize: '1rem', color: '#475569', fontWeight: '600', lineHeight: '1.7', marginBottom: '2rem', flex: 1 }}>"{t.content}"</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900' }}>{t.name.charAt(0)}</div>
                    <div>
                      <strong style={{ display: 'block', color: '#134E39', fontWeight: '800' }}>{t.name}</strong>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: '700' }}>{t.role}</span>
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
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '1.25rem', color: '#D4AF37' }}>
                    <Star size={16} fill="#D4AF37" stroke="none" />
                    <Star size={16} fill="#D4AF37" stroke="none" />
                    <Star size={16} fill="#D4AF37" stroke="none" />
                    <Star size={16} fill="#D4AF37" stroke="none" />
                    <Star size={16} fill="#D4AF37" stroke="none" />
                  </div>
                  <p style={{ fontSize: '1rem', color: '#475569', fontWeight: '600', lineHeight: '1.7', marginBottom: '2rem', flex: 1 }}>"{t.content}"</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900' }}>{t.name.charAt(0)}</div>
                    <div>
                      <strong style={{ display: 'block', color: '#134E39', fontWeight: '800' }}>{t.name}</strong>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: '700' }}>{t.role}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
 
        {/* CTA BANNER */}
        <section className="landing-section-full reveal" style={{ background: '#fdfdfd', padding: '4rem 1.5rem' }}>
          <div className="landing-cta-banner" style={{ background: 'linear-gradient(135deg, #134E39 0%, #1a5d46 100%)', color: 'white', padding: 'clamp(3rem, 8vw, 6rem) 2rem', textAlign: 'center', borderRadius: '24px', maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 30px 60px rgba(19, 78, 57, 0.25)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h2 style={{ fontSize: 'clamp(1.8rem, 5vw, 2.8rem)', marginBottom: '1.2rem', color: 'white', fontWeight: '900', letterSpacing: '-0.02em' }}>Siap Menjemput Jodoh Anda?</h2>
            <p style={{ opacity: 0.9, marginBottom: '2.5rem', fontSize: '1.1rem', maxWidth: '600px', fontWeight: '500' }}>Daftarkan diri secara gratis dan mulai perjalanan ibadah Anda sekarang dengan cara yang terjaga.</p>
            <button 
              className="btn" 
              style={{ 
                padding: '1.2rem 3.5rem', 
                borderRadius: '14px', 
                fontSize: '1.1rem', 
                fontWeight: '900', 
                background: 'linear-gradient(135deg, #D4AF37 0%, #E5C35E 100%)', 
                color: '#134E39', 
                boxShadow: '0 10px 30px rgba(212, 175, 55, 0.3)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
              }} 
              onClick={() => router.push('/daftar')}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 15px 35px rgba(212, 175, 55, 0.45)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(212, 175, 55, 0.3)';
              }}
            >
              Mulai Sekarang
            </button>
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
