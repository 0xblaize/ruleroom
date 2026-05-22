"use client";

import { useMemo, useState } from "react";
import type { MatchResult, PrecedentCase } from "@/types";

interface Props {
  cases: PrecedentCase[];
  matches: MatchResult[];
  onDelete: (id: string) => void;
}

export function PrecedentLibrary({ cases, matches, onDelete }: Props) {
  const [selectedId, setSelectedId] = useState(cases[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const selected = cases.find((item) => item.id === selectedId) ?? cases[0];
  const filtered = useMemo(() => {
    const normalized = query.toLowerCase();
    return cases.filter((item) =>
      `${item.title} ${item.ruleName} ${item.reason} ${item.tags.join(" ")}`.toLowerCase().includes(normalized)
    );
  }, [cases, query]);

  return (
    <section className="library-grid">
      <aside className="panel" style={{ boxShadow: "none" }}>
        <h3>Filters</h3>
        <span className="label">Rules</span>
        {["Rule 2", "Rule 3", "Rule 4", "Rule 5", "Rule 6"].map((rule) => (
          <label className="meta-row" style={{ marginTop: 10 }} key={rule}>
            <input type="checkbox" /> {rule}
          </label>
        ))}
        <hr style={{ border: 0, borderTop: "1px solid var(--line)", margin: "24px 0" }} />
        <span className="label">Saved Filters</span>
        <p style={{ color: "var(--blue)" }}>High Similarity Appeals</p>
        <p className="muted">Recent Verdicts</p>
      </aside>
      <div>
        <div className="split-row">
          <div>
            <h1>Precedent Library</h1>
            <p className="muted">Search and audit saved moderation decisions.</p>
          </div>
          <input
            className="field"
            style={{ maxWidth: 340 }}
            placeholder="Search titles, rules, or excerpts..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="list" style={{ marginTop: 18 }}>
          {filtered.length === 0 && <div className="empty">No precedent cases match this search.</div>}
          {filtered.map((precedent) => {
            const matchScore = matches.find((match) => match.precedentCase.id === precedent.id)?.similarityScore;
            return (
              <article
                className={`precedent-item ${selected?.id === precedent.id ? "active" : ""}`}
                key={precedent.id}
                onClick={() => setSelectedId(precedent.id)}
              >
                <div className="meta-row">
                  <span className="pill">{precedent.id}</span>
                  <span className={`verdict ${precedent.verdict.includes("Removed") ? "removed" : "approved"}`}>
                    {precedent.verdict}
                  </span>
                  <span>• {new Date(precedent.createdAt).toLocaleDateString()}</span>
                </div>
                <h3>{precedent.title}</h3>
                <p className="muted">{precedent.reason}</p>
                <div className="split-row">
                  <span>{precedent.ruleName}</span>
                  <span className="label">AI Match {matchScore ?? 0}%</span>
                </div>
              </article>
            );
          })}
        </div>
      </div>
      <aside className="card">
        {selected ? (
          <>
            <div className="split-row">
              <span className="tag">Inspector</span>
              <button className="btn ghost" onClick={() => onDelete(selected.id)}>Delete</button>
            </div>
            <h2>{selected.title}</h2>
            <p className="muted">Reviewed by {selected.createdBy}</p>
            <span className="label">Rule Context</span>
            <p className="field">{selected.ruleName}</p>
            <span className="label">Decision Summary</span>
            <p className="reason-box">{selected.reason}</p>
            <span className="label">Tags</span>
            <div className="tag-row" style={{ marginTop: 8 }}>
              {selected.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}
            </div>
            <span className="label" style={{ marginTop: 18 }}>Similarity Keywords</span>
            <p>{selected.samplePhrases.join(", ")}</p>
          </>
        ) : (
          <div className="empty">No precedent selected.</div>
        )}
      </aside>
    </section>
  );
}
