# StackIt Setup Guide

## Prerequisites

Before running StackIt, you need to have MongoDB installed and running on your system.

### Installing MongoDB

#### Option 1: MongoDB Community Server (Recommended)

1. Download MongoDB Community Server from [https://www.mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
2. Follow the installation instructions for your operating system
3. Start the MongoDB service

#### Option 2: Using Docker (Quick Setup)

```bash
# Start MongoDB with Docker
docker run -d --name stackit-mongo -p 27017:27017 mongo:latest

# To stop MongoDB later
docker stop stackit-mongo

# To start MongoDB again
docker start stackit-mongo
```

#### Option 3: MongoDB Atlas (Cloud)

1. Create a free account at [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a new cluster
3. Get your connection string and update the `.env` file

## Running StackIt

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Ensure MongoDB is running:**

   - If using local MongoDB: Make sure the MongoDB service is started
   - If using Docker: `docker start stackit-mongo`
   - If using Atlas: Your cluster should be running

3. **Start the development server:**

   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:8080`

## Environment Configuration

The application uses the following environment variables in `.env`:

```env
MONGODB_URI=mongodb://localhost:27017/stackit
NODE_ENV=development
```

For MongoDB Atlas, update the `MONGODB_URI` with your connection string:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/stackit?retryWrites=true&w=majority
```

## Features

✅ **Mobile Responsive** - Works perfectly on all screen sizes
✅ **MongoDB Integration** - Real database storage for questions and answers
✅ **Real-time Search** - Search questions by title, description, or tags
✅ **Theme Switching** - Dark/Light mode toggle
✅ **Authentication System** - Login/Signup with user roles
✅ **Rich Text Editor** - Full-featured markdown editor with formatting tools
✅ **Voting System** - Upvote/downvote questions and answers
✅ **Answer Acceptance** - Question authors can accept best answers
✅ **Notifications** - Bell icon with notification dropdown

## Demo Credentials

For testing, you can use these demo accounts:

**Regular User:**

- Email: john@example.com
- Password: password123

**Admin User:**

- Email: sarah@example.com
- Password: password123

## Troubleshooting

### MongoDB Connection Issues

- **Error: "Failed to connect to MongoDB"**
  - Ensure MongoDB is running on port 27017
  - Check if the MONGODB_URI in `.env` is correct
  - For Docker: `docker ps` to see if container is running

### Development Server Issues

- **Port 8080 already in use:**
  - Change the port in `vite.config.ts` server configuration
  - Or stop the process using port 8080

### Build Issues

- **TypeScript errors:**
  - Run `npm run typecheck` to see specific errors
  - Ensure all dependencies are installed with `npm install`

## Database Seeding

The application automatically seeds the database with sample questions and users on first run. If you want to reset the database:

1. Connect to MongoDB
2. Drop the `stackit` database
3. Restart the application - it will re-seed automatically

## Production Deployment

For production deployment:

1. **Build the application:**

   ```bash
   npm run build
   ```

2. **Set production environment variables:**

   ```env
   MONGODB_URI=your-production-mongodb-uri
   NODE_ENV=production
   ```

3. **Start the production server:**
   ```bash
   npm start
   ```

The production server serves the built React SPA and handles API requests.
