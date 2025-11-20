import { Quiz, QuizAttempt } from '../types';
import { SAMPLE_DATA, parseQuizContent } from './parser';

const STORAGE_KEY = 'quiz_master_data';
const RESULTS_KEY = 'quiz_master_results';

// Helper to safely read from storage without side effects
const readStorage = (): Quiz[] | null => {
  try {
    const item = localStorage.getItem(STORAGE_KEY);
    return item ? JSON.parse(item) : null; // Return null if key doesn't exist
  } catch (error) {
    console.error("Error reading from storage", error);
    return [];
  }
};

export const getStoredQuizzes = (): Quiz[] => {
  const quizzes = readStorage();
  
  // Only initialize defaults if storage is NULL (first time user), not just empty array
  if (quizzes === null) {
    const initialQuiz: Quiz = {
      id: 'default-sample-quiz',
      title: "Đề thi mẫu: Kiến thức Web",
      description: "Kiểm tra kiến thức cơ bản về HTML, CSS và JS.",
      createdAt: Date.now(),
      questions: parseQuizContent(SAMPLE_DATA)
    };
    
    const defaults = [initialQuiz];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
    return defaults;
  }
  
  return quizzes;
};

export const saveQuiz = (quiz: Quiz): void => {
  const current = readStorage() || []; 
  const updated = [quiz, ...current];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

export const deleteQuiz = (id: string): void => {
  const current = readStorage() || [];
  const updated = current.filter(q => q.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

// --- LEADERBOARD STORAGE ---

export const saveQuizResult = (result: QuizAttempt): void => {
  try {
    const storedResults = localStorage.getItem(RESULTS_KEY);
    const currentResults: QuizAttempt[] = storedResults ? JSON.parse(storedResults) : [];
    currentResults.push(result);
    localStorage.setItem(RESULTS_KEY, JSON.stringify(currentResults));
  } catch (error) {
    console.error("Error saving result", error);
  }
};

export const getQuizResults = (quizId: string): QuizAttempt[] => {
  try {
    const storedResults = localStorage.getItem(RESULTS_KEY);
    if (!storedResults) return [];
    const allResults: QuizAttempt[] = JSON.parse(storedResults);
    
    // Filter by quiz ID and sort by Score (descending)
    return allResults
      .filter(r => r.quizId === quizId)
      .sort((a, b) => b.score - a.score); 
  } catch (error) {
    return [];
  }
};