export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  reputation: number;
  createdAt: string;
}

export interface Question {
  id: string;
  title: string;
  description: string;
  tags: string[];
  authorId: string;
  author: User;
  votes: number;
  answersCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Answer {
  id: string;
  questionId: string;
  content: string;
  authorId: string;
  author: User;
  votes: number;
  isAccepted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Vote {
  id: string;
  userId: string;
  targetId: string; // Question or Answer ID
  targetType: "question" | "answer";
  value: 1 | -1; // 1 for upvote, -1 for downvote
  createdAt: string;
}

// API Request/Response types
export interface CreateQuestionRequest {
  title: string;
  description: string;
  tags: string[];
}

export interface CreateAnswerRequest {
  questionId: string;
  content: string;
}

export interface VoteRequest {
  targetId: string;
  targetType: "question" | "answer";
  value: 1 | -1;
}

export interface QuestionsResponse {
  questions: Question[];
  total: number;
  page: number;
  limit: number;
}

export interface QuestionDetailResponse {
  question: Question;
  answers: Answer[];
}

export interface DemoResponse {
  message: string;
}
