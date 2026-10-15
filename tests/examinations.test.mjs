import test from "node:test";
import assert from "node:assert/strict";
import { summarizeExaminations, formatGrade, localDateKey } from "../lib/examinations.ts";

test("40/60 weights produce a weighted result rather than a simple average", () => {
  assert.equal(summarizeExaminations([{grade:2,weight:40},{grade:4,weight:60}]).grade,3.2);
});
test("relative weights need not total 100", () => {
  assert.equal(summarizeExaminations([{grade:1,weight:1},{grade:3,weight:3}]).grade,2.5);
});
test("ungraded examinations produce a provisional result and retain their planned weight", () => {
  const summary=summarizeExaminations([{grade:2,weight:40},{grade:null,weight:60}]);
  assert.equal(summary.grade,2);assert.equal(summary.provisional,true);assert.equal(summary.gradedWeight,40);assert.equal(summary.totalWeight,100);
});
test("no results are ungraded, while zero is a valid recorded result", () => {
  assert.equal(summarizeExaminations([]).grade,null);
  assert.equal(summarizeExaminations([{grade:null,weight:100}]).grade,null);
  assert.equal(summarizeExaminations([{grade:0,weight:100}]).grade,0);
});
test("precision matches the database calculation, with two decimals for display", () => {
  const result=summarizeExaminations([{grade:1,weight:1},{grade:2,weight:2}]).grade;
  assert.equal(result,1.6667);assert.equal(formatGrade(result),"1.67");assert.equal(formatGrade(null),"—");
});
test("semester dates use the local calendar date", () => {
  assert.equal(localDateKey(new Date(2026,0,2,23,30)),"2026-01-02");
});
