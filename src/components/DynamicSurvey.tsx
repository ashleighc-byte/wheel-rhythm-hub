// Shared types for dynamic surveys (component implementation pending)
export interface SurveyQuestion {
  id: string;
  questionText: string;
  fieldType: string;
  answerOptions?: string[];
  required?: boolean;
  order?: number;
  [key: string]: unknown;
}

export default function DynamicSurvey() {
  return null;
}
