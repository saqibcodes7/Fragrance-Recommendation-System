import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Quiz from './pages/Quiz';
import SearchPage from './pages/SearchPage';
import FragranceDetails from './pages/FragranceDetails';
import Favorites from './pages/Favorites';
import { getLoggedInUser } from './api/requests';
import './App.css';
import Fragrances from './pages/Fragrances';
import Recommendations from './pages/Recommendations';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const fetchUser = async () => {
      try {
        // Check localStorage first for faster initial load
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }

        // Then verify with server
        const userData = await getLoggedInUser();
        if (userData) {
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        } else {
          setUser(null);
          localStorage.removeItem('user');
        }
      } catch (error) {
        console.error('Error checking user login status:', error);
        setUser(null);
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Handle user logout
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Protected route component
  const ProtectedRoute = ({ children }) => {
    if (loading) {
      return (
        <div className="container py-5">
          <div className="text-center">
            <div className="spinner-border text-warning" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      );
    }

    if (!user) {
      return <Navigate to="/login" />;
    }

    return children;
  };

  return (
    <div className="App">
      <Navbar user={user} setUser={setUser} onLogout={handleLogout} />
      <div className="container py-4">
        <Routes>
          <Route path="/" element={<Home user={user} />} />
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="/signup" element={<Signup setUser={setUser} />} />
          <Route path="/search" element={<SearchPage user={user} />} />
          <Route path="/fragrance/:id" element={<FragranceDetails user={user} />} />
          
          {/* Updated route */}
          <Route path="/explore" element={<Fragrances user={user} />} />
          <Route path="/recommendations" element={<Recommendations user={user} />} />

          {/* Protected routes */}
          <Route 
            path="/quiz" 
            element={
              <ProtectedRoute>
                <Quiz user={user} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/favorites" 
            element={
              <ProtectedRoute>
                <Favorites user={user} />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </div>
    </div>
  );
}

export default App;
