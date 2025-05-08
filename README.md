# fragrance-recommendation-system
MyScent – Personalised Fragrance Recommender
MyScent is a web-based hybrid fragrance recommendation system that helps users discover scents tailored to their personality, preferences, and lifestyle. Combining knowledge-based and content-based filtering, MyScent evolves with user feedback for ever-improving recommendations.

🚀 Features
🧠 Hybrid Recommendation Engine
Combines knowledge-based quiz results and content-based filtering (cosine similarity) for accurate recommendations.

📝 Fragrance Profile Quiz
New users complete a quick quiz to seed personalised suggestions.

⭐ Ratings & Favourites
Users can favourite/dislike scents to refine recommendations dynamically.

🔎 Fragrance Search & Filtering
Browse fragrances with pagination and filtering options.

🔥 Responsive Frontend
Clean, modern UI built with React and Material-UI.

🗄 Database
SQLite backend using SQLAlchemy ORM. Preloaded with Fragrantica-sourced dataset.

Frontend: React + Material-UI
Backend: Flask (Blueprint structure)
Database: SQLite (SQLAlchemy ORM)

API Structure:

/api/fragrances – Browse fragrances (supports pagination/filtering)
/api/quiz – Submit quiz results
/api/recommendations – Get personalised fragrance recommendations
/auth – User authentication (signup/login)
/api/favourites – Manage favourites

🧩 Tech Stack

Frontend: React, Material-UI, Axios
Backend: Flask, Flask-SQLAlchemy
Database: SQLite
Others: React Router, JWT for user auth
