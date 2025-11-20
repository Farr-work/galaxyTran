export interface Option {
  id: string; // "A", "B", "C", "D"
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: number;
  text: string;
  options: Option[];
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  createdAt: number;
  questions: Question[];
  password?: string; // Optional password protection
  shuffleQuestions?: boolean; // Randomize question order
}

export interface QuizResult {
  correct: number;
  total: number;
  score: number; // 0-10 scale
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  playerName: string;
  score: number;
  correct: number;
  total: number;
  timestamp: number;
}