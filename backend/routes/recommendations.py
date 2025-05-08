from flask import Blueprint, request, jsonify
import pandas as pd
import pickle
import os
import numpy as np
import json
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer
from auth import login_required, get_current_user
from models import db, User, QuizResult, Favorite

recommendations_bp = Blueprint('recommendations', __name__)


_recommendation_data = None

def load_recommendation_data():
    global _recommendation_data
    if _recommendation_data is None:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

        # Load dataset
        df_path = os.path.join(base_dir, 'perfume_data_clean.csv')
        df = pd.read_csv(df_path)

        # Fill missing values
        df['Description'] = df['Description'].fillna('')
        df['Main Accords'] = df['Main Accords'].fillna('')

        # Try loading pre-computed similarity matrix
        cosine_sim_path = os.path.join(base_dir, 'cosine_sim.pkl')
        if os.path.exists(cosine_sim_path):
            cosine_sim = pickle.load(open(cosine_sim_path, 'rb'))
        else:
            # Compute similarity matrix if not found
            tfidf = TfidfVectorizer(stop_words='english')
            tfidf_matrix = tfidf.fit_transform(df['Description'] + " " + df['Main Accords'])
            cosine_sim = cosine_similarity(tfidf_matrix, tfidf_matrix)

            # Save for future use
            pickle.dump(cosine_sim, open(cosine_sim_path, 'wb'))

        _recommendation_data = (df, cosine_sim)

    return _recommendation_data

# Hybrid recommendation function
def hybrid_recommendations(user_id, title=None, top_n=5):
    """Combine content-based and user preferences with fallback"""
    df, cosine_sim = load_recommendation_data()
    user = User.query.get(user_id)

    # 1. Content-based recommendations if title provided
    content_recs = pd.DataFrame()
    if title:
        title = title.strip().lower()
        matches = df[df['Name'].str.lower().str.strip() == title].index
        if len(matches) > 0:
            idx = matches[0]
            sim_scores = list(enumerate(cosine_sim[idx]))
            sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)[1:top_n+1]
            perfume_indices = [i[0] for i in sim_scores]
            content_recs = df.iloc[perfume_indices]

    # 2. Knowledge-based from quiz results
    quiz_recs = pd.DataFrame()
    quiz_result = QuizResult.query.filter_by(user_id=user_id).first()
    if quiz_result:
        prefs = json.loads(quiz_result.preferences)

        # Filter based on preferences
        filtered = df.copy()
        if 'gender' in prefs:
            filtered = filtered[filtered['Gender'] == prefs['gender']]
        if 'min_rating' in prefs:
            filtered = filtered[filtered['Rating Value'] >= float(prefs['min_rating'])]

        # Score based on accords
        if 'desired_accords' in prefs:
            filtered['score'] = filtered['Main Accords'].apply(
                lambda x: sum(1 for accord in prefs['desired_accords'] if accord in x)
            )
            quiz_recs = filtered.sort_values('score', ascending=False).head(top_n)

    # 3. Collaborative filtering from favorites
    collab_recs = pd.DataFrame()
    favorites = Favorite.query.filter_by(user_id=user_id).all()
    if favorites:
        fav_ids = [f.fragrance_id for f in favorites]
        similar_indices = set()
        for fid in fav_ids:
            if fid in df.index:
                sim_scores = list(enumerate(cosine_sim[fid]))
                sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)[1:3]
                similar_indices.update([i[0] for i in sim_scores])
        if similar_indices:
            collab_recs = df.iloc[list(similar_indices)]

    # Combine all recommendations
    combined = pd.concat([content_recs, quiz_recs, collab_recs]).drop_duplicates()

    # Fallback: If no recommendations, suggest top rated perfumes
    if combined.empty:
        combined = df.sort_values('Rating Value', ascending=False).head(top_n)

    # Rank and return top N
    return combined.sort_values('Rating Value', ascending=False).head(top_n)[[
        'Name', 'Gender', 'Rating Value', 'Rating Count',
        'Main Accords', 'Perfumers', 'Description', 'url'
    ]]

@recommendations_bp.route('/quiz', methods=['POST', 'OPTIONS'])  
def get_recommendations():
    """Hybrid recommendations endpoint"""
    user = get_current_user()
    title = request.args.get('title', '').strip()

    try:
        recommendations = hybrid_recommendations(user.id, title if title else None)

        if recommendations.empty:
            return jsonify({"message": "No recommendations found. Try exploring more fragrances!"}), 200

        return jsonify({
            "recommendations": recommendations.to_dict(orient='records'),
            "type": "hybrid",
            "count": len(recommendations)
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@recommendations_bp.route('/recommendations/personalized', methods=['GET'])
@login_required
def personalized_recommendations():
    """Recommendations based solely on user profile"""
    user = get_current_user()

    try:
        recommendations = hybrid_recommendations(user.id)

        if recommendations.empty:
            # Fallback to popular items
            df, _ = load_recommendation_data()
            recommendations = df.sort_values('Rating Value', ascending=False).head(5)

        return jsonify({
            "recommendations": recommendations.to_dict(orient='records'),
            "type": "personalized",
            "count": len(recommendations)
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@recommendations_bp.route('/api/quiz', methods=['POST'])
@login_required
def handle_quiz_submission():
    user = get_current_user()
    data = request.get_json()

    if not data or 'preferences' not in data:
        return jsonify({
            "success": False,
            "error": "Invalid quiz data format"
        }), 400

    try:
        QuizResult.query.filter_by(user_id=user.id).delete()

        quiz_result = QuizResult(
            user_id=user.id,
            preferences=json.dumps(data['preferences'])
        )
        db.session.add(quiz_result)
        db.session.commit()

        recommendations = hybrid_recommendations(user.id)

        return jsonify({
            "success": True,
            "recommendations": recommendations.to_dict(orient='records')
        })

    except Exception as e:
        db.session.rollback()
        print(f"Quiz submission error: {str(e)}")
        return jsonify({
            "success": False,
            "error": "Failed to process quiz. Please try again."
        }), 500
