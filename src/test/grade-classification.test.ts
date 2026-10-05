import { describe, expect, it } from "vitest";
import {
  GRADES,
  GRADE_SHORT,
  clampGrade,
  gradeLabel,
  gradeShort,
  recommendedLevelFor,
  subjects,
} from "../lib/curriculum";

describe("Grade Classification & Mapping (幼児〜小学6年生)", () => {
  it("defines exactly 7 grade tiers from 幼児 to 小学6年", () => {
    expect(GRADES).toHaveLength(7);
    expect(GRADES[0]).toBe("幼児");
    expect(GRADES[1]).toBe("小学1年");
    expect(GRADES[2]).toBe("小学2年");
    expect(GRADES[3]).toBe("小学3年");
    expect(GRADES[4]).toBe("小学4年");
    expect(GRADES[5]).toBe("小学5年");
    expect(GRADES[6]).toBe("小学6年");

    expect(GRADE_SHORT).toHaveLength(7);
    expect(GRADE_SHORT[0]).toBe("幼児");
    expect(GRADE_SHORT[6]).toBe("小6");
  });

  it("safely clamps out-of-range grades to 0..6", () => {
    expect(clampGrade(-1)).toBe(0);
    expect(clampGrade(0)).toBe(0);
    expect(clampGrade(3)).toBe(3);
    expect(clampGrade(6)).toBe(6);
    expect(clampGrade(99)).toBe(6);
    expect(clampGrade(NaN)).toBe(1);
    expect(gradeLabel(0)).toBe("幼児");
    expect(gradeLabel(6)).toBe("小学6年");
    expect(gradeShort(1)).toBe("小1");
  });

  it("recommends correct math start level for each grade", () => {
    expect(recommendedLevelFor(0)).toBe("math-count"); // 幼児
    expect(recommendedLevelFor(1)).toBe("math-k11");   // 小1（算数検定11級・たしざん）
    expect(recommendedLevelFor(2)).toBe("math-k10");   // 小2（算数検定10級・かけざん）
    expect(recommendedLevelFor(3)).toBe("math-k9");    // 小3（算数検定9級・わりざん）
    expect(recommendedLevelFor(4)).toBe("math-k8");    // 小4（算数検定8級・がい数分数）
    expect(recommendedLevelFor(5)).toBe("math-k7");    // 小5（算数検定7級・小数積割合）
    expect(recommendedLevelFor(6)).toBe("math-k6");    // 小6（算数検定6級・速さ比）
  });

  it("verifies every subject has valid startGrade between 0 and 6", () => {
    for (const sub of subjects) {
      for (const lvl of sub.levels) {
        expect(lvl.startGrade).toBeGreaterThanOrEqual(0);
        expect(lvl.startGrade).toBeLessThanOrEqual(6);
      }
    }
  });

  it("verifies 算数検定 levels are accurately classified by grade", () => {
    const math = subjects.find((s) => s.id === "math")!;
    const k11 = math.levels.find((l) => l.id === "math-k11")!;
    const k10 = math.levels.find((l) => l.id === "math-k10")!;
    const k9 = math.levels.find((l) => l.id === "math-k9")!;
    const k8 = math.levels.find((l) => l.id === "math-k8")!;
    const k7 = math.levels.find((l) => l.id === "math-k7")!;
    const k6 = math.levels.find((l) => l.id === "math-k6")!;

    expect(k11.startGrade).toBe(1); // 小1
    expect(k10.startGrade).toBe(2); // 小2
    expect(k9.startGrade).toBe(3);  // 小3
    expect(k8.startGrade).toBe(4);  // 小4
    expect(k7.startGrade).toBe(5);  // 小5
    expect(k6.startGrade).toBe(6);  // 小6
  });

  it("verifies 思考力 levels (算数ラボ各級) are accurately classified by grade", () => {
    const think = subjects.find((s) => s.id === "thinking")!;
    const t1 = think.levels.find((l) => l.id === "think-1")!;
    const t2 = think.levels.find((l) => l.id === "think-2")!;
    const t3 = think.levels.find((l) => l.id === "think-3")!;
    const t4 = think.levels.find((l) => l.id === "think-4")!;
    const t6 = think.levels.find((l) => l.id === "think-6")!;
    const t5 = think.levels.find((l) => l.id === "think-5")!;

    expect(t1.startGrade).toBe(1); // 10級・小1
    expect(t2.startGrade).toBe(2); // 9級・小2
    expect(t3.startGrade).toBe(3); // 8級・小3
    expect(t4.startGrade).toBe(4); // 7級・小4
    expect(t6.startGrade).toBe(5); // 6級・小5
    expect(t5.startGrade).toBe(6); // 5級・小6

    // 算数ラボ全級のステップ数がしっかり充実していること
    expect(t1.steps.length).toBeGreaterThanOrEqual(6);
    expect(t2.steps.length).toBeGreaterThanOrEqual(6);
    expect(t3.steps.length).toBeGreaterThanOrEqual(8);
    expect(t4.steps.length).toBeGreaterThanOrEqual(8);
    expect(t6.steps.length).toBeGreaterThanOrEqual(6);
    expect(t5.steps.length).toBeGreaterThanOrEqual(6);
  });
});
