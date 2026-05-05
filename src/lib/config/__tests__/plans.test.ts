/**
 * Plan config unit tests.
 * Uses Node.js built-in test runner — no external dependencies required.
 * Run: npm test
 *
 * These tests cover the pure plan limit logic only.
 * Integration tests (actual DB enforcement) require a live Supabase instance.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PLAN_CONFIG, getPlanLimits } from '../plans.ts';

// ─── PLAN_CONFIG structure ────────────────────────────────────────────────────

describe('PLAN_CONFIG — structure', () => {
  it('defines all required plans', () => {
    assert.ok(PLAN_CONFIG.free,       'free plan missing');
    assert.ok(PLAN_CONFIG.starter,    'starter plan missing');
    assert.ok(PLAN_CONFIG.pro,        'pro plan missing');
    assert.ok(PLAN_CONFIG.enterprise, 'enterprise plan missing (backward compat)');
  });

  it('each plan has all required fields', () => {
    const requiredFields = [
      'maxCustomers',
      'maxPrograms',
      'allowedProgramTypes',
      'transactionHistoryLimit',
      'rewardCatalog',
      'exportCSV',
      'prioritySupport',
    ];
    for (const [name, limits] of Object.entries(PLAN_CONFIG)) {
      for (const field of requiredFields) {
        assert.ok(field in limits, `${name}.${field} is missing`);
      }
    }
  });
});

// ─── FREE plan limits ─────────────────────────────────────────────────────────

describe('FREE plan', () => {
  const limits = PLAN_CONFIG.free;

  it('maxCustomers = 50', () => {
    assert.equal(limits.maxCustomers, 50);
  });

  it('maxPrograms = 1', () => {
    assert.equal(limits.maxPrograms, 1);
  });

  it('allows only points and stamps', () => {
    assert.deepEqual(limits.allowedProgramTypes, ['points', 'stamp']);
    assert.ok(!limits.allowedProgramTypes.includes('visit'),    'visit should NOT be allowed');
    assert.ok(!limits.allowedProgramTypes.includes('cashback'), 'cashback should NOT be allowed');
  });

  it('transactionHistoryLimit = 50', () => {
    assert.equal(limits.transactionHistoryLimit, 50);
  });

  it('rewardCatalog = false', () => {
    assert.equal(limits.rewardCatalog, false);
  });

  it('exportCSV = false', () => {
    assert.equal(limits.exportCSV, false);
  });

  it('prioritySupport = false', () => {
    assert.equal(limits.prioritySupport, false);
  });
});

// ─── STARTER plan limits ──────────────────────────────────────────────────────

describe('STARTER plan', () => {
  const limits = PLAN_CONFIG.starter;

  it('maxCustomers = 500', () => {
    assert.equal(limits.maxCustomers, 500);
  });

  it('maxPrograms = 3', () => {
    assert.equal(limits.maxPrograms, 3);
  });

  it('allows points, stamps and visits (not cashback)', () => {
    assert.ok(limits.allowedProgramTypes.includes('points'), 'points must be allowed');
    assert.ok(limits.allowedProgramTypes.includes('stamp'),  'stamp must be allowed');
    assert.ok(limits.allowedProgramTypes.includes('visit'),  'visit must be allowed');
    assert.ok(!limits.allowedProgramTypes.includes('cashback'), 'cashback should NOT be allowed');
  });

  it('transactionHistoryLimit = null (unlimited)', () => {
    assert.equal(limits.transactionHistoryLimit, null);
  });

  it('rewardCatalog = true', () => {
    assert.equal(limits.rewardCatalog, true);
  });

  it('exportCSV = false', () => {
    assert.equal(limits.exportCSV, false);
  });
});

// ─── PRO plan limits ──────────────────────────────────────────────────────────

describe('PRO plan', () => {
  const limits = PLAN_CONFIG.pro;

  it('maxCustomers = null (unlimited)', () => {
    assert.equal(limits.maxCustomers, null);
  });

  it('maxPrograms = null (unlimited)', () => {
    assert.equal(limits.maxPrograms, null);
  });

  it('allows all program types', () => {
    const allTypes = ['points', 'stamp', 'visit', 'cashback'];
    for (const type of allTypes) {
      assert.ok(
        limits.allowedProgramTypes.includes(type as never),
        `PRO should allow ${type}`
      );
    }
  });

  it('transactionHistoryLimit = null (unlimited)', () => {
    assert.equal(limits.transactionHistoryLimit, null);
  });

  it('rewardCatalog = true', () => {
    assert.equal(limits.rewardCatalog, true);
  });

  it('exportCSV = true', () => {
    assert.equal(limits.exportCSV, true);
  });

  it('prioritySupport = true', () => {
    assert.equal(limits.prioritySupport, true);
  });
});

// ─── enterprise backward compat ───────────────────────────────────────────────

describe('enterprise plan (backward compat)', () => {
  it('has same limits as PRO', () => {
    assert.deepEqual(PLAN_CONFIG.enterprise, PLAN_CONFIG.pro);
  });
});

// ─── getPlanLimits() ──────────────────────────────────────────────────────────

describe('getPlanLimits()', () => {
  it('returns correct limits for known plans', () => {
    assert.deepEqual(getPlanLimits('free'),       PLAN_CONFIG.free);
    assert.deepEqual(getPlanLimits('starter'),    PLAN_CONFIG.starter);
    assert.deepEqual(getPlanLimits('pro'),        PLAN_CONFIG.pro);
    assert.deepEqual(getPlanLimits('enterprise'), PLAN_CONFIG.enterprise);
  });

  it('falls back to FREE limits for unknown plan values', () => {
    assert.deepEqual(getPlanLimits('unknown_plan'), PLAN_CONFIG.free);
    assert.deepEqual(getPlanLimits(''),             PLAN_CONFIG.free);
  });

  it('FREE fallback prevents accidental unlimited access', () => {
    const fallback = getPlanLimits('legacy_plan');
    assert.notEqual(fallback.maxCustomers, null,  'fallback must NOT have unlimited customers');
    assert.notEqual(fallback.maxPrograms, null,   'fallback must NOT have unlimited programs');
    assert.equal(fallback.exportCSV, false,       'fallback must NOT allow CSV export');
    assert.equal(fallback.rewardCatalog, false,   'fallback must NOT allow reward catalog');
  });
});

// ─── Business rules cross-check ───────────────────────────────────────────────

describe('business rule invariants', () => {
  it('each higher plan has >= customers than the plan below it', () => {
    // null = unlimited, treated as Infinity
    const toNum = (n: number | null) => n ?? Infinity;
    assert.ok(toNum(PLAN_CONFIG.starter.maxCustomers) >= toNum(PLAN_CONFIG.free.maxCustomers));
    assert.ok(toNum(PLAN_CONFIG.pro.maxCustomers)     >= toNum(PLAN_CONFIG.starter.maxCustomers));
  });

  it('each higher plan has >= programs than the plan below it', () => {
    const toNum = (n: number | null) => n ?? Infinity;
    assert.ok(toNum(PLAN_CONFIG.starter.maxPrograms) >= toNum(PLAN_CONFIG.free.maxPrograms));
    assert.ok(toNum(PLAN_CONFIG.pro.maxPrograms)     >= toNum(PLAN_CONFIG.starter.maxPrograms));
  });

  it('rewardCatalog is not available on FREE', () => {
    assert.equal(PLAN_CONFIG.free.rewardCatalog, false);
  });

  it('exportCSV is only available on PRO (and enterprise)', () => {
    assert.equal(PLAN_CONFIG.free.exportCSV,    false);
    assert.equal(PLAN_CONFIG.starter.exportCSV, false);
    assert.equal(PLAN_CONFIG.pro.exportCSV,     true);
    assert.equal(PLAN_CONFIG.enterprise.exportCSV, true);
  });

  it('visit program type not available on FREE', () => {
    assert.ok(!PLAN_CONFIG.free.allowedProgramTypes.includes('visit'));
  });

  it('cashback program type only available on PRO+', () => {
    assert.ok(!PLAN_CONFIG.free.allowedProgramTypes.includes('cashback'));
    assert.ok(!PLAN_CONFIG.starter.allowedProgramTypes.includes('cashback'));
    assert.ok(PLAN_CONFIG.pro.allowedProgramTypes.includes('cashback'));
  });
});
