import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllFragrances } from '../api/requests';
import { CircularProgress, Alert, Button } from '@mui/material';
import '../index.css'; 

const Home = () => {
  const [topFragrances, setTopFragrances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTopFragrances();
  }, []);

  const fetchTopFragrances = async () => {
    try {
      setLoading(true);
      const data = await getAllFragrances();
      if (data.fragrances) {
        const sortedFragrances = [...data.fragrances]
          .sort((a, b) => (b.rating_value || 0) - (a.rating_value || 0))
          .slice(0, 5);
        setTopFragrances(sortedFragrances);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-5"><CircularProgress /></div>;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <div className="container py-5">
      <div className="row align-items-center mb-5">
        <div className="col-md-6 text-center text-md-start">
          <h1 className="mb-3">Welcome to MyScent</h1>
          <p className="lead mb-4">Discover your perfect fragrance with personalised recommendations</p>
          <Button
            component={Link}
            to="/quiz"
            variant="contained"
            size="large"
            sx={{
              backgroundColor: '#FFD700',
              '&:hover': {
                backgroundColor: '#e6c200',
              },
              color: '#000',
              fontWeight: 'bold',
              padding: '12px 32px',
              fontSize: '1.1rem',
            }}
          >
            Take the Quiz
          </Button>
        </div>
        <div className="col-md-6 text-center">
          <img
            src="/hero-image.jpg"
            alt="Fragrance Collection"
            className="hero-banner"
          />
        </div>
      </div>

      <div className="mb-5">
        <h2 className="mb-4">Top Rated Fragrances</h2>
        <div className="d-flex overflow-auto pb-3" style={{ gap: '1rem' }}>
          {topFragrances.map((fragrance) => (
            <div key={fragrance.id} className="card" style={{ minWidth: '300px', flex: '0 0 auto' }}>
              <div className="card-body">
                <h5 className="card-title">{fragrance.name}</h5>
                <h6 className="card-subtitle mb-2 text-muted">{fragrance.brand}</h6>
                <div className="mb-2">
                  <span className="rating-stars">
                    {'★'.repeat(Math.round(fragrance.rating_value))}
                    {'☆'.repeat(5 - Math.round(fragrance.rating_value))}
                  </span>
                  <small> ({fragrance.rating_count} reviews)</small>
                </div>
                <p className="card-text">
                  <strong>Scent Profile:</strong> {fragrance.main_accords}
                </p>
                <p className="card-text">
                  {fragrance.description?.substring(0, 100)}...
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="row">
        <div className="col-md-4 mb-4">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">Browse Fragrances</h5>
              <p className="card-text">
                Explore our extensive collection of fragrances from various brands and categories.
              </p>
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-4">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">Get Recommendations</h5>
              <p className="card-text">
                Receive personalised fragrance recommendations based on your preferences.
              </p>
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-4">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">Search & Discover</h5>
              <p className="card-text">
                Find your perfect scent using our advanced search and filtering options.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
