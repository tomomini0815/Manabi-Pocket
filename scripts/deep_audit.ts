import fs from "fs";
import { gens, generate } from "../src/lib/generators";
import curriculum from "../src/data/curriculum.json";
import thinkingProblemsData from "../src/data/thinking-problems.json";

interface AuditError {
  category: string;
  source: string;
  details: string;
  problem?: any;
}

const errors: AuditError[] = [];

console.log("=== 1. AUDITING THINKING PROBLEMS ===");
const thinkingProblems = thinkingProblemsData.problems;
for (const p of thinkingProblems) {
  if (!p.answer || p.answer.trim() === "") {
    errors.push({
      category: "THINKING_PROBLEM",
      source: p.id,
      details: "Answer is empty",
      problem: p,
    });
  }

  if (p.answerType === "choice" || p.choices) {
    if (!p.choices || !Array.isArray(p.choices)) {
      errors.push({
        category: "THINKING_PROBLEM",
        source: p.id,
        details: "answerType is choice but choices array is missing",
        problem: p,
      });
    } else {
      if (!p.choices.includes(p.answer)) {
        errors.push({
          category: "THINKING_PROBLEM",
          source: p.id,
          details: `Answer '${p.answer}' is not included in choices: ${JSON.stringify(p.choices)}`,
          problem: p,
        });
      }
      const uniqueChoices = new Set(p.choices);
      if (uniqueChoices.size !== p.choices.length) {
        errors.push({
          category: "THINKING_PROBLEM",
          source: p.id,
          details: `Duplicate choices found: ${JSON.stringify(p.choices)}`,
          problem: p,
        });
      }
    }
  }

  // ヒントチェック
  if (!p.hints || p.hints.length === 0) {
    errors.push({
      category: "THINKING_PROBLEM",
      source: p.id,
      details: "Hints array is empty",
      problem: p,
    });
  }
}

console.log("=== 2. AUDITING CURRICULUM STEPS VIA GENERATE ===");
for (const subject of curriculum.subjects) {
  for (const level of subject.levels) {
    for (const step of level.steps) {
      const stepId = `${subject.id}/${level.id}/${step.id}`;
      // 各ステップを50通りのシードで実行
      for (let s = 1; s <= 50; s++) {
        try {
          const prob = generate(step.generator, step.params as any, s * 7919, 0);

          if (!prob.prompt || prob.prompt.trim() === "") {
            errors.push({
              category: "CURRICULUM_STEP",
              source: `${stepId} (seed: ${s})`,
              details: "Generated prompt is empty",
            });
          }

          if (!prob.answer || prob.answer.trim() === "") {
            errors.push({
              category: "CURRICULUM_STEP",
              source: `${stepId} (seed: ${s})`,
              details: "Generated answer is empty",
            });
          }

          if (prob.input === "choice") {
            if (!prob.choices || !Array.isArray(prob.choices)) {
              errors.push({
                category: "CURRICULUM_STEP",
                source: `${stepId} (seed: ${s})`,
                details: "input is 'choice' but choices is missing",
              });
            } else {
              if (!prob.choices.includes(prob.answer)) {
                errors.push({
                  category: "CURRICULUM_STEP",
                  source: `${stepId} (seed: ${s})`,
                  details: `Answer '${prob.answer}' not in choices: ${JSON.stringify(prob.choices)} (prompt: ${prob.prompt})`,
                });
              }

              const unique = new Set(prob.choices);
              if (unique.size !== prob.choices.length) {
                errors.push({
                  category: "CURRICULUM_STEP",
                  source: `${stepId} (seed: ${s})`,
                  details: `Duplicate choices: ${JSON.stringify(prob.choices)} (prompt: ${prob.prompt})`,
                });
              }
            }
          }
        } catch (e: any) {
          errors.push({
            category: "CURRICULUM_STEP_EXCEPTION",
            source: `${stepId} (seed: ${s})`,
            details: e.message || String(e),
          });
        }
      }
    }
  }
}

console.log("=== 3. AUDITING ALL RAW GENERATORS DIRECTLY ===");
const genKeys = Object.keys(gens);
for (const key of genKeys) {
  const genFn = gens[key]!;
  // 300回ずつランダムシードで実行して全ブランチ・全プールを叩く
  for (let s = 1; s <= 300; s++) {
    let state = s * 65537 + 13;
    const r = () => {
      state = (state * 9301 + 49297) % 233280;
      return state / 233280;
    };

    try {
      const res = genFn({}, r, 0);

      if (!res.prompt) {
        errors.push({
          category: "RAW_GENERATOR",
          source: `${key} (run: ${s})`,
          details: "Prompt is empty",
        });
      }

      if (!res.answer) {
        errors.push({
          category: "RAW_GENERATOR",
          source: `${key} (run: ${s})`,
          details: "Answer is empty",
        });
      }

      if (res.input === "choice") {
        if (!res.choices) {
          errors.push({
            category: "RAW_GENERATOR",
            source: `${key} (run: ${s})`,
            details: "Choice input without choices array",
          });
        } else {
          if (!res.choices.includes(res.answer)) {
            errors.push({
              category: "RAW_GENERATOR",
              source: `${key} (run: ${s})`,
              details: `Answer '${res.answer}' not in choices: ${JSON.stringify(res.choices)} (prompt: ${res.prompt})`,
            });
          }

          const unique = new Set(res.choices);
          if (unique.size !== res.choices.length) {
            errors.push({
              category: "RAW_GENERATOR",
              source: `${key} (run: ${s})`,
              details: `Duplicate choices: ${JSON.stringify(res.choices)} (prompt: ${res.prompt})`,
            });
          }
        }
      }
    } catch (e: any) {
      errors.push({
        category: "RAW_GENERATOR_EXCEPTION",
        source: `${key} (run: ${s})`,
        details: e.message || String(e),
      });
    }
  }
}

console.log(`\n=== AUDIT RESULTS ===`);
console.log(`Total Errors Detected: ${errors.length}`);
if (errors.length > 0) {
  console.log(JSON.stringify(errors.slice(0, 50), null, 2));
  if (errors.length > 50) {
    console.log(`... and ${errors.length - 50} more errors.`);
  }
} else {
  console.log("CONGRATULATIONS: ZERO ERRORS DETECTED!");
}
