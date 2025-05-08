import os
import pandas as pd
from flask_sqlalchemy import SQLAlchemy
from flask import Flask
from models import db, User, Fragrance, Rating, Favorite, QuizResult

def init_db(app):
    """Initialize the database with SQLAlchemy"""
    
    # Configure SQLAlchemy
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Initialize SQLAlchemy with the app
    db.init_app(app)
    
    # Create database if it doesn't exist
    with app.app_context():
        db.create_all()
        
        # Check if we need to populate the fragrances table
        if Fragrance.query.count() == 0:
            populate_fragrances(app)
    
    return db

def populate_fragrances(app):
    """Populate the fragrances table with data from CSV file"""
    
    csv_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'perfume_data_clean.csv')
    
    if not os.path.exists(csv_path):
        print(f"Warning: {csv_path} not found. Skipping fragrance import.")
        return
    
    # Load the CSV file
    print("Loading fragrance data from CSV...")
    df = pd.read_csv(csv_path)
    
    # Limit to first 200 fragrances for demonstration (remove this limitation in production)
    df = df.head(200)
    
    with app.app_context():
        # Insert fragrances into the database
        for _, row in df.iterrows():
            fragrance = Fragrance(
                name=row['Name'],
                brand=row['Name'].split(' ')[0] if ' ' in row['Name'] else 'Unknown',  # Extract brand from name
                gender=row['Gender'],
                rating_value=row['Rating Value'],
                rating_count=row['Rating Count'],
                main_accords=str(row['Main Accords']),
                perfumers=str(row['Perfumers']),
                description=row['Description'],
                url=row['url']
            )
            db.session.add(fragrance)
        
        # Commit the changes
        db.session.commit()
        print(f"Imported {len(df)} fragrances into the database.") 