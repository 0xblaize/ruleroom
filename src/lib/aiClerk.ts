import type { CurrentContent, MatchResult } from "@/types";

function topicFrom(content: CurrentContent): string {
  const title = content.title.toLowerCase();
  if (title.includes("crypto") || content.body.toLowerCase().includes("token")) return "crypto project";
  if (title.includes("meme")) return "format-breaking meme";
  if (title.includes("giveaway") || content.body.toLowerCase().includes("link")) return "external link";
  if (title.includes("wiki") || title.includes("beginner")) return "beginner question";
  return "current post";
}

export function generateAiClerkSummary(content: CurrentContent, match?: MatchResult): string {
  if (!match) {
    return "No strong precedent was found. A moderator should review this case manually before applying a new team standard.";
  }

  const precedent = match.precedentCase;
  const verdict = precedent.verdict.toLowerCase();
  return `This ${topicFrom(content)} looks similar to "${precedent.title}", where the mod team ${verdict} the case under ${precedent.ruleName}. The overlap is strongest around ${match.matchedTerms.slice(0, 3).join(", ") || "the same rule context"}, and the prior reason was: ${precedent.reason}`;
}
