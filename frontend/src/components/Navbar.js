import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Navbar = ({ user, setUser }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    
    console.log('Searching for:', searchQuery);
  };

  return (
    <nav className="navbar">
   
      <div className="brand-container">
        <img src="/image.jpg" alt="MyScent Logo" className="logo-image" />
        <Link to="/" className="brand-name">
          MyScent
        </Link>
      </div>

  
      <div className="nav-links">
        <Link to="/">HOME</Link>
        <Link to="/explore">EXPLORE</Link>
        <Link to="/recommendations">RECOMMENDATIONS</Link>
        <Link to="/favourites">FAVOURITES</Link>
      </div>

  
      <div className="search-auth-container">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Search fragrances..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-button">
            <i className="fas fa-search"></i>
          </button>
        </form>

        <div className="auth-section">
          {user ? (
            <button onClick={() => setUser(null)} className="logout-btn">
              LOG OUT
            </button>
          ) : (
            <Link to="/login" className="login-btn">
              LOG IN
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
