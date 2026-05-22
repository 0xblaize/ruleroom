"use client";

import { useMemo, useState } from "react";
import type { CurrentContent, MatchResult, Vote, VoteDecision } from "@/types";

interface Props {
  content: CurrentContent;
  match?: MatchResult;
  votes: Vote[];
  onSubmitVote: (decision: VoteDecision, reason: string, anonymous: boolean) => void;
  onFinalize: () => void;
}

const decisions: VoteDecision[] = ["Approve", "Remove", "Lock", "Escalate", "Needs Senior Mod"];

export function VoteRoom({ content, match, votes, onSubmitVote, onFinalize }: Props) {
  const [decision, setDecision] = useState<VoteDecision>("Approve");
  const [reason, setReason] = useState("Legitimate grey-area case. Follow the closest precedent unless senior mods disagree.");
  const [anonymous, setAnonymous] = useState(false);
  const counts = useMemo(() => {
    return decisions.reduce<Record<string, number>>((acc, item) => {
      acc[item] = votes.filter((vote) => vote.decision === item).length;
      return acc;
    }, {});
  }, [votes]);
  const max = Math.max(1, ...Object.values(counts));

  return (
    <section className="vote-grid">
      <article className="post-card">
        <div className="split-row">
          <div>
            <strong>{content.author}</strong>
            <div className="post-meta">User Trust Level 3 • Posted 4h ago</div>
          </div>
          <span className="tag">Discussion</span>
        </div>
        <h1 className="post-title">{content.title}</h1>
        <p className="post-body">{content.body}</p>
        {match && (
          <div className="reason-box">
            Current suggested precedent: <strong>{match.precedentCase.title}</strong> at {match.similarityScore}% similarity.
            Suggested action: {match.suggestedAction}
          </div>
        )}
      </article>
      <aside className="list">
        <div className="card">
          <div className="split-row">
            <h2>Your Vote</h2>
            <span className="pill">Required</span>
          </div>
          <div className="list">
            {decisions.map((item) => (
              <button
                className={`btn full ${decision === item ? "primary" : ""}`}
                key={item}
                onClick={() => setDecision(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <label style={{ display: "block", marginTop: 16 }}>
            <span className="label">Reason</span>
            <textarea className="textarea" value={reason} onChange={(event) => setReason(event.target.value)} />
          </label>
          <label className="meta-row" style={{ marginTop: 12 }}>
            <input type="checkbox" checked={anonymous} onChange={(event) => setAnonymous(event.target.checked)} />
            Make anonymous
          </label>
          <button className="btn primary full" style={{ marginTop: 14 }} onClick={() => onSubmitVote(decision, reason, anonymous)}>
            Submit Vote
          </button>
        </div>
        <div className="card">
          <h2>Vote Summary</h2>
          <p className="muted">Initial consensus forming among {votes.length} participants.</p>
          <div className="list">
            {decisions.map((item) => (
              <div key={item}>
                <div className="split-row"><span>{item}</span><strong>{counts[item]}</strong></div>
                <div className="progress"><span style={{ width: `${(counts[item] / max) * 100}%` }} /></div>
              </div>
            ))}
          </div>
          <hr style={{ border: 0, borderTop: "1px solid var(--line)", margin: "18px 0" }} />
          <span className="label">Recent Reasons</span>
          <div className="list" style={{ marginTop: 10 }}>
            {votes.slice(-3).reverse().map((vote) => (
              <div key={vote.id}>
                <strong>{vote.anonymous ? "Anonymous Mod" : vote.modUsername}</strong> <span className="pill">Voted {vote.decision}</span>
                <p className="muted">{vote.reason}</p>
              </div>
            ))}
          </div>
        </div>
        <button className="btn primary full" onClick={onFinalize}>Finalize Decision</button>
      </aside>
    </section>
  );
}
