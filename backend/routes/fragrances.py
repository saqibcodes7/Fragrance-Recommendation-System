from flask import Blueprint, request, jsonify
import pandas as pd
import pickle
import os
from sklearn.metrics.pairwise import cosine_similarity
from models import db, Fragrance
from auth import login_required

# Create a Blueprint for fragrance routes
fragrances_bp = Blueprint('fragrances', __name__)

# Load the TF-IDF search model
def load_search_data():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    # Load perfume dataset
    df_path = os.path.join(base_dir, 'perfume_data_clean.csv')
    df = pd.read_csv(df_path)
    
    # Load TF-IDF matrix and vectorizer
    tfidf_matrix_path = os.path.join(base_dir, 'tfidf_matrix_search.pkl')  # Fixed from fidf_matrix_path
    vectorizer_path = os.path.join(base_dir, 'vectorizer.pkl')  # Fixed from .pk1
    
    if os.path.exists(tfidf_matrix_path) and os.path.exists(vectorizer_path):
        tfidf_matrix = pickle.load(open(tfidf_matrix_path, 'rb'))
        vectorizer = pickle.load(open(vectorizer_path, 'rb'))
    else:
        print("Warning: Search files not found. Search functionality may not work correctly.")
        tfidf_matrix = None
        vectorizer = None
    
    return df, tfidf_matrix, vectorizer

# TF-IDF search function
def search_based_recommendation_tfidf(user_query, df, tfidf_matrix, vectorizer, top_n=5):
    """Search for fragrances using TF-IDF similarity"""
    if tfidf_matrix is None or vectorizer is None:
        return pd.DataFrame()  # Return empty DataFrame if search data is not available
    
    # Transform user query using the vectorizer
    query_vec = vectorizer.transform([user_query])
    
    # Compute cosine similarity
    similarities = cosine_similarity(query_vec, tfidf_matrix).flatten()
    
    # Add similarity scores to DataFrame
    df_with_sim = df.copy()
    df_with_sim["similarity"] = similarities
    
    # Get top recommendations
    recommended = df_with_sim.sort_values(by="similarity", ascending=False).head(top_n)
    
    return recommended[['Name', 'Gender', 'Rating Value', 'Rating Count',
                      'Main Accords', 'Perfumers', 'Description', 'url']]

@fragrances_bp.route('/search', methods=['GET'])
def search_fragrance():
    """Searches for a fragrance by name, brand, or scent notes using TF-IDF similarity"""
    # Get user query from request parameters
    query = request.args.get('query', '').strip()
    
    if not query:
        return jsonify({"error": "Query parameter is required"}), 400
    
    # Load the search data
    df, tfidf_matrix, vectorizer = load_search_data()
    
    # Get search results
    results = search_based_recommendation_tfidf(query, df, tfidf_matrix, vectorizer)
    
    if results.empty:
        return jsonify({"message": "No fragrances found matching your search", "results": []}), 200
    
    # Return the results as JSON
    return jsonify({
        "message": f"Found {len(results)} fragrances matching your search", 
        "results": results.to_dict(orient='records')
    }), 200

@fragrances_bp.route('/fragrances', methods=['GET'])
def get_fragrances():
    """Get all fragrances with optional filtering"""
    # Parse query parameters for filtering
    gender = request.args.get('gender')
    min_rating = request.args.get('min_rating')
    brand = request.args.get('brand')
    limit = request.args.get('limit', 20, type=int)
    offset = request.args.get('offset', 0, type=int)
    
    # Start with a base query
    query = Fragrance.query
    
    # Apply filters if provided
    if gender:
        query = query.filter(Fragrance.gender == gender)
    
    if min_rating:
        query = query.filter(Fragrance.rating_value >= float(min_rating))
    
    if brand:
        query = query.filter(Fragrance.brand.ilike(f'%{brand}%'))
    
    # Get the total count of matching fragrances
    total_count = query.count()
    
    # Apply pagination
    fragrances = query.order_by(Fragrance.rating_value.desc()).offset(offset).limit(limit).all()
    
    # Convert to dictionary
    fragrance_list = [f.to_dict() for f in fragrances]
    
    return jsonify({
        "total": total_count,
        "offset": offset,
        "limit": limit,
        "fragrances": fragrance_list
    }), 200

@fragrances_bp.route('/fragrances/<int:fragrance_id>', methods=['GET'])
def get_fragrance(fragrance_id):
    """Get a specific fragrance by ID"""
    fragrance = Fragrance.query.get(fragrance_id)
    
    if not fragrance:
        return jsonify({"error": f"Fragrance with ID {fragrance_id} not found"}), 404
    
    return jsonify(fragrance.to_dict()), 200