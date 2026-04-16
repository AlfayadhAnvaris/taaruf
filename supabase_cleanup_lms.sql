-- ================================================================
-- CLEANUP & REORDER KURIKULUM: Sisakan Modul 1, 2, dan 6 (Sebagai Modul 3)
-- ================================================================

-- 1. Hapus Modul 3, 4, dan 5 (karena masih video placeholder)
-- ON DELETE CASCADE akan menghapus lessons dan quiz terkait
DELETE FROM public.courses WHERE id IN (3, 4, 5);

-- 2. Ubah Modul 6 menjadi Modul 3
-- Update ID jika tidak ada konflik, atau ubah order & title saja.
-- Agar bersih di UI, kita ubah title dan order_index-nya.
UPDATE public.courses 
SET 
  title = 'Modul 3: Etika Pernikahan dalam Islam',
  order_index = 3
WHERE id = 6;

-- Jika ingin benar-benar mengubah ID modulnya (opsional tapi lebih rapi):
-- Note: Lessons yang merujuk ke course_id=6 akan otomatis terupdate jika ada FK ON UPDATE CASCADE, 
-- namun script migration kita hanya pakai ON DELETE CASCADE. Jadi kita update manual.

-- Pastikan ID 3 benar-benar kosong (sudah di-delete di atas)
UPDATE public.courses SET id = 3 WHERE id = 6;
UPDATE public.lessons SET course_id = 3 WHERE course_id = 6;

-- Agar ID lessons juga rapi (v6-x -> v3-x)
UPDATE public.lessons SET id = 'v3-1' WHERE id = 'v6-1';
UPDATE public.lessons SET id = 'q3-1' WHERE id = 'q6-1';

-- Update quiz questions references (untuk jaga-jaga jika ID diubah)
UPDATE public.quiz_questions SET lesson_id = 'q3-1' WHERE lesson_id = 'q6-1';

-- Reset sequence
SELECT setval('public.courses_id_seq', 3, true);
