import mongoose from "mongoose";

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String },
  reputation: { type: Number, default: 0 },
  role: { type: String, enum: ["guest", "user", "admin"], default: "user" },
  createdAt: { type: Date, default: Date.now },
});

// Question Schema
const questionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  tags: [{ type: String }],
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  votes: { type: Number, default: 0 },
  answersCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Answer Schema
const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Question",
    required: true,
  },
  content: { type: String, required: true },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  votes: { type: Number, default: 0 },
  isAccepted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Vote Schema
const voteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  targetType: { type: String, enum: ["question", "answer"], required: true },
  value: { type: Number, enum: [1, -1], required: true },
  createdAt: { type: Date, default: Date.now },
});

// Create unique index for votes to prevent duplicate voting
voteSchema.index({ userId: 1, targetId: 1, targetType: 1 }, { unique: true });

// Text search indexes
questionSchema.index({
  title: "text",
  description: "text",
  tags: "text",
});

export const User = mongoose.model("User", userSchema);
export const Question = mongoose.model("Question", questionSchema);
export const Answer = mongoose.model("Answer", answerSchema);
export const Vote = mongoose.model("Vote", voteSchema);
