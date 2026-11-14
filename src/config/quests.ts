import type { QuestAnswers, QuestQuestion, QuestSpec, TaskCategory, TaskType } from "@/types";

export type QuestField = "platform" | "action" | "appName" | "watchSeconds" | "questions" | "passMark" | "phrase";
export type Choice = { id: string; label: string };

export interface CategoryDef {
  label: string;
  hint: string;
  link: "required" | "optional" | "none";
  linkLabel: string;
  linkPlaceholder: string;
  fields: QuestField[];
  platforms?: Choice[];
  actions?: Choice[];
  autoVerify: boolean;
  notes: "required" | "optional";
  notesLabel: string;
  forAdvertisers: boolean;
}

export const platformHosts: Record<string, string[]> = {
  instagram: ["instagram.com"],
  tiktok: ["tiktok.com"],
  x: ["x.com", "twitter.com"],
  facebook: ["facebook.com", "fb.com", "fb.watch"],
  telegram: ["t.me", "telegram.me"],
  whatsapp: ["whatsapp.com", "wa.me", "chat.whatsapp.com"],
  youtube: ["youtube.com", "youtu.be"],
};

export const categoryDefs: Partial<Record<TaskCategory, CategoryDef>> = {
  social: {
    label: "Social media",
    hint: "Follow, like, comment or share on a social network.",
    link: "required",
    linkLabel: "Profile or post link",
    linkPlaceholder: "https://instagram.com/yourpage",
    fields: ["platform", "action"],
    platforms: [
      { id: "instagram", label: "Instagram" },
      { id: "tiktok", label: "TikTok" },
      { id: "x", label: "X (Twitter)" },
      { id: "facebook", label: "Facebook" },
      { id: "telegram", label: "Telegram" },
      { id: "whatsapp", label: "WhatsApp channel" },
    ],
    actions: [
      { id: "follow", label: "Follow the account" },
      { id: "like", label: "Like a post" },
      { id: "comment", label: "Comment on a post" },
      { id: "share", label: "Share a post" },
    ],
    autoVerify: false,
    notes: "optional",
    notesLabel: "Extra steps (optional)",
    forAdvertisers: true,
  },
  youtube: {
    label: "YouTube",
    hint: "Subscribe, like, comment or watch a YouTube video.",
    link: "required",
    linkLabel: "YouTube channel or video link",
    linkPlaceholder: "https://youtube.com/watch?v=...",
    fields: ["action", "watchSeconds"],
    actions: [
      { id: "subscribe", label: "Subscribe to the channel" },
      { id: "like", label: "Like the video" },
      { id: "comment", label: "Comment on the video" },
      { id: "watch", label: "Watch the video" },
    ],
    autoVerify: false,
    notes: "optional",
    notesLabel: "Extra steps (optional)",
    forAdvertisers: true,
  },
  video: {
    label: "Watch a video",
    hint: "Players watch any video for a set time.",
    link: "required",
    linkLabel: "Video link",
    linkPlaceholder: "https://...",
    fields: ["watchSeconds"],
    autoVerify: false,
    notes: "optional",
    notesLabel: "Extra steps (optional)",
    forAdvertisers: true,
  },
  survey: {
    label: "Survey",
    hint: "Players answer your questions inside the app. Checked automatically.",
    link: "none",
    linkLabel: "",
    linkPlaceholder: "",
    fields: ["questions"],
    autoVerify: true,
    notes: "optional",
    notesLabel: "Short intro for players (optional)",
    forAdvertisers: true,
  },
  quiz: {
    label: "Quiz",
    hint: "Questions with one right answer. Players must reach the pass mark.",
    link: "none",
    linkLabel: "",
    linkPlaceholder: "",
    fields: ["questions", "passMark"],
    autoVerify: true,
    notes: "optional",
    notesLabel: "Short intro for players (optional)",
    forAdvertisers: true,
  },
  app_install: {
    label: "Install an app",
    hint: "Players install your app and send a screenshot.",
    link: "required",
    linkLabel: "Play Store or App Store link",
    linkPlaceholder: "https://play.google.com/store/apps/details?id=...",
    fields: ["appName"],
    autoVerify: false,
    notes: "optional",
    notesLabel: "Extra steps (optional)",
    forAdvertisers: true,
  },
  typing: {
    label: "Typing",
    hint: "Players type a text exactly. Checked automatically.",
    link: "none",
    linkLabel: "",
    linkPlaceholder: "",
    fields: ["phrase"],
    autoVerify: true,
    notes: "optional",
    notesLabel: "Extra note (optional)",
    forAdvertisers: false,
  },
  screenshot: {
    label: "Other task",
    hint: "Anything else. You explain the steps, players send a screenshot.",
    link: "optional",
    linkLabel: "Link to open (optional)",
    linkPlaceholder: "https://...",
    fields: [],
    autoVerify: false,
    notes: "required",
    notesLabel: "What should players do?",
    forAdvertisers: true,
  },
};

