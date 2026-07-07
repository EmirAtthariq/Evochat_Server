interface Chunk {
  content: string;
  headingPath: string;
}

const MAX_CHUNK_TOKENS = 500;
const MIN_CHUNK_TOKENS = 100;

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function chunkMarkdown(markdown: string): Chunk[] {
  const lines = markdown.split('\n');
  const chunks: Chunk[] = [];
  let headingStack: string[] = [];
  let buffer: string[] = [];

  function flush() {
    if (buffer.length === 0) return;
    const text = buffer.join('\n\n').trim();
    if (text) chunks.push({ content: text, headingPath: headingStack.join(' > ') });
    buffer = [];
  }

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,3})\s+(.*)/);
    if (headingMatch) {
      flush();
      const level = headingMatch[1].length;
      headingStack = headingStack.slice(0, level - 1);
      headingStack[level - 1] = headingMatch[2];
      continue;
    }
    if (line.trim() === '') continue;
    buffer.push(line);
    if (estimateTokens(buffer.join(' ')) > MAX_CHUNK_TOKENS) flush();
  }
  flush();

  return mergeSmallChunks(chunks);
}

function mergeSmallChunks(chunks: Chunk[]): Chunk[] {
  const result: Chunk[] = [];
  for (const chunk of chunks) {
    const prev = result[result.length - 1];
    if (prev && prev.headingPath === chunk.headingPath &&
        estimateTokens(prev.content) < MIN_CHUNK_TOKENS) {
      prev.content += '\n\n' + chunk.content;
    } else {
      result.push({ ...chunk });
    }
  }
  return result;
}