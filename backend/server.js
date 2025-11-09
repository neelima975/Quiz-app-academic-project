const express = require('express');
const cors = require('cors');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const PORT = 5000;

// MongoDB connection
const MONGO_URI = 'mongodb://localhost:27017';
const DB_NAME = 'quizMasterDB';

let db;

// Connect to MongoDB
MongoClient.connect(MONGO_URI, { useUnifiedTopology: true })
  .then(client => {
    console.log('Connected to MongoDB');
    db = client.db(DB_NAME);
  })
  .catch(error => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });

// Middleware
app.use(cors());
app.use(express.json());

// Serve static images from 'images' folder at root level
app.use('/images', express.static(path.join(__dirname, 'images')));

// Get all quizzes
app.get('/api/quizzes', async (req, res) => {
  try {
    const quizzes = await db.collection('quizzes').find({}).toArray();
    res.json(quizzes);
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    res.status(500).json({ error: 'Failed to fetch quizzes' });
  }
});

// Get questions for a specific quiz (5 questions per round, 3 rounds = 15 questions total)
app.get('/api/questions/:quizId', async (req, res) => {
  try {
    const { quizId } = req.params;
    const allQuestions = await db.collection('questions')
      .find({ quizId: new ObjectId(quizId) })
      .toArray();
    
    // Shuffle questions and take first 15 (5 per round × 3 rounds)
    const shuffled = allQuestions.sort(() => 0.5 - Math.random());
    const selectedQuestions = shuffled.slice(0, 15);
    
    // Add round information to each question
    const questionsWithRounds = selectedQuestions.map((q, index) => ({
      ...q,
      round: Math.floor(index / 5) + 1, // Round 1, 2, or 3
      questionInRound: (index % 5) + 1   // Question 1-5 within the round
    }));
    
    res.json(questionsWithRounds);
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

// Get a single quiz by ID
app.get('/api/quizzes/:quizId', async (req, res) => {
  try {
    const { quizId } = req.params;
    const quiz = await db.collection('quizzes')
      .findOne({ _id: new ObjectId(quizId) });
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    res.json(quiz);
  } catch (error) {
    console.error('Error fetching quiz:', error);
    res.status(500).json({ error: 'Failed to fetch quiz' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Images should be placed in: ${path.join(__dirname, 'public', 'images')}`);
});