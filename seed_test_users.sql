-- SEED DATA UNTUK TESTING DASHBOARD ADMIN
-- Script ini akan memasukkan data user dengan berbagai status untuk mencoba grafik baru

-- 1. Tambah User yang belum melengkapi profil (Inaktif / Incomplete)
-- User ini baru mendaftar, gender null, profile_complete false
INSERT INTO public.profiles (id, name, email, role, profile_complete, created_at)
VALUES 
  (gen_random_uuid(), 'Budi Test User', 'budi.incomplete@example.com', 'user', false, NOW() - INTERVAL '1 day'),
  (gen_random_uuid(), 'Siti Test User', 'siti.incomplete@example.com', 'user', false, NOW() - INTERVAL '2 days');

-- 2. Tambah User yang sudah melengkapi profil tapi belum isi gender (Edge Case)
-- Walaupun di UI wajib, database mungkin mengizinkan null jika tidak ada constraint.
-- Ini untuk mengetes kategori "Belum Diisi" di grafik.
INSERT INTO public.profiles (id, name, email, role, profile_complete, created_at, phone_wa, domisili_provinsi, domisili_kota)
VALUES 
  (gen_random_uuid(), 'Andi No Gender', 'andi.nogender@example.com', 'user', true, NOW() - INTERVAL '3 days', '08123456701', 'Jawa Barat', 'Bandung');

-- 3. Tambah User Aktif (Ikhwan)
INSERT INTO public.profiles (id, name, email, role, gender, profile_complete, created_at, phone_wa, domisili_provinsi, domisili_kota, pekerjaan, pendidikan_terakhir)
VALUES 
  (gen_random_uuid(), 'Ahmad Ikhwan Aktif', 'ahmad.ikhwan@example.com', 'user', 'ikhwan', true, NOW() - INTERVAL '5 days', '08123456702', 'DKI Jakarta', 'Jakarta Selatan', 'Software Engineer', 'Sarjana (S1)');

-- 4. Tambah User Aktif (Akhwat)
INSERT INTO public.profiles (id, name, email, role, gender, profile_complete, created_at, phone_wa, domisili_provinsi, domisili_kota, pekerjaan, pendidikan_terakhir)
VALUES 
  (gen_random_uuid(), 'Fatimah Akhwat Aktif', 'fatimah.akhwat@example.com', 'user', 'akhwat', true, NOW() - INTERVAL '6 days', '08123456703', 'Jawa Timur', 'Surabaya', 'Project Manager', 'Sarjana (S1)');
