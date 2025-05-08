from flask import Blueprint, request, jsonify, session
from models import db, User
import bcrypt
from functools import wraps

# Create a Blueprint for authentication routes
auth_bp = Blueprint('auth', __name__)

# Decorator for routes that require authentication
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({"error": "Authentication required"}), 401
        return f(*args, **kwargs)
    return decorated_function

# Get current user from session
def get_current_user():
    if 'user_id' in session:
        return User.query.get(session['user_id'])
    return None

@auth_bp.route('/signup', methods=['POST'])
def signup():
    """Registers a new user"""
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    # Check if user already exists
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered"}), 400

    # Hash the password
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    # Create a new user
    new_user = User(email=email, password=hashed_password)
    db.session.add(new_user)
    
    try:
        db.session.commit()
        session['user_id'] = new_user.id
        return jsonify({"message": "User registered successfully", "user_id": new_user.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Error registering user: {str(e)}"}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Logs in a user"""
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    # Find the user
    user = User.query.filter_by(email=email).first()

    # Check if user exists and password is correct
    if user and bcrypt.checkpw(password.encode('utf-8'), user.password):
        session['user_id'] = user.id
        return jsonify({"message": "Login successful", "user_id": user.id}), 200
    else:
        return jsonify({"error": "Invalid email or password"}), 401

@auth_bp.route('/logout', methods=['POST'])
def logout():
    """Logs out a user"""
    session.pop('user_id', None)
    return jsonify({"message": "Logged out successfully"}), 200

@auth_bp.route('/me', methods=['GET'])
@login_required
def me():
    """Gets the current logged in user"""
    user = get_current_user()
    if user:
        return jsonify({"user_id": user.id, "email": user.email}), 200
    return jsonify({"error": "Not logged in"}), 401 