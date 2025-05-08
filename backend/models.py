from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    favorites = db.relationship('Favorite', backref='user', lazy=True)
    quiz_results = db.relationship('QuizResult', backref='user', lazy=True)
    
    def __repr__(self):
        return f'<User {self.email}>'

class Fragrance(db.Model):
    __tablename__ = 'fragrances'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    brand = db.Column(db.String(255), nullable=False)
    gender = db.Column(db.String(50))
    rating_value = db.Column(db.Float)
    rating_count = db.Column(db.Integer)
    main_accords = db.Column(db.Text)
    perfumers = db.Column(db.Text)
    description = db.Column(db.Text)
    url = db.Column(db.String(255))
    
    # Relationships
    favorites = db.relationship('Favorite', backref='fragrance', lazy=True)
    
    def __repr__(self):
        return f'<Fragrance {self.name}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'brand': self.brand,
            'gender': self.gender,
            'rating_value': self.rating_value,
            'rating_count': self.rating_count,
            'main_accords': self.main_accords,
            'perfumers': self.perfumers,
            'description': self.description,
            'url': self.url
        }

class Rating(db.Model):
    __tablename__ = 'ratings'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    fragrance_id = db.Column(db.Integer, db.ForeignKey('fragrances.id'), nullable=False)
    rating = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<Rating {self.rating}>'

class Favorite(db.Model):
    __tablename__ = 'favorites'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    fragrance_id = db.Column(db.Integer, db.ForeignKey('fragrances.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<Favorite {self.user_id} - {self.fragrance_id}>'

class QuizResult(db.Model):
    __tablename__ = 'quiz_results'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    preferences = db.Column(db.Text, nullable=False)  # Stored as JSON string
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<QuizResult {self.user_id}>' 