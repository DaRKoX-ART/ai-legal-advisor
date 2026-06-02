import type { SavedAnswer } from "@/types/answer";

/**
 * Compose the "תיק לעו״ד" — a single Hebrew text artifact built from a
 * SavedAnswer + the user's current checklist progress. The output is
 * the killer FOLIO deliverable: a clean, scannable document the user
 * can ship to their lawyer over WhatsApp, mail, or any share target.
 *
 * Design rules:
 *   - Plain text only. No markdown — many share targets render it
 *     poorly. We use unicode geometric chars for checkboxes (☑ / ☐)
 *     and section rules for visual structure.
 *   - Always includes the demo banner when source === "demo", and
 *     never omits the disclaimer.
 *   - Reflects the user's current progress on action/evidence items.
 *   - Stable line ordering — the same answer always exports the same
 *     way, regardless of how many times the user shares.
 */
export function composeLawyerPack(answer: SavedAnswer): string {
  const lines: string[] = [];
  const sep = "─".repeat(28);
  const date = new Date(answer.createdAt).toLocaleDateString("he-IL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // ── Header ─────────────────────────────────────────────────────────
  lines.push("FOLIO · תיק משפטי");
  lines.push(sep);
  lines.push(`כותרת: ${answer.title}`);
  lines.push(`תאריך פתיחת התיק: ${date}`);
  lines.push(`קטגוריה: ${answer.category}`);
  lines.push(`רמת דחיפות: ${urgencyHe(answer.urgency)}`);
  if (answer.source === "demo") {
    lines.push("");
    lines.push("⚠ הערה: תיק זה הופק במצב דמו — לא נוצר על-ידי מודל AI חי.");
  }
  lines.push("");

  // ── Situation ──────────────────────────────────────────────────────
  lines.push("המצב");
  lines.push(sep);
  lines.push(answer.brief);
  if (answer.question && answer.question !== answer.brief) {
    lines.push("");
    lines.push("השאלה המקורית:");
    lines.push(`«${answer.question}»`);
  }
  lines.push("");

  // ── Deadline ───────────────────────────────────────────────────────
  if (answer.deadlineHint) {
    lines.push("דדליין מרכזי");
    lines.push(sep);
    const parts: string[] = [answer.deadlineHint.label];
    if (answer.deadlineHint.iso) parts.push(answer.deadlineHint.iso);
    else if (answer.deadlineHint.relative)
      parts.push(answer.deadlineHint.relative);
    lines.push(parts.join(" · "));
    lines.push("");
  }

  // ── Key insight ────────────────────────────────────────────────────
  if (answer.insight && answer.insight.trim().length > 0) {
    lines.push("תובנה מרכזית");
    lines.push(sep);
    lines.push(answer.insight.trim());
    lines.push("");
  }

  // ── Action plan progress ───────────────────────────────────────────
  if (answer.actionPlan.length > 0) {
    const done = answer.actionPlan.filter((i) => i.done).length;
    lines.push(`מה לעשות עכשיו (${done}/${answer.actionPlan.length} הושלמו)`);
    lines.push(sep);
    for (const item of answer.actionPlan) {
      const box = item.done ? "☑" : "☐";
      const deadline = item.deadline ? ` · ${item.deadline}` : "";
      lines.push(`${box} ${item.text}${deadline}`);
      if (item.note && item.note.trim().length > 0) {
        lines.push(`   ↳ ${item.note.trim()}`);
      }
      if (item.done && item.doneAt) {
        const doneDate = new Date(item.doneAt).toLocaleDateString("he-IL", {
          day: "numeric",
          month: "short",
        });
        lines.push(`   ↳ הושלם ב-${doneDate}`);
      }
    }
    lines.push("");
  }

  // ── Evidence checklist ─────────────────────────────────────────────
  if (answer.evidenceChecklist.length > 0) {
    const done = answer.evidenceChecklist.filter((i) => i.done).length;
    lines.push(
      `מה להביא איתך (${done}/${answer.evidenceChecklist.length} הושלמו)`,
    );
    lines.push(sep);
    for (const item of answer.evidenceChecklist) {
      const box = item.done ? "☑" : "☐";
      lines.push(`${box} ${item.text}`);
      if (item.note && item.note.trim().length > 0) {
        lines.push(`   ↳ ${item.note.trim()}`);
      }
    }
    lines.push("");
  }

  // ── Common mistakes ────────────────────────────────────────────────
  if (answer.commonMistakes.length > 0) {
    lines.push("מה לא לעשות");
    lines.push(sep);
    for (const m of answer.commonMistakes) lines.push(`• ${m}`);
    lines.push("");
  }

  // ── Lawyer questions ───────────────────────────────────────────────
  if (answer.lawyerQuestions.length > 0) {
    lines.push("שאלות לשאול את עורך הדין");
    lines.push(sep);
    if (answer.lawyerReason && answer.lawyerReason.trim().length > 0) {
      lines.push(answer.lawyerReason.trim());
      lines.push("");
    }
    answer.lawyerQuestions.forEach((q, i) => {
      lines.push(`${i + 1}. ${q}`);
    });
    lines.push("");
  }

  // ── Free legal aid ─────────────────────────────────────────────────
  if (answer.legalAid.length > 0) {
    lines.push("סיוע ללא עלות");
    lines.push(sep);
    for (const aid of answer.legalAid) {
      const note = aid.note ? ` — ${aid.note}` : "";
      lines.push(`${aid.name}: ${aid.phone}${note}`);
    }
    lines.push("");
  }

  // ── Explanation ────────────────────────────────────────────────────
  lines.push("הסבר משפטי");
  lines.push(sep);
  lines.push(answer.explanation);
  lines.push("");

  // ── Glossary ───────────────────────────────────────────────────────
  if (answer.glossary.length > 0) {
    lines.push("מילון מונחים");
    lines.push(sep);
    for (const g of answer.glossary) lines.push(`${g.term} — ${g.definition}`);
    lines.push("");
  }

  // ── Disclaimer ─────────────────────────────────────────────────────
  lines.push("הצהרה");
  lines.push(sep);
  lines.push(answer.disclaimer);
  lines.push("");

  lines.push("———");
  lines.push("נוצר על-ידי FOLIO · מידע משפטי ראשוני בלבד · לא מהווה ייעוץ.");

  return lines.join("\n");
}

function urgencyHe(u: SavedAnswer["urgency"]): string {
  if (u === "high") return "גבוהה";
  if (u === "medium") return "בינונית";
  return "נמוכה";
}
