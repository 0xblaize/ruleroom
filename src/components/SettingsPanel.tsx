"use client";

import type { RuleRoomSettings } from "@/types";

interface Props {
  settings: RuleRoomSettings;
  onChange: (settings: RuleRoomSettings) => void;
}

export function SettingsPanel({ settings, onChange }: Props) {
  return (
    <section>
      <div className="split-row">
        <div>
          <h1>Settings</h1>
          <p className="muted">RuleRoom / Subreddit Config / Global Settings</p>
        </div>
        <button className="btn primary" onClick={() => onChange(settings)}>Save Changes</button>
      </div>
      <div className="settings-grid" style={{ marginTop: 24 }}>
        <div className="list">
          <article className="card settings-card">
            <h2>AI Clerk Tuning</h2>
            <label>
              <span className="label">Match Confidence Threshold: {settings.confidenceThreshold}%</span>
              <input
                className="field"
                type="range"
                min="45"
                max="90"
                value={settings.confidenceThreshold}
                onChange={(event) => onChange({ ...settings, confidenceThreshold: Number(event.target.value) })}
              />
            </label>
            <label>
              <span className="label">Similarity Sensitivity</span>
              <div className="segmented" style={{ marginTop: 8 }}>
                {(["Light", "Balanced", "Strict"] as const).map((item) => (
                  <button
                    className={settings.sensitivity === item ? "active" : ""}
                    key={item}
                    onClick={() => onChange({ ...settings, sensitivity: item })}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </label>
            <label>
              <span className="label">Default Workflow</span>
              <select
                className="select"
                value={settings.defaultWorkflow}
                onChange={(event) =>
                  onChange({ ...settings, defaultWorkflow: event.target.value as RuleRoomSettings["defaultWorkflow"] })
                }
              >
                <option>Suggest Only</option>
                <option>Send to Vote</option>
              </select>
            </label>
            <div className="switch-row">
              <div>
                <strong>AI Clerk Summary</strong>
                <p className="muted">Use deterministic template summaries. No external API calls.</p>
              </div>
              <button
                className={`switch ${settings.aiClerkEnabled ? "on" : ""}`}
                onClick={() => onChange({ ...settings, aiClerkEnabled: !settings.aiClerkEnabled })}
                aria-label="Toggle AI Clerk Summary"
              >
                <span />
              </button>
            </div>
            <div className="switch-row">
              <div>
                <strong>AI Suggests Actions</strong>
                <p className="muted">Show suggested actions without enforcing automatically.</p>
              </div>
              <button
                className={`switch ${settings.autoSuggestActions ? "on" : ""}`}
                onClick={() => onChange({ ...settings, autoSuggestActions: !settings.autoSuggestActions })}
                aria-label="Toggle suggested actions"
              >
                <span />
              </button>
            </div>
            <div className="switch-row">
              <div>
                <strong>Default Vote Anonymity</strong>
                <p className="muted">Start votes as anonymous by default in the vote room.</p>
              </div>
              <button
                className={`switch ${settings.defaultAnonymity ? "on" : ""}`}
                onClick={() => onChange({ ...settings, defaultAnonymity: !settings.defaultAnonymity })}
                aria-label="Toggle default anonymity"
              >
                <span />
              </button>
            </div>
            <label>
              <span className="label">Clerk Guidance Directives</span>
              <textarea
                className="textarea"
                value={settings.clerkGuidance}
                onChange={(event) => onChange({ ...settings, clerkGuidance: event.target.value })}
              />
            </label>
          </article>
          <article className="card settings-card">
            <h2>Saved Response Templates</h2>
            {settings.savedResponses.map((response) => (
              <label key={response.id}>
                <span className="label">{response.name}</span>
                <textarea
                  className="textarea"
                  value={response.body}
                  onChange={(event) =>
                    onChange({
                      ...settings,
                      savedResponses: settings.savedResponses.map((item) =>
                        item.id === response.id ? { ...item, body: event.target.value } : item
                      )
                    })
                  }
                />
              </label>
            ))}
          </article>
        </div>
        <div className="list">
          <article className="card settings-card">
            <h2>Rules List</h2>
            {settings.rules.map((rule) => (
              <div className="precedent-item" key={rule.id}>
                <strong>{rule.name}</strong>
                <p className="muted">{rule.description}</p>
              </div>
            ))}
          </article>
          <article className="card">
            <h2>Workflow Notes</h2>
            <p className="muted">Apply actions are logged for the MVP. Manual enforcement may be required depending on permissions.</p>
            <p className="tag">Discord Webhooks: Coming Soon</p>
            <p className="tag">AutoMod import: Coming Soon</p>
          </article>
        </div>
      </div>
    </section>
  );
}
