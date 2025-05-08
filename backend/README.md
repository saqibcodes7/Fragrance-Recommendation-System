# Fragrance Recommender API

A Flask-based REST API for fragrance recommendations, searches, and user management.

## Features

- User authentication (signup, login, logout)
- Fragrance search using TF-IDF similarity
- Content-based fragrance recommendations
- Quiz-based fragrance recommendations
- User favorite management
- Full SQLAlchemy ORM integration

## Setup

1. Create and activate a virtual environment:

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python -m venv venv
source venv/bin/activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Run the application:

```bash
python main.py
```

The API will be available at http://localhost:5000.

## API Endpoints

### Authentication

- `POST /signup` - Register a new user
- `POST /login` - Log in a user
- `POST /logout` - Log out a user
- `GET /me` - Get current user information

### Fragrances

- `GET /fragrances` - Get all fragrances with optional filtering
- `GET /fragrances/<id>` - Get a specific fragrance by ID
- `GET /search?query=<query>` - Search fragrances by name, brand, or scent notes

### Quiz

- `POST /quiz` - Save quiz preferences and get recommendations
- `GET /quiz` - Get saved quiz preferences and recommendations

### Recommendations

- `GET /recommendations?title=<title>` - Get recommendations for a specific fragrance

### Favourites

- `POST /favourites` - Add a fragrance to favorites
- `GET /favourites` - Get all favorites for the current user
- `DELETE /favourites/<id>` - Remove a fragrance from favorites
- `GET /favourites/check/<id>` - Check if a fragrance is in favorites

## Project Structure

- `main.py` - Application entry point
- `models.py` - SQLAlchemy database models
- `auth.py` - Authentication routes and utilities
- `db_setup.py` - Database initialization
- `routes/` - API routes organized by feature
  - `fragrances.py` - Fragrance search and retrieval
  - `quiz.py` - Quiz-based recommendations
  - `recommendations.py` - Fragrance recommendation engine
  - `favourites.py` - User favorite management 