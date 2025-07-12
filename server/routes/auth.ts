import { RequestHandler } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { User } from "../models/index.js";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Rate limiting for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: "Too many authentication attempts, please try again later",
});

// Register new user
export const register: RequestHandler = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    // Check if MongoDB is connected
    if (!req.app.locals.mongoConnected) {
      return res.status(503).json({ error: "Database not available" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({ 
        error: existingUser.email === email ? "Email already exists" : "Username already exists" 
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = new User({
      username,
      email,
      password: hashedPassword,
      role: "user",
      reputation: 0
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Return user data (without password)
    const userData = {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      reputation: user.reputation,
      role: user.role,
      createdAt: user.createdAt.toISOString()
    };

    res.status(201).json({ user: userData, token });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Login user
export const login: RequestHandler = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Check if MongoDB is connected
    if (!req.app.locals.mongoConnected) {
      return res.status(503).json({ error: "Database not available" });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Return user data (without password)
    const userData = {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      reputation: user.reputation,
      role: user.role,
      createdAt: user.createdAt.toISOString()
    };

    res.json({ user: userData, token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get current user profile
export const getProfile: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).user.userId;

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const userData = {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      reputation: user.reputation,
      role: user.role,
      createdAt: user.createdAt.toISOString()
    };

    res.json(userData);
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
