import { RequestHandler } from "express";
import {
  CreateQuestionRequest,
  CreateAnswerRequest,
  VoteRequest,
  QuestionsResponse,
  QuestionDetailResponse,
} from "@shared/api";
import { User, Question, Answer, Vote } from "../models/index.js";
import { mockDataService } from "../services/mockData.js";

// Get all questions with pagination and search
export const getQuestions: RequestHandler = async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || "";

    // Check if MongoDB is connected
    if (!req.app.locals.mongoConnected) {
      const result = mockDataService.getQuestions(search, page, limit);
      res.json(result);
      return;
    }

    let query = {};

    // Build search query
    if (search) {
      query = {
        $or: [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { tags: { $in: [new RegExp(search, "i")] } },
        ],
      };
    }

    // Get total count for pagination
    const total = await Question.countDocuments(query);

    // Get questions with pagination and populate author
    const questions = await Question.find(query)
      .populate("authorId", "username email reputation role createdAt")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Transform data to match frontend interface
    const transformedQuestions = questions.map((q: any) => ({
      id: q._id.toString(),
      title: q.title,
      description: q.description,
      tags: q.tags,
      authorId: q.authorId._id.toString(),
      author: {
        id: q.authorId._id.toString(),
        username: q.authorId.username,
        email: q.authorId.email,
        reputation: q.authorId.reputation,
        createdAt: q.authorId.createdAt.toISOString(),
      },
      votes: q.votes,
      answersCount: q.answersCount,
      createdAt: q.createdAt.toISOString(),
      updatedAt: q.updatedAt.toISOString(),
    }));

    const response: QuestionsResponse = {
      questions: transformedQuestions,
      total,
      page,
      limit,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching questions:", error);
    res.status(500).json({ error: "Failed to fetch questions" });
  }
};

// Get question by ID with answers
export const getQuestionById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if MongoDB is connected
    if (!req.app.locals.mongoConnected) {
      const result = mockDataService.getQuestionById(id);
      if (!result) {
        return res.status(404).json({ error: "Question not found" });
      }
      res.json(result);
      return;
    }

    const question = await Question.findById(id)
      .populate("authorId", "username email reputation role createdAt")
      .lean();

    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }

    const answers = await Answer.find({ questionId: id })
      .populate("authorId", "username email reputation role createdAt")
      .sort({ isAccepted: -1, votes: -1, createdAt: 1 })
      .lean();

    // Transform question data
    const transformedQuestion = {
      id: question._id.toString(),
      title: question.title,
      description: question.description,
      tags: question.tags,
      authorId: (question.authorId as any)._id.toString(),
      author: {
        id: (question.authorId as any)._id.toString(),
        username: (question.authorId as any).username,
        email: (question.authorId as any).email,
        reputation: (question.authorId as any).reputation,
        createdAt: (question.authorId as any).createdAt.toISOString(),
      },
      votes: question.votes,
      answersCount: question.answersCount,
      createdAt: question.createdAt.toISOString(),
      updatedAt: question.updatedAt.toISOString(),
    };

    // Transform answers data
    const transformedAnswers = answers.map((a: any) => ({
      id: a._id.toString(),
      questionId: a.questionId.toString(),
      content: a.content,
      authorId: a.authorId._id.toString(),
      author: {
        id: a.authorId._id.toString(),
        username: a.authorId.username,
        email: a.authorId.email,
        reputation: a.authorId.reputation,
        createdAt: a.authorId.createdAt.toISOString(),
      },
      votes: a.votes,
      isAccepted: a.isAccepted,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    }));

    const response: QuestionDetailResponse = {
      question: transformedQuestion,
      answers: transformedAnswers,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching question:", error);
    res.status(500).json({ error: "Failed to fetch question" });
  }
};

// Create new question
export const createQuestion: RequestHandler = async (req, res) => {
  try {
    const { title, description, tags }: CreateQuestionRequest = req.body;
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!title || !description) {
      return res
        .status(400)
        .json({ error: "Title and description are required" });
    }

    // Check if MongoDB is connected
    if (!req.app.locals.mongoConnected) {
      const newQuestion = mockDataService.createQuestion({
        title,
        description,
        tags: tags || [],
      });
      res.status(201).json(newQuestion);
      return;
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const newQuestion = await Question.create({
      title,
      description,
      tags: tags || [],
      authorId: userId,
    });

    // Populate author information
    await newQuestion.populate("authorId", "username email reputation role createdAt");

    const transformedQuestion = {
      id: newQuestion._id.toString(),
      title: newQuestion.title,
      description: newQuestion.description,
      tags: newQuestion.tags,
      authorId: (newQuestion.authorId as any)._id.toString(),
      author: {
        id: (newQuestion.authorId as any)._id.toString(),
        username: (newQuestion.authorId as any).username,
        email: (newQuestion.authorId as any).email,
        reputation: (newQuestion.authorId as any).reputation,
        createdAt: (newQuestion.authorId as any).createdAt.toISOString(),
      },
      votes: newQuestion.votes,
      answersCount: newQuestion.answersCount,
      createdAt: newQuestion.createdAt.toISOString(),
      updatedAt: newQuestion.updatedAt.toISOString(),
    };

    res.status(201).json(transformedQuestion);
  } catch (error) {
    console.error("Error creating question:", error);
    res.status(500).json({ error: "Failed to create question" });
  }
};

