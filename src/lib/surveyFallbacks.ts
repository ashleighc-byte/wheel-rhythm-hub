import type { SurveyQuestion } from "@/components/DynamicSurvey";

const PRE_PHASE_IMPORTANCE_OPTIONS = [
  "1 – Not important",
  "2",
  "3 – Somewhat important",
  "4",
  "5 – Very important",
];

export const PRE_PHASE_FALLBACK_QUESTIONS: SurveyQuestion[] = [
  {
    id: "pre-q1-active-style",
    questionText: "Q1: When it comes to being active, which sounds most like you?",
    fieldType: "single select",
    answerOptions: [
      "I prefer sport and outdoor activity",
      "I prefer screen-based or gaming activities",
      "I enjoy both equally",
      "I don't really do either much",
    ],
    order: 1,
    phase: "Pre Phase",
  },
  {
    id: "pre-q2-bike-history",
    questionText: "Q2: Have you ever ridden a bike before (any kind)?",
    fieldType: "single select",
    answerOptions: [
      "Never",
      "A few times",
      "Regularly in the past",
      "I currently ride regularly",
    ],
    order: 2,
    phase: "Pre Phase",
  },
  {
    id: "pre-q3-virtual-league-reaction",
    questionText:
      "Q3: Before trying it — the idea of competing in a virtual cycling league (like a video game on a real bike), sounded...",
    fieldType: "single select",
    answerOptions: [
      "Really cool — I'm into it",
      "Interesting, but I'm not sure yet",
      "Weird — I'd rather just ride outside",
      "I'd only do it if my friends were",
      "Not my thing at all",
    ],
    order: 3,
    phase: "Pre Phase",
  },
  {
    id: "pre-q4-free-time-choice",
    questionText: "Q4: If you had free time right now, which would you choose?",
    fieldType: "single select",
    answerOptions: [
      "Go for a real ride outside",
      "Play a competitive game or esport",
      "Something else active",
      "Something completely inactive",
    ],
    order: 4,
    phase: "Pre Phase",
  },
  {
    id: "pre-q5a-competing",
    questionText: "Q5a: Competing and beating others (rate 1–5)",
    fieldType: "single select",
    answerOptions: PRE_PHASE_IMPORTANCE_OPTIONS,
    order: 5,
    phase: "Pre Phase",
  },
  {
    id: "pre-q5b-pbs",
    questionText: "Q5b: Improving my own stats / PBs (rate 1–5)",
    fieldType: "single select",
    answerOptions: PRE_PHASE_IMPORTANCE_OPTIONS,
    order: 6,
    phase: "Pre Phase",
  },
  {
    id: "pre-q5c-friends",
    questionText: "Q5c: Doing it with friends (rate 1–5)",
    fieldType: "single select",
    answerOptions: PRE_PHASE_IMPORTANCE_OPTIONS,
    order: 7,
    phase: "Pre Phase",
  },
  {
    id: "pre-q5d-game-feel",
    questionText: "Q5d: It feels like a game (rate 1–5)",
    fieldType: "single select",
    answerOptions: PRE_PHASE_IMPORTANCE_OPTIONS,
    order: 8,
    phase: "Pre Phase",
  },
  {
    id: "pre-q5e-schedule",
    questionText: "Q5e: I can do it on my own schedule (rate 1–5)",
    fieldType: "single select",
    answerOptions: PRE_PHASE_IMPORTANCE_OPTIONS,
    order: 9,
    phase: "Pre Phase",
  },
  {
    id: "pre-q5f-fitter",
    questionText: "Q5f: Getting physically fitter (rate 1–5)",
    fieldType: "single select",
    answerOptions: PRE_PHASE_IMPORTANCE_OPTIONS,
    order: 10,
    phase: "Pre Phase",
  },
  {
    id: "pre-q6-gaming-enjoyment",
    questionText: "Q6: How much do you enjoy competitive gaming or esports?",
    fieldType: "single select",
    answerOptions: [
      "1 – Not at all",
      "2",
      "3 – Somewhat",
      "4",
      "5 – Love it",
    ],
    order: 11,
    phase: "Pre Phase",
  },
  {
    id: "pre-q7-worth-time",
    questionText: "Q7: What would need to be true for a virtual cycling league to feel worth your time?",
    fieldType: "text",
    answerOptions: [],
    order: 12,
    phase: "Pre Phase",
  },
  {
    id: "pre-q8-one-word",
    questionText: "Q8: In one word — how are you feeling about joining Free Wheeler?",
    fieldType: "text",
    answerOptions: [],
    order: 13,
    phase: "Pre Phase",
  },
];

export function getFallbackSurveyQuestions(phase: string): SurveyQuestion[] {
  if (phase === "Pre Phase") {
    return PRE_PHASE_FALLBACK_QUESTIONS;
  }

  if (phase === "Mid Phase") {
    return MID_PHASE_FALLBACK_QUESTIONS;
  }

  return [];
}
const MID_PHASE_FALLBACK_QUESTIONS: SurveyQuestion[] = [
  {
    id: "mid-q1-enjoyment",
    questionText: "Mid Q1: How much are you enjoying the virtual bike sessions so far?",
    fieldType: "single select",
    answerOptions: [
      "1 \u2013 Not really",
      "2",
      "3 \u2013 It\u2019s okay",
      "4",
      "5 \u2013 Really enjoying it",
    ],
    order: 1,
    phase: "Mid Phase",
  },
  {
    id: "mid-q2-virtual-vs-real",
    questionText: "Mid Q2: After a few sessions, where are you sitting on virtual vs real cycling?",
    fieldType: "single select",
    answerOptions: [
      "I\u2019d rather do this than ride outside",
      "I\u2019d rather be riding outside",
      "I enjoy both equally",
      "I still don\u2019t love either",
    ],
    order: 2,
    phase: "Mid Phase",
  },
  {
    id: "mid-q3-reasons",
    questionText: "Mid Q3: What\u2019s been the main reason you\u2019ve come back to ride? Tick all that apply.",
    fieldType: "multi select",
    answerOptions: [
      "The points and levelling up",
      "Competing with others",
      "I like the virtual routes",
      "Friends are doing it",
      "Fits my schedule",
      "Want to beat my own score",
    ],
    order: 3,
    phase: "Mid Phase",
  },
  {
    id: "mid-q4-leaderboard",
    questionText: "Mid Q4: Does competing against other riders on the leaderboard motivate you to ride more?",
    fieldType: "single select",
    answerOptions: [
      "1 \u2013 Not at all",
      "2",
      "3 \u2013 Somewhat",
      "4",
      "5 \u2013 Definitely yes",
    ],
    order: 4,
    phase: "Mid Phase",
  },
  {
    id: "mid-q5-head-to-head",
    questionText: "Mid Q5: If you could race head-to-head in real time against riders at other schools \u2014 like a multiplayer game \u2014 would that make you ride more?",
    fieldType: "single select",
    answerOptions: [
      "Yes \u2014 that would be way more fun",
      "Maybe",
      "Probably not",
      "Doesn\u2019t matter to me",
    ],
    order: 5,
    phase: "Mid Phase",
  },
  {
    id: "mid-q6-one-thing",
    questionText: "Mid Q6: What ONE thing would make this experience more fun or make you ride more?",
    fieldType: "text",
    answerOptions: [],
    order: 6,
    phase: "Mid Phase",
  },
];