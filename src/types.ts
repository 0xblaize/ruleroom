export type Verdict = "Removed" | "Locked" | "Approved as Exception" | "Redirected" | "Approved";

export type VoteDecision = "Approve" | "Remove" | "Lock" | "Escalate" | "Needs Senior Mod" | "Redirect";

export interface VoteCounts {
  approve: number;
  remove: number;
  lock: number;
  redirect?: number;
  escalate?: number;
  needsSeniorMod?: number;
}

export interface PrecedentCase {
  id: string;
  title: string;
  contentSummary: string;
  sourcePostId?: string;
  sourceCommentId?: string;
  subreddit?: string;
  ruleId: string;
  ruleName: string;
  verdict: Verdict;
  votes: VoteCounts;
  tags: string[];
  reason: string;
  suggestedAction: string;
  createdAt: string;
  createdBy: string;
  samplePhrases: string[];
  decisionSummary?: string;
}

export interface ReviewCase {
  id: string;
  targetId: string;
  targetType: "post" | "comment";
  title: string;
  body: string;
  author: string;
  subreddit: string;
  status: "pending" | "resolved" | "ignored";
  createdAt: string;
  permalink?: string;
  matchResults: MatchResult[];
  suggestedAction?: string;
  finalDecision?: VoteDecision;
}

export interface Vote {
  id: string;
  caseId: string;
  modUsername: string;
  decision: VoteDecision;
  reason: string;
  anonymous: boolean;
  createdAt: string;
}

export interface SavedResponse {
  id: string;
  name: string;
  body: string;
}

export interface RuleRoomSettings {
  sensitivity: "Light" | "Balanced" | "Strict";
  confidenceThreshold: number;
  defaultWorkflow: "Suggest Only" | "Send to Vote";
  aiClerkEnabled: boolean;
  autoSuggestActions: boolean;
  defaultAnonymity: boolean;
  savedResponses: SavedResponse[];
  rules: Array<{ id: string; name: string; description: string }>;
  clerkGuidance: string;
}

export interface CurrentContent {
  id: string;
  author: string;
  subreddit: string;
  title: string;
  body: string;
  createdAt: string;
  reports: string[];
  stats: {
    upvotes: number;
    comments: number;
  };
  permalink?: string;
}

export interface MatchResult {
  precedentCase: PrecedentCase;
  similarityScore: number;
  matchedTerms: string[];
  matchedRule: string;
  explanation: string;
  suggestedAction: string;
}

export interface BootstrapData {
  content: CurrentContent;
  cases: PrecedentCase[];
  settings: RuleRoomSettings;
  votes: Vote[];
  matches: MatchResult[];
  reviewCase: ReviewCase;
}
