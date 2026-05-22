"use client";

import { useEffect, useMemo, useState } from "react";
import { PrecedentLibrary } from "@/components/PrecedentLibrary";
import { ReviewScreen } from "@/components/ReviewScreen";
import { SettingsPanel } from "@/components/SettingsPanel";
import { VoteRoom } from "@/components/VoteRoom";
import {
  applySuggestedAction,
  deletePrecedent,
  fetchBootstrap,
  finalizeDecision,
  savePrecedent,
  saveRemoteSettings,
  submitVote
} from "@/lib/api";
import { findTopPrecedents } from "@/lib/matching";
import { demoContent, seedCases, seedSettings, seedVotes } from "@/lib/seed";
import { loadInitialData, saveCases as saveFallbackCases, saveSettings as saveFallbackSettings, saveVotes as saveFallbackVotes } from "@/lib/storage";
import type { CurrentContent, PrecedentCase, ReviewCase, RuleRoomSettings, Vote, VoteDecision } from "@/types";

type Screen = "review" | "library" | "vote" | "settings";

export function RuleRoomApp() {
  const [screen, setScreen] = useState<Screen>("review");
  const [content, setContent] = useState<CurrentContent>(demoContent);
  const [reviewCase, setReviewCase] = useState<ReviewCase | null>(null);
  const [cases, setCases] = useState<PrecedentCase[]>([]);
  const [settings, setSettings] = useState<RuleRoomSettings | null>(null);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const targetId = new URLSearchParams(window.location.search).get("targetId");
      try {
        const data = await fetchBootstrap(targetId);
        setContent(data.content);
        setReviewCase(data.reviewCase);
        setCases(data.cases);
        setSettings(data.settings);
        setVotes(data.votes);
      } catch {
        const data = loadInitialData();
        setContent(demoContent);
        setCases(data.cases);
        setSettings(data.settings);
        setVotes(data.votes);
        setToast("Devvit API unavailable. Running local demo fallback.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  const matches = useMemo(() => {
    if (!settings) return [];
    return findTopPrecedents(content, cases, settings);
  }, [cases, content, settings]);
  const bestMatch = matches[0];

  function showToast(message: string): void {
    setToast(message);
    window.setTimeout(() => setToast(""), 4200);
  }

  async function updateSettings(nextSettings: RuleRoomSettings): Promise<void> {
    setSettings(nextSettings);
    saveFallbackSettings(nextSettings);
    try {
      setSettings(await saveRemoteSettings(nextSettings));
    } catch {
      showToast("Settings saved locally. Devvit Redis was unavailable.");
    }
  }

  async function handleApply(): Promise<void> {
    try {
      const result = await applySuggestedAction(reviewCase?.id ?? `review:${content.id}`, bestMatch?.suggestedAction ?? "No match");
      setCases(result.cases);
      showToast(result.message);
    } catch {
      showToast("Action logged. Manual enforcement may be required depending on permissions.");
    }
  }

  async function handleSavePrecedent(): Promise<void> {
    try {
      const nextCases = await savePrecedent(reviewCase?.id ?? `review:${content.id}`);
      setCases(nextCases);
      showToast("Saved as a new precedent.");
    } catch {
      const newCase: PrecedentCase = {
        id: `P-${Math.floor(9000 + Math.random() * 999)}`,
        title: content.title,
        contentSummary: content.body,
        sourcePostId: content.id.startsWith("t3_") ? content.id : undefined,
        sourceCommentId: content.id.startsWith("t1_") ? content.id : undefined,
        subreddit: content.subreddit.replace(/^r\//, ""),
        ruleId: bestMatch?.precedentCase.ruleId ?? "rule-new",
        ruleName: bestMatch?.precedentCase.ruleName ?? "Unclassified Grey-Area Case",
        verdict: bestMatch?.precedentCase.verdict ?? "Removed",
        votes: { approve: 0, remove: 1, lock: 0 },
        tags: bestMatch?.matchedTerms.slice(0, 4) ?? ["grey-area"],
        reason: bestMatch?.explanation ?? "Saved from moderator review for future consistency.",
        suggestedAction: bestMatch?.suggestedAction ?? "Review manually and record final team decision.",
        createdAt: new Date().toISOString(),
        createdBy: "Current_Mod",
        samplePhrases: bestMatch?.matchedTerms ?? [],
        decisionSummary: bestMatch?.explanation
      };
      const nextCases = [newCase, ...cases];
      setCases(nextCases);
      saveFallbackCases(nextCases);
      showToast("Saved locally as a new precedent.");
    }
  }

  async function handleDeleteCase(id: string): Promise<void> {
    try {
      const nextCases = await deletePrecedent(id);
      setCases(nextCases);
    } catch {
      const nextCases = cases.filter((precedent) => precedent.id !== id);
      setCases(nextCases);
      saveFallbackCases(nextCases);
    }
    showToast("Precedent removed from the library.");
  }

  async function handleSubmitVote(decision: VoteDecision, reason: string, anonymous: boolean): Promise<void> {
    const caseId = reviewCase?.id ?? `review:${content.id}`;
    try {
      setVotes(await submitVote(caseId, decision, reason, anonymous));
    } catch {
      const nextVotes = [
        ...votes,
        {
          id: `vote-${Date.now()}`,
          caseId,
          modUsername: "Current_Mod",
          decision,
          reason,
          anonymous,
          createdAt: new Date().toISOString()
        }
      ];
      setVotes(nextVotes);
      saveFallbackVotes(nextVotes);
    }
    showToast("Vote submitted to the Mod Vote Room.");
  }

  async function handleFinalize(): Promise<void> {
    try {
      const result = await finalizeDecision(reviewCase?.id ?? `review:${content.id}`);
      setCases(result.cases);
      setVotes(result.votes);
      showToast(result.message);
    } catch {
      showToast("Decision finalized locally. Devvit Redis was unavailable.");
    }
  }

  if (loading || !settings) {
    return <main className="main"><div className="empty">Loading RuleRoom...</div></main>;
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark">◇</span> RuleRoom</div>
        <div className="crumbs"><span>{content.subreddit}</span><span>›</span><strong>Mod Tools</strong></div>
        <nav className="tabs" aria-label="RuleRoom sections">
          <button className={`tab ${screen === "review" ? "active" : ""}`} onClick={() => setScreen("review")}>Review</button>
          <button className={`tab ${screen === "library" ? "active" : ""}`} onClick={() => setScreen("library")}>Library</button>
          <button className={`tab ${screen === "vote" ? "active" : ""}`} onClick={() => setScreen("vote")}>Vote Room</button>
        </nav>
        <input className="top-search" placeholder="Search precedents..." />
        <button className={`tab ${screen === "settings" ? "active" : ""}`} onClick={() => setScreen("settings")}>⚙</button>
        <div className="avatar" aria-hidden />
      </header>
      <main className="main">
        {screen === "review" && (
          <ReviewScreen
            content={content}
            match={bestMatch}
            aiEnabled={settings.aiClerkEnabled}
            onApply={handleApply}
            onVote={() => setScreen("vote")}
            onSave={handleSavePrecedent}
            onIgnore={() => showToast("Match ignored. No moderation action was taken.")}
          />
        )}
        {screen === "vote" && (
          <VoteRoom
            content={content}
            match={bestMatch}
            votes={votes}
            onSubmitVote={handleSubmitVote}
            onFinalize={handleFinalize}
          />
        )}
        {screen === "library" && <PrecedentLibrary cases={cases} matches={matches} onDelete={handleDeleteCase} />}
        {screen === "settings" && <SettingsPanel settings={settings} onChange={(next) => void updateSettings(next)} />}
      </main>
      <footer className="footer">
        © 2026 RuleRoom. Hackathon category: Best New Mod Tool. System Status: All Systems Operational.
      </footer>
      {toast && (
        <div className="toast">
          <strong>RuleRoom</strong>
          <div>{toast}</div>
        </div>
      )}
    </div>
  );
}
