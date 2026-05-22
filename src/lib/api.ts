"use client";

import type { BootstrapData, PrecedentCase, RuleRoomSettings, Vote, VoteDecision } from "@/types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return (await response.json()) as T;
}

export async function fetchBootstrap(targetId?: string | null): Promise<BootstrapData> {
  const params = targetId ? `?targetId=${encodeURIComponent(targetId)}` : "";
  return request<BootstrapData>(`/api/bootstrap${params}`);
}

export async function submitVote(caseId: string, decision: VoteDecision, reason: string, anonymous: boolean): Promise<Vote[]> {
  return request<Vote[]>("/api/votes", {
    method: "POST",
    body: JSON.stringify({ caseId, decision, reason, anonymous })
  });
}

export async function applySuggestedAction(caseId: string, suggestedAction: string): Promise<{ message: string; cases: PrecedentCase[] }> {
  return request<{ message: string; cases: PrecedentCase[] }>("/api/apply", {
    method: "POST",
    body: JSON.stringify({ caseId, suggestedAction })
  });
}

export async function savePrecedent(caseId: string): Promise<PrecedentCase[]> {
  return request<PrecedentCase[]>("/api/precedents", {
    method: "POST",
    body: JSON.stringify({ caseId })
  });
}

export async function deletePrecedent(id: string): Promise<PrecedentCase[]> {
  return request<PrecedentCase[]>(`/api/precedents/${encodeURIComponent(id)}`, {
    method: "DELETE"
  });
}

export async function finalizeDecision(caseId: string): Promise<{ message: string; cases: PrecedentCase[]; votes: Vote[] }> {
  return request<{ message: string; cases: PrecedentCase[]; votes: Vote[] }>("/api/finalize", {
    method: "POST",
    body: JSON.stringify({ caseId })
  });
}

export async function saveRemoteSettings(settings: RuleRoomSettings): Promise<RuleRoomSettings> {
  return request<RuleRoomSettings>("/api/settings", {
    method: "POST",
    body: JSON.stringify(settings)
  });
}
