import { describe, it, expect } from "vitest";
import curriculum from "../data/curriculum.json";
import { generate } from "../lib/generators";

describe("Curriculum Generators Full Coverage", () => {
  for (const subject of curriculum.subjects) {
    describe(`Subject: ${subject.name} (${subject.id})`, () => {
      for (const level of subject.levels) {
        describe(`Level: ${level.name} (${level.id})`, () => {
          for (const step of level.steps) {
            it(`Step: ${step.title} (${step.id}) generates valid problem`, () => {
              const prob = generate(step.generator, step.params as any, 12345, 0);
              expect(prob).toBeDefined();
              expect(prob.prompt).toBeTruthy();
              expect(prob.answer).toBeTruthy();
              expect(prob.hints).toHaveLength(3);
              if (prob.input === "choice") {
                expect(prob.choices).toBeDefined();
                expect(prob.choices!.length).toBeGreaterThanOrEqual(2);
                expect(prob.choices).toContain(prob.answer);
              }
            });

            it(`Step: ${step.title} (${step.id}) generates unique problems in a 10-question session`, () => {
              const used = new Set<string>();
              const generatedKeys: string[] = [];
              for (let i = 0; i < 10; i++) {
                const prob = generate(step.generator, step.params as any, 1000 + i * 97, 0, used);
                const key = `${prob.prompt}___${prob.answer}___${prob.visual || ""}`;
                generatedKeys.push(key);
              }
              // makeTen (9 options) or small min-max might have at most 1 repeat in 10 questions,
              // but all large-pool steps (en-word, josh, wordGroup, etc.) should have 9 or 10 unique problems
              const uniqueCount = new Set(generatedKeys).size;
              expect(uniqueCount).toBeGreaterThanOrEqual(8);
            });
          }
        });
      }
    });
  }
});
