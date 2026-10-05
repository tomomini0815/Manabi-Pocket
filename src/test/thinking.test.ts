import { describe, it, expect } from "vitest";
import { BANK, paramProblem } from "../lib/thinking";
import rawData from "../data/thinking-problems.json";

describe("Thinking Problems Bank & Generators", () => {
  it("手作り問題バンクの全問がスキーマを満たしていること", () => {
    expect(rawData.problems.length).toBeGreaterThanOrEqual(25);
    // BANK は validate() フィルタ済み
    expect(BANK.length).toBe(rawData.problems.length);

    for (const prob of BANK) {
      expect(prob.id).toBeTruthy();
      expect(prob.typeTag).toBeTruthy();
      expect(prob.difficulty).toBeGreaterThanOrEqual(1);
      expect(prob.difficulty).toBeLessThanOrEqual(5);
      expect(prob.question).toBeTruthy();
      expect(prob.answer).toBeTruthy();
      expect(prob.hints.length).toBe(3);
      expect(prob.altSolutions.length).toBeGreaterThanOrEqual(2);
      expect(prob.explanation).toBeTruthy();

      if (prob.answerType === "choice") {
        expect(prob.choices).toBeDefined();
        expect(prob.choices).toContain(prob.answer);
      }
    }
  });

  it("動的パラメータ問題（paramProblem）が全パターン正常に生成されること", () => {
    for (let seed = 1; seed <= 30; seed++) {
      const p = paramProblem(seed * 100 + 7);
      expect(p.id).toBeTruthy();
      expect(p.question).toBeTruthy();
      expect(p.answer).toBeTruthy();
      expect(p.hints.length).toBe(3);
      expect(p.altSolutions.length).toBeGreaterThanOrEqual(2);
      expect(p.explanation).toBeTruthy();
    }
  });

  it("思考力カリキュラムの全ステップが正しく解決でき、nextステップが繋がること", async () => {
    const { subjects, findStep } = await import("../lib/curriculum");
    const thinkingSub = subjects.find((s) => s.id === "thinking");
    expect(thinkingSub).toBeDefined();

    for (const lvl of thinkingSub!.levels) {
      for (let i = 0; i < lvl.steps.length; i++) {
        const st = lvl.steps[i];
        const found = findStep(lvl.id, st.id);
        expect(found).not.toBeNull();
        if (i < lvl.steps.length - 1) {
          expect(found!.next).toBeDefined();
          expect(found!.next!.id).toBe(lvl.steps[i + 1].id);
        } else {
          expect(found!.next).toBeUndefined();
        }
      }
    }
  });
});
