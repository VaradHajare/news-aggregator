const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'for',
  'from', 'how', 'in', 'into', 'is', 'it', 'its', 'of', 'on', 'or',
  'that', 'the', 'their', 'this', 'to', 'was', 'were', 'what', 'when',
  'where', 'which', 'who', 'why', 'will', 'with', 'your',
]);

export function getQueryTerms(query) {
  const terms = [];
  const seen = new Set();
  const tokens = String(query || '').toLowerCase().match(/[a-z0-9][a-z0-9\-/+.]*/g) || [];
  for (const token of tokens) {
    if (token.length < 3 || STOPWORDS.has(token)) continue;
    if (!seen.has(token)) { seen.add(token); terms.push(token); }
  }
  return terms;
}

function scoreRelevance(text, queryTerms) {
  const haystack = text.toLowerCase();
  if (!haystack || !queryTerms.length) return queryTerms.length ? 0 : 1;
  let score = 0;
  for (const term of queryTerms) {
    if (haystack.includes(term)) score += 2.5;
  }
  return score;
}

export function collectSentences(text, queryTerms, maxSentences = 2) {
  const sentences = text.split(/(?<=[.!?])\s+(?=[A-Z0-9"'])/);
  const candidates = [];

  for (let i = 0; i < sentences.length; i++) {
    const s = sentences[i].trim();
    const words = s.split(/\s+/);
    if (words.length < 8 || words.length > 45) continue;

    let score = scoreRelevance(s, queryTerms);
    if (score <= 0 && i > 1) continue;
    score += Math.max(0, 2 - Math.min(i, 2)) * 0.35;
    if (/\d/.test(s)) score += 0.25;
    candidates.push({ score, index: i, text: s });
  }

  if (!candidates.length) {
    return sentences
      .filter(s => s.split(/\s+/).length >= 8)
      .slice(0, maxSentences);
  }

  candidates.sort((a, b) => b.score - a.score || a.index - b.index);
  const selected = [];
  const seen = new Set();

  for (const c of candidates) {
    const key = c.text.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!key || seen.has(key)) continue;
    seen.add(key);
    selected.push(c);
    if (selected.length >= maxSentences) break;
  }

  return selected
    .sort((a, b) => a.index - b.index)
    .map(c => c.text);
}

export function buildMultiSourceSummary(query, sourceEntries, maxSentences = 5) {
  const queryTerms = getQueryTerms(query);
  const candidates = [];

  for (const source of sourceEntries) {
    for (let order = 0; order < source.sentences.length; order++) {
      const sentence = source.sentences[order];
      let score = scoreRelevance(sentence, queryTerms);
      score += Math.max(0, 1 - order) * 0.3;
      candidates.push({ score, order, sourceNum: source.num, text: sentence });
    }
  }

  if (!candidates.length) return '';

  candidates.sort((a, b) => b.score - a.score || a.sourceNum - b.sourceNum || a.order - b.order);

  const chosen = [];
  const usedKeys = new Set();
  const usedSources = new Set();

  for (const c of candidates) {
    const key = c.text.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!key || usedKeys.has(key)) continue;
    if (usedSources.has(c.sourceNum) && usedSources.size < sourceEntries.length) continue;
    chosen.push(c);
    usedKeys.add(key);
    usedSources.add(c.sourceNum);
    if (chosen.length >= maxSentences) break;
  }

  return chosen.map(c => `${c.text} [${c.sourceNum}]`).join(' ');
}
