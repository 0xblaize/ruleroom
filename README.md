# RuleRoom

RuleRoom is a precedent memory system for Reddit moderators.

When a post falls into a grey area, mods can check similar past decisions, see how the team ruled before, vote on the current case, and save the final outcome as future precedent. AutoMod handles obvious spam. RuleRoom helps humans stay consistent when the decision is not obvious.

## Hackathon Category

Best New Mod Tool for the Reddit Mod Tools and Migrated Apps Hackathon.

## Problem

Moderator teams often make nuanced decisions that live only in memory, chat threads, or scattered mod notes. Similar grey-area posts can be handled differently depending on which moderator is online.

## Solution

RuleRoom gives mod teams a reusable moderation memory. A moderator can open a Reddit post or comment, click **Check Precedent**, compare it with saved cases, vote with the team, and save the final decision as future precedent.

## Core Features

- Native Devvit moderator menu action: **Check Precedent**.
- Real selected post/comment review using Reddit IDs passed from the menu action.
- Redis-backed precedent library, review cases, settings, votes, and action logs.
- Deterministic local matching engine with no paid AI or external vector database.
- Template-based AI Clerk explanation generated from precedent data.
- Functional Vote Room with persisted votes and vote summary.
- Finalize decision flow that saves the result back into the Precedent Library.
- Graceful fallback message when Reddit enforcement actions are unavailable.

## How It Works

1. A moderator opens a Reddit post or comment.
2. The moderator selects **Check Precedent** from the Reddit menu.
3. RuleRoom reads the target title/body/author/subreddit from the Reddit API.
4. The app loads saved precedent cases from Devvit Redis.
5. The local matcher scores title, body, rule/tag, keyword, and phrase overlap.
6. RuleRoom shows the top precedent match, AI Clerk reasoning, past verdict, vote history, and suggested action.
7. Mods can apply/log the suggested action, send the case to voting, or save it as a new precedent.
8. Finalized decisions become future moderation memory.

## Matching Weights

- Title similarity: 35%
- Body similarity: 30%
- Rule and tag similarity: 20%
- Phrase and keyword boost: 15%

Sensitivity thresholds:

- Light: 45%
- Balanced: 60%
- Strict: 75%

## Tech Stack

- Reddit Devvit Web
- Devvit Redis
- Reddit API through Devvit
- React
- Vite
- TypeScript
- Deterministic local matching and templated AI Clerk summaries

## Devvit Setup

Install dependencies:

```bash
npm install
```

Build the Devvit Web client and server:

```bash
npm run build
```

This produces:

- `dist/client` for the Devvit Web UI.
- `dist/server/index.js` for API endpoints and the menu action handler.

The app config lives in `devvit.json`.

## Local Development

Run the Vite client:

```bash
npm run dev
```

The UI has a local fallback mode if the Devvit API is not available. The full hackathon flow should be tested through Devvit because the winning path depends on the native Reddit menu action and Redis persistence.

## Demo Flow

Use a grey-area post:

**Title:** Is this crypto project worth joining or is it a scam?

**Body:** I found this new token called NebulaLink. They claim to be the first decentralized bridge between layer 1 and layer 3. Their website looks slick and they have a 50k telegram community. Does anyone have experience with their dev team? I am thinking of putting in 2 ETH but wanted to check with the experts here first.

Expected result:

- Best match: **Subtle self-promotion in crypto discussion**
- High similarity score
- AI Clerk explains that it resembles project promotion framed as a neutral question
- Suggested action: remove as self promotion and redirect to the weekly promo thread

Winning loop:

Post appears → Check Precedent → Match found → Send to Mod Vote → Finalize Decision → Saved in Precedent Library

## Reliability Notes

- Redis is seeded with demo cases if empty.
- Empty post/comment bodies are handled.
- No user content is sent to external AI APIs.
- Moderation actions are logged first; manual enforcement may be required depending on subreddit permissions.
- Risky private-signal labels are avoided: no verified email, no shadowban risk, no unsupported view count.

## Future Improvements

- Add optional real moderation actions for remove, lock, flair, and saved response comments.
- Add richer subreddit rule import.
- Add precedent edit history and audit trail.
- Add mod-only route gating once final Devvit install context is available.
