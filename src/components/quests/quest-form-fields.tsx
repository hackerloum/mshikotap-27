"use client";

import { Plus, Trash2 } from "lucide-react";
import { categoryDefs } from "@/config/quests";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import type { QuestPayload } from "@/services/campaigns.service";
import type { QuestionKind, TaskCategory } from "@/types";

export interface DraftQuestion {
  text: string;
  kind: QuestionKind;
  options: string[];
  correct: number;
}

export interface QuestDraft {
  category: TaskCategory;
  platform: string;
  action: string;
  targetUrl: string;
  appName: string;
  watchSeconds: string;
  passMark: string;
  phrase: string;
  notes: string;
  questions: DraftQuestion[];
}

export const newQuestion = (kind: QuestionKind = "choice"): DraftQuestion => ({
  text: "",
  kind,
  options: kind === "choice" || kind === "multi" ? ["", ""] : [],
  correct: 0,
});

export function emptyDraft(category: TaskCategory = "social"): QuestDraft {
  const def = categoryDefs[category];
  return {
    category,
    platform: def?.platforms?.[0]?.id ?? "",
    action: def?.actions?.[0]?.id ?? "",
    targetUrl: "",
    appName: "",
    watchSeconds: "30",
    passMark: "60",
    phrase: "",
    notes: "",
    questions: category === "survey" || category === "quiz" ? [newQuestion()] : [],
  };
}

export function draftToPayload(d: QuestDraft): QuestPayload {
  const def = categoryDefs[d.category];
  const fields = def?.fields ?? [];
  const showWatch = fields.includes("watchSeconds") && (d.category === "video" || d.action === "watch");
  return {
    category: d.category,
    ...(fields.includes("platform") ? { platform: d.platform } : {}),
    ...(fields.includes("action") ? { action: d.action } : {}),
    ...(def?.link !== "none" && d.targetUrl.trim() ? { targetUrl: d.targetUrl.trim() } : {}),
    ...(fields.includes("appName") ? { appName: d.appName } : {}),
    ...(showWatch ? { watchSeconds: Number(d.watchSeconds) } : {}),
    ...(fields.includes("passMark") ? { passMark: Number(d.passMark) } : {}),
    ...(fields.includes("phrase") ? { phrase: d.phrase } : {}),
    ...(d.notes.trim() ? { notes: d.notes.trim() } : {}),
    ...(fields.includes("questions")
      ? {
          questions: d.questions.map((q) => ({
            text: q.text,
            kind: d.category === "quiz" ? "choice" : q.kind,
            ...(q.kind === "choice" || q.kind === "multi" || d.category === "quiz"
              ? { options: q.options.map((o) => o.trim()).filter(Boolean) }
              : {}),
            ...(d.category === "quiz" ? { correct: [q.correct] } : {}),
          })),
        }
      : {}),
  };
}

const kindLabels: Record<QuestionKind, string> = {
  choice: "Pick one",
  multi: "Pick many",
  text: "Short answer",
  rating: "Rating 1 to 5",
};

