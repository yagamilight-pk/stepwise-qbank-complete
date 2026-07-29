import { describe, expect, it } from "vitest";
import { initialState } from "@/lib/data";
import {
  LEARNER_STATE_SCHEMA_VERSION,
  mergeLearnerState,
  parseLearnerState,
  selectLearnerState,
} from "@/lib/learner-state";

describe("learner state contract", () => {
  it("selects only learner-owned fields and validates them strictly", () => {
    const state = selectLearnerState(initialState);
    expect(state.schemaVersion).toBe(LEARNER_STATE_SCHEMA_VERSION);
    expect(parseLearnerState(state)).toEqual(state);
    expect("questions" in state).toBe(false);
    expect("adminUsers" in state).toBe(false);
  });

  it("upgrades an accepted legacy schema marker", () => {
    const state = { ...selectLearnerState(initialState), schemaVersion: 1 };
    expect(parseLearnerState(state)?.schemaVersion).toBe(LEARNER_STATE_SCHEMA_VERSION);
  });

  it("rejects malformed, oversized, and unexpected data", () => {
    const state = selectLearnerState(initialState);
    expect(parseLearnerState({ ...state, unexpected: true })).toBeNull();
    expect(parseLearnerState({ ...state, learnerProfile: { ...state.learnerProfile, email: "not-an-email" } })).toBeNull();
    expect(parseLearnerState({ ...state, settings: { ...state.settings, dailyGoal: 999 } })).toBeNull();
    expect(parseLearnerState({ ...state, attempts: [{ id: "bad" }] })).toBeNull();
  });

  it("merges learner fields without overwriting the question bank or admin data", () => {
    const remote = {
      ...selectLearnerState(initialState),
      learnerProfile: { ...initialState.learnerProfile, name: "Remote Learner" },
      bookmarks: ["SW-1001"],
    };
    const merged = mergeLearnerState(initialState, remote);
    expect(merged.learnerProfile.name).toBe("Remote Learner");
    expect(merged.bookmarks).toEqual(["SW-1001"]);
    expect(merged.questions).toBe(initialState.questions);
    expect(merged.adminUsers).toBe(initialState.adminUsers);
  });
});
