import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveDefaultTripId } from "./trip";
import type { Trip } from "./trip";
import type { Member, Expense, RecordedSettlement } from "./types";

const emptyMembers: Member[] = [];
const emptyExpenses: Expense[] = [];
const emptySettlements: RecordedSettlement[] = [];

function makeTrip(overrides: Partial<Trip> & { id: string }): Trip {
  return {
    name: overrides.id,
    dates: "",
    status: "active",
    members: emptyMembers,
    expenses: emptyExpenses,
    settlements: emptySettlements,
    ...overrides,
  };
}

describe("resolveDefaultTripId", () => {
  it("returns null for empty trips", () => {
    assert.equal(resolveDefaultTripId([]), null);
  });

  it("CASE A — Active + Upcoming + Completed → Active", () => {
    const trips = [
      makeTrip({ id: "completed-1", startDate: "2026-06-01", endDate: "2026-06-10" }),
      makeTrip({ id: "active-1", startDate: "2026-09-01", endDate: "2026-09-20" }),
      makeTrip({ id: "upcoming-1", startDate: "2026-10-10", endDate: "2026-10-15" }),
    ];
    assert.equal(resolveDefaultTripId(trips), "active-1");
  });

  it("CASE B — 2 Active → most recently started", () => {
    const trips = [
      makeTrip({ id: "active-a", startDate: "2026-09-01", endDate: "2026-09-20" }),
      makeTrip({ id: "active-b", startDate: "2026-09-10", endDate: "2026-09-18" }),
    ];
    assert.equal(resolveDefaultTripId(trips), "active-b");
  });

  it("CASE C — Upcoming only → nearest Upcoming", () => {
    const trips = [
      makeTrip({ id: "up-c", startDate: "2026-10-10" }),
      makeTrip({ id: "up-a", startDate: "2026-09-25" }),
      makeTrip({ id: "up-b", startDate: "2026-11-01" }),
    ];
    assert.equal(resolveDefaultTripId(trips), "up-a");
  });

  it("CASE D — 3 Upcoming → earliest start", () => {
    const trips = [
      makeTrip({ id: "u3", startDate: "2026-12-01" }),
      makeTrip({ id: "u1", startDate: "2026-10-01" }),
      makeTrip({ id: "u2", startDate: "2026-11-01" }),
    ];
    assert.equal(resolveDefaultTripId(trips), "u1");
  });

  it("CASE E — Completed only → most recently completed", () => {
    const trips = [
      makeTrip({ id: "c-a", startDate: "2026-06-01", endDate: "2026-06-10" }),
      makeTrip({ id: "c-b", startDate: "2026-08-01", endDate: "2026-09-12" }),
      makeTrip({ id: "c-c", startDate: "2026-05-01", endDate: "2026-05-20" }),
    ];
    assert.equal(resolveDefaultTripId(trips), "c-b");
  });

  it("CASE F — multiple Completed → latest end date", () => {
    const trips = [
      makeTrip({ id: "c1", startDate: "2026-01-01", endDate: "2026-03-01" }),
      makeTrip({ id: "c2", startDate: "2026-06-01", endDate: "2026-08-15" }),
      makeTrip({ id: "c3", startDate: "2026-04-01", endDate: "2026-07-01" }),
    ];
    assert.equal(resolveDefaultTripId(trips), "c2");
  });

  it("CASE G — no trips → null", () => {
    assert.equal(resolveDefaultTripId([]), null);
  });

  it("CASE H — equal Active start dates → deterministic ID tie-break", () => {
    const trips = [
      makeTrip({ id: "active-z", startDate: "2026-09-15", endDate: "2026-09-20" }),
      makeTrip({ id: "active-a", startDate: "2026-09-15", endDate: "2026-09-18" }),
    ];
    assert.equal(resolveDefaultTripId(trips), "active-a");
  });

  it("CASE I — equal Upcoming start dates → deterministic ID tie-break", () => {
    const trips = [
      makeTrip({ id: "up-z", startDate: "2026-10-10" }),
      makeTrip({ id: "up-a", startDate: "2026-10-10" }),
    ];
    assert.equal(resolveDefaultTripId(trips), "up-a");
  });

  it("CASE J — equal Completed end dates → deterministic ID tie-break", () => {
    const trips = [
      makeTrip({ id: "c-z", startDate: "2026-06-01", endDate: "2026-08-10" }),
      makeTrip({ id: "c-a", startDate: "2026-06-01", endDate: "2026-08-10" }),
    ];
    assert.equal(resolveDefaultTripId(trips), "c-a");
  });

  it("Active with no start date still selected over Upcoming", () => {
    const trips = [
      makeTrip({ id: "up-1", startDate: "2026-10-01" }),
      makeTrip({ id: "act-1", endDate: "2026-12-31" }),
    ];
    // act-1 has no start but has end in future → status active via computeTripStatus
    // It should be preferred over upcoming
    assert.equal(resolveDefaultTripId(trips), "act-1");
  });

  it("single trip returns that trip", () => {
    const trips = [makeTrip({ id: "only-one", startDate: "2026-09-01", endDate: "2026-09-10" })];
    assert.equal(resolveDefaultTripId(trips), "only-one");
  });

  it("does not depend on array order", () => {
    const trips = [
      makeTrip({ id: "c-2", startDate: "2026-03-01", endDate: "2026-04-01" }),
      makeTrip({ id: "a-1", startDate: "2026-09-05", endDate: "2026-09-25" }),
      makeTrip({ id: "u-3", startDate: "2026-10-20" }),
      makeTrip({ id: "c-1", startDate: "2026-01-01", endDate: "2026-02-01" }),
    ];
    // a-1 is active (Sep 5–25, today Sep 16) → should always win regardless of array position
    assert.equal(resolveDefaultTripId(trips), "a-1");
  });
});