// Create new answer
export const createAnswer: RequestHandler = async (req, res) => {
  try {
    const { questionId, content }: CreateAnswerRequest = req.body;
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!questionId || !content) {
      return res
        .status(400)
        .json({ error: "Question ID and content are required" });
    }

    // Check if MongoDB is connected
    if (!req.app.locals.mongoConnected) {
      const newAnswer = mockDataService.createAnswer({ questionId, content });
      if (!newAnswer) {
        return res.status(404).json({ error: "Question not found" });
      }
      res.status(201).json(newAnswer);
      return;
    }

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const newAnswer = await Answer.create({
      questionId,
      content,
      authorId: userId,
      votes: 0,
      isAccepted: false,
    });

    // Update question answer count
    await Question.findByIdAndUpdate(questionId, {
      $inc: { answersCount: 1 },
      updatedAt: new Date(),
    });

    // Populate author data
    await newAnswer.populate(
      "authorId",
      "username email reputation role createdAt",
    );

    // Transform data to match frontend interface
    const transformedAnswer = {
      id: newAnswer._id.toString(),
      questionId: newAnswer.questionId.toString(),
      content: newAnswer.content,
      authorId: (newAnswer.authorId as any)._id.toString(),
      author: {
        id: (newAnswer.authorId as any)._id.toString(),
        username: (newAnswer.authorId as any).username,
        email: (newAnswer.authorId as any).email,
        reputation: (newAnswer.authorId as any).reputation,
        createdAt: (newAnswer.authorId as any).createdAt.toISOString(),
      },
      votes: newAnswer.votes,
      isAccepted: newAnswer.isAccepted,
      createdAt: newAnswer.createdAt.toISOString(),
      updatedAt: newAnswer.updatedAt.toISOString(),
    };

    res.status(201).json(transformedAnswer);
  } catch (error) {
    console.error("Error creating answer:", error);
    res.status(500).json({ error: "Failed to create answer" });
  }
};

// Vote on question or answer
export const vote: RequestHandler = async (req, res) => {
  try {
    const { targetId, targetType, value }: VoteRequest = req.body;
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!targetId || !targetType || (value !== 1 && value !== -1)) {
      return res.status(400).json({ error: "Invalid vote data" });
    }

    // Check if MongoDB is connected
    if (!req.app.locals.mongoConnected) {
      const result = mockDataService.vote(targetId, targetType, value);
      if (!result) {
        return res.status(404).json({ error: "Target not found" });
      }
      res.json(result);
      return;
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if user has already voted
    const existingVote = await Vote.findOne({
      userId,
      targetId,
      targetType,
    });

    let newVotes = 0;

    if (existingVote) {
      // Update existing vote
      if (existingVote.value === value) {
        // Remove vote if clicking the same button
        await Vote.deleteOne({ _id: existingVote._id });
        newVotes = -existingVote.value;
      } else {
        // Change vote direction
        await Vote.updateOne(
          { _id: existingVote._id },
          { value, updatedAt: new Date() },
        );
        newVotes = value - existingVote.value;
      }
    } else {
      // Create new vote
      await Vote.create({
        userId,
        targetId,
        targetType,
        value,
      });
      newVotes = value;
    }

    // Update vote count on target
    if (targetType === "question") {
      const updatedQuestion = await Question.findByIdAndUpdate(
        targetId,
        { $inc: { votes: newVotes }, updatedAt: new Date() },
        { new: true },
      );
      if (!updatedQuestion) {
        return res.status(404).json({ error: "Question not found" });
      }
      res.json({ votes: updatedQuestion.votes });
    } else if (targetType === "answer") {
      const updatedAnswer = await Answer.findByIdAndUpdate(
        targetId,
        { $inc: { votes: newVotes }, updatedAt: new Date() },
        { new: true },
      );
      if (!updatedAnswer) {
        return res.status(404).json({ error: "Answer not found" });
      }
      res.json({ votes: updatedAnswer.votes });
    } else {
      res.status(400).json({ error: "Invalid target type" });
    }
  } catch (error) {
    console.error("Error processing vote:", error);
    res.status(500).json({ error: "Failed to process vote" });
  }
};

// Accept answer
export const acceptAnswer: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Check if MongoDB is connected
    if (!req.app.locals.mongoConnected) {
      const result = mockDataService.acceptAnswer(id);
      if (!result) {
        return res.status(404).json({ error: "Answer not found" });
      }
      res.json(result);
      return;
    }

    const answer = await Answer.findById(id).populate(
      "authorId",
      "username email reputation role createdAt",
    );
    if (!answer) {
      return res.status(404).json({ error: "Answer not found" });
    }

    // Get the question to check if current user is the author
    const question = await Question.findById(answer.questionId);
    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }

    // Only question author can accept answers
    if (question.authorId.toString() !== userId) {
      return res.status(403).json({ error: "Only question author can accept answers" });
    }

    // Mark all other answers for this question as not accepted
    await Answer.updateMany(
      { questionId: answer.questionId },
      { isAccepted: false, updatedAt: new Date() },
    );

    // Mark this answer as accepted
    answer.isAccepted = true;
    answer.updatedAt = new Date();
    await answer.save();

    // Transform data to match frontend interface
    const transformedAnswer = {
      id: answer._id.toString(),
      questionId: answer.questionId.toString(),
      content: answer.content,
      authorId: (answer.authorId as any)._id.toString(),
      author: {
        id: (answer.authorId as any)._id.toString(),
        username: (answer.authorId as any).username,
        email: (answer.authorId as any).email,
        reputation: (answer.authorId as any).reputation,
        createdAt: (answer.authorId as any).createdAt.toISOString(),
      },
      votes: answer.votes,
      isAccepted: answer.isAccepted,
      createdAt: answer.createdAt.toISOString(),
      updatedAt: answer.updatedAt.toISOString(),
    };

    res.json(transformedAnswer);
  } catch (error) {
    console.error("Error accepting answer:", error);
    res.status(500).json({ error: "Failed to accept answer" });
  }
};
