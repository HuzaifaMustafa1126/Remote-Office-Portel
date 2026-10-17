import assert from "node:assert/strict";
import test from "node:test";
import { applySandwichPolicy } from "../src/services/payroll.service.js";

const policy = {
  sandwich_leave_enabled: true,
  sandwich_apply_unapproved: true,
  sandwich_apply_unpaid: true,
  sandwich_apply_paid: false,
  sandwich_include_weekly_off: true,
  sandwich_include_company_holidays: true,
  sandwich_include_public_holidays: true,
  sandwich_include_adjacent: true,
  sandwich_include_between: true,
};
const rows = (...classifications) => classifications.map((classification, index) => ({
  date: `2026-01-${String(index + 1).padStart(2, "0")}`,
  classification,
  deduction: classification === "UNAUTHORIZED_ABSENCE" || classification === "DEDUCTIBLE_APPROVED_LEAVE" ? 1000 : 0,
}));
const sandwichCount = (result) => result.filter((day) => day.sandwich).length;

test("Monday absence includes the adjacent Sunday", () => {
  assert.equal(sandwichCount(applySandwichPolicy(rows("WEEKLY_OFF", "UNAUTHORIZED_ABSENCE"), policy, 1000)), 1);
});

test("Friday absence includes configured Saturday and Sunday weekly offs", () => {
  assert.equal(sandwichCount(applySandwichPolicy(rows("UNAUTHORIZED_ABSENCE", "WEEKLY_OFF", "WEEKLY_OFF"), policy, 1000)), 2);
});

test("public and company holidays apply on either adjacent side", () => {
  assert.equal(sandwichCount(applySandwichPolicy(rows("DEDUCTIBLE_APPROVED_LEAVE", "PUBLIC_HOLIDAY"), policy, 1000)), 1);
  assert.equal(sandwichCount(applySandwichPolicy(rows("COMPANY_HOLIDAY", "DEDUCTIBLE_APPROVED_LEAVE"), policy, 1000)), 1);
});

test("all intervening off days are deducted once between qualifying leave days", () => {
  const result = applySandwichPolicy(rows(
    "DEDUCTIBLE_APPROVED_LEAVE", "WEEKLY_OFF", "WEEKLY_OFF", "PUBLIC_HOLIDAY", "UNAUTHORIZED_ABSENCE",
  ), policy, 1000);
  assert.equal(sandwichCount(result), 3);
  assert.equal(result.reduce((sum, day) => sum + day.deduction, 0), 5000);
});

test("paid leave and excluded holiday types do not trigger deductions by default", () => {
  assert.equal(sandwichCount(applySandwichPolicy(rows("FREE_APPROVED_LEAVE", "WEEKLY_OFF"), policy, 1000)), 0);
  assert.equal(sandwichCount(applySandwichPolicy(rows("DEDUCTIBLE_APPROVED_LEAVE", "PUBLIC_HOLIDAY"), { ...policy, sandwich_include_public_holidays: false }, 1000)), 0);
});

