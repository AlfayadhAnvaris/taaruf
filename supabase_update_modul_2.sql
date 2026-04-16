-- ================================================================
-- UPDATE MODUL 2: Allah's Best Choice
-- Serta penambahan kolom 'content' untuk ringkasan teks
-- ================================================================

-- 1. Tambah kolom content jika belum ada
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS content TEXT;

-- 2. Update Modul 2: Video & Content
UPDATE public.lessons 
SET 
  title = 'Pilihan Terbaik Allah (Allah''s Best Choice)',
  video_url = 'https://www.youtube.com/embed/ga5-GxicWCs',
  content = 'Kajian ini menekankan bahwa setiap ketetapan Allah Ta''ala bagi hamba-Nya senantiasa mengandung hikmah dan merupakan pilihan terbaik, meskipun terkadang tidak sesuai dengan keinginan pribadi. Keterbatasan ilmu manusia dan pengaruh hawa nafsu seringkali membuat kita merasa lebih tahu apa yang baik bagi diri sendiri. Seorang muslim dituntut untuk senantiasa berbaik sangka (husnudzan) kepada Allah, rajin berdoa meminta petunjuk, serta melatih diri untuk menundukkan hawa nafsu agar dapat menerima takdir dengan hati yang lapang.'
WHERE id = 'v2-1';

-- 3. Update Kuis Modul 2
DELETE FROM public.quiz_questions WHERE lesson_id = 'q2-1';

INSERT INTO public.quiz_questions (lesson_id, question_text, options, correct_index, order_index) VALUES
('q2-1', 'Apa keyakinan mendasar seorang mukmin terkait takdir yang ditetapkan Allah?', '["Takdir hanya berlaku untuk hal-hal besar", "Pilihan Allah selalu mengandung keburukan", "Pilihan Allah senantiasa merupakan yang terbaik", "Manusia bisa menentukan takdirnya sendiri sepenuhnya"]', 2, 1),
('q2-1', 'Faktor utama apakah yang sering membuat manusia merasa pilihannya lebih baik daripada pilihan Allah?', '["Pengalaman hidup yang luas", "Pengaruh hawa nafsu dan kesenangan duniawi", "Nasihat dari teman-teman dekat", "Membaca banyak buku pengetahuan"]', 1, 2),
('q2-1', 'Bagaimana cara yang benar bagi seorang muslim dalam merespons keinginan yang belum terwujud?', '["Berputus asa dari rahmat Allah", "Berprasangka buruk (su''udzan) kepada Allah", "Tetap berdoa dan meyakini ada hikmah terbaik di balik pilihan Allah", "Berhenti menjalankan ibadah sebagai bentuk protes"]', 2, 3),
('q2-1', 'Menurut Ustadz Abdullah Taslim, apa hubungan antara hawa nafsu dengan kekhusyukan dalam shalat?', '["Hawa nafsu tidak berpengaruh pada ibadah", "Mengikuti hawa nafsu dapat merusak kekhusyukan shalat", "Hawa nafsu membantu seseorang lebih khusyu", "Shalat otomatis khusyu jika keinginan duniawi terpenuhi"]', 1, 4),
('q2-1', 'Apa langkah konkret yang disarankan untuk melatih diri agar bisa menerima pilihan Allah?', '["Memperdalam pemahaman agama dan disiplin melawan hawa nafsu", "Mengikuti semua keinginan hati tanpa terkecuali", "Menghindari doa agar tidak kecewa", "Hanya berbuat baik jika keinginan dikabulkan"]', 0, 5);

-- 4. Tambahkan Content Ringkasan untuk Modul lain (Opsional agar seragam)
UPDATE public.lessons SET content = 'Ringkasan: Memahami bahwa taaruf adalah proses perkenalan yang terjaga tujuannya bukan untuk pacaran, melainkan untuk ibadah pernikahan. Fokus pada kriteria agama dan akhlak.' WHERE id = 'v1-1';
UPDATE public.lessons SET content = 'Ringkasan: Adab malam pertama meliputi sikap lemah lembut, shalat sunnah pengantin 2 rakaat, mendoakan istri (tangan di ubun-ubun), dan menjaga rahasia hubungan suami istri.' WHERE id = 'v3-1';
