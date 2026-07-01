import React, { useState, useEffect } from 'react';
import { X, Compass, Plus, Trash2, Edit3, Check, RotateCcw, MessageSquare } from 'lucide-react';

const DEFAULT_QA_TEMPLATES = [
  {
    id: 'aqidah_ibadah',
    title: 'Aqidah & Ibadah',
    questions: [
      { id: 'aq1', text: "Bagaimana pemahaman Anda mengenai aqidah Ahlus Sunnah wal Jama'ah?" },
      { id: 'aq2', text: "Bagaimana rutinitas ibadah wajib dan sunnah Anda sehari-hari?" },
      { id: 'aq3', text: "Seberapa sering Anda menghadiri kajian keislaman dan siapa ustadz yang sering Anda simak?" }
    ]
  },
  {
    id: 'visi_misi',
    title: 'Visi & Misi Pernikahan',
    questions: [
      { id: 'vm1', text: "Apa visi dan misi utama yang ingin Anda capai dalam membangun rumah tangga?" },
      { id: 'vm2', text: "Bagaimana pandangan Anda mengenai hak dan kewajiban suami istri sesuai syariat?" },
      { id: 'vm3', text: "Bagaimana sikap Anda jika kelak terjadi perbedaan pendapat dalam keluarga?" }
    ]
  },
  {
    id: 'karakter_diri',
    title: 'Karakter & Kepribadian',
    questions: [
      { id: 'kk1', text: "Bagaimana cara Anda mengelola emosi atau kemarahan ketika sedang menghadapi masalah?" },
      { id: 'kk2', text: "Apa sifat terbaik dan sifat kurang baik yang Anda miliki yang perlu saya ketahui?" },
      { id: 'kk3', text: "Bagaimana Anda menyeimbangkan waktu antara pekerjaan, keluarga, dan ibadah?" }
    ]
  },
  {
    id: 'keuangan_karir',
    title: 'Keuangan & Karir',
    questions: [
      { id: 'kk_f1', text: "Bagaimana pandangan Anda mengenai pembagian nafkah dan pengelolaan keuangan rumah tangga?" },
      { id: 'kk_f2', text: "Apakah setelah menikah istri diperbolehkan bekerja atau fokus mendidik anak di rumah?" },
      { id: 'kk_f3', text: "Bagaimana pandangan Anda tentang kepemilikan aset dan menghindari riba?" }
    ]
  },
  {
    id: 'keluarga',
    title: 'Hubungan Keluarga',
    questions: [
      { id: 'kl1', text: "Bagaimana hubungan Anda dengan orang tua saat ini dan bagaimana peran mereka kelak setelah kita menikah?" },
      { id: 'kl2', text: "Bagaimana pandangan Anda mengenai tinggal bersama mertua atau mandiri setelah menikah?" }
    ]
  }
];

