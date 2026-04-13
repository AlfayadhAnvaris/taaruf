import React, { createContext, useState } from 'react';
import AuthPage from './pages/AuthPage';
import LandingPage from './pages/LandingPage';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import { Heart, XCircle, CheckCircle, AlertCircle, Search, UserCheck, FileText, User as UserIcon, Activity } from 'lucide-react';

export const AppContext = createContext();

function App() {
  const [user, setUser] = useState(null); // { username: '', role: 'admin' | 'user', name: '' }
  const [showLanding, setShowLanding] = useState(true);
  const [activeTab, setActiveTab] = useState('find');
  const [modalState, setModalState] = useState({ isOpen: false, title: '', message: '', type: 'info' });

  const showAlert = (title, message, type = 'info') => {
    setModalState({ isOpen: true, title, message, type });
  };
  
  const closeModal = () => setModalState({ ...modalState, isOpen: false });
  
  // Mock Database for Users
  const [usersDb, setUsersDb] = useState([
    { email: 'admin@mail.com', password: '123', name: 'Ustadz Fulan', role: 'admin' },
    { email: 'ikhwan@mail.com', password: '123', name: 'Ahmad (Ikhwan)', role: 'user', gender: 'ikhwan' },
    { email: 'ikhwan2@mail.com', password: '123', name: 'Budi (Ikhwan)', role: 'user', gender: 'ikhwan' },
    { email: 'ikhwan3@mail.com', password: '123', name: 'Fahmi (Ikhwan)', role: 'user', gender: 'ikhwan' },
    { email: 'akhwat@mail.com', password: '123', name: 'Aisyah (Akhwat)', role: 'user', gender: 'akhwat' },
    { email: 'akhwat2@mail.com', password: '123', name: 'Fatima (Akhwat)', role: 'user', gender: 'akhwat' },
    { email: 'akhwat3@mail.com', password: '123', name: 'Khadijah (Akhwat)', role: 'user', gender: 'akhwat' },
    { email: 'akhwat4@mail.com', password: '123', name: 'Zahra (Akhwat)', role: 'user', gender: 'akhwat' },
  ]);

  // Mock Data for Taaruf Flow
  const [cvs, setCvs] = useState([
    { id: 1, alias: 'Akhwat A', age: 24, location: 'Jakarta', education: 'S1', job: 'Guru SD', salary: '3 - 5 Juta', marital_status: 'Lajang', worship: 'Shalat fardhu awal waktu, sedekah rutin', criteria: 'Soleh, tidak merokok', about: 'Mencari ridho Allah dalam berumah tangga', status: 'pending', requestedBy: null, gender: 'akhwat', suku: 'Jawa', hobi: 'Membaca', poligami: 'Tidak Bersedia' },
    { id: 2, alias: 'Ikhwan B', age: 27, location: 'Bandung', education: 'S2', job: 'Programmer', salary: '5 - 10 Juta', marital_status: 'Lajang', worship: 'Jamaah di masjid, tilawah mingguan', criteria: 'Penyabar, siap dibimbing', about: 'Membangun generasi rabbani', status: 'approved', requestedBy: null, gender: 'ikhwan', suku: 'Sunda', hobi: 'Olahraga', poligami: 'Bersedia' },
    { id: 3, alias: 'Akhwat C', age: 22, location: 'Surabaya', education: 'SMA', job: 'Mahasiswi', salary: '', marital_status: 'Lajang', worship: 'Shalat fardhu awal waktu', criteria: 'Iman baik, sabar', about: 'Taat pada suami dan agama', status: 'approved', requestedBy: null, gender: 'akhwat', suku: 'Madura', hobi: 'Memasak', poligami: 'Tidak Bersedia' },
    { id: 4, alias: 'Ikhwan D', age: 29, location: 'Jakarta', education: 'S1', job: 'Wirausaha', salary: '> 10 Juta', marital_status: 'Duda/Janda', worship: 'Jamaah di masjid, kajian pekanan', criteria: 'Bisa merawat anak', about: 'Saling mendukung dalam dakwah', status: 'approved', requestedBy: null, gender: 'ikhwan', suku: 'Betawi', hobi: 'Berdakwah', poligami: 'Mungkin' },
    { id: 5, alias: 'Akhwat E', age: 25, location: 'Bandung', education: 'D3', job: 'Perawat', salary: '3 - 5 Juta', marital_status: 'Lajang', worship: 'Tilawah 1 juz/hari', criteria: 'Soleh, mapan', about: 'Menjadi keluarga sakina', status: 'approved', requestedBy: null, gender: 'akhwat', suku: 'Sunda', hobi: 'Menulis', poligami: 'Semua' }
  ]);

  const [taarufRequests, setTaarufRequests] = useState([
    { 
      id: 1, 
      senderEmail: 'ikhwan@mail.com', 
      senderAlias: 'Ahmad (Ikhwan)', 
      targetCvId: 5, 
      targetAlias: 'Akhwat E', 
      status: 'pending_admin', 
      updatedAt: new Date().toISOString() 
    }
  ]);

  const [messages, setMessages] = useState([
    {
      taarufId: 1,
      chats: [
        { id: 1, sender: 'ikhwan@mail.com', senderAlias: 'Ahmad (Ikhwan)', text: 'Assalamualaikum wa rahmatullah, bagaimana visi misi pernikahan ukhti?', timestamp: new Date(Date.now() - 3600000).toISOString() },
        { id: 2, sender: 'akhwat@mail.com', senderAlias: 'Akhwat E', text: 'Waalaikumsalam wa rahmatullah. Saya mengutamakan visi untuk membangun generasi qurrata a\'yun yang dekat dengan agama, insya Allah.', timestamp: new Date(Date.now() - 1800000).toISOString() },
      ]
    }
  ]);

  const handleLogin = (email, password, role) => {
    const existingUser = usersDb.find(u => u.email === email && u.password === password && u.role === role);
    if (!existingUser) {
      showAlert('Gagal Masuk', 'Email/No HP, password, atau role tidak sesuai!', 'error');
      return;
    }
    setUser(existingUser);
    setActiveTab(existingUser.role === 'admin' ? 'review' : 'find');
  };

  const handleRegister = (email, password, name, role, waliPhone, gender) => {
    const existingUser = usersDb.find(u => u.email === email);
    if (existingUser) {
      showAlert('Gagal Mendaftar', 'Email/No HP sudah terdaftar!', 'error');
      return;
    }
    const newUser = { email, password, name, role, waliPhone, gender };
    setUsersDb([...usersDb, newUser]);
    setUser(newUser); // Auto login after register
    setActiveTab(newUser.role === 'admin' ? 'review' : 'find');
    showAlert('Berhasil', `Berhasil mendaftar sebagai ${role === 'admin' ? 'Admin/Ustadz' : 'Calon Taaruf'}!`, 'success');
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <AppContext.Provider value={{ user, cvs, setCvs, taarufRequests, setTaarufRequests, usersDb, messages, setMessages, showAlert }}>
      {modalState.isOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className={`modal-header ${modalState.type}`}>
               {modalState.type === 'error' && <XCircle size={48} />}
               {modalState.type === 'success' && <CheckCircle size={48} />}
               {modalState.type === 'info' && <AlertCircle size={48} />}
               <h3>{modalState.title}</h3>
            </div>
            <div className="modal-body">
              <p>{modalState.message}</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={closeModal}>Mengerti</button>
            </div>
          </div>
        </div>
      )}

      {!user ? (
        showLanding ? (
          <LandingPage onEnter={() => setShowLanding(false)} />
        ) : (
          <AuthPage onLogin={handleLogin} onRegister={handleRegister} showAlert={showAlert} />
        )
      ) : (
        <div className="app-container">
          <header className="navbar">
            <div className="navbar-brand">
              <Heart size={28} />
              Mawaddah Match
            </div>
            
            <div className="nav-links">
              {user.role === 'admin' ? (
                <>
                  <button className={`nav-link ${activeTab === 'review' ? 'active' : ''}`} onClick={() => setActiveTab('review')}><FileText size={18}/> Review CV</button>
                  <button className={`nav-link ${activeTab === 'mediate' ? 'active' : ''}`} onClick={() => setActiveTab('mediate')}><Activity size={18}/> Mediasi Taaruf</button>
                </>
              ) : (
                <>
                  <button className={`nav-link ${activeTab === 'find' ? 'active' : ''}`} onClick={() => setActiveTab('find')}><Search size={18}/> Cari Pasangan</button>
                  <button className={`nav-link ${activeTab === 'status' ? 'active' : ''}`} onClick={() => setActiveTab('status')}><UserCheck size={18}/> Status Taaruf</button>
                  <button className={`nav-link ${activeTab === 'my_cv' ? 'active' : ''}`} onClick={() => setActiveTab('my_cv')}><FileText size={18}/> CV Saya</button>
                  <button className={`nav-link ${activeTab === 'account' ? 'active' : ''}`} onClick={() => setActiveTab('account')}><UserIcon size={18}/> Profil</button>
                </>
              )}
            </div>

            <div className="navbar-user">
              <span><strong>{user.name}</strong></span>
              <button className="btn logout-btn" onClick={handleLogout}>Keluar</button>
            </div>
          </header>

          <main className="main-content">
            {user.role === 'admin' ? <AdminDashboard activeTab={activeTab} setActiveTab={setActiveTab} /> : <UserDashboard activeTab={activeTab} setActiveTab={setActiveTab} />}
          </main>
        </div>
      )}
    </AppContext.Provider>
  );
}

export default App;
