import type { BootstrapData, CurrentContent, PrecedentCase, ReviewCase, RuleRoomSettings, Vote, VoteDecision } from "@/types";
import { demoContent, seedCases, seedSettings, seedVotes } from "@/lib/seed";
import { findTopPrecedents } from "@/lib/matching";
import { redis, reddit } from "@devvit/web/server";

const CASES_KEY = "ruleroom:precedents";
const SETTINGS_KEY = "ruleroom:settings";
const VOTES_KEY = "ruleroom:votes";
const REVIEWS_KEY = "ruleroom:reviews";
const ACTIONS_KEY = "ruleroom:actions";

const memory = {
  cases: [...seedCases],
  settings: seedSettings,
  votes: [...seedVotes],
  reviews: {} as Record<string, ReviewCase>,
  actions: [] as string[]
};

async function safe<T>(operation: () => Promise<T>, fallback: () => T): Promise<T> {
  try {
    return await operation();
  } catch {
    return fallback();
  }
}

function parseRecord<T>(record: Record<string, string>, fallback: T[]): T[] {
  const values = Object.values(record);
  return values.length > 0 ? values.map((value) => JSON.parse(value) as T) : fallback;
}

export async function ensureSeeded(): Promise<void> {
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
    () => undefined
  );
}

export async function getCases(): Promise<PrecedentCase[]> {
  await ensureSeeded();
  return safe(async () => parseRecord<PrecedentCase>(await redis.hGetAll(CASES_KEY), seedCases), () => memory.cases);
}

export async function saveCases(cases: PrecedentCase[]): Promise<void> {
  memory.cases = cases;
  await safe(
    async () => {
      await redis.del(CASES_KEY);
      await redis.hSet(CASES_KEY, Object.fromEntries(cases.map((precedent) => [precedent.id, JSON.stringify(precedent)])));
    },
    () => undefined
  );
}

export async function getSettings(): Promise<RuleRoomSettings> {
  await ensureSeeded();
  return safe(async () => JSON.parse((await redis.get(SETTINGS_KEY)) ?? JSON.stringify(seedSettings)) as RuleRoomSettings, () => memory.settings);
}

export async function saveSettings(settings: RuleRoomSettings): Promise<RuleRoomSettings> {
  memory.settings = settings;
  await safe(async () => void (await redis.set(SETTINGS_KEY, JSON.stringify(settings))), () => undefined);
  return settings;
}

export async function getVotes(caseId?: string): Promise<Vote[]> {
  await ensureSeeded();
  const votes = await safe(async () => parseRecord<Vote>(await redis.hGetAll(VOTES_KEY), seedVotes), () => memory.votes);
  return caseId ? votes.filter((vote) => vote.caseId === caseId) : votes;
}

export async function addVote(caseId: string, decision: VoteDecision, reason: string, anonymous: boolean): Promise<Vote[]> {
  const modUsername = await safe(async () => (await reddit.getCurrentUsername()) ?? "Current_Mod", () => "Current_Mod");
  const vote: Vote = {
    id: `vote-${Date.now()}`,
    caseId,
    modUsername,
    decision,
    reason,
    anonymous,
    createdAt: new Date().toISOString()
  };
  memory.votes = [...memory.votes, vote];
  await safe(async () => void (await redis.hSet(VOTES_KEY, { [vote.id]: JSON.stringify(vote) })), () => undefined);
  return getVotes(caseId);
}

export async function fetchTargetContent(targetId?: string | null): Promise<CurrentContent> {
  if (!targetId) return demoContent;

  return safe(
    async () => {
      if (targetId.startsWith("t1_")) {
        const comment = await reddit.getCommentById(targetId as `t1_${string}`);
        const post = await reddit.getPostById(comment.postId);
        return {
          id: comment.id,
          author: comment.authorName || "unknown",
          subreddit: `r/${comment.subredditName}`,
          title: `Comment on: ${post.title}`,
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

      const post = await reddit.getPostById(targetId as `t3_${string}`);
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

export async function getOrCreateReviewCase(content: CurrentContent, matches: BootstrapData["matches"]): Promise<ReviewCase> {
  const reviewId = `review:${content.id}`;
  const fallback: ReviewCase = {
    id: reviewId,
    targetId: content.id,
    targetType: content.id.startsWith("t1_") ? "comment" : "post",
    title: content.title,
    body: content.body ?? "",
    author: content.author,
    subreddit: content.subreddit,
    status: "pending",
    createdAt: new Date().toISOString(),
    permalink: content.permalink,
    matchResults: matches,
    suggestedAction: matches[0]?.suggestedAction
  };

  return safe(
    async () => {
      const existing = await redis.hGet(REVIEWS_KEY, reviewId);
      const review = existing ? (JSON.parse(existing) as ReviewCase) : fallback;
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

export async function getReviewCase(caseId: string): Promise<ReviewCase | undefined> {
  return safe(
    async () => {
      const value = await redis.hGet(REVIEWS_KEY, caseId);
      return value ? (JSON.parse(value) as ReviewCase) : undefined;
    },
    () => memory.reviews[caseId]
  );
}

export async function saveReviewCase(review: ReviewCase): Promise<void> {
  memory.reviews[review.id] = review;
  await safe(async () => void (await redis.hSet(REVIEWS_KEY, { [review.id]: JSON.stringify(review) })), () => undefined);
}

export async function bootstrap(targetId?: string | null): Promise<BootstrapData> {
  const [cases, settings, content] = await Promise.all([getCases(), getSettings(), fetchTargetContent(targetId)]);
  const matches = findTopPrecedents(content, cases, settings);
  const reviewCase = await getOrCreateReviewCase(content, matches);
  const votes = await getVotes(reviewCase.id);
  return { content, cases, settings, votes, matches, reviewCase };
}

export async function appendAction(message: string): Promise<void> {
  memory.actions = [`${new Date().toISOString()} ${message}`, ...memory.actions].slice(0, 50);
  await safe(async () => void (await redis.hSet(ACTIONS_KEY, { [`action-${Date.now()}`]: memory.actions[0] })), () => undefined);
}

export async function createPrecedentFromReview(caseId: string, finalDecision?: VoteDecision): Promise<PrecedentCase[]> {
  const review = await getReviewCase(caseId);
  const cases = await getCases();
  if (!review) return cases;

  const best = review.matchResults[0];
  const modUsername = await safe(async () => (await reddit.getCurrentUsername()) ?? "Current_Mod", () => "Current_Mod");
  const precedent: PrecedentCase = {
    id: `P-${Date.now().toString().slice(-6)}`,
    title: review.title,
    contentSummary: review.body || "No body text was available.",
    sourcePostId: review.targetType === "post" ? review.targetId : undefined,
    sourceCommentId: review.targetType === "comment" ? review.targetId : undefined,
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
    createdAt: new Date().toISOString(),
    createdBy: modUsername,
    samplePhrases: best?.matchedTerms ?? [],
    decisionSummary: `Final decision: ${finalDecision ?? "Saved as precedent"}. ${best?.explanation ?? ""}`.trim()
  };

  const nextCases = [precedent, ...cases];
  await saveCases(nextCases);
  await saveReviewCase({ ...review, status: "resolved", finalDecision });
  return nextCases;
}
