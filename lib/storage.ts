
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function uploadFile(buffer: Buffer, path: string, contentType: string) {
  const { error } = await supabase.storage
    .from('documents')
    .upload(path, buffer, { contentType, upsert: true });

  if (error) throw error;
  return path;
}

export async function downloadFile(path: string): Promise<Buffer> {
  const { data, error } = await supabase.storage.from('documents').download(path);
  if (error) throw error;
  return Buffer.from(await data.arrayBuffer());
}