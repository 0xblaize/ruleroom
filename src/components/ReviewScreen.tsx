"use client";

import type { CurrentContent, MatchResult } from "@/types";
import { PrecedentMatchCard } from "@/components/PrecedentMatchCard";

interface Props {
  content: CurrentContent;
  match?: MatchResult;
  aiEnabled: boolean;
  onApply: () => void;
  onVote: () => void;
  onSave: () => void;
  onIgnore: () => void;
}

export function ReviewScreen(props: Props) {
  const { content } = props;

  return (
    <section className="review-grid">
      <div>
        <article className="post-card">
          <div className="split-row">
            <div>
              <strong>{content.author}</strong>
              <div className="post-meta">Posted 45 minutes ago in {content.subreddit}</div>
            </div>
            <span className="pill">Mod Review</span>
          </div>
          <h1 className="post-title">{content.title}</h1>
          <div className="tag-row">
            {content.reports.map((report) => <span className="verdict removed" key={report}>{report}</span>)}
          </div>
          <p className="post-body">{content.body || "No body text was provided for this item."}</p>
          <div className="metric-row">
            <div className="metric"><span className="label">Upvotes</span><strong>{content.stats.upvotes}</strong></div>
            <div className="metric"><span className="label">Comments</span><strong>{content.stats.comments}</strong></div>
            <div className="metric"><span className="label">Account</span><strong>Public signals only</strong></div>
          </div>
        </article>
        <div style={{ height: 28 }} />
        <article className="card">
          <h2>Moderation History for {content.author}</h2>
          <div className="list">
            <div className="precedent-item">
              <strong>Mod_Alpha</strong> <span className="pill">Warning Issued</span>
              <p className="muted">User asked similar questions without links. Given benefit of doubt.</p>
            </div>
            <div className="precedent-item">
              <strong>AutoMod</strong> <span className="pill">Filtered</span>
              <p className="muted">Post containing blacklisted promotional language was hidden.</p>
            </div>
          </div>
        </article>
      </div>
      <PrecedentMatchCard {...props} />
    </section>
  );
}
