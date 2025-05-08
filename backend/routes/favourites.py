from flask import Blueprint, request, jsonify
from models import db, Favorite, Fragrance
from auth import login_required, get_current_user


favourites_bp = Blueprint('favourites', __name__)

@favourites_bp.route('/favourites', methods=['POST'])
@login_required
def add_favourite():
    """Add a fragrance to the user's favorites"""
    user = get_current_user()
    data = request.json
    fragrance_id = data.get('fragrance_id')
    
    if not fragrance_id:
        return jsonify({"error": "Fragrance ID is required"}), 400
    
    
    fragrance = Fragrance.query.get(fragrance_id)
    if not fragrance:
        return jsonify({"error": f"Fragrance with ID {fragrance_id} not found"}), 404
    
    # Check if the favorite already exists
    existing_favorite = Favorite.query.filter_by(
        user_id=user.id, 
        fragrance_id=fragrance_id
    ).first()
    
    if existing_favorite:
        return jsonify({"message": "Fragrance is already in favorites"}), 200
    
    
    new_favorite = Favorite(user_id=user.id, fragrance_id=fragrance_id)
    db.session.add(new_favorite)
    
    try:
        db.session.commit()
        return jsonify({
            "message": "Added to favorites",
            "favorite_id": new_favorite.id
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Error adding to favorites: {str(e)}"}), 500

@favourites_bp.route('/favourites', methods=['GET'])
@login_required
def get_favourites():
    """Get all favorites for the current user"""
    user = get_current_user()
    
   
    favorites = db.session.query(Favorite, Fragrance).\
        join(Fragrance, Favorite.fragrance_id == Fragrance.id).\
        filter(Favorite.user_id == user.id).all()
    
  
    result = [{
        "favorite_id": favorite.id,
        "date_added": favorite.created_at.isoformat() if hasattr(favorite, 'created_at') else None,
        "fragrance": fragrance.to_dict()
    } for favorite, fragrance in favorites]
    
    return jsonify({
        "count": len(result),
        "favourites": result
    }), 200

@favourites_bp.route('/favourites/<int:favourite_id>', methods=['DELETE'])
@login_required
def remove_favourite(favourite_id):
    """Remove a fragrance from the user's favorites"""
    user = get_current_user()
    
    # Find the favorite
    favorite = Favorite.query.filter_by(id=favourite_id, user_id=user.id).first()
    
    if not favorite:
        return jsonify({"error": "Favorite not found"}), 404
    
    
    db.session.delete(favorite)
    
    try:
        db.session.commit()
        return jsonify({"message": "Removed from favorites"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Error removing from favorites: {str(e)}"}), 500

@favourites_bp.route('/favourites/check/<int:fragrance_id>', methods=['GET'])
@login_required
def check_favourite(fragrance_id):
    """Check if a fragrance is in the user's favorites"""
    user = get_current_user()
    
    
    favorite = Favorite.query.filter_by(
        user_id=user.id, 
        fragrance_id=fragrance_id
    ).first()
    
    if favorite:
        return jsonify({
            "is_favorite": True,
            "favorite_id": favorite.id
        }), 200
    else:
        return jsonify({
            "is_favorite": False
        }), 200 