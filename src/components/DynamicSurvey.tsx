// Shared types for dynamic surveys (component implementation lives elsewhere or pending)
export interface SurveyQuestion {
  id: string;
  questionText: string;
  fieldType: string;
  answerOptions?: string[];
  required?: boolean;
}

export default function DynamicSurvey() {
  return null;
}
