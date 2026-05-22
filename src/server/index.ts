import { createServer } from "@devvit/web/server";
import {
  addVote,
  appendAction,
  bootstrap,
  createPrecedentFromReview,
  getCases,
  getReviewCase,
  getVotes,
  saveCases,
  saveReviewCase,
  saveSettings
} from "@/lib/serverStorage";
import type { PrecedentCase, Vote, VoteDecision } from "@/types";

function sendJson(res: { statusCode: number; setHeader(name: string, value: string): void; end(body?: string): void }, data: unknown, status = 200): void {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
}

function sendError(res: { statusCode: number; setHeader(name: string, value: string): void; end(body?: string): void }, error: unknown): void {
  const message = error instanceof Error ? error.message : "RuleRoom server error";
  sendJson(res, { error: message }, 500);
}

async function readBody<T>(req: AsyncIterable<Buffer>): Promise<T> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? (JSON.parse(raw) as T) : ({} as T);
}

function getFinalDecision(votes: Vote[]): VoteDecision {
  const priority: VoteDecision[] = ["Remove", "Lock", "Needs Senior Mod", "Escalate", "Approve"];
  const counts = votes.reduce<Record<string, number>>((acc, vote) => {
    acc[vote.decision] = (acc[vote.decision] ?? 0) + 1;
    return acc;
  }, {});
  return priority.sort((a, b) => (counts[b] ?? 0) - (counts[a] ?? 0))[0];
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "https://ruleroom.local");

  try {
    if (
      req.method === "POST" &&
      (url.pathname === "/menu/check-precedent" || url.pathname === "/internal/menu/check-precedent")
    ) {
      const body = await readBody<{ targetId?: string }>(req);
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
      const body = await readBody<{ caseId: string; decision: VoteDecision; reason: string; anonymous: boolean }>(req);
      sendJson(res, await addVote(body.caseId, body.decision, body.reason, body.anonymous));
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/apply") {
      const body = await readBody<{ caseId: string; suggestedAction: string }>(req);
      await appendAction(`Suggested action applied for ${body.caseId}: ${body.suggestedAction}`);
      const cases = await createPrecedentFromReview(body.caseId, "Remove");
      sendJson(res, {
        message: "Action logged. Manual enforcement may be required depending on permissions.",
        cases
      });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/precedents") {
      const body = await readBody<{ caseId: string }>(req);
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
      const body = await readBody<{ caseId: string }>(req);
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
