import { LiteParse } from '@llamaindex/liteparse';
import mammoth from 'mammoth';
export async function extractDocx(buffer: Buffer): Promise<string> {
  // mammoth does not provide convertToMarkdown; use extractRawText to get plain text
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}



export async function extractPdf(buffer: Buffer): Promise<string> {
  const parser = new LiteParse({
    ocrEnabled: true, // otomatis OCR kalau ada teks hasil scan/gambar
  });

  const result = await parser.parse(buffer);
  return result.text;
}

export async function extractText(
  buffer: Buffer,
  mimeType: string,
  filename?: string
): Promise<string> {
  const ext = filename?.toLowerCase().split('.').pop();

  if (mimeType.includes('wordprocessingml') || ext === 'docx') {
    return extractDocx(buffer);
  }
  if (mimeType === 'application/pdf' || ext === 'pdf') {
    return extractPdf(buffer);
  }
  throw new Error(`Unsupported file type: ${filename ?? mimeType}`);
}