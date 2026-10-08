import type { ScopeItem } from "./project-types";

export type ScopeClassification = "possible_change" | "likely_in_scope" | "uncertain";

export type ScopeAssessment = {
  engine: "rules-demo-v1";
  classification: ScopeClassification;
  confidence: "low" | "medium";
  summary: string;
  requestExcerpt: string;
  matchedScopeItems: Array<{ id: string; title: string; excerpt: string }>;
  relatedScopeItems: Array<{ id: string; title: string; excerpt: string }>;
  missingConcepts: string[];
};

const stopWords = new Set([
  "это", "что", "как", "для", "или", "еще", "ещё", "можем", "можно", "будет", "будут", "надо", "нужно", "пожалуйста",
  "the", "and", "with", "for", "that", "this", "can", "could", "please", "would", "you", "your", "are", "into",
]);
const additiveCue = /(?:добав|создат|сделат|разработ|отдельн|дополн|ещё|еще|нов(?:ый|ая|ое|ые)?|another|add(?:ed|ing)?|new|extra|separate|additional|include)/iu;

function tokens(value: string) {
  return new Set((value.toLocaleLowerCase("ru-RU").match(/[\p{L}\p{N}]{3,}/gu) ?? [])
    .filter((token) => !stopWords.has(token)));
}

function overlapScore(requestTokens: Set<string>, scopeText: string) {
  const itemTokens = tokens(scopeText);
  if (itemTokens.size === 0) return 0;
  let shared = 0;
  for (const token of itemTokens) if (requestTokens.has(token)) shared += 1;
  return shared / Math.max(1, Math.min(requestTokens.size, 5));
}

function excerpt(value: string, maxLength = 140) {
  const clean = value.replace(/\s+/gu, " ").trim();
  return clean.length > maxLength ? `${clean.slice(0, maxLength - 1).trimEnd()}…` : clean;
}

export function assessScopeChange(message: string, scopeItems: ScopeItem[]): ScopeAssessment {
  const requestTokens = tokens(message);
  const ranked = scopeItems
    .map((item) => ({ item, score: overlapScore(requestTokens, `${item.title} ${item.description}`) }))
    .sort((left, right) => right.score - left.score);
  const bestScore = ranked[0]?.score ?? 0;
  const hasAdditiveCue = additiveCue.test(message);

  if (hasAdditiveCue && bestScore < 0.4) {
    const requestPhrase = message.match(/(?:добав\w*|отдельн\w*|нов\w*|ещё|еще|add\w*|new\w*|separate\w*)[^?!.]*/iu)?.[0];
    return {
      engine: "rules-demo-v1",
      classification: "possible_change",
      confidence: "medium",
      summary: "Запрос похож на новую работу: в текущем объёме не найдено близкого пункта. Это подсказка, решение остаётся за участниками.",
      requestExcerpt: excerpt(requestPhrase ?? message, 160),
      matchedScopeItems: [],
      relatedScopeItems: ranked.slice(0, 2).filter(({ score }) => score > 0).map(({ item }) => ({ id: item.id, title: item.title, excerpt: excerpt(item.description) })),
      missingConcepts: [...requestTokens].slice(0, 5),
    };
  }

  if (!hasAdditiveCue && bestScore >= 0.45) {
    const matches = ranked.filter(({ score }) => score >= 0.25).slice(0, 3);
    return {
      engine: "rules-demo-v1",
      classification: "likely_in_scope",
      confidence: "low",
      summary: "Нашлись похожие пункты в согласованном объёме. Перед решением проверьте контекст и детали запроса.",
      requestExcerpt: excerpt(message, 160),
      matchedScopeItems: matches.map(({ item }) => ({ id: item.id, title: item.title, excerpt: excerpt(item.description) })),
      relatedScopeItems: [],
      missingConcepts: [],
    };
  }

  return {
    engine: "rules-demo-v1",
    classification: "uncertain",
    confidence: "low",
    summary: "Правил недостаточно, чтобы сравнить запрос с объёмом. Уточните у сторон, что именно нужно сделать.",
    requestExcerpt: excerpt(message, 160),
    matchedScopeItems: ranked.filter(({ score }) => score >= 0.2).slice(0, 2).map(({ item }) => ({ id: item.id, title: item.title, excerpt: excerpt(item.description) })),
    relatedScopeItems: [],
    missingConcepts: [],
  };
}
