import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Paper, Typography, RadioGroup, Radio,
  FormControlLabel, Button, Box, LinearProgress,
  Alert, Grid, Chip, CircularProgress  
} from '@mui/material';
import { submitQuiz, getLoggedInUser } from '../api/requests';

const questionSets = {
  Beginner: [
    {
      id: 'vibe',
      question: "What kind of vibe are you going for?",
      type: 'single',
      options: ["Fresh and clean", "Warm and cosy", "Bold and attention-grabbing", "Light and subtle"]
    },
    {
      id: 'occasion',
      question: "Where are you most likely to wear this fragrance?",
      type: 'single',
      options: ["Daily wear (uni, errands)", "Special occasions (dinners, events)", "Outdoors (walks, picnics, travel)", "I just want to smell good at home"]
    },
    {
      id: 'season',
      question: "What season best fits your ideal scent?",
      type: 'single',
      options: ["Spring – floral, breezy", "Summer – fresh, citrusy", "Autumn – warm, spicy", "Winter – deep, woody"]
    },
    {
      id: 'scent_preference',
      question: "Do you prefer sweet or fresh scents?",
      type: 'single',
      options: ["Sweet (vanilla, caramel, fruity)", "Fresh (citrus, mint, green)", "I'm not sure yet"]
    },
    {
      id: 'longevity',
      question: "How long do you want the scent to last?",
      type: 'single',
      options: ["Just a few hours is fine", "I want it to last all day", "I don't mind either way"]
    }
  ],
  Intermediate: [
    {
      id: 'collection',
      question: "Which of these best describes your current fragrance collection?",
      type: 'single',
      options: ["A few designer scents", "Mostly fresh/clean perfumes", "Some warm and spicy options", "A little bit of everything"]
    },
    {
      id: 'scent_appeal',
      question: "Which type of scent do you find most appealing?",
      type: 'single',
      options: ["Fruity/floral", "Spicy/woody", "Aquatic/fresh", "Sweet/gourmand"]
    },
    {
      id: 'favorite_note',
      question: "Pick a note you know and love:",
      type: 'single',
      options: ["Vanilla", "Bergamot", "Leather", "Lavender"]
    },
    {
      id: 'strength',
      question: "How strong do you want your fragrance to be?",
      type: 'single',
      options: ["Subtle – just for me", "Noticeable – for people nearby", "Strong – I want to make an entrance"]
    },
    {
      id: 'brands',
      question: "Which of these brands have you tried or heard of?",
      type: 'single',
      options: ["Dior / Chanel / Versace", "Maison Margiela / Le Labo", "Mont Blanc / YSL / Paco Rabanne", "I'm still figuring them out"]
    }
  ],
  Advanced: [
    {
      id: 'top_notes',
      question: "Which of these top notes do you gravitate towards?",
      type: 'single',
      options: ["Bergamot", "Cardamom", "Pink Pepper", "Grapefruit"]
    },
    {
      id: 'base_notes',
      question: "Which base note do you enjoy most?",
      type: 'single',
      options: ["Amber", "Musk", "Oud", "Vetiver"]
    },
    {
      id: 'avoid',
      question: "Which of these would make you skip a fragrance?",
      type: 'single',
      options: ["Too much sweetness", "Poor projection", "Too powdery or soapy"]
    },
    {
      id: 'layering',
      question: "Do you enjoy layering fragrances?",
      type: 'single',
      options: ["Yes, I like to experiment", "Sometimes, depending on the scent", "No, I prefer one solid fragrance"]
    },
    {
      id: 'niche_brands',
      question: "What's your stance on niche brands?",
      type: 'single',
      options: ["Obsessed – I seek out niche houses", "Interested but still exploring", "Not interested"]
    }
  ]
};