export const creatableCategories = Object.keys(categoryDefs) as TaskCategory[];
export const advertiserCategories = creatableCategories.filter((c) => categoryDefs[c]?.forAdvertisers);

export function categoryLabel(category: string) {
  return categoryDefs[category as TaskCategory]?.label ?? category.replaceAll("_", " ");
}

export interface QuestInput {
  category?: unknown;
  platform?: unknown;
  action?: unknown;
  targetUrl?: unknown;
  appName?: unknown;
  watchSeconds?: unknown;
  questions?: unknown;
  passMark?: unknown;
  phrase?: unknown;
  notes?: unknown;
}

export interface QuestValue {
  category: TaskCategory;
  type: TaskType;
  requiresScreenshot: boolean;
  autoVerify: boolean;
  targetUrl?: string;
  minSeconds?: number;
  spec: QuestSpec;
  instructions: string;
}

const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

function hostMatches(url: URL, hosts: string[]) {
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  return hosts.some((h) => host === h || host.endsWith(`.${h}`));
}

function parseQuestions(raw: unknown, quiz: boolean): QuestQuestion[] | string {
  if (!Array.isArray(raw) || raw.length === 0) return "Add at least one question";
  if (raw.length > 15) return "Use 15 questions or fewer";
  const out: QuestQuestion[] = [];
  for (let i = 0; i < raw.length; i += 1) {
    const q = raw[i] as Record<string, unknown>;
    const label = `Question ${i + 1}`;
    const questionText = text(q?.text, 200);
    if (questionText.length < 3) return `${label} needs text`;
    const kind = quiz ? "choice" : (q?.kind as string);
    if (!["choice", "multi", "text", "rating"].includes(kind)) return `${label} has an unknown type`;
    const item: QuestQuestion = { id: `q${i + 1}`, text: questionText, kind: kind as QuestQuestion["kind"] };
    if (kind === "choice" || kind === "multi") {
      const options = (Array.isArray(q?.options) ? q.options : []).map((o) => text(o, 80)).filter(Boolean);
      if (options.length < 2) return `${label} needs at least 2 answer options`;
      if (options.length > (quiz ? 6 : 8)) return `${label} has too many options`;
      if (new Set(options.map((o) => o.toLowerCase())).size !== options.length) return `${label} has repeated options`;
      item.options = options;
    }
    if (quiz) {
      const correct = Array.isArray(q?.correct) ? (q.correct as unknown[]).map(Number) : [];
      const options = item.options ?? [];
      if (correct.length !== 1 || !Number.isInteger(correct[0]) || correct[0] < 0 || correct[0] >= options.length) {
        return `${label} needs exactly one right answer`;
      }
      item.correct = correct;
    }
    out.push(item);
  }
  return out;
}

