// Mock data service for when MongoDB is not available
import { Question, Answer } from "@shared/api";

let mockQuestions: Question[] = [
  {
    id: "1",
    title: "How do I centre a div with only css and html?",
    description:
      "I've been trying to center a div element on my webpage using only CSS and HTML, but I'm having trouble getting it to work properly. I've tried using margin: auto but it doesn't seem to center vertically.\n\nHere's what I've tried so far:\n\n```css\n.center {\n  margin: auto;\n  width: 50%;\n}\n```\n\nBut this only centers horizontally. How can I center both horizontally and vertically?",
    tags: ["css", "html", "centering"],
    authorId: "user1",
    author: {
      id: "user1",
      username: "john_dev",
      email: "john@example.com",
      reputation: 1250,
      createdAt: "2024-01-15T10:30:00Z",
    },
    votes: 5,
    answersCount: 2,
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-01-15T10:30:00Z",
  },
  {
    id: "2",
    title: "Best practices for React state management in 2024",
    description:
      "What are the current best practices for managing state in React applications? I'm working on a large project and need to decide between Context API, Redux, or other solutions. The project has multiple components that need to share state, and I want to ensure good performance and maintainability.",
    tags: ["react", "state-management", "redux"],
    authorId: "user2",
    author: {
      id: "user2",
      username: "sarah_react",
      email: "sarah@example.com",
      reputation: 2840,
      createdAt: "2024-01-14T15:20:00Z",
    },
    votes: 12,
    answersCount: 1,
    createdAt: "2024-01-14T15:20:00Z",
    updatedAt: "2024-01-14T15:20:00Z",
  },
  {
    id: "3",
    title: "How to optimize database queries in Node.js?",
    description:
      "I'm experiencing slow query performance in my Node.js application with PostgreSQL. What are some strategies to optimize database queries and improve overall performance? The application handles about 1000 concurrent users.",
    tags: ["nodejs", "postgresql", "performance"],
    authorId: "user3",
    author: {
      id: "user3",
      username: "mike_backend",
      email: "mike@example.com",
      reputation: 890,
      createdAt: "2024-01-13T09:45:00Z",
    },
    votes: 8,
    answersCount: 1,
    createdAt: "2024-01-13T09:45:00Z",
    updatedAt: "2024-01-13T09:45:00Z",
  },
];

let mockAnswers: Answer[] = [
  {
    id: "1",
    questionId: "1",
    content: `You can use flexbox to center both horizontally and vertically:

\`\`\`css
.container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}
\`\`\`

This is the modern and most reliable way to center content.`,
    authorId: "user2",
    author: {
      id: "user2",
      username: "sarah_react",
      email: "sarah@example.com",
      reputation: 2840,
      createdAt: "2024-01-14T15:20:00Z",
    },
    votes: 8,
    isAccepted: true,
    createdAt: "2024-01-15T11:15:00Z",
    updatedAt: "2024-01-15T11:15:00Z",
  },
  {
    id: "2",
    questionId: "1",
    content: `Another approach is using CSS Grid:

\`\`\`css
.container {
  display: grid;
  place-items: center;
  height: 100vh;
}
\`\`\`

This is even simpler than flexbox!`,
    authorId: "user3",
    author: {
      id: "user3",
      username: "mike_backend",
      email: "mike@example.com",
      reputation: 890,
      createdAt: "2024-01-13T09:45:00Z",
    },
    votes: 3,
    isAccepted: false,
    createdAt: "2024-01-15T12:30:00Z",
    updatedAt: "2024-01-15T12:30:00Z",
  },
  {
    id: "3",
    questionId: "2",
    content: `For 2024, I'd recommend using Zustand for most React applications. It's lightweight, has great TypeScript support, and doesn't require boilerplate like Redux.

\`\`\`javascript
import { create } from 'zustand'

const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}))
\`\`\`

For complex applications, consider Redux Toolkit with RTK Query.`,
    authorId: "user1",
    author: {
      id: "user1",
      username: "john_dev",
      email: "john@example.com",
      reputation: 1250,
      createdAt: "2024-01-15T10:30:00Z",
    },
    votes: 15,
    isAccepted: true,
    createdAt: "2024-01-14T16:20:00Z",
    updatedAt: "2024-01-14T16:20:00Z",
  },
  {
    id: "4",
    questionId: "3",
    content: `Here are some key optimization strategies:

1. **Use connection pooling**
2. **Add proper indexes** on frequently queried columns
3. **Use prepared statements** to prevent SQL injection and improve performance
4. **Implement query result caching** with Redis
5. **Use database connection limits** to prevent overwhelming the DB

Example with connection pooling:
\`\`\`javascript
const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})
\`\`\``,
    authorId: "user2",
    author: {
      id: "user2",
      username: "sarah_react",
      email: "sarah@example.com",
      reputation: 2840,
      createdAt: "2024-01-14T15:20:00Z",
    },
    votes: 12,
    isAccepted: true,
    createdAt: "2024-01-13T11:45:00Z",
    updatedAt: "2024-01-13T11:45:00Z",
  },
];

