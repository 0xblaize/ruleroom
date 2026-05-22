import type { CurrentContent, PrecedentCase, RuleRoomSettings, Vote } from "@/types";

export const seedCases: PrecedentCase[] = [
  {
    id: "P-8821",
    title: "Subtle self-promotion in crypto discussion",
    contentSummary:
      "User framed a project recommendation as a neutral question, but the post mostly promoted one specific project and linked to its community.",
    sourcePostId: "t3_demo_crypto_promo",
    subreddit: "CryptoMoonShots",
    ruleId: "rule-3",
    ruleName: "Rule 3: No Self-Promotion",
    verdict: "Removed",
    votes: { remove: 4, approve: 1, lock: 0 },
    tags: ["crypto", "promotion", "shilling", "grey-area"],
    reason:
      "User framed a project recommendation as a neutral question, but the post mostly promoted one specific project and linked to its community.",
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
    decisionSummary:
      "The post looked neutral on the surface but centered one specific crypto project and community link."
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
    contentSummary:
      "The post technically broke formatting rules but created high-quality community discussion and was approved as an exception precedent.",
    sourcePostId: "t3_demo_meme_exception",
    subreddit: "ExampleSubreddit",
    ruleId: "rule-5",
    ruleName: "Rule 5: Post Format",
    verdict: "Approved as Exception",
    votes: { approve: 4, remove: 1, lock: 0 },
    tags: ["meme", "formatting", "exception", "high-value"],
    reason:
      "The post technically broke formatting rules but created high-quality community discussion and was approved as an exception precedent.",
    suggestedAction: "Approve and optionally apply an exception flair.",
    createdAt: "2026-02-15T12:00:00.000Z",
    createdBy: "Mod_Gamma",
    samplePhrases: ["meme", "format rules", "formatting", "exception", "high quality discussion"],
    decisionSummary: "Mods approved the post as a visible exception because discussion value outweighed format issues."
  },
  {
    id: "P-8611",
    title: "Beginner question already covered by wiki",
    contentSummary:
      "The question was valid but had already been answered in the official beginner wiki and weekly help thread.",
    sourcePostId: "t3_demo_wiki_redirect",
    subreddit: "ExampleSubreddit",
    ruleId: "rule-6",
    ruleName: "Rule 6: Use Megathreads and Wiki",
    verdict: "Redirected",
    votes: { redirect: 5, approve: 0, remove: 0, lock: 0 },
    tags: ["beginner", "repeated question", "wiki", "megathread"],
    reason:
      "The question was valid but had already been answered in the official beginner wiki and weekly help thread.",
    suggestedAction: "Reply with wiki link and redirect to the weekly help thread.",
    createdAt: "2026-01-10T12:00:00.000Z",
    createdBy: "Mod_Delta",
    samplePhrases: ["beginner question", "already covered", "wiki", "megathread", "weekly help"],
    decisionSummary: "The case was not bad-faith, but the right moderation memory was redirecting to existing resources."
  },
  {
    id: "P-8555",
    title: "Suspicious external giveaway link",
    contentSummary:
      "The post encouraged users to click an external giveaway link without verifiable source information.",
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

export const seedSettings: RuleRoomSettings = {
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
  clerkGuidance:
    "Focus on grey-area consistency. Identify subtle self promotion, unsafe links, civility escalation, and redirectable repeat questions. Keep humans in control."
};

export const demoContent: CurrentContent = {
  id: "demo-post-1",
  author: "u/CryptoInvestigator",
  subreddit: "r/CryptoMoonShots",
  title: "Is this new crypto project actually good or just another scam?",
  body:
    "I found this project and it looks promising. Their community is growing fast and the token seems early. Has anyone joined yet?",
  createdAt: "2026-05-21T09:35:00.000Z",
  reports: ["Reported: Rule 3", "High Spam Probability"],
  stats: {
    upvotes: 12,
    comments: 34
  },
  permalink: "/r/CryptoMoonShots/comments/demo_post"
};

export const seedVotes: Vote[] = [
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
