import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const candidateColumns = [
  'email',
  'sender',
  'sender_alias',
  'alias',
  'sender_name',
  'name'
];

async function probeSenderColumns() {
  console.log("Probing sender columns in 'messages' table...");
  for (const col of candidateColumns) {
    const { data, error } = await supabase.from('messages').select(col).limit(1);
    if (error) {
      console.log(`Column '${col}': ❌ NOT FOUND (Error: ${error.message})`);
    } else {
      console.log(`Column '${col}': ✅ EXISTS`);
    }
  }
}

probeSenderColumns();
