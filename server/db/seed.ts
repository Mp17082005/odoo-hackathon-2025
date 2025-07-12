import { User, Question, Answer } from "../models/index.js";
import { connectDB } from "./connection.js";

export async function seedDatabase() {
  try {
    const connected = await connectDB();
    if (!connected) {
      console.log("🚀 Skipping database seeding - MongoDB not available");
      return;
    }

    // Check if data already exists
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      console.log("📊 Database already seeded");
      return;
    }

    console.log("🌱 Seeding database...");

    // Create users
    const users = await User.insertMany([
      {
        username: "john_dev",
        email: "john@example.com",
        reputation: 1250,
        role: "user",
      },
      {
        username: "sarah_react",
        email: "sarah@example.com",
        reputation: 2840,
        role: "admin",
      },
      {
        username: "mike_backend",
        email: "mike@example.com",
        reputation: 890,
        role: "user",
      },
    ]);

    // Create questions
    const questions = await Question.insertMany([
      {
        title: "How do I centre a div with only css and html?",
        description: `I've been trying to center a div element on my webpage using only CSS and HTML, but I'm having trouble getting it to work properly. I've tried using margin: auto but it doesn't seem to center vertically.

Here's what I've tried so far:

\`\`\`css
.center {
  margin: auto;
  width: 50%;
}
\`\`\`

But this only centers horizontally. How can I center both horizontally and vertically?`,
        tags: ["css", "html", "centering"],
        authorId: users[0]._id,
        votes: 5,
        answersCount: 2,
      },
      {
        title: "Best practices for React state management in 2024",
        description:
          "What are the current best practices for managing state in React applications? I'm working on a large project and need to decide between Context API, Redux, or other solutions. The project has multiple components that need to share state, and I want to ensure good performance and maintainability.",
        tags: ["react", "state-management", "redux"],
        authorId: users[1]._id,
        votes: 12,
        answersCount: 1,
      },
      {
        title: "How to optimize database queries in Node.js?",
        description:
          "I'm experiencing slow query performance in my Node.js application with PostgreSQL. What are some strategies to optimize database queries and improve overall performance? The application handles about 1000 concurrent users.",
        tags: ["nodejs", "postgresql", "performance"],
        authorId: users[2]._id,
        votes: 8,
        answersCount: 1,
      },
    ]);

    // Create answers
    await Answer.insertMany([
      {
        questionId: questions[0]._id,
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
        authorId: users[1]._id,
        votes: 8,
        isAccepted: true,
      },
      {
        questionId: questions[0]._id,
        content: `Another approach is using CSS Grid:

\`\`\`css
.container {
  display: grid;
  place-items: center;
  height: 100vh;
}
\`\`\`

This is even simpler than flexbox!`,
        authorId: users[2]._id,
        votes: 3,
        isAccepted: false,
      },
      {
        questionId: questions[1]._id,
        content: `For 2024, I'd recommend using Zustand for most React applications. It's lightweight, has great TypeScript support, and doesn't require boilerplate like Redux.

\`\`\`javascript
import { create } from 'zustand'

const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}))
\`\`\`

For complex applications, consider Redux Toolkit with RTK Query.`,
        authorId: users[0]._id,
        votes: 15,
        isAccepted: true,
      },
      {
        questionId: questions[2]._id,
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
        authorId: users[1]._id,
        votes: 12,
        isAccepted: true,
      },
    ]);

    console.log("✅ Database seeded successfully");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}
