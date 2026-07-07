import mammoth from 'mammoth';

export async function extractDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

export async function extractPdf(buffer: Buffer): Promise<string> {
  const form = new FormData();
  // Convert Node Buffer to Uint8Array for Blob compatibility
  const uint8 = new Uint8Array(buffer);
  form.append('files', new Blob([uint8]), 'doc.pdf');
  form.append('strategy', 'hi_res');

  const res = await fetch('https://api.unstructured.io/general/v0/general', {
    method: 'POST',
    headers: { 'unstructured-api-key': process.env.UNSTRUCTURED_API_KEY! },
    body: form,
  });

  if (!res.ok) throw new Error(`Unstructured API error: ${res.status}`);

  const elements = await res.json();
  return elements
    .map((el: any) => (el.type === 'Title' ? `\n## ${el.text}\n` : el.text))
    .join('\n');
}

export async function extractText(buffer: Buffer, mimeType: string): Promise<string> {
  if (mimeType.includes('wordprocessingml')) return extractDocx(buffer);
  if (mimeType === 'application/pdf') return extractPdf(buffer);
  throw new Error(`Unsupported mime type: ${mimeType}`);
}