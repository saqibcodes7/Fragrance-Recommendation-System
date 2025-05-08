from flask import Flask, jsonify
from flask_cors import CORS
import os

# Import database setup
from db_setup import init_db

# Import authentication routes
from auth import auth_bp

# Import route modules
from routes.quiz import quiz_bp
from routes.recommendations import recommendations_bp
from routes.fragrances import fragrances_bp
from routes.favourites import favourites_bp

def create_app(test_config=None):
    """Create and configure the Flask application"""
    
    app = Flask(__name__, instance_relative_config=True)
    
    # Enable CORS for frontend development
    CORS(app, 
         resources={r"/*": {
             "origins": ["http://localhost:3000"],
             "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
             "allow_headers": ["Content-Type", "Authorization"]
         }}, 
         supports_credentials=True)
    
    # Secret key
    app.secret_key = os.environ.get('SECRET_KEY', 'dev_secret_key')
    
    # Initialize database
    init_db(app)
    
    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api')
    app.register_blueprint(quiz_bp, url_prefix='/api')
    app.register_blueprint(recommendations_bp, url_prefix='/api')
    app.register_blueprint(fragrances_bp, url_prefix='/api')
    app.register_blueprint(favourites_bp, url_prefix='/api')
    
    # Root route
    @app.route('/')
    def index():
        return jsonify({
            "message": "Fragrance Recommender API",
            "version": "1.0.0",
            "endpoints": {
                "auth": ["/api/signup", "/api/login", "/api/logout", "/api/me"],
                "fragrances": ["/api/fragrances", "/api/fragrances/<id>", "/api/search"],
                "quiz": ["/api/quiz"],
                "recommendations": ["/api/recommendations"],
                "favourites": ["/api/favourites", "/api/favourites/<id>", "/api/favourites/check/<id>"]
            }
        })
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Resource not found"}), 404
    
    @app.errorhandler(500)
    def server_error(e):
        # **Log the actual error to console**
        import traceback
        print(traceback.format_exc())
        return jsonify({"error": "Internal server error"}), 500
    
    return app

# Run the application
if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5000)
