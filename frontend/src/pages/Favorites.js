import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { getFavorites, removeFromFavorites } from '../api/requests';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Stack,
  CircularProgress,
  Alert,
  IconButton,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

const Favorites = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const data = await getFavorites();
      setFavorites(data.favourites || []);
      setError(null);
    } catch (err) {
      setError('Error loading favorites');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (favoriteId) => {
    try {
      await removeFromFavorites(favoriteId);
      setFavorites(favorites.filter(fav => fav.favorite_id !== favoriteId));
    } catch (err) {
      console.error('Error removing from favorites:', err);
    }
  };

  if (loading) {
    return (
      <Container sx={{ textAlign: 'center', mt: 5 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 5 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 5 }}>
      <Typography variant="h4" gutterBottom>
        Your Favourite Fragrances
      </Typography>

      {favorites.length === 0 ? (
        <Alert severity="info">
          <Typography>You don't have any favorite fragrances yet.</Typography>
          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <Button variant="contained" component={RouterLink} to="/search">
              Search Fragrances
            </Button>
            <Button variant="outlined" component={RouterLink} to="/quiz">
              Take Our Quiz
            </Button>
          </Stack>
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {favorites.map((item) => {
            const fragrance = item.fragrance;
            return (
              <Grid item xs={12} sm={6} md={4} key={item.favorite_id}>
                <Card sx={{ backgroundColor: '#2a2a2a', color: 'white' }}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="start">
                      <Typography variant="h6" sx={{ color: '#FFD700' }}>
                        {fragrance.name}
                      </Typography>
                      <IconButton onClick={() => handleRemove(item.favorite_id)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </Stack>
                    <Typography variant="subtitle2" color="gray" gutterBottom>
                      {fragrance.brand}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {'★'.repeat(Math.round(fragrance.rating_value || 0))}
                      {'☆'.repeat(5 - Math.round(fragrance.rating_value || 0))} (
                      {fragrance.rating_count || 0} reviews)
                    </Typography>

                    {fragrance.main_accords && (
                      <Stack direction="row" spacing={1} sx={{ mb: 1 }} flexWrap="wrap">
                        {fragrance.main_accords
                          .split(',')
                          .slice(0, 3)
                          .map((accord, idx) => (
                            <Chip
                              key={idx}
                              label={accord.trim()}
                              size="small"
                              sx={{ backgroundColor: '#444', color: '#FFD700' }}
                            />
                          ))}
                      </Stack>
                    )}

                    <Typography variant="body2">
                      {fragrance.description?.substring(0, 100)}
                      {fragrance.description && fragrance.description.length > 100 ? '...' : ''}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      variant="contained"
                      sx={{ backgroundColor: '#FFD700', color: 'black' }}
                      component={RouterLink}
                      to={`/fragrance/${fragrance.id}`}
                    >
                      View Details
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Container>
  );
};

export default Favorites;
