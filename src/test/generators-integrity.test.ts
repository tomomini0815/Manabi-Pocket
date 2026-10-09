import { describe, it, expect } from "vitest";
import { gens } from "../lib/generators";
import thinkingProblemsData from "../data/thinking-problems.json";

describe("Problem Content & Answer Integrity Audit", () => {
  it("verifies all thinking problems have correct answers, valid choices, and consistent hints", () => {
    const problems = thinkingProblemsData.problems;
    expect(problems.length).toBeGreaterThan(0);

    for (const p of problems) {
      // 1. answer が存在すること
      expect(p.answer, `Problem ${p.id} must have non-empty answer`).toBeTruthy();

      // 2. choice 形式の場合、choices に answer が含まれていること
      if (p.answerType === "choice" || p.choices) {
        expect(p.choices, `Problem ${p.id} must have choices array`).toBeDefined();
        expect(p.choices).toContain(p.answer);
        // choices に重複がないこと
        const uniqueChoices = new Set(p.choices);
        expect(uniqueChoices.size, `Problem ${p.id} choices must be unique`).toBe(p.choices!.length);
      }

      // 3. number 形式の場合、数値としてパース可能であること
      if (p.answerType === "number") {
        const num = Number(p.answer);
        expect(Number.isFinite(num), `Problem ${p.id} answer '${p.answer}' must be finite number`).toBe(true);
      }

      // 4. hints が存在すること
      expect(p.hints.length, `Problem ${p.id} must have hints`).toBeGreaterThan(0);
    }
  });

  it("verifies all generator functions produce valid questions, choices containing answer, and consistent answers", () => {
    // 乱数シードを固定して各ジェネレータを複数回（網羅的に）実行
    const genKeys = Object.keys(gens) as (keyof typeof gens)[];
    expect(genKeys.length).toBeGreaterThan(0);

    for (const key of genKeys) {
      const genFn = gens[key]!;

      // 各ジェネレータを100回シミュレートして問題プールと乱数分岐を網羅
      for (let seed = 1; seed <= 100; seed++) {
        // pseudo-random using seed
        let s = seed;
        const fakeRandom = () => {
          s = (s * 9301 + 49297) % 233280;
          return s / 233280;
        };

        const result = genFn({}, fakeRandom, 0);

        // 1. prompt と answer の存在
        expect(result.prompt, `Generator ${key} prompt must be non-empty`).toBeTruthy();
        expect(result.answer, `Generator ${key} answer must be non-empty`).toBeTruthy();

        // 2. choice 入力の場合の検証
        if (result.input === "choice") {
          expect(result.choices, `Generator ${key} must have choices for input: choice`).toBeDefined();
          expect(
            result.choices!.includes(result.answer),
            `Generator ${key} choices ${JSON.stringify(result.choices)} must contain answer '${result.answer}' (prompt: ${result.prompt})`
          ).toBe(true);

          // choices の重複チェック
          const uniqueChoices = new Set(result.choices);
          expect(
            uniqueChoices.size,
            `Generator ${key} choices must be unique (prompt: ${result.prompt})`
          ).toBe(result.choices!.length);
        }

        // 3. keypad 入力の場合、answer が空でないこと
        if (result.input === "keypad") {
          expect(result.answer.trim().length).toBeGreaterThan(0);
        }

        // 4. ヒントの「こたえは」と answer の整合性チェック
        if (result.hints && result.hints.length > 0) {
          const lastHint = result.hints[result.hints.length - 1]!;
          const match = lastHint.match(/こたえは[「\s]*([^」\s]+)[」\s]*/);
          if (match) {
            const hintedAns = match[1]!;
            // 単純な数値や文字列の場合、hintedAns に answer が含まれているか一致していること
            // (例: 答えが "3" でヒントが "こたえは 3個" のようなケースも考慮)
            expect(
              hintedAns.includes(result.answer) || result.answer.includes(hintedAns),
              `Generator ${key} hint answer '${hintedAns}' should match problem answer '${result.answer}'`
            ).toBe(true);
          }
        }
      }
    }
  });

  it("verifies all curriculum steps generate questions with correct answers, choices, and hints", async () => {
    const curriculum = (await import("../data/curriculum.json")).default;
    const { generate } = await import("../lib/generators");

    for (const subject of curriculum.subjects) {
      for (const level of subject.levels) {
        for (const step of level.steps) {
          const stepId = `${subject.id}/${level.id}/${step.id}`;
          for (let s = 1; s <= 20; s++) {
            const prob = generate(step.generator, step.params as any, s * 7919, 0);

            expect(prob.prompt, `${stepId} prompt must not be empty`).toBeTruthy();
            expect(prob.answer, `${stepId} answer must not be empty`).toBeTruthy();
            expect(prob.hints).toHaveLength(3);

            if (prob.input === "choice") {
              expect(prob.choices, `${stepId} must have choices`).toBeDefined();
              expect(
                prob.choices!.includes(prob.answer),
                `${stepId} choices ${JSON.stringify(prob.choices)} must contain answer '${prob.answer}'`
              ).toBe(true);

              const unique = new Set(prob.choices);
              expect(
                unique.size,
                `${stepId} choices must be unique: ${JSON.stringify(prob.choices)}`
              ).toBe(prob.choices!.length);
            }
          }
        }
      }
    }
  });
});
