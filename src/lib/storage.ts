"use client";

import type { PrecedentCase, RuleRoomSettings, Vote } from "@/types";
import { seedCases, seedSettings, seedVotes } from "@/lib/seed";

const CASES_KEY = "ruleroom.precedents";
const SETTINGS_KEY = "ruleroom.settings";
const VOTES_KEY = "ruleroom.votes";
const ACTIONS_KEY = "ruleroom.actions";

function readJson<T>(key: string, fallback: T): T {
  try {
    const item = window.localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Browser storage can fail in private or restricted contexts; the UI keeps working with in-memory state.
  }
}

export function loadInitialData(): {
  cases: PrecedentCase[];
  settings: RuleRoomSettings;
  votes: Vote[];
  storageFailed: boolean;
} {
  if (typeof window === "undefined") {
    return { cases: seedCases, settings: seedSettings, votes: seedVotes, storageFailed: false };
  }

  try {
    if (!window.localStorage.getItem(CASES_KEY)) writeJson(CASES_KEY, seedCases);
    if (!window.localStorage.getItem(SETTINGS_KEY)) writeJson(SETTINGS_KEY, seedSettings);
    if (!window.localStorage.getItem(VOTES_KEY)) writeJson(VOTES_KEY, seedVotes);

    return {
      cases: readJson(CASES_KEY, seedCases),
      settings: readJson(SETTINGS_KEY, seedSettings),
      votes: readJson(VOTES_KEY, seedVotes),
      storageFailed: false
    };
  } catch {
    return { cases: seedCases, settings: seedSettings, votes: seedVotes, storageFailed: true };
  }
}

export function saveCases(cases: PrecedentCase[]): void {
  writeJson(CASES_KEY, cases);
}

export function saveSettings(settings: RuleRoomSettings): void {
  writeJson(SETTINGS_KEY, settings);
}

export function saveVotes(votes: Vote[]): void {
  writeJson(VOTES_KEY, votes);
}

export function logAction(message: string): void {
  const actions = readJson<string[]>(ACTIONS_KEY, []);
  writeJson(ACTIONS_KEY, [`${new Date().toISOString()} ${message}`, ...actions].slice(0, 25));
}
