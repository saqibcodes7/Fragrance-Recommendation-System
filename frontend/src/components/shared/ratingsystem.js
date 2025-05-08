import React, { useState, useEffect } from 'react';
import { 
  Box,
  Typography,
  IconButton,
  Tooltip,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Star as StarFilled,
  StarBorder as StarEmpty,
  StarHalf as StarHalf
} from '@mui/icons-material';
import { postRating, getRating } from '../api/requests';

const RatingSystem = ({ fragranceId, userId, size = 'medium', showText = true }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(null);
  const [userRating, setUserRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Fetch user's existing rating
  useEffect(() => {
    const fetchUserRating = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }
      
      try {
        const ratingData = await getRating(fragranceId, userId);
        if (ratingData && ratingData.rating) {
          setUserRating(ratingData.rating);
          setRating(ratingData.rating);
        }
      } catch (error) {
        console.error('Error fetching rating:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRating();
  }, [fragranceId, userId]);

  const handleRating = async (newRating) => {
    if (!userId) {
      setSnackbar({
        open: true,
        message: 'Please login to rate fragrances',
        severity: 'error'
      });
      return;
    }

    try {
      await postRating(fragranceId, userId, newRating);
      setUserRating(newRating);
      setRating(newRating);
      setSnackbar({
        open: true,
        message: 'Rating submitted successfully!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error submitting rating:', error);
      setSnackbar({
        open: true,
        message: 'Failed to submit rating. Please try again.',
        severity: 'error'
      });
    }
  };

  const handleMouseOver = (newHover) => {
    setHover(newHover);
  };

  const handleMouseLeave = () => {
    setHover(null);
  };

  const getIconSize = () => {
    switch (size) {
      case 'small': return { fontSize: '1.2rem' };
      case 'large': return { fontSize: '2.5rem' };
      default: return { fontSize: '1.8rem' };
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  if (loading) {
    return <CircularProgress size={20} />;
  }

  return (
    <Box display="flex" alignItems="center">
      <Box 
        display="flex" 
        onMouseLeave={handleMouseLeave}
        sx={{ cursor: userId ? 'pointer' : 'default' }}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const ratingValue = star;
          const isFilled = ratingValue <= (hover || rating);
          const isHalf = !isFilled && (hover || rating) >= ratingValue - 0.5;

          return (
            <Tooltip 
              key={star} 
              title={`${ratingValue} star${ratingValue !== 1 ? 's' : ''}`}
              placement="top"
            >
              <IconButton
                disableRipple={!userId}
                onClick={() => userId && handleRating(ratingValue)}
                onMouseOver={() => userId && handleMouseOver(ratingValue)}
                sx={{ p: size === 'large' ? 1 : 0.5 }}
              >
                {isFilled ? (
                  <StarFilled sx={{ ...getIconSize(), color: '#FFD700' }} />
                ) : isHalf ? (
                  <StarHalf sx={{ ...getIconSize(), color: '#FFD700' }} />
                ) : (
                  <StarEmpty sx={{ ...getIconSize(), color: userId ? '#FFD700' : '#e0e0e0' }} />
                )}
              </IconButton>
            </Tooltip>
          );
        })}
      </Box>

      {showText && (
        <Typography variant="body2" sx={{ ml: 1, color: 'text.secondary' }}>
          {userRating > 0 ? `You rated this ${userRating} star${userRating !== 1 ? 's' : ''}` : 'Rate this fragrance'}
        </Typography>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RatingSystem;