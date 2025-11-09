import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, Award, ChevronRight, List, Trophy, Target, Zap, Flame } from 'lucide-react';
import './App.scss';

const API_URL = 'http://localhost:5000/api';

export default function QuizApp() {
  const [view, setView] = useState('quizList');
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [showRoundTransition, setShowRoundTransition] = useState(false);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  useEffect(() => {
    if (view === 'quiz' && timeLeft > 0 && !isAnswered) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isAnswered && view === 'quiz') {
      handleTimeUp();
    }
  }, [timeLeft, isAnswered, view]);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/quizzes`);
      const data = await response.json();
      setQuizzes(data);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      alert('Failed to load quizzes. Make sure the backend is running!');
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = async (quiz) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/questions/${quiz._id}`);
      const data = await response.json();
      
      if (data.length === 0) {
        alert('No questions found for this quiz!');
        return;
      }
      
      setSelectedQuiz(quiz);
      setQuestions(data);
      setCurrentQuestionIndex(0);
      setCurrentRound(1);
      setScore(0);
      setAnswers([]);
      setTimeLeft(data[0].timer);
      setView('quiz');
    } catch (error) {
      console.error('Error fetching questions:', error);
      alert('Failed to load questions. Make sure the backend is running!');
    } finally {
      setLoading(false);
    }
  };

  const handleTimeUp = () => {
    setIsAnswered(true);
    setAnswers([...answers, { 
      question: questions[currentQuestionIndex],
      selectedOption: null,
      isCorrect: false,
      timedOut: true
    }]);
  };

  const handleAnswerSelect = (optionIndex) => {
    if (isAnswered) return;
    
    setSelectedAnswer(optionIndex);
    setIsAnswered(true);
    
    const isCorrect = questions[currentQuestionIndex].options[optionIndex].isCorrect;
    
    if (isCorrect) {
      setScore(score + 1);
    }
    
    setAnswers([...answers, {
      question: questions[currentQuestionIndex],
      selectedOption: optionIndex,
      isCorrect: isCorrect,
      timedOut: false
    }]);
  };

  const handleNext = () => {
    const nextIndex = currentQuestionIndex + 1;
    const nextQuestion = questions[nextIndex];
    
    // Check if moving to a new round
    if (nextQuestion && nextQuestion.round > currentRound) {
      setShowRoundTransition(true);
      setTimeout(() => {
        setCurrentRound(nextQuestion.round);
        setShowRoundTransition(false);
        setCurrentQuestionIndex(nextIndex);
        setSelectedAnswer(null);
        setIsAnswered(false);
        setTimeLeft(nextQuestion.timer);
      }, 2000);
    } else if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(nextIndex);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setTimeLeft(nextQuestion.timer);
    } else {
      setView('results');
    }
  };

  const handleSkip = () => {
    if (isAnswered) {
      handleNext();
      return;
    }
    
    // Mark as skipped (same as time up)
    setIsAnswered(true);
    setAnswers([...answers, { 
      question: questions[currentQuestionIndex],
      selectedOption: null,
      isCorrect: false,
      timedOut: false,
      skipped: true
    }]);
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      const prevIndex = currentQuestionIndex - 1;
      const prevQuestion = questions[prevIndex];
      setCurrentQuestionIndex(prevIndex);
      setCurrentRound(prevQuestion.round || Math.floor(prevIndex / 5) + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setTimeLeft(prevQuestion.timer);
      // Remove the last answer from history
      setAnswers(answers.slice(0, -1));
      // Adjust score if last answer was correct
      if (answers[answers.length - 1]?.isCorrect) {
        setScore(score - 1);
      }
    }
  };

  const handleSubmitQuiz = () => {
    if (window.confirm('Are you sure you want to end the quiz and view your results?')) {
      setView('results');
    }
  };

  const restartQuiz = () => {
    setView('quizList');
    setSelectedQuiz(null);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setScore(0);
    setAnswers([]);
    setCurrentRound(1);
    setShowRoundTransition(false);
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    
    // If it's already a full URL, return it
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // If path starts with /images/, use it directly with backend URL
    if (imagePath.startsWith('/images/')) {
      return `http://localhost:5000${imagePath}`;
    }
    
    // Otherwise, add /images/ prefix
    return `http://localhost:5000/images/${imagePath}`;
  };

  if (view === 'quizList') {
    return (
      <div className="quiz-app">
        <div className="quiz-container">
          <div className="header-section">
            <div className="header-content">
              <Trophy className="header-icon" size={48} />
              <h1 className="main-title">Quiz Master</h1>
              <p className="subtitle">Challenge yourself with 3 rounds of 5 questions each</p>
            </div>
          </div>

          {loading ? (
            <div className="loading-section">
              <div className="spinner"></div>
              <p className="loading-text">Loading quizzes...</p>
            </div>
          ) : quizzes.length === 0 ? (
            <div className="empty-state">
              <Target size={64} className="empty-icon" />
              <p className="empty-text">No quizzes available</p>
              <p className="empty-subtext">Make sure your MongoDB has data!</p>
            </div>
          ) : (
            <div className="quiz-grid">
              {quizzes.map((quiz) => (
                <div key={quiz._id} className="quiz-card">
                  <div className="quiz-card-header">
                    <h3 className="quiz-title">{quiz.title}</h3>
                    <span className={`difficulty-badge difficulty-${quiz.difficulty.toLowerCase()}`}>
                      {quiz.difficulty}
                    </span>
                  </div>
                  <p className="quiz-description">{quiz.description}</p>
                  <div className="quiz-meta">
                    <span className="quiz-info">
                      <Flame size={16} />
                      3 Rounds
                    </span>
                    <span className="quiz-info">
                      <Target size={16} />
                      15 Questions
                    </span>
                  </div>
                  <div className="quiz-card-footer">
                    <span className="category-badge">
                      <Zap size={14} />
                      {quiz.category}
                    </span>
                    <button onClick={() => startQuiz(quiz)} className="start-button">
                      Start Quiz <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (showRoundTransition) {
    return (
      <div className="quiz-app">
        <div className="quiz-container">
          <div className="round-transition">
            <Flame className="round-icon" size={80} />
            <h1 className="round-title">Round {currentRound + 1}</h1>
            <p className="round-subtitle">Get ready for the next 5 questions!</p>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'quiz') {
    const currentQuestion = questions[currentQuestionIndex];
    const questionInRound = currentQuestion.questionInRound || ((currentQuestionIndex % 5) + 1);
    
    return (
      <div className="quiz-app">
        <div className="quiz-container">
          <div className="quiz-top-bar">
            <div className="nav-buttons-left">
              <button 
                onClick={handlePrevious} 
                disabled={currentQuestionIndex === 0}
                className="nav-button prev-button"
              >
                ← Previous
              </button>
              <button 
                onClick={handleNext} 
                disabled={!isAnswered}
                className="nav-button next-button-top"
              >
                Next →
              </button>
            </div>
            <button 
              onClick={handleSubmitQuiz}
              className="submit-button"
            >
              End Quiz
            </button>
          </div>

          <div className="question-card">
            <div className="round-indicator">
              <div className="round-badge">
                <Flame size={18} />
                Round {currentQuestion.round || currentRound}
              </div>
              <div className="round-progress">
                {[1, 2, 3].map((round) => (
                  <div 
                    key={round} 
                    className={`round-dot ${round <= (currentQuestion.round || currentRound) ? 'active' : ''}`}
                  />
                ))}
              </div>
            </div>

            <div className="question-header">
              <div className="question-info">
                <span className="question-number">
                  Question {questionInRound} of 5
                </span>
                <span className="total-progress">
                  ({currentQuestionIndex + 1}/{questions.length} overall)
                </span>
              </div>
              <div className={`timer ${timeLeft <= 5 ? 'timer-warning' : ''}`}>
                <Clock size={20} />
                <span className="timer-value">{timeLeft}s</span>
              </div>
            </div>
            
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
              ></div>
            </div>

            <h2 className="question-text">{currentQuestion.questionText}</h2>

            {currentQuestion.questionImage && (
              <div className="question-image-container">
                <img 
                  src={getImageUrl(currentQuestion.questionImage)}
                  alt="Question illustration" 
                  className="question-image"
                  onLoad={(e) => {
                    e.target.style.display = 'block';
                    console.log('Image loaded successfully:', currentQuestion.questionImage);
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    console.error('Failed to load image:', currentQuestion.questionImage);
                    console.error('Tried URL:', getImageUrl(currentQuestion.questionImage));
                  }}
                />
              </div>
            )}

            <div className="options-container">
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedAnswer === index;
                const isCorrect = option.isCorrect;
                const showCorrect = isAnswered && isCorrect;
                const showIncorrect = isAnswered && isSelected && !isCorrect;

                return (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    disabled={isAnswered}
                    className={`option-button ${
                      showCorrect ? 'option-correct' :
                      showIncorrect ? 'option-incorrect' :
                      isAnswered ? 'option-disabled' :
                      'option-default'
                    }`}
                  >
                    <span className="option-text">{option.text}</span>
                    {showCorrect && <CheckCircle className="option-icon" size={24} />}
                    {showIncorrect && <XCircle className="option-icon" size={24} />}
                  </button>
                );
              })}
            </div>

            {isAnswered && (
              <div className="feedback-section">
                <div className={`feedback-box ${
                  answers[answers.length - 1]?.timedOut ? 'feedback-timeout' :
                  answers[answers.length - 1]?.isCorrect ? 'feedback-correct' : 
                  'feedback-incorrect'
                }`}>
                  <p className="feedback-title">
                    {answers[answers.length - 1]?.timedOut ? '⏰ Time\'s Up!' :
                     answers[answers.length - 1]?.isCorrect ? '✓ Correct!' : '✗ Incorrect!'}
                  </p>
                  <p className="feedback-text">{currentQuestion.explanation}</p>
                </div>
                
                <button onClick={handleNext} className="next-button">
                  {currentQuestionIndex < questions.length - 1 ? 
                    (questionInRound === 5 ? 'Next Round' : 'Next Question') : 
                    'View Results'}
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (view === 'results') {
    const percentage = Math.round((score / questions.length) * 100);
    
    // Calculate score by round
    const roundScores = [
      { round: 1, score: 0, total: 0 },
      { round: 2, score: 0, total: 0 },
      { round: 3, score: 0, total: 0 }
    ];
    
    answers.forEach((answer, index) => {
      const roundIndex = Math.floor(index / 5);
      if (roundIndex < 3) {
        roundScores[roundIndex].total++;
        if (answer.isCorrect) {
          roundScores[roundIndex].score++;
        }
      }
    });
    
    return (
      <div className="quiz-app">
        <div className="quiz-container">
          <div className="results-card">
            <Award className="results-icon" size={80} />
            <h1 className="results-title">Quiz Complete!</h1>
            <p className="results-subtitle">{selectedQuiz.title}</p>
            
            <div className="score-display">
              <div className="score-main">{score}/{questions.length}</div>
              <div className="score-percentage">{percentage}%</div>
              <div className="score-message">
                {percentage >= 80 ? '🎉 Excellent!' : percentage >= 60 ? '👍 Good Job!' : '💪 Keep Practicing!'}
              </div>
            </div>

            <div className="round-scores">
              <h3 className="round-scores-title">Performance by Round</h3>
              <div className="round-scores-grid">
                {roundScores.map((roundScore) => (
                  <div key={roundScore.round} className="round-score-card">
                    <Flame className="round-score-icon" size={24} />
                    <div className="round-score-label">Round {roundScore.round}</div>
                    <div className="round-score-value">
                      {roundScore.score}/{roundScore.total}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="answers-review">
              {answers.map((answer, index) => {
                const round = Math.floor(index / 5) + 1;
                const questionInRound = (index % 5) + 1;
                
                return (
                  <div key={index} className={`answer-item ${
                    answer.timedOut ? 'answer-timeout' :
                    answer.isCorrect ? 'answer-correct' : 
                    'answer-incorrect'
                  }`}>
                    <div className="answer-content">
                      {answer.timedOut ? (
                        <Clock className="answer-icon" size={20} />
                      ) : answer.isCorrect ? (
                        <CheckCircle className="answer-icon" size={20} />
                      ) : (
                        <XCircle className="answer-icon" size={20} />
                      )}
                      <div className="answer-details">
                        <p className="answer-question-number">
                          Round {round} - Question {questionInRound}
                        </p>
                        <p className="answer-question-text">{answer.question.questionText}</p>
                        {!answer.timedOut && (
                          <p className="answer-user-response">
                            Your answer: {answer.question.options[answer.selectedOption].text}
                          </p>
                        )}
                        {answer.timedOut && (
                          <p className="answer-timeout-text">Time expired</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="results-actions">
              <button onClick={() => startQuiz(selectedQuiz)} className="retry-button">
                Retry Quiz
              </button>
              <button onClick={restartQuiz} className="back-button">
                <List size={20} />
                All Quizzes
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}