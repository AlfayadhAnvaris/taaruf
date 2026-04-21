import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY; // Using anon key for client-side like simulation, but service role is better if available

if (!supabaseUrl || !supabaseKey) {
  console.error('Environment variables VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const cities = ['Jakarta', 'Bandung', 'Surabaya', 'Medan', 'Makassar', 'Yogyakarta', 'Semarang', 'Palembang', 'Malang', 'Denpasar'];
const suffixes = ['Pusat', 'Selatan', 'Utara', 'Barut', 'Timur'];
const names_ikhwan = ['Ahmad', 'Faisal', 'Zulhilmi', 'Hendra', 'Ridwan', 'Taufiq', 'Lukman', 'Budi', 'Farhan', 'Irfan'];
const names_akhwat = ['Siti', 'Aisyah', 'Fatimah', 'Zahra', 'Indah', 'Lestari', 'Nurul', 'Putri', 'Rina', 'Dewi'];
const jobs = ['Software Engineer', 'Guru', 'Dokter', 'Wiraswasta', 'Karyawan Swasta', 'PNS', 'Arsitek', 'Desainer', 'Perawat', 'Mahasiswa'];
const educations = ['S1', 'S2', 'D3', 'SMA/SMK'];
const sukus = ['Jawa', 'Sunda', 'Minang', 'Batak', 'Bugis', 'Melayu', 'Betawi'];

async function seedUsers(count = 20, forcedCity = null) {
  console.log(`Starting to seed ${count} users...`);

  for (let i = 0; i < count; i++) {
    const isIkhwan = Math.random() > 0.5;
    const baseName = isIkhwan 
      ? names_ikhwan[Math.floor(Math.random() * names_ikhwan.length)] 
      : names_akhwat[Math.floor(Math.random() * names_akhwat.length)];
    const fullName = `${baseName} ${String.fromCharCode(65 + i)} ${Math.floor(Math.random() * 100)}`;
    const email = `test_user_solo_${i}_${Date.now()}@example.com`;
    const password = 'Password789!';
    const city = forcedCity || cities[Math.floor(Math.random() * cities.length)];
    const area = suffixes[Math.floor(Math.random() * suffixes.length)];
    const location = `${city} ${area}`;

    console.log(`Creating user: ${fullName} (${email})...`);

    // 1. Sign Up
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name: fullName }
      }
    });

    if (authError) {
      console.error(`Error creating auth user ${email}:`, authError.message);
      continue;
    }

    const userId = authData.user?.id;
    if (!userId) continue;

    // 2. Create Profile
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: userId,
      name: fullName,
      email: email,
      role: 'user',
      profile_complete: true
    });

    if (profileError) {
      console.error(`Error creating profile for ${userId}:`, profileError.message);
      continue;
    }

    // 3. Create CV
    const age = 22 + Math.floor(Math.random() * 10);
    const { error: cvError } = await supabase.from('cv_profiles').insert({
      user_id: userId,
      alias: `Wong Solo ${i + 1}`,
      gender: isIkhwan ? 'ikhwan' : 'akhwat',
      age: age,
      location: location,
      education: educations[Math.floor(Math.random() * educations.length)],
      job: jobs[Math.floor(Math.random() * jobs.length)],
      worship: 'Alhamdulillah rutin shalat 5 waktu dan aktif di komunitas muslim lokal.',
      about: `Asli Solo, ingin membangun keluarga sakinah di kota tercinta ${location}.`,
      criteria: 'Mencari pasangan yang shalih/shalihah, mengerti adab, dan mau menetap di Solo atau sekitarnya.',
      suku: 'Jawa',
      hobi: 'Membaca, kulineran Solo, dan ikut kajian.',
      poligami: 'Tidak Bersedia',
      salary: `${5 + Math.floor(Math.random() * 5)} Juta`,
      address: `Jl. Slamet Riyadi No. ${i + 10}, ${location}`,
      marital_status: 'Lajang',
      tinggi_berat: `${160 + Math.floor(Math.random() * 20)}cm / ${50 + Math.floor(Math.random() * 20)}kg`,
      kesehatan: 'Sehat walafiat.',
      kajian: 'Sering hadir di kajian Ustadz-ustadz di Surakarta.',
      karakter: 'Lembut, penyabar, dan tawadhu.',
      status: 'approved'
    });

    if (cvError) {
      console.error(`Error creating CV for ${userId}:`, cvError.message);
    } else {
      console.log(`Successfully seeded user: ${fullName} (City: ${city})`);
    }
  }

  console.log('Seeding completed!');
}

seedUsers(4, 'Solo');
