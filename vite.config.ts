import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { demoContent, seedCases, seedSettings, seedVotes } from "./src/lib/seed";
import { findTopPrecedents } from "./src/lib/matching";
import type { PrecedentCase, ReviewCase, RuleRoomSettings, Vote, VoteDecision } from "./src/types";

const isServer = process.env.BUILD_TARGET === "server";

function localRuleRoomApi() {
  const memory: {
    cases: PrecedentCase[];
    settings: RuleRoomSettings;
    votes: Vote[];
    reviews: Record<string, ReviewCase>;
  } = {
    cases: [...seedCases],
    settings: seedSettings,
    votes: [...seedVotes],
    reviews: {}
  };

  async function readBody<T>(req: import("node:http").IncomingMessage): Promise<T> {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(Buffer.from(chunk));
    const raw = Buffer.concat(chunks).toString("utf8");
    return raw ? (JSON.parse(raw) as T) : ({} as T);
  }

  function writeJson(res: import("node:http").ServerResponse, data: unknown, status = 200): void {
    res.statusCode = status;
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.end(JSON.stringify(data));
  }

  function getReview(): { review: ReviewCase; matches: ReturnType<typeof findTopPrecedents> } {
    const matches = findTopPrecedents(demoContent, memory.cases, memory.settings);
    const id = `review:${demoContent.id}`;
    memory.reviews[id] = memory.reviews[id] ?? {
      id,
      targetId: demoContent.id,
      targetType: "post",
      title: demoContent.title,
      body: demoContent.body,
      author: demoContent.author,
      subreddit: demoContent.subreddit,
      status: "pending",
      createdAt: new Date().toISOString(),
      permalink: demoContent.permalink,
      matchResults: matches,
      suggestedAction: matches[0]?.suggestedAction
    };
    memory.reviews[id] = { ...memory.reviews[id], matchResults: matches, suggestedAction: matches[0]?.suggestedAction };
    return { review: memory.reviews[id], matches };
  }

  function createPrecedent(caseId: string, finalDecision?: VoteDecision): PrecedentCase[] {
    const review = memory.reviews[caseId] ?? getReview().review;
    const best = review.matchResults[0];
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
      createdBy: "Local_Mod",
      samplePhrases: best?.matchedTerms ?? [],
      decisionSummary: `Final decision: ${finalDecision ?? "Saved as precedent"}. ${best?.explanation ?? ""}`.trim()
    };
    memory.cases = [precedent, ...memory.cases];
    memory.reviews[caseId] = { ...review, status: "resolved", finalDecision };
    return memory.cases;
  }

  return {
    name: "ruleroom-local-api",
    configureServer(server: import("vite").ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url ?? "/", "http://127.0.0.1");
        if (!url.pathname.startsWith("/api/")) {
          next();
          return;
        }

        try {
          if (req.method === "GET" && url.pathname === "/api/bootstrap") {
            const { review, matches } = getReview();
            writeJson(res, {
              content: demoContent,
              cases: memory.cases,
              settings: memory.settings,
              votes: memory.votes.filter((vote) => vote.caseId === review.id),
              matches,
              reviewCase: review
            });
            return;
          }

          if (req.method === "POST" && url.pathname === "/api/votes") {
            const body = await readBody<{ caseId: string; decision: VoteDecision; reason: string; anonymous: boolean }>(req);
            const vote: Vote = {
              id: `vote-${Date.now()}`,
              caseId: body.caseId,
              modUsername: "Local_Mod",
              decision: body.decision,
              reason: body.reason,
              anonymous: body.anonymous,
              createdAt: new Date().toISOString()
            };
            memory.votes = [...memory.votes, vote];
            writeJson(res, memory.votes.filter((item) => item.caseId === body.caseId));
            return;
          }

          if (req.method === "POST" && url.pathname === "/api/apply") {
            const body = await readBody<{ caseId: string }>(req);
            writeJson(res, {
              message: "Action logged. Manual enforcement may be required depending on permissions.",
              cases: createPrecedent(body.caseId, "Remove")
            });
            return;
          }

          if (req.method === "POST" && url.pathname === "/api/precedents") {
            const body = await readBody<{ caseId: string }>(req);
            writeJson(res, createPrecedent(body.caseId));
            return;
          }

          if (req.method === "DELETE" && url.pathname.startsWith("/api/precedents/")) {
            const id = decodeURIComponent(url.pathname.replace("/api/precedents/", ""));
            memory.cases = memory.cases.filter((precedent) => precedent.id !== id);
            writeJson(res, memory.cases);
            return;
          }

          if (req.method === "POST" && url.pathname === "/api/finalize") {
            const body = await readBody<{ caseId: string }>(req);
            const votes = memory.votes.filter((vote) => vote.caseId === body.caseId);
            const decision =
              (["Remove", "Lock", "Needs Senior Mod", "Escalate", "Approve"] as VoteDecision[]).sort(
                (a, b) => votes.filter((vote) => vote.decision === b).length - votes.filter((vote) => vote.decision === a).length
              )[0] ?? "Remove";
            writeJson(res, {
              message: `Decision finalized as ${decision}. Saved to the Precedent Library.`,
              cases: createPrecedent(body.caseId, decision),
              votes
            });
            return;
          }

          if (req.method === "POST" && url.pathname === "/api/settings") {
            memory.settings = await readBody<RuleRoomSettings>(req);
            writeJson(res, memory.settings);
            return;
          }

          writeJson(res, { error: "Not found" }, 404);
        } catch (error) {
          writeJson(res, { error: error instanceof Error ? error.message : "Local RuleRoom API error" }, 500);
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), localRuleRoomApi()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src")
    },
    conditions: isServer ? [] : ["browser"]
  },
  build: isServer
    ? {
        ssr: "src/server/index.ts",
        outDir: "dist/server",
        emptyOutDir: false,
        target: "node20",
        rollupOptions: {
          output: {
            entryFileNames: "index.js"
          }
        }
      }
    : {
        outDir: "dist/client",
        emptyOutDir: true
      },
  server: {}
});