export function buildInstructions(category: TaskCategory, spec: QuestSpec, notes: string) {
  const def = categoryDefs[category];
  const platform = def?.platforms?.find((p) => p.id === spec.platform)?.label ?? "the app";
  const lines: string[] = [];
  switch (category) {
    case "social": {
      const verb: Record<string, string> = {
        follow: "Follow the account",
        like: "Like the post",
        comment: "Leave a real comment on the post",
        share: "Share the post",
      };
      lines.push(`Open the link. ${verb[spec.action ?? "follow"] ?? "Do the task"} on ${platform}. Then send a screenshot that shows you did it.`);
      break;
    }
    case "youtube": {
      const verb: Record<string, string> = {
        subscribe: "Subscribe to the channel",
        like: "Like the video",
        comment: "Comment on the video",
        watch: `Watch the video for at least ${spec.watchSeconds ?? 30} seconds`,
      };
      lines.push(`Open the link on YouTube. ${verb[spec.action ?? "subscribe"] ?? "Do the task"}. Then send a screenshot that shows you did it.`);
      break;
    }
    case "video":
      lines.push(`Open the link and watch the video for at least ${spec.watchSeconds ?? 30} seconds. Then send a screenshot of it playing.`);
      break;
    case "app_install":
      lines.push(`Install "${spec.appName ?? "the app"}" from the link and open it once. Then send a screenshot of the app on your phone.`);
      break;
    case "survey":
      lines.push(`Answer all ${spec.questions?.length ?? 0} questions honestly. Your answers are checked automatically.`);
      break;
    case "quiz":
      lines.push(`Answer the ${spec.questions?.length ?? 0} questions. You need ${spec.passMark ?? 60}% to pass. You get 3 tries.`);
      break;
    case "typing":
      lines.push("Type the text exactly as it is shown, including capital letters and punctuation.");
      break;
    default:
      break;
  }
  if (notes) lines.push(notes);
  return lines.join("\n");
}

export function validateQuest(input: QuestInput): { ok: true; value: QuestValue } | { ok: false; message: string } {
  const category = input.category as TaskCategory;
  const def = categoryDefs[category];
  if (!def) return { ok: false, message: "Pick a category" };

  const spec: QuestSpec = {};
  let type: TaskType = "screenshot_proof";
  let minSeconds: number | undefined;

  if (def.fields.includes("platform")) {
    const platform = text(input.platform, 30);
    if (!def.platforms?.some((p) => p.id === platform)) return { ok: false, message: "Pick the social network" };
    spec.platform = platform;
  }
  if (def.fields.includes("action")) {
    const action = text(input.action, 30);
    if (!def.actions?.some((a) => a.id === action)) return { ok: false, message: "Pick what players must do" };
    spec.action = action;
  }

  let targetUrl: string | undefined;
  const rawUrl = text(input.targetUrl, 600);
  if (def.link !== "none" && rawUrl) {
    try {
      const url = new URL(rawUrl);
      if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("protocol");
      if (category === "social" && spec.platform && !hostMatches(url, platformHosts[spec.platform] ?? [])) {
        return { ok: false, message: `That link is not from ${def.platforms?.find((p) => p.id === spec.platform)?.label}. Check the link.` };
      }
      if (category === "youtube" && !hostMatches(url, platformHosts.youtube)) {
        return { ok: false, message: "That is not a YouTube link" };
      }
      targetUrl = url.toString();
    } catch {
      return { ok: false, message: `${def.linkLabel || "Link"} is not a valid link` };
    }
  }
  if (def.link === "required" && !targetUrl) return { ok: false, message: `${def.linkLabel} is required` };

  if (category === "video" || (category === "youtube" && spec.action === "watch")) {
    const seconds = Math.round(Number(input.watchSeconds));
    if (!Number.isFinite(seconds) || seconds < 10 || seconds > 3600) {
      return { ok: false, message: "Watch time must be between 10 and 3600 seconds" };
    }
    spec.watchSeconds = seconds;
    minSeconds = seconds;
  }
  if (category === "social") type = (spec.action === "share" ? "screenshot_proof" : spec.action) as TaskType;
  if (category === "youtube") type = spec.action === "watch" ? "watch" : (spec.action as TaskType);
  if (category === "video") type = "watch";

  if (category === "app_install") {
    const appName = text(input.appName, 60);
    if (appName.length < 2) return { ok: false, message: "Add the app name" };
    spec.appName = appName;
    type = "install";
  }

  if (category === "survey" || category === "quiz") {
    const questions = parseQuestions(input.questions, category === "quiz");
    if (typeof questions === "string") return { ok: false, message: questions };
    spec.questions = questions;
    type = category;
    minSeconds = clamp(questions.length * (category === "quiz" ? 8 : 5), 15, 300);
    if (category === "quiz") {
      const pass = input.passMark === undefined || input.passMark === "" ? 60 : Math.round(Number(input.passMark));
      if (!Number.isFinite(pass) || pass < 1 || pass > 100) return { ok: false, message: "Pass mark must be 1 to 100 percent" };
      spec.passMark = pass;
    }
  }

  if (category === "typing") {
    const phrase = text(input.phrase, 300).replace(/\s+/g, " ");
    if (phrase.length < 10) return { ok: false, message: "The text to type must be at least 10 characters" };
    spec.phrase = phrase;
    type = "typing";
    minSeconds = clamp(Math.round(phrase.length / 6), 8, 120);
  }

  const notes = text(input.notes, 600);
  if (def.notes === "required" && notes.length < 10) return { ok: false, message: "Explain what players should do (at least 10 characters)" };

  return {
    ok: true,
    value: {
      category,
      type,
      requiresScreenshot: !def.autoVerify,
      autoVerify: def.autoVerify,
      ...(targetUrl ? { targetUrl } : {}),
      ...(minSeconds ? { minSeconds } : {}),
      spec,
      instructions: buildInstructions(category, spec, notes),
    },
  };
}

