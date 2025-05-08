from main import create_app
from models import db, Fragrance
import pandas as pd
import os
from sqlalchemy import inspect

def verify_database():
    # Create and configure the app
    app = create_app()
    
    with app.app_context():
        # Create all tables
        db.create_all()
        
        # Get list of tables
        inspector = inspect(db.engine)
        tables = inspector.get_table_names()
        print("Existing tables:", tables)
        
        # Check if fragrances table needs to be populated
        fragrance_count = Fragrance.query.count()
        print(f"Number of fragrances in database: {fragrance_count}")
        
        if fragrance_count == 0:
            # Load and populate fragrances
            csv_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'perfume_data_clean.csv')
            if os.path.exists(csv_path):
                print("Loading fragrance data from CSV...")
                df = pd.read_csv(csv_path)
                
                for _, row in df.iterrows():
                    fragrance = Fragrance(
                        name=row['Name'],
                        brand=row['Brand'] if 'Brand' in row else row['Name'].split(' ')[0],
                        gender=row.get('Gender', None),
                        rating_value=row.get('Rating Value', None),
                        rating_count=row.get('Rating Count', None),
                        main_accords=str(row.get('Main Accords', '')),
                        perfumers=str(row.get('Perfumers', '')),
                        description=row.get('Description', ''),
                        url=row.get('url', '')
                    )
                    db.session.add(fragrance)
                
                db.session.commit()
                print(f"Imported {len(df)} fragrances into the database.")
            else:
                print(f"Warning: {csv_path} not found!")
        
        # Verify fragrance data
        sample_fragrance = Fragrance.query.first()
        if sample_fragrance:
            print("\nSample fragrance data:")
            print(sample_fragrance.to_dict())

if __name__ == '__main__':
    verify_database() 