export const mockDataService = {
  // Questions
  getQuestions: (search = "", page = 1, limit = 10) => {
    let filtered = mockQuestions;

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = mockQuestions.filter(
        (q) =>
          q.title.toLowerCase().includes(searchLower) ||
          q.description.toLowerCase().includes(searchLower) ||
          q.tags.some((tag) => tag.toLowerCase().includes(searchLower)),
      );
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedQuestions = filtered.slice(startIndex, endIndex);

    return {
      questions: paginatedQuestions,
      total: filtered.length,
      page,
      limit,
    };
  },

  getQuestionById: (id: string) => {
    const question = mockQuestions.find((q) => q.id === id);
    if (!question) return null;

    const questionAnswers = mockAnswers.filter((a) => a.questionId === id);
    return {
      question,
      answers: questionAnswers,
    };
  },

  createQuestion: (data: {
    title: string;
    description: string;
    tags: string[];
  }) => {
    const newId = (mockQuestions.length + 1).toString();
    const newQuestion: Question = {
      id: newId,
      title: data.title,
      description: data.description,
      tags: data.tags,
      authorId: "user1",
      author: {
        id: "user1",
        username: "john_dev",
        email: "john@example.com",
        reputation: 1250,
        createdAt: "2024-01-15T10:30:00Z",
      },
      votes: 0,
      answersCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockQuestions.unshift(newQuestion);
    return newQuestion;
  },

  // Answers
  createAnswer: (data: { questionId: string; content: string }) => {
    const question = mockQuestions.find((q) => q.id === data.questionId);
    if (!question) return null;

    const newId = (mockAnswers.length + 1).toString();
    const newAnswer: Answer = {
      id: newId,
      questionId: data.questionId,
      content: data.content,
      authorId: "user1",
      author: {
        id: "user1",
        username: "john_dev",
        email: "john@example.com",
        reputation: 1250,
        createdAt: "2024-01-15T10:30:00Z",
      },
      votes: 0,
      isAccepted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockAnswers.push(newAnswer);

    // Update question answer count
    question.answersCount += 1;
    question.updatedAt = new Date().toISOString();

    return newAnswer;
  },

  // Voting
  vote: (
    targetId: string,
    targetType: "question" | "answer",
    value: number,
  ) => {
    if (targetType === "question") {
      const question = mockQuestions.find((q) => q.id === targetId);
      if (question) {
        question.votes += value;
        return { votes: question.votes };
      }
    } else {
      const answer = mockAnswers.find((a) => a.id === targetId);
      if (answer) {
        answer.votes += value;
        return { votes: answer.votes };
      }
    }
    return null;
  },

  // Accept answer
  acceptAnswer: (answerId: string) => {
    const answer = mockAnswers.find((a) => a.id === answerId);
    if (!answer) return null;

    // Mark all other answers for this question as not accepted
    mockAnswers.forEach((a) => {
      if (a.questionId === answer.questionId) {
        a.isAccepted = false;
      }
    });

    // Mark this answer as accepted
    answer.isAccepted = true;
    answer.updatedAt = new Date().toISOString();

    return answer;
  },
};
