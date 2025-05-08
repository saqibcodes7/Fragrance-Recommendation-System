from flask import Blueprint, request, jsonify
import pandas as pd
import json
import ast  # New import for safer string evaluation
from models import db, QuizResult
from auth import login_required, get_current_user
import os

# Blueprint setup
quiz_bp = Blueprint('quiz', __name__)

# Dataset loading with error handling
def get_df():
    try:
        csv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'perfume_data_clean.csv')
        df = pd.read_csv(csv_path)

        # Convert string representations to actual lists
        df['Main Accords'] = df['Main Accords'].apply(lambda x: ast.literal_eval(x) if isinstance(x, str) else [])
        df['Perfumers'] = df['Perfumers'].apply(lambda x: ast.literal_eval(x) if isinstance(x, str) else [])

        return df
    except Exception as e:
        print(f"Error loading dataset: {str(e)}")
        return pd.DataFrame()

# Experience-based question branching
def get_questions_by_level(experience_level):
    questions = {
        "Beginner": [
            {"id": "vibe", "question": "What kind of vibe are you going for?", "options": ["Fresh and clean", "Warm and cosy", "Bold and attention-grabbing", "Light and subtle"]},
            {"id": "occasion", "question": "Where will you wear this fragrance?", "options": ["Daily wear", "Special occasions", "Outdoors", "At home"]},
            {"id": "season", "question": "Preferred season for your scent?", "options": ["Spring", "Summer", "Autumn", "Winter"]},
            {"id": "scent_type", "question": "Sweet or fresh scents?", "options": ["Sweet", "Fresh", "Not sure"]},
            {"id": "longevity", "question": "How long should it last?", "options": ["Few hours", "All day", "Doesn't matter"]}
        ],
        "Intermediate": [
            {"id": "collection", "question": "Describe your current collection", "options": ["Few designer scents", "Mostly fresh/clean", "Some warm/spicy", "Bit of everything"]},
            {"id": "appeal", "question": "Most appealing scent type?", "options": ["Fruity/floral", "Spicy/woody", "Aquatic/fresh", "Sweet/gourmand"]},
            {"id": "note", "question": "Favorite note you know?", "options": ["Vanilla", "Bergamot", "Leather", "Lavender"]},
            {"id": "strength", "question": "How strong?", "options": ["Subtle", "Noticeable", "Strong"]},
            {"id": "brands", "question": "Brands you've tried?", "options": ["Dior/Chanel/Versace", "Maison Margiela/Le Labo", "Mont Blanc/YSL/Paco Rabanne", "Still figuring out"]}
        ],
        "Advanced": [
            {"id": "top_notes", "question": "Favorite top notes?", "options": ["Bergamot", "Cardamom", "Pink Pepper", "Grapefruit"]},
            {"id": "base_notes", "question": "Favorite base notes?", "options": ["Amber", "Musk", "Oud", "Vetiver"]},
            {"id": "avoid", "question": "What makes you skip a fragrance?", "options": ["Too sweet", "Poor projection", "Too powdery/soapy"]},
            {"id": "layering", "question": "Do you layer fragrances?", "options": ["Yes, I experiment", "Sometimes", "No, I prefer one"]},
            {"id": "niche", "question": "Your stance on niche brands?", "options": ["Obsessed", "Interested but exploring", "Not interested"]}
        ]
    }
    return questions.get(experience_level, [])

@quiz_bp.route('/quiz/start', methods=['POST'])
@login_required
def start_quiz():
    """Handle initial experience level selection"""
    user = get_current_user()
    data = request.json
    experience_level = data.get('experience_level')

    if not experience_level or experience_level not in ['Beginner', 'Intermediate', 'Advanced']:
        return jsonify({"error": "Valid experience level is required"}), 400

    # Save initial selection
    quiz_data = {"experience_level": experience_level}
    existing_result = QuizResult.query.filter_by(user_id=user.id).first()

    if existing_result:
        existing_result.preferences = json.dumps(quiz_data)
    else:
        new_result = QuizResult(user_id=user.id, preferences=json.dumps(quiz_data))
        db.session.add(new_result)

    try:
        db.session.commit()
        questions = get_questions_by_level(experience_level)
        return jsonify({"questions": questions}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@quiz_bp.route('/quiz/submit', methods=['POST'])
@login_required
def submit_quiz():
    """Handle quiz submission and provide recommendations"""
    user = get_current_user()
    data = request.json
    answers = data.get('answers')

    if not answers:
        return jsonify({"error": "Answers are required"}), 400

    # Get existing quiz data
    result = QuizResult.query.filter_by(user_id=user.id).first()
    if not result:
        return jsonify({"error": "Quiz not started"}), 400

    try:
        preferences = json.loads(result.preferences)
        preferences.update(answers)

        # Save updated preferences
        result.preferences = json.dumps(preferences)
        db.session.commit()

        # Get recommendations
        df = get_df()
        if df.empty:
            return jsonify({"error": "Dataset not available"}), 500

        recommendations = get_recommendations(df, preferences)
        return jsonify({
            "recommendations": recommendations.to_dict(orient='records'),
            "message": "Recommendations based on your preferences"
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

def get_recommendations(df, preferences):
    """Improved recommendation logic"""
    # Filter by experience level first
    exp_level = preferences.get('experience_level', 'Beginner')

    # Base filters
    filtered = df.copy()

    # Gender filter
    if preferences.get('gender'):
        filtered = filtered[filtered['Gender'] == preferences['gender']]

    # Rating filter
    min_rating = float(preferences.get('min_rating', 3.5))
    filtered = filtered[filtered['Rating Value'] >= min_rating]

    # Experience-specific filtering
    if exp_level == 'Beginner':
        # Simple filtering for beginners
        if preferences.get('vibe'):
            vibe_map = {
                'Fresh and clean': ['Fresh', 'Aquatic', 'Green'],
                'Warm and cosy': ['Vanilla', 'Amber', 'Gourmand'],
                'Bold and attention-grabbing': ['Spicy', 'Woody', 'Leather'],
                'Light and subtle': ['Floral', 'Citrus', 'Powdery']
            }
            desired_accords = vibe_map.get(preferences['vibe'], [])
            filtered['score'] = filtered['Main Accords'].apply(
                lambda accords: sum(1 for accord in accords if accord in desired_accords)
            )

    elif exp_level == 'Intermediate':
        # More advanced filtering
        if preferences.get('note'):
            filtered['score'] = filtered['Main Accords'].apply(
                lambda accords: 1 if preferences['note'] in accords else 0
            )

    else:  # Advanced
        # Most sophisticated filtering
        if preferences.get('top_notes') and preferences.get('base_notes'):
            filtered['top_score'] = filtered['Main Accords'].apply(
                lambda accords: 1 if preferences['top_notes'] in accords else 0
            )
            filtered['base_score'] = filtered['Main Accords'].apply(
                lambda accords: 1 if preferences['base_notes'] in accords else 0
            )
            filtered['score'] = filtered['top_score'] + filtered['base_score']

    # Sort and return top 5
    return filtered.sort_values('score', ascending=False).head(5)[[
        'Name', 'Gender', 'Rating Value', 'Rating Count',
        'Main Accords', 'Perfumers', 'Description', 'url'
    ]]
