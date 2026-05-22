import type { CurrentContent, MatchResult, PrecedentCase, RuleRoomSettings } from "@/types";

const stopWords = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "but",
  "by",
  "for",
  "from",
  "has",
  "have",
  "i",
  "in",
  "is",
  "it",
  "its",
  "just",
  "of",
  "on",
  "or",
  "that",
  "the",
  "their",
  "this",
  "to",
  "was",
  "with",
  "yet"
]);

const semanticAliases: Record<string, string[]> = {
  promotion: ["project", "token", "community", "recommendation", "promising", "joined"],
  shilling: ["project", "token", "promising", "early", "joined"],
  "self-promotion": ["project", "token", "community", "recommendation", "promising"],
  scam: ["unsafe", "suspicious", "giveaway", "link"],
  beginner: ["new", "help", "question", "wiki"],
  debate: ["discussion", "argument", "personal", "hostile"]
};

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " link ")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(text: string): string[] {
  return normalizeText(text)
    .split(" ")
    .map((token) => token.trim())
    .filter(Boolean);
}

export function removeStopWords(tokens: string[]): string[] {
  return tokens.filter((token) => !stopWords.has(token) && token.length > 1);
}

export function calculateJaccardSimilarity(tokensA: string[], tokensB: string[]): number {
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  const intersection = [...setA].filter((token) => setB.has(token)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

function calculateCoverageSimilarity(tokensA: string[], tokensB: string[]): number {
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  const intersection = [...setA].filter((token) => setB.has(token)).length;
  const smallestSet = Math.min(setA.size, setB.size);
  return smallestSet === 0 ? 0 : intersection / smallestSet;
}

export function calculatePhraseBoost(text: string, phrases: string[]): number {
  const normalized = normalizeText(text);
  const matched = phrases.filter((phrase) => normalized.includes(normalizeText(phrase)));
  return Math.min(1, matched.length / Math.max(3, phrases.length * 0.5));
}

export function calculateTagBoost(currentText: string, caseTags: string[]): number {
  const normalized = normalizeText(currentText);
  const currentTokens = new Set(removeStopWords(tokenize(normalized)));
  const matched = caseTags.filter((tag) => {
    const normalizedTag = normalizeText(tag);
    const aliases = semanticAliases[normalizedTag] ?? [];
    return (
      normalized.includes(normalizedTag) ||
      normalizedTag.split(" ").some((part) => currentTokens.has(part)) ||
      aliases.some((alias) => currentTokens.has(alias))
    );
  });
  return caseTags.length === 0 ? 0 : matched.length / caseTags.length;
}

export function calculateRuleBoost(currentText: string, ruleName: string): number {
  const normalized = normalizeText(currentText);
  const ruleLabel = normalizeText(ruleName.replace(/rule\s*\d+:?/i, ""));
  const ruleTokens = removeStopWords(tokenize(ruleLabel));
  const matched = ruleTokens.filter((token) => {
    const aliases = semanticAliases[token] ?? semanticAliases[ruleLabel] ?? [];
    return normalized.includes(token) || aliases.some((alias) => normalized.includes(alias));
  });
  return ruleTokens.length === 0 ? 0 : matched.length / ruleTokens.length;
}

function getThreshold(settings: RuleRoomSettings): number {
  if (Number.isFinite(settings.confidenceThreshold)) return settings.confidenceThreshold;
  if (settings.sensitivity === "Light") return 45;
  if (settings.sensitivity === "Strict") return 75;
  return 60;
}

function matchedTermsFor(currentText: string, precedentCase: PrecedentCase): string[] {
  const currentTokens = new Set(removeStopWords(tokenize(currentText)));
  const caseTokens = removeStopWords(
    tokenize(`${precedentCase.title} ${precedentCase.contentSummary} ${precedentCase.reason}`)
  );
  const tokenMatches = [...new Set(caseTokens.filter((token) => currentTokens.has(token)))];
  const tagMatches = precedentCase.tags.filter((tag) => normalizeText(currentText).includes(normalizeText(tag)));
  return [...new Set([...tagMatches, ...tokenMatches])].slice(0, 8);
}

export function findTopPrecedents(
  currentContent: CurrentContent,
  precedentCases: PrecedentCase[],
  settings: RuleRoomSettings
): MatchResult[] {
  const currentTitleTokens = removeStopWords(tokenize(currentContent.title));
  const currentBodyTokens = removeStopWords(tokenize(currentContent.body ?? ""));
  const currentText = `${currentContent.title} ${currentContent.body ?? ""}`;

  return precedentCases
    .map((precedentCase) => {
      const caseTitleTokens = removeStopWords(tokenize(`${precedentCase.title} ${precedentCase.samplePhrases.join(" ")}`));
      const caseBodyTokens = removeStopWords(
        tokenize(
          `${precedentCase.contentSummary} ${precedentCase.reason} ${precedentCase.samplePhrases.join(" ")} ${precedentCase.tags.join(" ")}`
        )
      );
      const titleScore = Math.max(
        calculateJaccardSimilarity(currentTitleTokens, caseTitleTokens),
        calculateCoverageSimilarity(currentTitleTokens, caseTitleTokens)
      );
      const bodyScore = Math.max(
        calculateJaccardSimilarity(currentBodyTokens, caseBodyTokens),
        calculateCoverageSimilarity(currentBodyTokens, caseBodyTokens)
      );
      const tagScore = calculateTagBoost(currentText, precedentCase.tags);
      const ruleScore = calculateRuleBoost(currentText, precedentCase.ruleName);
      const phraseScore = calculatePhraseBoost(currentText, precedentCase.samplePhrases);
      const similarityScore = Math.round(
        Math.min(1, titleScore * 0.35 + bodyScore * 0.3 + Math.max(tagScore, ruleScore) * 0.2 + phraseScore * 0.15) *
          100
      );

      const matchedTerms = matchedTermsFor(currentText, precedentCase);
      const explanation =
        matchedTerms.length > 0
          ? `Matched on ${matchedTerms.slice(0, 4).join(", ")} with prior ${precedentCase.ruleName} precedent.`
          : `Matched by overall wording and rule context with prior ${precedentCase.ruleName} precedent.`;

      return {
        precedentCase,
        similarityScore,
        matchedTerms,
        matchedRule: precedentCase.ruleName,
        explanation,
        suggestedAction: precedentCase.suggestedAction
      };
    })
    .filter((match) => match.similarityScore >= getThreshold(settings))
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, 3);
}
