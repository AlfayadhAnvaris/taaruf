import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const INDONESIA_LOCATIONS = {
  "Aceh": ["Banda Aceh", "Langsa", "Lhokseumawe", "Meulaboh", "Sabang", "Subulussalam"],
  "Sumatera Utara": ["Binjai", "Gunungsitoli", "Medan", "Padang Sidempuan", "Pematangsiantar", "Sibolga", "Tanjungbalai", "Tebing Tinggi"],
  "Sumatera Barat": ["Bukittinggi", "Padang", "Padang Panjang", "Pariaman", "Payakumbuh", "Sawahlunto", "Solok"],
  "Riau": ["Dumai", "Pekanbaru"],
  "Kepulauan Riau": ["Batam", "Tanjungpinang"],
  "Jambi": ["Jambi", "Sungaipenuh"],
  "Bengkulu": ["Bengkulu"],
  "Sumatera Selatan": ["Lubuklinggau", "Pagar Alam", "Palembang", "Prabumulih"],
  "Kepulauan Bangka Belitung": ["Pangkalpinang"],
  "Lampung": ["Bandar Lampung", "Metro"],
  "Banten": ["Cilegon", "Serang", "Tangerang", "Tangerang Selatan"],
  "DKI Jakarta": ["Jakarta Barat", "Jakarta Pusat", "Jakarta Selatan", "Jakarta Timur", "Jakarta Utara"],
  "Jawa Barat": ["Bandung", "Banjar", "Bekasi", "Bogor", "Cimahi", "Cirebon", "Depok", "Sukabumi", "Tasikmalaya"],
  "Jawa Tengah": ["Magelang", "Pekalongan", "Salatiga", "Semarang", "Surakarta (Solo)", "Tegal"],
  "DI Yogyakarta": ["Yogyakarta"],
  "Jawa Timur": ["Batu", "Blitar", "Kediri", "Madiun", "Malang", "Mojokerto", "Pasuruan", "Probolinggo", "Surabaya"],
  "Bali": ["Denpasar"],
  "Nusa Tenggara Barat": ["Bima", "Mataram"],
  "Nusa Tenggara Timur": ["Kupang"],
  "Kalimantan Barat": ["Pontianak", "Singkawang"],
  "Kalimantan Tengah": ["Palangkaraya"],
  "Kalimantan Selatan": ["Banjarbaru", "Banjarmasin"],
  "Kalimantan Timur": ["Balikpapan", "Bontang", "Samarinda"],
  "Kalimantan Utara": ["Tarakan"],
  "Sulawesi Utara": ["Bitung", "Kotamobagu", "Manado", "Tomohon"],
  "Gorontalo": ["Gorontalo"],
  "Sulawesi Tengah": ["Palu"],
  "Sulawesi Barat": ["Mamuju"],
  "Sulawesi Selatan": ["Makassar", "Palopo", "Parepare"],
  "Sulawesi Tenggara": ["Bau-Bau", "Kendari"],
  "Maluku": ["Ambon", "Tual"],
  "Maluku Utara": ["Ternate", "Tidore Kepulauan"],
  "Papua": ["Jayapura"],
  "Papua Barat": ["Sorong"]
};

const MAJOR_SUKU = [
  "Jawa", "Sunda", "Batak", "Minangkabau", "Bugis", "Madura", "Betawi", "Melayu", 
  "Arab", "Tionghoa", "Aceh", "Bali", "Sasak", "Dayak", "Banjar", "Makassar", 
  "Minahasa", "Nias", "Mandar", "Cirebon", "Lampung", "Bangka", "Bima", "Papua"
];

const jobs = ['Software Engineer', 'Guru', 'Dokter', 'Wiraswasta', 'Karyawan Swasta', 'PNS', 'Arsitek', 'Desainer', 'Perawat', 'Dosen'];
const names_ikhwan = ['Ahmad', 'Faisal', 'Zulhilmi', 'Hendra', 'Ridwan', 'Taufiq', 'Lukman', 'Budi', 'Farhan', 'Irfan'];
const names_akhwat = ['Siti', 'Aisyah', 'Fatimah', 'Zahra', 'Indah', 'Lestari', 'Nurul', 'Putri', 'Rina', 'Dewi'];

async function seedVarietyUsers(count = 20) {
  console.log(`Starting to seed ${count} variety users...`);
  const provinces = Object.keys(INDONESIA_LOCATIONS);

  for (let i = 0; i < count; i++) {
    const isIkhwan = Math.random() > 0.5;
    const baseName = isIkhwan ? names_ikhwan[Math.floor(Math.random() * names_ikhwan.length)] : names_akhwat[Math.floor(Math.random() * names_akhwat.length)];
    const fullName = `${baseName} Test ${Date.now().toString().slice(-4)}`;
    const email = `variety_test_${i}_${Date.now()}@example.com`;
    const password = 'Password789!';
    
    // Pick Location
    const province = provinces[Math.floor(Math.random() * provinces.length)];
    const city = INDONESIA_LOCATIONS[province][Math.floor(Math.random() * INDONESIA_LOCATIONS[province].length)];
    const location = `${city} ${province}`;
    const suku = MAJOR_SUKU[Math.floor(Math.random() * MAJOR_SUKU.length)];

    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError) continue;

    const userId = authData.user?.id;
    if (!userId) continue;

    await supabase.from('profiles').upsert({ id: userId, name: fullName, email, role: 'user', profile_complete: true });

    await supabase.from('cv_profiles').insert({
      user_id: userId,
      alias: `Kandidat ${suku} ${i+1}`,
      gender: isIkhwan ? 'ikhwan' : 'akhwat',
      age: 20 + Math.floor(Math.random() * 20),
      location,
      education: 'S1',
      job: jobs[Math.floor(Math.random() * jobs.length)],
      worship: 'Rutin beribadah',
      about: `Saya bangga menjadi bagian dari suku ${suku} dan berdomisili di ${location}.`,
      criteria: 'Mencari pasangan yang sevisi.',
      suku,
      marital_status: 'Lajang',
      status: 'approved',
      tinggi_berat: '170cm / 60kg',
      kesehatan: 'Sehat'
    });

    console.log(`Successfully seeded: ${fullName} | ${suku} | ${location}`);
  }
}

seedVarietyUsers(20);
