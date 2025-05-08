import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchFragrances } from '../api/requests';
import {
  Container,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Box,
  Chip
} from '@mui/material';
import { styled } from '@mui/system';

// Custom styled components
const SearchHeader = styled(Box)({
  background: 'linear-gradient(135deg, #1e1e1e 0%, #3a3a3a 100%)',
  padding: '3rem 0',
  color: 'white',
  marginBottom: '2rem'
});

const FragranceCard = styled(Card)({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.3s',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
  }
});

const AccordChip = styled(Chip)({
  margin: '0.25rem',
  backgroundColor: '#FFD700',
  color: 'black',
  fontWeight: 'bold'
});

const SearchPage = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) {
      setError('Please enter a search term');
      return;
    }
    
    setLoading(true);
    setError(null);
    setResults([]);
    
    try {
      const { results: data } = await searchFragrances(query);
      if (!data || data.length === 0) {
        setError(`No fragrances found matching "${query}"`);
      }
      setResults(data || []);
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFragranceClick = (fragranceId) => {
    navigate(`/fragrance/${fragranceId}`);
  };

  // Helper function to parse accords
  const parseAccords = (accords) => {
    if (Array.isArray(accords)) return accords.slice(0, 3);
    if (typeof accords === 'string') {
      return accords.split(',').slice(0, 3).map(a => a.trim());
    }
    return [];
  };

  return (
    <div>
      <SearchHeader>
        <Container>
          <Typography variant="h3" component="h1" gutterBottom>
            Discover Your Fragrance
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            Search by name, brand, or scent notes (e.g., "woody", "vanilla", "citrus")
          </Typography>
          
          <form onSubmit={handleSearch}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={9}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Search fragrances..."
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setError(null);
                  }}
                  error={!!error}
                  helperText={error}
                  InputProps={{
                    style: { backgroundColor: 'white', borderRadius: '4px' }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  type="submit"
                  disabled={loading}
                  size="large"
                  sx={{ height: '56px' }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Search'}
                </Button>
              </Grid>
            </Grid>
          </form>
        </Container>
      </SearchHeader>

      <Container sx={{ py: 4 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" my={5}>
            <CircularProgress color="primary" size={60} />
          </Box>
        ) : (
          <>
            {results.length > 0 && (
              <Typography variant="h5" component="h2" gutterBottom>
                Found {results.length} fragrance{results.length !== 1 ? 's' : ''}
              </Typography>
            )}

            <Grid container spacing={3}>
              {results.map((fragrance) => (
                <Grid item xs={12} sm={6} md={4} key={fragrance.id}>
                  <FragranceCard onClick={() => handleFragranceClick(fragrance.id)}>
                    <CardContent>
                      <Typography variant="h6" component="h3" gutterBottom>
                        {fragrance.Name}
                      </Typography>
                      <Typography color="textSecondary" gutterBottom>
                        {fragrance.Brand}
                      </Typography>
                      
                      <Box my={1}>
                        {[...Array(5)].map((_, i) => (
                          <span key={i}>
                            {i < Math.round(fragrance['Rating Value'] || 0) ? '★' : '☆'}
                          </span>
                        ))}
                        <Typography variant="caption" color="textSecondary" ml={1}>
                          ({fragrance['Rating Count'] || 0} reviews)
                        </Typography>
                      </Box>
                      
                      {fragrance['Main Accords'] && (
                        <Box my={2}>
                          {parseAccords(fragrance['Main Accords']).map((accord, idx) => (
                            <AccordChip key={idx} label={accord} size="small" />
                          ))}
                        </Box>
                      )}
                      
                      <Typography variant="body2" color="textSecondary">
                        {fragrance.Description?.substring(0, 100)}...
                      </Typography>
                    </CardContent>
                  </FragranceCard>
                </Grid>
              ))}
            </Grid>

            {error && !loading && results.length === 0 && (
              <Box textAlign="center" my={5}>
                <Typography variant="h6" color="error">
                  {error}
                </Typography>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  sx={{ mt: 2 }}
                  onClick={() => setQuery('')}
                >
                  Clear Search
                </Button>
              </Box>
            )}
          </>
        )}
      </Container>
    </div>
  );
};

export default SearchPage;