export type AutoResult =
  | { ok: true; answers?: QuestAnswers; score?: number }
  | { ok: false; message: string; countsAsAttempt: boolean };

const normalize = (s: string) => s.replace(/\s+/g, " ").trim();

export function gradeAuto(category: TaskCategory, spec: QuestSpec | undefined, body: { answers?: unknown; typed?: unknown }): AutoResult {
  if (category === "typing") {
    const typed = typeof body.typed === "string" ? normalize(body.typed) : "";
    if (!spec?.phrase) return { ok: false, message: "This quest is not set up right", countsAsAttempt: false };
    if (typed !== spec.phrase) return { ok: false, message: "The text does not match. Check capital letters and punctuation.", countsAsAttempt: false };
    return { ok: true };
  }

  const questions = spec?.questions ?? [];
  const raw = (body.answers && typeof body.answers === "object" ? body.answers : {}) as Record<string, unknown>;
  const answers: QuestAnswers = {};
  let right = 0;

  for (const q of questions) {
    const value = raw[q.id];
    if (q.kind === "text") {
      const t = typeof value === "string" ? normalize(value).slice(0, 500) : "";
      if (t.length < 2) return { ok: false, message: `Answer: ${q.text}`, countsAsAttempt: false };
      answers[q.id] = t;
    } else if (q.kind === "rating") {
      const n = Number(value);
      if (!Number.isInteger(n) || n < 1 || n > 5) return { ok: false, message: `Rate: ${q.text}`, countsAsAttempt: false };
      answers[q.id] = n;
    } else if (q.kind === "multi") {
      const picked = Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
      const valid = picked.filter((v) => q.options?.includes(v));
      if (valid.length === 0 || valid.length !== picked.length) return { ok: false, message: `Pick at least one: ${q.text}`, countsAsAttempt: false };
      answers[q.id] = [...new Set(valid)];
    } else {
      const picked = typeof value === "string" ? value : "";
      if (!q.options?.includes(picked)) return { ok: false, message: `Pick an answer: ${q.text}`, countsAsAttempt: false };
      answers[q.id] = picked;
      if (category === "quiz" && q.correct && q.options[q.correct[0]] === picked) right += 1;
    }
  }

  if (category === "quiz") {
    const score = questions.length ? Math.round((right / questions.length) * 100) : 0;
    if (score < (spec?.passMark ?? 60)) {
      return { ok: false, message: `You scored ${score}%. You need ${spec?.passMark ?? 60}% to pass.`, countsAsAttempt: true };
    }
    return { ok: true, score };
  }
  return { ok: true, answers };
}

export function stripAnswerKey<T extends { spec?: QuestSpec }>(task: T): T {
  if (!task.spec?.questions) return task;
  return {
    ...task,
    spec: {
      ...task.spec,
      questions: task.spec.questions.map((q) => {
        const { correct, ...rest } = q;
        void correct;
        return rest;
      }),
    },
  };
}
