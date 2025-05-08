import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  getFragrance,
  getSimilarFragrances,
  checkFavorite,
  addToFavorites,
  removeFromFavorites,
} from '../api/requests';

const FragranceDetails = () => {
  const { id } = useParams();
  const [fragrance, setFragrance] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const fragranceData = await getFragrance(id);
        setFragrance(fragranceData);

        const similarFragrances = await getSimilarFragrances(fragranceData.name);
        setRecommendations(similarFragrances);

        const favData = await checkFavorite(id);
        setIsFavorite(favData.is_favorite);
        if (favData.is_favorite) setFavoriteId(favData.favorite_id);
      } catch (err) {
        setError('Error loading fragrance details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleFavoriteToggle = async () => {
    try {
      if (isFavorite) {
        await removeFromFavorites(favoriteId);
        setIsFavorite(false);
        setFavoriteId(null);
      } else {
        const result = await addToFavorites(id);
        setIsFavorite(true);
        setFavoriteId(result.favorite_id);
      }
    } catch (err) {
      console.error('Favorite toggle failed:', err);
    }
  };

  if (loading) return <div className="text-center py-5">Loading...</div>;

  if (error || !fragrance) {
    return (
      <div className="container my-5">
        <div className="alert alert-danger">{error || 'Fragrance not found'}</div>
        <Link to="/" className="btn btn-primary">Back to Home</Link>
      </div>
    );
  }

  return (
    <div className="container my-5">
      <div className="row mb-4">
        <div className="col-md-4">
          <img
            src={`${process.env.PUBLIC_URL}/images/${fragrance.id}.jpg`}
            alt={fragrance.name}
            className="img-fluid rounded"
            style={{ height: '250px', objectFit: 'cover', width: '100%' }}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = `${process.env.PUBLIC_URL}/images/placeholder.jpg`;
            }}
          />
          <div className="card mt-3">
            <div className="card-body">
              <h5>Details</h5>
              <ul className="list-group list-group-flush">
                <li className="list-group-item"><strong>Gender:</strong> {fragrance.gender}</li>
                <li className="list-group-item"><strong>Brand:</strong> {fragrance.brand}</li>
                <li className="list-group-item">
                  <strong>Rating:</strong> 
                  <span className="text-warning ms-2">
                    {'★'.repeat(Math.round(fragrance.rating_value || 0))}
                    {'☆'.repeat(5 - Math.round(fragrance.rating_value || 0))}
                  </span>
                  ({fragrance.rating_count || 0})
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="col-md-8">
          <h1>{fragrance.name}</h1>
          <h5 className="text-muted">{fragrance.brand}</h5>

          <div className="d-flex mb-3">
            <button className="btn btn-outline-danger me-2" onClick={handleFavoriteToggle}>
              <i className={`fas fa-heart ${isFavorite ? 'text-danger' : ''}`}></i>
              {isFavorite ? ' Remove Favorite' : ' Add Favorite'}
            </button>
            {fragrance.url && (
              <a href={fragrance.url} target="_blank" rel="noopener noreferrer" className="btn btn-outline-secondary">
                View on Fragrantica
              </a>
            )}
          </div>

          <h5>Description</h5>
          <p>{fragrance.description || 'No description available'}</p>

          <h5>Main Accords</h5>
          {fragrance.main_accords ? fragrance.main_accords.split(',').map((a, i) => (
            <span key={i} className="badge bg-secondary me-1 mb-1">{a.trim()}</span>
          )) : <p>No accords available.</p>}

          <h5 className="mt-3">Scent Notes</h5>
          <p>{fragrance.scentProfile?.join(', ') || 'No scent notes available'}</p>
        </div>
      </div>

      <div className="mt-5">
        <h3>Similar Fragrances</h3>
        {recommendations.length === 0 ? (
          <p>No similar fragrances found.</p>
        ) : (
          <div className="row">
            {recommendations.map((rec, i) => (
              <div key={i} className="col-md-4 mb-4">
                <div className="card h-100 shadow-sm">
                  <img
                    src={`/images/${rec.id || i + 100}.jpg`}
                    alt={rec.Name}
                    className="card-img-top"
                    style={{ height: '200px', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/images/placeholder.jpg';
                    }}
                  />
                  <div className="card-body">
                    <h5 className="card-title">{rec.Name}</h5>
                    <h6 className="card-subtitle mb-2 text-muted">{rec.brand}</h6>
                    <div className="mb-2">
                      <span className="text-warning">
                        {'★'.repeat(Math.round(rec['Rating Value'] || 0))}
                        {'☆'.repeat(5 - Math.round(rec['Rating Value'] || 0))}
                      </span>
                      <small> ({rec['Rating Count'] || 0} reviews)</small>
                    </div>
                    <p className="card-text">{rec.Description?.substring(0, 100)}...</p>
                  </div>
                  <div className="card-footer bg-white border-top-0">
                    <Link to={`/fragrance/${rec.id || i + 100}`} className="btn btn-primary btn-sm w-100">
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FragranceDetails;
