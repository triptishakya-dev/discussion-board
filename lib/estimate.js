import { CONFIG } from './board-config';

export function calculateEstimate(layout, answers) {
  const lines = CONFIG.questions.flatMap(question => {
    const option = question.options[answers[question.id]];
    if (!option) return [];
    return [{ label: question.label, choice: option.label, add: option.add * layout.factor }];
  });
  const subtotal = lines.reduce((sum, line) => sum + line.add, layout.base);
  return { total: Math.round(subtotal / 5000) * 5000, lines, base: layout.base };
}
