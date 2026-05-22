import { reddit, redis, createServer } from "@devvit/web/server";
const seedCases = [
  {
    id: "P-8821",
    title: "Subtle self-promotion in crypto discussion",
    contentSummary: "User framed a project recommendation as a neutral question, but the post mostly promoted one specific project and linked to its community.",
    sourcePostId: "t3_demo_crypto_promo",
    subreddit: "CryptoMoonShots",
    ruleId: "rule-3",
    ruleName: "Rule 3: No Self-Promotion",
    verdict: "Removed",
    votes: { remove: 4, approve: 1, lock: 0 },
    tags: ["crypto", "promotion", "shilling", "grey-area"],
    reason: "User framed a project recommendation as a neutral question, but the post mostly promoted one specific project and linked to its community.",
    suggestedAction: "Remove as self-promotion and redirect user to the weekly promo thread.",
    createdAt: "2026-03-12T12:00:00.000Z",
    createdBy: "Mod_Alpha",
    samplePhrases: [
      "is this project good",
      "new crypto project",
      "community is growing",
      "token seems early",
      "has anyone joined",
      "project recommendation",
      "neutral question",
      "specific project"
    ],
    decisionSummary: "The post looked neutral on the surface but centered one specific crypto project and community link."
  },
  {
    id: "P-8790",
    title: "Heated debate turning personal",
    contentSummary: "The original discussion was allowed, but the comment chain became personal and hostile.",
    sourcePostId: "t3_demo_civility_lock",
    subreddit: "ExampleSubreddit",
    ruleId: "rule-2",
    ruleName: "Rule 2: Be Civil",
    verdict: "Locked",
    votes: { lock: 3, approve: 1, remove: 0 },
    tags: ["debate", "insults", "personal attack", "escalating"],
    reason: "The original discussion was allowed, but the comment chain became personal and hostile.",
    suggestedAction: "Lock thread and leave a civility reminder.",
    createdAt: "2026-02-28T12:00:00.000Z",
    createdBy: "Mod_Beta",
    samplePhrases: ["turning personal", "hostile", "insults", "personal attack", "heated debate"],
    decisionSummary: "The thread moved from argument about the topic into personal attacks."
  },
  {
    id: "P-8742",
    title: "High quality meme breaking format rules",
    contentSummary: "The post technically broke formatting rules but created high-quality community discussion and was approved as an exception precedent.",
    sourcePostId: "t3_demo_meme_exception",
    subreddit: "ExampleSubreddit",
    ruleId: "rule-5",
    ruleName: "Rule 5: Post Format",
    verdict: "Approved as Exception",
    votes: { approve: 4, remove: 1, lock: 0 },
    tags: ["meme", "formatting", "exception", "high-value"],
    reason: "The post technically broke formatting rules but created high-quality community discussion and was approved as an exception precedent.",
    suggestedAction: "Approve and optionally apply an exception flair.",
    createdAt: "2026-02-15T12:00:00.000Z",
    createdBy: "Mod_Gamma",
    samplePhrases: ["meme", "format rules", "formatting", "exception", "high quality discussion"],
    decisionSummary: "Mods approved the post as a visible exception because discussion value outweighed format issues."
  },
  {
    id: "P-8611",
    title: "Beginner question already covered by wiki",
    contentSummary: "The question was valid but had already been answered in the official beginner wiki and weekly help thread.",
    sourcePostId: "t3_demo_wiki_redirect",
    subreddit: "ExampleSubreddit",
    ruleId: "rule-6",
    ruleName: "Rule 6: Use Megathreads and Wiki",
    verdict: "Redirected",
    votes: { redirect: 5, approve: 0, remove: 0, lock: 0 },
    tags: ["beginner", "repeated question", "wiki", "megathread"],
    reason: "The question was valid but had already been answered in the official beginner wiki and weekly help thread.",
    suggestedAction: "Reply with wiki link and redirect to the weekly help thread.",
    createdAt: "2026-01-10T12:00:00.000Z",
    createdBy: "Mod_Delta",
    samplePhrases: ["beginner question", "already covered", "wiki", "megathread", "weekly help"],
    decisionSummary: "The case was not bad-faith, but the right moderation memory was redirecting to existing resources."
  },
  {
    id: "P-8555",
    title: "Suspicious external giveaway link",
    contentSummary: "The post encouraged users to click an external giveaway link without verifiable source information.",
    sourcePostId: "t3_demo_giveaway_link",
    subreddit: "ExampleSubreddit",
    ruleId: "rule-4",
    ruleName: "Rule 4: No Unsafe Links",
    verdict: "Removed",
    votes: { remove: 5, approve: 0, lock: 0 },
    tags: ["giveaway", "suspicious link", "scam risk"],
    reason: "The post encouraged users to click an external giveaway link without verifiable source information.",
    suggestedAction: "Remove and send a safety reminder.",
    createdAt: "2026-01-02T12:00:00.000Z",
    createdBy: "Mod_Echo",
    samplePhrases: ["giveaway", "external link", "click", "scam", "unsafe link", "verifiable source"],
    decisionSummary: "The external giveaway had no trusted source and created unnecessary safety risk."
  }
];
const seedSettings = {
  sensitivity: "Balanced",
  confidenceThreshold: 60,
  defaultWorkflow: "Suggest Only",
  aiClerkEnabled: true,
  autoSuggestActions: true,
  defaultAnonymity: false,
  savedResponses: [
    {
      id: "response-promo",
      name: "Promo redirect",
      body: "Thanks for posting. This looks promotional, so please use the weekly promo thread instead."
    },
    {
      id: "response-civility",
      name: "Civility reminder",
      body: "Please keep the discussion focused on ideas rather than other users."
    }
  ],
  rules: [
    { id: "rule-2", name: "Rule 2: Be Civil", description: "No personal attacks or hostile escalation." },
    { id: "rule-3", name: "Rule 3: No Self-Promotion", description: "No disguised promotion or shilling." },
    { id: "rule-4", name: "Rule 4: No Unsafe Links", description: "No suspicious external links." },
    { id: "rule-5", name: "Rule 5: Post Format", description: "Follow title, flair, and format rules." },
    {
      id: "rule-6",
      name: "Rule 6: Use Megathreads and Wiki",
      description: "Redirect repeat beginner questions to canonical resources."
    }
  ],
  clerkGuidance: "Focus on grey-area consistency. Identify subtle self promotion, unsafe links, civility escalation, and redirectable repeat questions. Keep humans in control."
};
const demoContent = {
  id: "demo-post-1",
  author: "u/CryptoInvestigator",
  subreddit: "r/CryptoMoonShots",
  title: "Is this new crypto project actually good or just another scam?",
  body: "I found this project and it looks promising. Their community is growing fast and the token seems early. Has anyone joined yet?",
  createdAt: "2026-05-21T09:35:00.000Z",
  reports: ["Reported: Rule 3", "High Spam Probability"],
  stats: {
    upvotes: 12,
    comments: 34
  },
  permalink: "/r/CryptoMoonShots/comments/demo_post"
};
const seedVotes = [
  {
    id: "vote-1",
    caseId: "demo-post-1",
    modUsername: "Mod_Alpha",
    decision: "Remove",
    reason: "Looks like project promotion framed as a neutral question.",
    anonymous: false,
    createdAt: "2026-05-21T09:40:00.000Z"
  },
  {
    id: "vote-2",
    caseId: "demo-post-1",
    modUsername: "Safety_Jane",
    decision: "Needs Senior Mod",
    reason: "Agree with the precedent match, but confirm whether the link exists before enforcement.",
    anonymous: false,
    createdAt: "2026-05-21T09:42:00.000Z"
  }
];
const stopWords = /* @__PURE__ */ new Set([
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
const semanticAliases = {
  promotion: ["project", "token", "community", "recommendation", "promising", "joined"],
  shilling: ["project", "token", "promising", "early", "joined"],
  "self-promotion": ["project", "token", "community", "recommendation", "promising"],
  scam: ["unsafe", "suspicious", "giveaway", "link"],
  beginner: ["new", "help", "question", "wiki"],
  debate: ["discussion", "argument", "personal", "hostile"]
};
function normalizeText(text) {
  return text.toLowerCase().replace(/https?:\/\/\S+/g, " link ").replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();
}
function tokenize(text) {
  return normalizeText(text).split(" ").map((token) => token.trim()).filter(Boolean);
}
function removeStopWords(tokens) {
  return tokens.filter((token) => !stopWords.has(token) && token.length > 1);
}
function calculateJaccardSimilarity(tokensA, tokensB) {
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  const intersection = [...setA].filter((token) => setB.has(token)).length;
  const union = (/* @__PURE__ */ new Set([...setA, ...setB])).size;
  return union === 0 ? 0 : intersection / union;
}
function calculateCoverageSimilarity(tokensA, tokensB) {
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  const intersection = [...setA].filter((token) => setB.has(token)).length;
  const smallestSet = Math.min(setA.size, setB.size);
  return smallestSet === 0 ? 0 : intersection / smallestSet;
}
function calculatePhraseBoost(text, phrases) {
  const normalized = normalizeText(text);
  const matched = phrases.filter((phrase) => normalized.includes(normalizeText(phrase)));
  return Math.min(1, matched.length / Math.max(3, phrases.length * 0.5));
}
function calculateTagBoost(currentText, caseTags) {
  const normalized = normalizeText(currentText);
  const currentTokens = new Set(removeStopWords(tokenize(normalized)));
  const matched = caseTags.filter((tag) => {
    const normalizedTag = normalizeText(tag);
    const aliases = semanticAliases[normalizedTag] ?? [];
    return normalized.includes(normalizedTag) || normalizedTag.split(" ").some((part) => currentTokens.has(part)) || aliases.some((alias) => currentTokens.has(alias));
  });
  return caseTags.length === 0 ? 0 : matched.length / caseTags.length;
}
function calculateRuleBoost(currentText, ruleName) {
  const normalized = normalizeText(currentText);
  const ruleLabel = normalizeText(ruleName.replace(/rule\s*\d+:?/i, ""));
  const ruleTokens = removeStopWords(tokenize(ruleLabel));
  const matched = ruleTokens.filter((token) => {
    const aliases = semanticAliases[token] ?? semanticAliases[ruleLabel] ?? [];
    return normalized.includes(token) || aliases.some((alias) => normalized.includes(alias));
  });
  return ruleTokens.length === 0 ? 0 : matched.length / ruleTokens.length;
}
function getThreshold(settings) {
  if (Number.isFinite(settings.confidenceThreshold)) return settings.confidenceThreshold;
  if (settings.sensitivity === "Light") return 45;
  if (settings.sensitivity === "Strict") return 75;
  return 60;
}
function matchedTermsFor(currentText, precedentCase) {
  const currentTokens = new Set(removeStopWords(tokenize(currentText)));
  const caseTokens = removeStopWords(
    tokenize(`${precedentCase.title} ${precedentCase.contentSummary} ${precedentCase.reason}`)
  );
  const tokenMatches = [...new Set(caseTokens.filter((token) => currentTokens.has(token)))];
  const tagMatches = precedentCase.tags.filter((tag) => normalizeText(currentText).includes(normalizeText(tag)));
  return [.../* @__PURE__ */ new Set([...tagMatches, ...tokenMatches])].slice(0, 8);
}
function findTopPrecedents(currentContent, precedentCases, settings) {
  const currentTitleTokens = removeStopWords(tokenize(currentContent.title));
  const currentBodyTokens = removeStopWords(tokenize(currentContent.body ?? ""));
  const currentText = `${currentContent.title} ${currentContent.body ?? ""}`;
  return precedentCases.map((precedentCase) => {
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
      Math.min(1, titleScore * 0.35 + bodyScore * 0.3 + Math.max(tagScore, ruleScore) * 0.2 + phraseScore * 0.15) * 100
    );
    const matchedTerms = matchedTermsFor(currentText, precedentCase);
    const explanation = matchedTerms.length > 0 ? `Matched on ${matchedTerms.slice(0, 4).join(", ")} with prior ${precedentCase.ruleName} precedent.` : `Matched by overall wording and rule context with prior ${precedentCase.ruleName} precedent.`;
    return {
      precedentCase,
      similarityScore,
      matchedTerms,
      matchedRule: precedentCase.ruleName,
      explanation,
      suggestedAction: precedentCase.suggestedAction
    };
  }).filter((match) => match.similarityScore >= getThreshold(settings)).sort((a, b) => b.similarityScore - a.similarityScore).slice(0, 3);
}
const CASES_KEY = "ruleroom:precedents";
const SETTINGS_KEY = "ruleroom:settings";
const VOTES_KEY = "ruleroom:votes";
const REVIEWS_KEY = "ruleroom:reviews";
const ACTIONS_KEY = "ruleroom:actions";
const memory = {
  cases: [...seedCases],
  settings: seedSettings,
  votes: [...seedVotes],
  reviews: {},
  actions: []
};
async function safe(operation, fallback) {
  try {
    return await operation();
  } catch {
    return fallback();
  }
}
function parseRecord(record, fallback) {
  const values = Object.values(record);
  return values.length > 0 ? values.map((value) => JSON.parse(value)) : fallback;
}
async function ensureSeeded() {
  await safe(
    async () => {
      const count = await redis.hLen(CASES_KEY);
      if (count === 0) {
        await redis.hSet(
          CASES_KEY,
          Object.fromEntries(seedCases.map((precedent) => [precedent.id, JSON.stringify(precedent)]))
        );
      }
      const settings = await redis.get(SETTINGS_KEY);
      if (!settings) await redis.set(SETTINGS_KEY, JSON.stringify(seedSettings));
      const votes = await redis.hLen(VOTES_KEY);
      if (votes === 0) {
        await redis.hSet(VOTES_KEY, Object.fromEntries(seedVotes.map((vote) => [vote.id, JSON.stringify(vote)])));
      }
    },
    () => void 0
  );
}
async function getCases() {
  await ensureSeeded();
  return safe(async () => parseRecord(await redis.hGetAll(CASES_KEY), seedCases), () => memory.cases);
}
async function saveCases(cases) {
  memory.cases = cases;
  await safe(
    async () => {
      await redis.del(CASES_KEY);
      await redis.hSet(CASES_KEY, Object.fromEntries(cases.map((precedent) => [precedent.id, JSON.stringify(precedent)])));
    },
    () => void 0
  );
}
async function getSettings() {
  await ensureSeeded();
  return safe(async () => JSON.parse(await redis.get(SETTINGS_KEY) ?? JSON.stringify(seedSettings)), () => memory.settings);
}
async function saveSettings(settings) {
  memory.settings = settings;
  await safe(async () => void await redis.set(SETTINGS_KEY, JSON.stringify(settings)), () => void 0);
  return settings;
}
async function getVotes(caseId) {
  await ensureSeeded();
  const votes = await safe(async () => parseRecord(await redis.hGetAll(VOTES_KEY), seedVotes), () => memory.votes);
  return caseId ? votes.filter((vote) => vote.caseId === caseId) : votes;
}
async function addVote(caseId, decision, reason, anonymous) {
  const modUsername = await safe(async () => await reddit.getCurrentUsername() ?? "Current_Mod", () => "Current_Mod");
  const vote = {
    id: `vote-${Date.now()}`,
    caseId,
    modUsername,
    decision,
    reason,
    anonymous,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  memory.votes = [...memory.votes, vote];
  await safe(async () => void await redis.hSet(VOTES_KEY, { [vote.id]: JSON.stringify(vote) }), () => void 0);
  return getVotes(caseId);
}
async function fetchTargetContent(targetId) {
  if (!targetId) return demoContent;
  return safe(
    async () => {
      if (targetId.startsWith("t1_")) {
        const comment = await reddit.getCommentById(targetId);
        const post2 = await reddit.getPostById(comment.postId);
        return {
          id: comment.id,
          author: comment.authorName || "unknown",
          subreddit: `r/${comment.subredditName}`,
          title: `Comment on: ${post2.title}`,
          body: comment.body ?? "",
          createdAt: comment.createdAt.toISOString(),
          reports: [...comment.userReportReasons, ...comment.modReportReasons],
          stats: {
            upvotes: comment.score,
            comments: 0
          },
          permalink: comment.permalink
        };
      }
      const post = await reddit.getPostById(targetId);
      return {
        id: post.id,
        author: post.authorName || "unknown",
        subreddit: `r/${post.subredditName}`,
        title: post.title,
        body: post.body ?? "",
        createdAt: post.createdAt.toISOString(),
        reports: [...post.userReportReasons, ...post.modReportReasons],
        stats: {
          upvotes: post.score,
          comments: post.numberOfComments
        },
        permalink: post.permalink
      };
    },
    () => ({ ...demoContent, id: targetId })
  );
}
async function getOrCreateReviewCase(content, matches) {
  const reviewId = `review:${content.id}`;
  const fallback = {
    id: reviewId,
    targetId: content.id,
    targetType: content.id.startsWith("t1_") ? "comment" : "post",
    title: content.title,
    body: content.body ?? "",
    author: content.author,
    subreddit: content.subreddit,
    status: "pending",
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    permalink: content.permalink,
    matchResults: matches,
    suggestedAction: matches[0]?.suggestedAction
  };
  return safe(
    async () => {
      const existing = await redis.hGet(REVIEWS_KEY, reviewId);
      const review = existing ? JSON.parse(existing) : fallback;
      const updated = { ...review, matchResults: matches, suggestedAction: matches[0]?.suggestedAction };
      await redis.hSet(REVIEWS_KEY, { [reviewId]: JSON.stringify(updated) });
      return updated;
    },
    () => {
      memory.reviews[reviewId] = memory.reviews[reviewId] ?? fallback;
      return { ...memory.reviews[reviewId], matchResults: matches, suggestedAction: matches[0]?.suggestedAction };
    }
  );
}
async function getReviewCase(caseId) {
  return safe(
    async () => {
      const value = await redis.hGet(REVIEWS_KEY, caseId);
      return value ? JSON.parse(value) : void 0;
    },
    () => memory.reviews[caseId]
  );
}
async function saveReviewCase(review) {
  memory.reviews[review.id] = review;
  await safe(async () => void await redis.hSet(REVIEWS_KEY, { [review.id]: JSON.stringify(review) }), () => void 0);
}
async function bootstrap(targetId) {
  const [cases, settings, content] = await Promise.all([getCases(), getSettings(), fetchTargetContent(targetId)]);
  const matches = findTopPrecedents(content, cases, settings);
  const reviewCase = await getOrCreateReviewCase(content, matches);
  const votes = await getVotes(reviewCase.id);
  return { content, cases, settings, votes, matches, reviewCase };
}
async function appendAction(message) {
  memory.actions = [`${(/* @__PURE__ */ new Date()).toISOString()} ${message}`, ...memory.actions].slice(0, 50);
  await safe(async () => void await redis.hSet(ACTIONS_KEY, { [`action-${Date.now()}`]: memory.actions[0] }), () => void 0);
}
async function createPrecedentFromReview(caseId, finalDecision) {
  const review = await getReviewCase(caseId);
  const cases = await getCases();
  if (!review) return cases;
  const best = review.matchResults[0];
  const modUsername = await safe(async () => await reddit.getCurrentUsername() ?? "Current_Mod", () => "Current_Mod");
  const precedent = {
    id: `P-${Date.now().toString().slice(-6)}`,
    title: review.title,
    contentSummary: review.body || "No body text was available.",
    sourcePostId: review.targetType === "post" ? review.targetId : void 0,
    sourceCommentId: review.targetType === "comment" ? review.targetId : void 0,
    subreddit: review.subreddit.replace(/^r\//, ""),
    ruleId: best?.precedentCase.ruleId ?? "rule-review",
    ruleName: best?.matchedRule ?? "Moderator Review",
    verdict: finalDecision === "Approve" ? "Approved" : finalDecision === "Lock" ? "Locked" : "Removed",
    votes: {
      approve: finalDecision === "Approve" ? 1 : 0,
      remove: finalDecision === "Remove" ? 1 : 0,
      lock: finalDecision === "Lock" ? 1 : 0,
      escalate: finalDecision === "Escalate" ? 1 : 0,
      needsSeniorMod: finalDecision === "Needs Senior Mod" ? 1 : 0
    },
    tags: best?.matchedTerms.slice(0, 5) ?? ["grey-area"],
    reason: best?.explanation ?? "Saved from moderator review for future consistency.",
    suggestedAction: review.suggestedAction ?? best?.suggestedAction ?? "Review manually and record final team decision.",
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    createdBy: modUsername,
    samplePhrases: best?.matchedTerms ?? [],
    decisionSummary: `Final decision: ${finalDecision ?? "Saved as precedent"}. ${best?.explanation ?? ""}`.trim()
  };
  const nextCases = [precedent, ...cases];
  await saveCases(nextCases);
  await saveReviewCase({ ...review, status: "resolved", finalDecision });
  return nextCases;
}
function sendJson(res, data, status = 200) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
}
function sendError(res, error) {
  const message = error instanceof Error ? error.message : "RuleRoom server error";
  sendJson(res, { error: message }, 500);
}
async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}
function getFinalDecision(votes) {
  const priority = ["Remove", "Lock", "Needs Senior Mod", "Escalate", "Approve"];
  const counts = votes.reduce((acc, vote) => {
    acc[vote.decision] = (acc[vote.decision] ?? 0) + 1;
    return acc;
  }, {});
  return priority.sort((a, b) => (counts[b] ?? 0) - (counts[a] ?? 0))[0];
}
const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "https://ruleroom.local");
  try {
    if (req.method === "POST" && (url.pathname === "/menu/check-precedent" || url.pathname === "/internal/menu/check-precedent")) {
      const body = await readBody(req);
      const targetId = body.targetId ?? url.searchParams.get("targetId") ?? "";
      sendJson(res, {
        navigateTo: {
          url: targetId ? `/?targetId=${encodeURIComponent(targetId)}` : "/"
        },
        showToast: {
          text: "Opening RuleRoom precedent review.",
          appearance: "success"
        }
      });
      return;
    }
    if (req.method === "GET" && url.pathname === "/api/bootstrap") {
      sendJson(res, await bootstrap(url.searchParams.get("targetId")));
      return;
    }
    if (req.method === "POST" && url.pathname === "/api/votes") {
      const body = await readBody(req);
      sendJson(res, await addVote(body.caseId, body.decision, body.reason, body.anonymous));
      return;
    }
    if (req.method === "POST" && url.pathname === "/api/apply") {
      const body = await readBody(req);
      await appendAction(`Suggested action applied for ${body.caseId}: ${body.suggestedAction}`);
      const cases = await createPrecedentFromReview(body.caseId, "Remove");
      sendJson(res, {
        message: "Action logged. Manual enforcement may be required depending on permissions.",
        cases
      });
      return;
    }
    if (req.method === "POST" && url.pathname === "/api/precedents") {
      const body = await readBody(req);
      sendJson(res, await createPrecedentFromReview(body.caseId));
      return;
    }
    if (req.method === "DELETE" && url.pathname.startsWith("/api/precedents/")) {
      const id = decodeURIComponent(url.pathname.replace("/api/precedents/", ""));
      const cases = (await getCases()).filter((precedent) => precedent.id !== id);
      await saveCases(cases);
      sendJson(res, cases);
      return;
    }
    if (req.method === "POST" && url.pathname === "/api/finalize") {
      const body = await readBody(req);
      const votes = await getVotes(body.caseId);
      const decision = getFinalDecision(votes);
      const review = await getReviewCase(body.caseId);
      if (review) {
        await saveReviewCase({ ...review, status: "resolved", finalDecision: decision });
      }
      const cases = await createPrecedentFromReview(body.caseId, decision);
      sendJson(res, {
        message: `Decision finalized as ${decision}. Saved to the Precedent Library.`,
        cases,
        votes
      });
      return;
    }
    if (req.method === "POST" && url.pathname === "/api/settings") {
      sendJson(res, await saveSettings(await readBody(req)));
      return;
    }
    if (req.method === "GET" && url.pathname === "/api/precedents") {
      sendJson(res, await getCases());
      return;
    }
    sendJson(res, { error: "Not found" }, 404);
  } catch (error) {
    sendError(res, error);
  }
});
server.listen();