export function QuestFormFields({
  draft,
  onChange,
  categories,
  idPrefix = "qf",
}: {
  draft: QuestDraft;
  onChange: (next: QuestDraft) => void;
  categories: TaskCategory[];
  idPrefix?: string;
}) {
  const def = categoryDefs[draft.category];
  const fields = def?.fields ?? [];
  const quiz = draft.category === "quiz";
  const showWatch = fields.includes("watchSeconds") && (draft.category === "video" || draft.action === "watch");
  const set = (patch: Partial<QuestDraft>) => onChange({ ...draft, ...patch });

  const setQuestion = (i: number, patch: Partial<DraftQuestion>) =>
    set({ questions: draft.questions.map((q, idx) => (idx === i ? { ...q, ...patch } : q)) });

  const setOption = (qi: number, oi: number, value: string) =>
    setQuestion(qi, { options: draft.questions[qi].options.map((o, idx) => (idx === oi ? value : o)) });

  const removeOption = (qi: number, oi: number) => {
    const q = draft.questions[qi];
    const correct = q.correct === oi ? 0 : q.correct > oi ? q.correct - 1 : q.correct;
    setQuestion(qi, { options: q.options.filter((_, idx) => idx !== oi), correct });
  };

  return (
    <>
      <div className="md:col-span-2 xl:col-span-4">
        <Label htmlFor={`${idPrefix}-cat`}>What should players do?</Label>
        <Select
          id={`${idPrefix}-cat`}
          value={draft.category}
          onChange={(e) => onChange(emptyDraft(e.target.value as TaskCategory))}
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {categoryDefs[c]?.label ?? c}
            </option>
          ))}
        </Select>
        {def ? <p className="mt-1.5 text-xs text-slate-500">{def.hint}</p> : null}
      </div>

      {fields.includes("platform") ? (
        <div>
          <Label htmlFor={`${idPrefix}-platform`}>Social network</Label>
          <Select id={`${idPrefix}-platform`} value={draft.platform} onChange={(e) => set({ platform: e.target.value })}>
            {def?.platforms?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </Select>
        </div>
      ) : null}

      {fields.includes("action") ? (
        <div className={fields.includes("platform") ? "xl:col-span-3" : ""}>
          <Label htmlFor={`${idPrefix}-action`}>Action</Label>
          <Select id={`${idPrefix}-action`} value={draft.action} onChange={(e) => set({ action: e.target.value })}>
            {def?.actions?.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </Select>
        </div>
      ) : null}

      {def && def.link !== "none" ? (
        <div className="md:col-span-2 xl:col-span-4">
          <Label htmlFor={`${idPrefix}-link`}>{def.linkLabel}</Label>
          <Input
            id={`${idPrefix}-link`}
            inputMode="url"
            required={def.link === "required"}
            placeholder={def.linkPlaceholder}
            value={draft.targetUrl}
            onChange={(e) => set({ targetUrl: e.target.value })}
          />
        </div>
      ) : null}

      {fields.includes("appName") ? (
        <div className="md:col-span-2 xl:col-span-4">
          <Label htmlFor={`${idPrefix}-app`}>App name</Label>
          <Input id={`${idPrefix}-app`} required maxLength={60} value={draft.appName} onChange={(e) => set({ appName: e.target.value })} />
        </div>
      ) : null}

      {showWatch ? (
        <div>
          <Label htmlFor={`${idPrefix}-watch`}>Watch time (seconds)</Label>
          <Input id={`${idPrefix}-watch`} type="number" min={10} max={3600} required value={draft.watchSeconds} onChange={(e) => set({ watchSeconds: e.target.value })} />
        </div>
      ) : null}

      {fields.includes("phrase") ? (
        <div className="md:col-span-2 xl:col-span-4">
          <Label htmlFor={`${idPrefix}-phrase`}>Text players must type</Label>
          <Textarea id={`${idPrefix}-phrase`} required minLength={10} maxLength={300} className="min-h-20" value={draft.phrase} onChange={(e) => set({ phrase: e.target.value })} />
        </div>
      ) : null}

      {fields.includes("passMark") ? (
        <div>
          <Label htmlFor={`${idPrefix}-pass`}>Pass mark (%)</Label>
          <Input id={`${idPrefix}-pass`} type="number" min={1} max={100} value={draft.passMark} onChange={(e) => set({ passMark: e.target.value })} />
        </div>
      ) : null}

      {fields.includes("questions") ? (
        <div className="space-y-3 md:col-span-2 xl:col-span-4">
          <Label>{quiz ? "Quiz questions" : "Survey questions"}</Label>
          {draft.questions.map((q, qi) => (
            <div key={qi} className="space-y-3 rounded-lg border border-ink-700 bg-ink-950 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-display text-sm text-coin">Question {qi + 1}</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={draft.questions.length === 1}
                  onClick={() => set({ questions: draft.questions.filter((_, idx) => idx !== qi) })}
                  aria-label={`Remove question ${qi + 1}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Input
                required
                maxLength={200}
                placeholder="Type the question"
                aria-label={`Question ${qi + 1} text`}
                value={q.text}
                onChange={(e) => setQuestion(qi, { text: e.target.value })}
              />
              {!quiz ? (
                <Select
                  aria-label={`Question ${qi + 1} type`}
                  value={q.kind}
                  onChange={(e) => {
                    const kind = e.target.value as QuestionKind;
                    setQuestion(qi, {
                      kind,
                      options: kind === "choice" || kind === "multi" ? (q.options.length >= 2 ? q.options : ["", ""]) : [],
                    });
                  }}
                >
                  {(Object.keys(kindLabels) as QuestionKind[]).map((k) => (
                    <option key={k} value={k}>
                      {kindLabels[k]}
                    </option>
                  ))}
                </Select>
              ) : null}
              {q.kind === "choice" || q.kind === "multi" ? (
                <div className="space-y-2">
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      {quiz ? (
                        <input
                          type="radio"
                          name={`${idPrefix}-correct-${qi}`}
                          className="h-5 w-5 shrink-0 accent-[#4be08f]"
                          checked={q.correct === oi}
                          onChange={() => setQuestion(qi, { correct: oi })}
                          aria-label={`Option ${oi + 1} is the right answer`}
                        />
                      ) : null}
                      <Input
                        required
                        maxLength={80}
                        placeholder={`Option ${oi + 1}`}
                        aria-label={`Question ${qi + 1} option ${oi + 1}`}
                        value={opt}
                        onChange={(e) => setOption(qi, oi, e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={q.options.length <= 2}
                        onClick={() => removeOption(qi, oi)}
                        aria-label="Remove option"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {q.options.length < (quiz ? 6 : 8) ? (
                    <Button type="button" variant="secondary" size="sm" onClick={() => setQuestion(qi, { options: [...q.options, ""] })}>
                      <Plus className="h-4 w-4" /> Add option
                    </Button>
                  ) : null}
                  {quiz ? <p className="text-xs font-semibold text-mint">Tick the circle next to the right answer.</p> : null}
                </div>
              ) : null}
            </div>
          ))}
          {draft.questions.length < 15 ? (
            <Button type="button" variant="secondary" size="sm" onClick={() => set({ questions: [...draft.questions, newQuestion()] })}>
              <Plus className="h-4 w-4" /> Add question
            </Button>
          ) : null}
        </div>
      ) : null}

      {def ? (
        <div className="md:col-span-2 xl:col-span-4">
          <Label htmlFor={`${idPrefix}-notes`}>{def.notesLabel}</Label>
          <Textarea
            id={`${idPrefix}-notes`}
            required={def.notes === "required"}
            maxLength={600}
            className="min-h-20"
            value={draft.notes}
            onChange={(e) => set({ notes: e.target.value })}
          />
        </div>
      ) : null}
    </>
  );
}