const Quiz = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [experienceLevel, setExperienceLevel] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await getLoggedInUser();
        setUser(userData);
      } catch (err) {
        console.error('Auth check error:', err);
      } finally {
        setCheckingAuth(false);
      }
    };
    checkAuth();
  }, []);

  const questions = questionSets[experienceLevel] || [];
  const progress = currentStep === 0 ? 20 : (20 + ((currentQuestion + 1) / questions.length) * 80);

  const handleExperienceSelect = (level) => {
    setExperienceLevel(level);
    setAnswers(prev => ({ ...prev, experience_level: level }));
    setCurrentStep(1);
  };

  const handleAnswer = (value) => {
    const question = questions[currentQuestion];
    setAnswers(prev => ({ ...prev, [question.id]: value }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setError('');
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    } else {
      setCurrentStep(0);
    }
    setError('');
  };

  const handleSubmit = async () => {
    if (!user) {
      setError('Please log in to submit the quiz');
      return;
    }

    const unansweredQuestions = questions.filter(q => !answers[q.id]);
    if (unansweredQuestions.length > 0) {
      setError('Please answer all questions before getting recommendations');
      return;
    }

    setLoading(true);
    try {
      const quizData = {
        experience_level: answers.experience_level,
        longevity: answers.longevity,
        min_rating: 3.5,
        desired_accords: getDesiredAccords(answers),
        gender: "Unisex" // Ye NAYA FIELD ADD KARNA ZAROORI HAI
      };

      const response = await submitQuiz(quizData);

      if (!response.success) {
        throw new Error(response.error || 'Failed to get recommendations');
      }

      navigate('/recommendations', {
        state: {
          quizAnswers: answers,
          recommendations: response.recommendations
        }
      });
    } catch (err) {
      console.error("Quiz submission error:", err);
      setError(err.message || 'Failed to submit quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to map answers to scent accords
  const getDesiredAccords = (answers) => {
    const accords = [];
    const level = answers.experience_level;

    if (level === 'Beginner') {
      if (answers.vibe === "Fresh and clean") accords.push('Fresh', 'Clean', 'Aquatic');
      if (answers.season === "Summer") accords.push('Citrus', 'Fruity');
      // Add more mappings for beginner
    }
    else if (level === 'Intermediate') {
      if (answers.favorite_note === "Vanilla") accords.push('Vanilla', 'Gourmand');
      // Add more mappings for intermediate
    }
    else if (level === 'Advanced') {
      if (answers.top_notes === "Bergamot") accords.push('Citrus', 'Fresh');
      // Add more mappings for advanced
    }

    return [...new Set(accords)]; // Remove duplicates
  };

  const renderExperienceSelection = () => (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom sx={{ color: '#FFD700' }}>
        How would you describe your experience with fragrances?
      </Typography>
      <Grid container spacing={2} sx={{ mt: 2 }}>
        {Object.keys(questionSets).map(level => (
          <Grid item xs={12} sm={4} key={level}>
            <Button
              fullWidth
              variant="outlined"
              size="large"
              onClick={() => handleExperienceSelect(level)}
              sx={{
                py: 3,
                borderColor: '#FFD700',
                color: '#FFD700',
                '&:hover': {
                  backgroundColor: 'rgba(255, 215, 0, 0.1)',
                },
              }}
            >
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                {level}
              </Typography>
              <Typography variant="caption" display="block">
                {level === 'Beginner' && 'Just starting out'}
                {level === 'Intermediate' && 'Tried a few fragrances'}
                {level === 'Advanced' && 'Understand notes and accords'}
              </Typography>
            </Button>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderQuestion = () => {
    const question = questions[currentQuestion];
    const currentAnswer = answers[question.id];

    return (
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ color: '#FFD700' }}>
          {question.question}
        </Typography>
        <RadioGroup
          value={currentAnswer || ''}
          onChange={(e) => handleAnswer(e.target.value)}
          sx={{ mt: 2 }}
        >
          {question.options.map((option) => (
            <FormControlLabel
              key={option}
              value={option}
              control={<Radio sx={{ color: '#FFD700' }} />}
              label={<Typography sx={{ color: 'white' }}>{option}</Typography>}
              sx={{
                mb: 1,
                '&:hover': { backgroundColor: 'rgba(255, 215, 0, 0.05)' },
                borderRadius: 1,
                padding: '4px 8px'
              }}
            />
          ))}
        </RadioGroup>
      </Box>
    );
  };

  if (checkingAuth) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <LinearProgress sx={{ color: '#FFD700' }} />
      </Container>
    );
  }

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ mb: 2, backgroundColor: '#2a2a2a', color: 'white' }}>
          Please log in to take the quiz and get personalized recommendations.
        </Alert>
        <Button
          variant="contained"
          onClick={() => navigate('/login')}
          sx={{
            backgroundColor: '#FFD700',
            color: 'black',
            '&:hover': { backgroundColor: '#e6c200' },
          }}
        >
          Go to Login
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{
        p: 4,
        backgroundColor: '#1e1e1e',
        color: 'white',
        border: '1px solid #333'
      }}>
        <Typography variant="h4" gutterBottom align="center" sx={{ color: '#FFD700' }}>
          {currentStep === 0 ? 'Fragrance Experience Quiz' : 'Find Your Perfect Scent'}
        </Typography>

        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            mb: 4,
            height: 8,
            borderRadius: 4,
            backgroundColor: '#333',
            '& .MuiLinearProgress-bar': { backgroundColor: '#FFD700' }
          }}
        />

        {currentStep === 0 ? renderExperienceSelection() : renderQuestion()}

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            onClick={handleBack}
            disabled={(currentStep === 1 && currentQuestion === 0) || loading}
            sx={{
              borderColor: '#FFD700',
              color: '#FFD700',
              '&:hover': {
                backgroundColor: 'rgba(255, 215, 0, 0.1)',
              },
            }}
          >
            Back
          </Button>
          {currentStep === 1 && (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={!answers[questions[currentQuestion]?.id] || loading}
              sx={{
                backgroundColor: '#FFD700',
                color: 'black',
                '&:hover': { backgroundColor: '#e6c200' },
              }}
            >
              {loading ? (
                <CircularProgress size={24} sx={{ color: 'black' }} />
              ) : (
                currentQuestion === questions.length - 1 ? 'Get Recommendations' : 'Next'
              )}
            </Button>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{
            mt: 2,
            backgroundColor: '#2a2a2a',
            color: 'white',
            border: '1px solid #ff3333'
          }}>
            {error}
          </Alert>
        )}
      </Paper>
    </Container>
  );
};

export default Quiz;
