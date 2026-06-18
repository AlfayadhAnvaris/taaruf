const fs = require('fs');

const codeToInject = `
                    </button>
                  )))}
               </div>

              {activeViewTab === 'cv' ? (
                <div className="cv-grid-layout" style={{ alignItems: 'start', animation: 'fadeIn 0.35s ease' }}>
                 
                 {/* Card: Pendidikan & Karir */}
                 <div className="cv-card-premium">
                    <div className="cv-card-title">
                       <div className="cv-card-icon"><GraduationCap size={22} color="#134E39" /></div>
                       <h3>Pendidikan & Karir</h3>
                    </div>
                    <div className="cv-info-grid">
                       <div className="cv-info-field">
                         <label>Pendidikan Terakhir</label>
                         <span>{displayCv.education || '—'}</span>
                       </div>
                       <div className="cv-info-field">
                         <label>Profesi Saat Ini</label>
                         <span>{displayCv.job || '—'}</span>
                       </div>
                       <div className="cv-info-field">
                         <label>Estimasi Penghasilan</label>
                         <span>{displayCv.salary || '—'}</span>
                       </div>
                       <div className="cv-info-field">
                         <label>Suku Bangsa</label>
                         <span>{displayCv.suku || '—'}</span>
                       </div>
                    </div>
                 </div>

                 {/* Card: Fisik & Karakter */}
                 <div className="cv-card-premium">
                    <div className="cv-card-title">
                       <div className="cv-card-icon"><Target size={22} color="#134E39" /></div>
                       <h3>Fisik & Karakter</h3>
                    </div>
                    <div className="cv-info-grid">
                       <div className="cv-info-field">
                         <label>Tinggi / Berat Badan</label>
                         <span>{displayCv.tinggi_berat || '—'}</span>
                       </div>
                       <div className="cv-info-field">
                         <label>Kondisi Kesehatan</label>
                         <span>{displayCv.kesehatan || 'Normal'}</span>
                       </div>
                       <div className="cv-info-field">
                         <label>Ketaatan Ibadah</label>
                         <span>{displayCv.worship || '—'}</span>
                       </div>
                       <div className="cv-info-field">
                         <label>Pandangan Poligami</label>
                         <span>{displayCv.poligami || 'Tidak Bersedia'}</span>
                       </div>
                    </div>
                 </div>

                 {/* Card: Kriteria — full width */}
                 <div className="cv-card-premium" style={{ gridColumn: '1 / -1' }}>
                    <div className="cv-card-title">
                       <div className="cv-card-icon" style={{ background: 'rgba(212,175,55,0.08)' }}>
                         <Compass size={22} color="#D4AF37" />
                       </div>
                       <h3>Kriteria Pasangan Impian</h3>
                    </div>
                    <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '1.25rem 1.5rem', border: '1px solid #f1f5f9', position: 'relative' }}>
                      <p style={{ 
                        fontSize: '0.95rem', lineHeight: 1.8, color: '#475569', fontWeight: '500', margin: 0,
                        display: displayCv.criteria?.length > 200 ? '-webkit-box' : 'block',
                        WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                      }}>{displayCv.criteria || '—'}</p>
                    </div>
                    {displayCv.criteria?.length > 200 && (
                      <button 
                        onClick={() => setFullViewItem({ l: 'Kriteria Pasangan Impian', v: displayCv.criteria })}
                        style={{ marginTop: '1rem', background: 'none', border: '1.5px solid #e2e8f0', color: '#134E39', padding: '8px 16px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Eye size={13} /> LIHAT SELENGKAPNYA
                      </button>
                    )}
                 </div>
              </div>
            ) : activeViewTab === 'aqidah' ? (
              <div style={{ animation: 'fadeIn 0.4s ease' }}>
                <div className="cv-card-premium">
                    <div className="cv-card-title" style={{ marginBottom: '2rem' }}>
                        <div className="cv-card-icon" style={{ background: 'rgba(212,175,55,0.08)', width: '48px', height: '48px' }}>
                          <BookOpen size={24} color="#D4AF37" />
                        </div>
                        <div>
                          <h3 style={{ fontSize: '1.2rem', color: '#134E39' }}>Pemahaman Aqidah & Agama</h3>
                          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Prinsip Dasar Kandidat</p>
                        </div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                          {[
                          { l: '3 Landasan Utama', v: displayCv.screening_data?.aqidah1 || (isViewingOther ? null : user.aqidah1) },
                          { l: 'Makna Syahadat', v: displayCv.screening_data?.aqidah2 || (isViewingOther ? null : user.aqidah2) },
                          { l: 'Tujuan Penciptaan', v: displayCv.screening_data?.aqidah3 || (isViewingOther ? null : user.aqidah3) },
                          { l: 'Visi Pernikahan', v: displayCv.screening_data?.marriage_vision || (isViewingOther ? null : user.marriage_vision) },
                          { l: 'Tanggung Jawab Suami/Istri', v: displayCv.screening_data?.role_view || (isViewingOther ? null : user.role_view) },
                          { l: 'Pandangan Poligami', v: displayCv.screening_data?.polygamy_view || (isViewingOther ? null : user.polygamy_view) }
                        ].filter(q => q && q.v).map((q, idx) => (
                           <div key={idx} className="cv-q-box">
                               <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: '900', color: '#D4AF37', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.08em' }}>{q.l}</label>
                               <p style={{ 
                                 margin: 0, fontSize: '0.9rem', lineHeight: 1.65, color: '#1e293b', fontWeight: '500',
                                 display: q.v?.length > 150 ? '-webkit-box' : 'block',
                                 WebkitLineClamp: 5, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                               }}>{q.v}</p>
                               {q.v?.length > 150 && (
                                 <button 
                                   onClick={() => setFullViewItem({ l: q.l, v: q.v })}
                                   style={{ marginTop: '12px', background: 'none', border: '1px solid #e2e8f0', color: '#134E39', padding: '6px 12px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '800', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                                 >
                                   <Eye size={12} /> Selengkapnya
                                 </button>
                               )}
                           </div>
                        ))}
                    </div>
                </div>
              </div>
            ) : (
              <div style={{ animation: 'fadeInUp 0.4s ease' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'rgba(212,175,55,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.12)' }}>
                          <Star size={24} fill="#D4AF37" />
                        </div>
                        <div>
                          <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#134E39', margin: 0 }}>Review & Kesan</h3>
                          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.8rem', fontWeight: '600' }}>Pendapat jujur dari kandidat lainnya</p>
                        </div>
                    </div>
                    {isViewingOther && (
                      <button 
                        onClick={() => setShowReviewModal(true)}
                        style={{ 
                          background: '#134E39', color: 'white', border: 'none', 
                          padding: '0.75rem 1.25rem', borderRadius: '10px', 
                          fontWeight: '800', fontSize: '0.82rem', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: '8px',
                          boxShadow: '0 8px 20px rgba(19,78,57,0.15)',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                      >
                        <Plus size={16} /> BERIKAN KESAN
                      </button>
                    )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
                   {userReviews.filter(r => r.target_id === displayCv.user_id && r.is_active !== false).length === 0 ? (
                     <div style={{ textAlign: 'center', padding: '5rem 2rem', background: 'white', borderRadius: '20px', border: '2px dashed #f1f5f9', gridColumn: '1 / -1' }}>
                        <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
                           <Quote size={32} color="#cbd5e1" />
                        </div>
                        <h4 style={{ color: '#134E39', fontWeight: '900', fontSize: '1.1rem', margin: '0 0 0.4rem' }}>Belum Ada Kesan</h4>
                        <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem', fontWeight: '500' }}>Jadilah yang pertama memberikan kesan</p>
                     </div>
                   ) : (
                     userReviews.filter(r => r.target_id === displayCv.user_id && r.is_active !== false).map(review => (
                       <div key={review.id} style={{ background: 'white', padding: '1.75rem', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #134E39 0%, #1a5d46 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: '900', color: 'white' }}>
                                 {review.reviewer?.name?.charAt(0)}
                              </div>
                              <div>
                                 <span style={{ fontWeight: '800', color: '#134E39', fontSize: '0.95rem', display: 'block' }}>{review.reviewer?.name}</span>
                                 <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: '600' }}>{new Date(review.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                              </div>
                           </div>
                           <div style={{ display: 'flex', gap: '3px', background: 'rgba(212,175,55,0.05)', padding: '5px 10px', borderRadius: '6px', border: '1px solid rgba(212,175,55,0.1)' }}>
                             {[1, 2, 3, 4, 5].map(s => <Star key={s} size={14} color={s <= review.rating ? '#D4AF37' : '#e2e8f0'} fill={s <= review.rating ? '#D4AF37' : 'transparent'} />)}
                           </div>
                         </div>
                         <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: '#334155', lineHeight: 1.75, fontWeight: '500', fontStyle: 'italic' }}>"{review.comment}"</p>
                         </div>
                       </div>
                     ))
                   )}
                </div>
              </div>
            )}
           </div>
`;

const file = 'd:/taaruf/src/components/dashboard/MyCvTab.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/(\s*\{\s*tab\.badge\s*\}\s*<\/span>\s*\)\}\s*)<\/div>/, '$1</button>\n                  )))}\n               </div>' + codeToInject);
fs.writeFileSync(file, content);
console.log('Patched file successfully!');
