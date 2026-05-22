"use client";

import type { CurrentContent, MatchResult } from "@/types";
import { generateAiClerkSummary } from "@/lib/aiClerk";

interface Props {
  content: CurrentContent;
  match?: MatchResult;
  aiEnabled: boolean;
  onApply: () => void;
  onVote: () => void;
  onSave: () => void;
  onIgnore: () => void;
}

function verdictClass(verdict: string): string {
  if (verdict.includes("Removed")) return "removed";
  if (verdict.includes("Approved")) return "approved";
  if (verdict.includes("Locked")) return "locked";
  return "redirected";
}

export function PrecedentMatchCard({ content, match, aiEnabled, onApply, onVote, onSave, onIgnore }: Props) {
  if (!match) {
    return (
      <aside className="card">
        <h2>No Strong Match Found</h2>
        <p className="muted">RuleRoom did not find a precedent above the current sensitivity threshold.</p>
        <div className="empty">Send this to the vote room or save the final outcome as a new precedent.</div>
        <div className="button-row" style={{ marginTop: 16 }}>
          <button className="btn primary" onClick={onVote}>Send to Mod Vote</button>
          <button className="btn" onClick={onSave}>Save as New Precedent</button>
        </div>
      </aside>
    );
  }

  const precedent = match.precedentCase;
  const voteSummary = Object.entries(precedent.votes)
    .filter(([, value]) => value > 0)
    .map(([key, value]) => `${value} ${key}`)
    .join(" / ");

  return (
    <aside className="card match-card">
      <div className="split-row">
        <strong style={{ color: "var(--blue)" }}>Precedent Match Found</strong>
        <span className="score">{match.similarityScore}% Similarity</span>
      </div>
      <h2>{precedent.title}</h2>
      <p className="muted">Matched on {new Date(precedent.createdAt).toLocaleDateString()}</p>
      <div className="tag-row">
        <span className="tag">{precedent.ruleName}</span>
        <span className={`verdict ${verdictClass(precedent.verdict)}`}>Verdict: {precedent.verdict}</span>
      </div>
      <div className="panel" style={{ boxShadow: "none", marginTop: 18 }}>
        <span className="label">Mod Consensus</span>
        <strong>{voteSummary}</strong>
      </div>
      <div style={{ marginTop: 18 }}>
        <span className="label">Matched Terms</span>
        <div className="tag-row" style={{ marginTop: 8 }}>
          {match.matchedTerms.map((term) => <span className="tag" key={term}>{term}</span>)}
        </div>
      </div>
      {aiEnabled && (
        <div style={{ marginTop: 18 }}>
          <span className="label">AI Clerk Summary</span>
          <p className="reason-box">{generateAiClerkSummary(content, match)}</p>
        </div>
      )}
      <div style={{ marginTop: 18 }}>
        <span className="label">Suggested Action</span>
        <p><strong>{match.suggestedAction}</strong></p>
      </div>
      <div className="list">
        <button className="btn success full" onClick={onApply}>Apply Suggested Action</button>
        <div className="button-row">
          <button className="btn" onClick={onVote}>Send to Mod Vote</button>
          <button className="btn" onClick={onSave}>Save as New Precedent</button>
        </div>
        <button className="btn ghost full" onClick={onIgnore}>Ignore Match</button>
      </div>
    </aside>
  );
}
