import React, { useState, useEffect } from 'react';
import { getAllFragrances } from '../api/requests';
import { Link } from 'react-router-dom';

const Fragrances = () => {
  const [fragrances, setFragrances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchFragrances();
  }, [page]);

  const fetchFragrances = async () => {
    try {
      setLoading(true);
      const data = await getAllFragrances(page);
      if (data?.fragrances) {
        setFragrances(prev => [...prev, ...data.fragrances]);
        setHasMore(data.fragrances.length === 20);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => setPage(prev => prev + 1);

  const safeDescription = (desc) =>
    (desc || '').replace(/([a-z])([A-Z])/g, '$1 $2').substring(0, 150);

  
  const getImageSrc = (index) => {
    const imgIndex = (index % 15) + 1;
    return [
      `${process.env.PUBLIC_URL}/images/jpg${imgIndex}.jpg`,
      `${process.env.PUBLIC_URL}/images/jpg${imgIndex}.jpeg`,
      `${process.env.PUBLIC_URL}/images/placeholder.jpg`,
    ];
  };

  const handleImageError = (e, index = 0, srcs = []) => {
    if (index < srcs.length - 1) {
      e.target.src = srcs[index + 1];
      e.target.onerror = (err) => handleImageError(e, index + 1, srcs);
    }
  };

  if (loading && page === 1) return <div className="text-center py-5">Loading...</div>;
  if (error) return <div className="alert alert-danger py-5">{error}</div>;

  return (
    <div className="container py-5">
      <h1 className="mb-4 text-center">Fragrances</h1>
      <div className="row">
        {fragrances.map((fragrance, index) => {
          const srcs = getImageSrc(index);
          return (
            <div key={fragrance.id} className="col-md-4 mb-4">
              <div className="card h-100 shadow-sm">
                <img
                  src={srcs[0]}
                  alt={fragrance.name || 'Fragrance'}
                  className="card-img-top"
                  style={{ height: '250px', objectFit: 'cover' }}
                  onError={(e) => handleImageError(e, 0, srcs)}
                />
                <div className="card-body">
                  <h5 className="card-title">{fragrance.name}</h5>
                  <h6 className="card-subtitle text-muted mb-2">{fragrance.brand}</h6>
                  <div className="mb-2">
                    <span className="text-warning">
                      {'★'.repeat(Math.round(fragrance.rating_value || 0))}
                      {'☆'.repeat(5 - Math.round(fragrance.rating_value || 0))}
                    </span>
                    <small className="ms-2">({fragrance.rating_count || 0} reviews)</small>
                  </div>
                  <div className="mb-2">
                    <strong>Scent Profile:</strong> {fragrance.scentProfile?.join(', ') || 'N/A'}
                  </div>
                  <p className="card-text">{safeDescription(fragrance.description)}...</p>
                </div>
                <div className="card-footer bg-white border-top-0">
                  <Link to={`/fragrance/${fragrance.id}`} className="btn btn-primary btn-sm w-100">
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {hasMore && (
        <div className="text-center mt-4">
          <button
            className="btn btn-outline-primary"
            onClick={loadMore}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
};

export default Fragrances;