export default function QaTemplatesModal({ isOpen, onClose, onSelect }) {
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('aqidah_ibadah');
  const [newQuestionText, setNewQuestionText] = useState('');
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [editingText, setEditingText] = useState('');

  // Load from localStorage or defaults
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('taaruf_qa_templates');
      if (saved) {
        try {
          setCategories(JSON.parse(saved));
        } catch (e) {
          setCategories(DEFAULT_QA_TEMPLATES);
        }
      } else {
        setCategories(DEFAULT_QA_TEMPLATES);
      }
    }
  }, [isOpen]);

  const saveTemplates = (newCats) => {
    setCategories(newCats);
    localStorage.setItem('taaruf_qa_templates', JSON.stringify(newCats));
  };

  const handleReset = () => {
    if (confirm('Apakah Anda yakin ingin mengembalikan semua panduan pertanyaan ke setelan bawaan? Kustomisasi Anda akan hilang.')) {
      saveTemplates(DEFAULT_QA_TEMPLATES);
    }
  };

  const handleAddQuestion = (e) => {
    e.preventDefault();
    if (!newQuestionText.trim()) return;

    const updated = categories.map(cat => {
      if (cat.id === activeTab) {
        return {
          ...cat,
          questions: [
            ...cat.questions,
            { id: `q_custom_${Date.now()}`, text: newQuestionText.trim() }
          ]
        };
      }
      return cat;
    });

    saveTemplates(updated);
    setNewQuestionText('');
  };

  const handleDeleteQuestion = (qId) => {
    const updated = categories.map(cat => {
      if (cat.id === activeTab) {
        return {
          ...cat,
          questions: cat.questions.filter(q => q.id !== qId)
        };
      }
      return cat;
    });
    saveTemplates(updated);
  };

  const handleStartEdit = (q) => {
    setEditingQuestionId(q.id);
    setEditingText(q.text);
  };

  const handleSaveEdit = (qId) => {
    if (!editingText.trim()) return;
    const updated = categories.map(cat => {
      if (cat.id === activeTab) {
        return {
          ...cat,
          questions: cat.questions.map(q => q.id === qId ? { ...q, text: editingText.trim() } : q)
        };
      }
      return cat;
    });
    saveTemplates(updated);
    setEditingQuestionId(null);
  };

  if (!isOpen) return null;

  const currentCategory = categories.find(c => c.id === activeTab) || categories[0];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.6)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: '1rem',
      animation: 'fadeIn 0.25s ease'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '850px',
        height: '90vh',
        maxHeight: '680px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(19, 78, 57, 0.25)',
        border: '1px solid rgba(19, 78, 57, 0.08)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(19, 78, 57, 0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'rgba(19, 78, 57, 0.08)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: '#134E39'
            }}>
              <Compass size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '850', color: '#134E39', letterSpacing: '-0.01em' }}>
                Panduan Pertanyaan Q&A
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B', fontWeight: '500' }}>
                Gunakan, ubah, atau tambahkan pertanyaan Anda sendiri secara bebas.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handleReset}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: 'transparent', border: '1px solid #CBD5E1',
                padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem',
                fontWeight: '700', color: '#475569', cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#94A3B8'; e.currentTarget.style.background = '#F8FAFC'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.background = 'transparent'; }}
            >
              <RotateCcw size={13} />
              Reset Bawaan
            </button>
            <button
              onClick={onClose}
              style={{
                background: '#F1F5F9', border: 'none', width: '32px', height: '32px',
                borderRadius: '50%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: '#475569', cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#E2E8F0'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#F1F5F9'; }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content Container */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', flexDirection: window?.innerWidth < 640 ? 'column' : 'row' }}>
          {/* Sidebar / Tabs */}
          <div style={{
            width: window?.innerWidth < 640 ? '100%' : '240px',
            borderRight: window?.innerWidth < 640 ? 'none' : '1px solid #E2E8F0',
            borderBottom: window?.innerWidth < 640 ? '1px solid #E2E8F0' : 'none',
            background: '#F8FAFC',
            padding: '1rem',
            display: 'flex',
            flexDirection: window?.innerWidth < 640 ? 'row' : 'column',
            gap: '8px',
            overflowX: window?.innerWidth < 640 ? 'auto' : 'visible',
            whiteSpace: window?.innerWidth < 640 ? 'nowrap' : 'normal'
          }}>
            {categories.map(cat => {
              const isActive = cat.id === activeTab;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveTab(cat.id)}
                  style={{
                    display: 'block',
                    textAlign: 'left',
                    width: window?.innerWidth < 640 ? 'auto' : '100%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    fontSize: '0.85rem',
                    fontWeight: '800',
                    border: 'none',
                    cursor: 'pointer',
                    background: isActive ? '#134E39' : 'transparent',
                    color: isActive ? '#ffffff' : '#475569',
                    transition: 'all 0.2s ease',
                    boxShadow: isActive ? '0 4px 12px rgba(19, 78, 57, 0.15)' : 'none'
                  }}
                  onMouseEnter={e => { if(!isActive) e.currentTarget.style.background = '#E2E8F0'; }}
                  onMouseLeave={e => { if(!isActive) e.currentTarget.style.background = 'transparent'; }}
                >
                  {cat.title}
                </button>
              );
            })}
          </div>

          {/* List Area */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            background: '#ffffff'
          }}>
            {/* List */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {currentCategory?.questions?.length === 0 ? (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', height: '100%', color: '#94A3B8', gap: '8px'
                }}>
                  <MessageSquare size={32} />
                  <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Belum ada pertanyaan di kategori ini.</span>
                </div>
              ) : (
                currentCategory?.questions?.map((q, idx) => {
                  const isEditing = editingQuestionId === q.id;
                  return (
                    <div
                      key={q.id}
                      style={{
                        padding: '1rem',
                        borderRadius: '16px',
                        background: isEditing ? '#F8FAFC' : 'rgba(241, 245, 249, 0.5)',
                        border: isEditing ? '1px solid #134E39' : '1px solid #E2E8F0',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {isEditing ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <textarea
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            style={{
                              width: '100%',
                              minHeight: '60px',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              border: '1px solid #CBD5E1',
                              fontSize: '0.85rem',
                              fontFamily: 'inherit',
                              resize: 'vertical',
                              outline: 'none'
                            }}
                          />
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => setEditingQuestionId(null)}
                              style={{
                                padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem',
                                border: '1px solid #CBD5E1', background: 'white', color: '#64748B',
                                fontWeight: '700', cursor: 'pointer'
                              }}
                            >
                              Batal
                            </button>
                            <button
                              onClick={() => handleSaveEdit(q.id)}
                              style={{
                                padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem',
                                border: 'none', background: '#134E39', color: 'white',
                                fontWeight: '700', cursor: 'pointer'
                              }}
                            >
                              Simpan
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div style={{ fontSize: '0.88rem', fontWeight: '600', color: '#1E293B', lineHeight: '1.6' }}>
                            {idx + 1}. {q.text}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                onClick={() => handleStartEdit(q)}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: '4px',
                                  background: 'transparent', border: 'none', color: '#0284C7',
                                  fontSize: '0.75rem', fontWeight: '750', cursor: 'pointer', padding: 0
                                }}
                              >
                                <Edit3 size={12} />
                                Ubah
                              </button>
                              <span style={{ color: '#E2E8F0', fontSize: '0.75rem' }}>|</span>
                              <button
                                onClick={() => handleDeleteQuestion(q.id)}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: '4px',
                                  background: 'transparent', border: 'none', color: '#EF4444',
                                  fontSize: '0.75rem', fontWeight: '750', cursor: 'pointer', padding: 0
                                }}
                              >
                                <Trash2 size={12} />
                                Hapus
                              </button>
                            </div>
                            <button
                              onClick={() => onSelect(q.text)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                background: '#134E39', color: '#white', border: 'none',
                                padding: '6px 14px', borderRadius: '8px', fontSize: '0.75rem',
                                fontWeight: '800', cursor: 'pointer', color: 'white',
                                boxShadow: '0 2px 4px rgba(19, 78, 57, 0.1)',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={e => { e.currentTarget.style.background = '#0F3F2E'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = '#134E39'; }}
                            >
                              Gunakan
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Form */}
            <form
              onSubmit={handleAddQuestion}
              style={{
                padding: '1rem 1.5rem',
                borderTop: '1px solid #E2E8F0',
                display: 'flex',
                gap: '10px',
                background: 'rgba(248, 250, 252, 0.6)'
              }}
            >
              <input
                type="text"
                placeholder="Tulis pertanyaan kustom Anda di sini..."
                value={newQuestionText}
                onChange={(e) => setNewQuestionText(e.target.value)}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.85rem',
                  outline: 'none',
                  background: 'white'
                }}
              />
              <button
                type="submit"
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  background: '#134E39', color: 'white', border: 'none',
                  padding: '10px 16px', borderRadius: '12px', fontSize: '0.85rem',
                  fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#0F3F2E'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#134E39'; }}
              >
                <Plus size={16} />
                Tambah
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
