export async function embedTexts(
  texts: string[],
  inputType: 'document' | 'query' = 'document'
): Promise<number[][]> {
  const res = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ input: texts, model: 'voyage-3', input_type: inputType }),
  });

  if (!res.ok) throw new Error(`Voyage API error: ${res.status} ${await res.text()}`);

  const data = await res.json();
  return data.data.map((d: any) => d.embedding);
}