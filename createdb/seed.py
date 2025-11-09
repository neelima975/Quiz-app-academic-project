import pymongo
from bson.objectid import ObjectId
import os
from dotenv import load_dotenv
import sys
import google.generativeai as genai
import json
import re

# --- CONFIGURATION ---
load_dotenv()

# MongoDB Configuration
MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    print("ERROR: MONGO_URI is not set in the .env file.")
    sys.exit(1)

# Google Gemini Configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    # A fallback for your previous setup, with a warning.
    GEMINI_API_KEY = os.getenv("APP_SECRET_KEY")
    if GEMINI_API_KEY:
        print("WARNING: Using API key from APP_SECRET_KEY. It's recommended to use GEMINI_API_KEY.")
    else:
        print("ERROR: GEMINI_API_KEY is not set in the .env file.")
        sys.exit(1)
genai.configure(api_key=GEMINI_API_KEY)


# --- DATA DEFINITION ---
# Image map remains the same
IMAGE_MAP = {
    "statue_of_liberty": "/images/statue_of_liberty.jpeg",
    "christ_the_redeemer": "/images/christ_the_redeemer.jpeg",
    "map_france": "/images/map_france.jpeg",
    "map_japan": "/images/map_japan.jpeg",
    "colosseum": "/images/colosseum.jpeg",
    "eiffel_tower": "/images/eiffel_tower.jpeg",
    "great_wall_of_china": "/images/great_wall_of_china.jpeg",
    "taj_mahal": "/images/taj_mahal.jpeg",
    "moai_statues": "/images/moai_statues.jpeg",
    "sydney_opera_house": "/images/sydney_opera_house.jpeg",
}


def generate_text_questions(topic, num_questions):
    """Generates a specified number of text-only questions using the Google Gemini API."""
    print(f"Generating {num_questions} questions for topic: '{topic}' with Gemini...")
    try:
        prompt = f"""
        You are a helpful assistant designed to output JSON.
        Generate {num_questions} multiple-choice questions about '{topic}'.
        Each question MUST be a JSON object with the following keys:
        - "questionText": A string containing the question.
        - "options": An array of 4 objects, each with "text" (string) and "isCorrect" (boolean).
        - "explanation": A brief string explaining the correct answer.
        - "timer": An integer between 20 and 40.
        
        RULES:
        1. Exactly one option must have "isCorrect" set to true.
        2. Do NOT include any images or image paths.
        3. Return ONLY a valid JSON array of these objects. Do not include any other text, greetings, or markdown code fences.
        """
        
        # --- THE FINAL FIX ---
        # We are now using a model name directly from YOUR list of available models.
        # Note the 'models/' prefix is required.
        model = genai.GenerativeModel('models/gemini-pro-latest')
        
        response = model.generate_content(prompt)
        
        return response.text
    except Exception as e:
        print(f"ERROR: Failed to generate questions from Gemini API. Details: {e}")
        return None
    
def parse_llm_response(response_text):
    """Parses the LLM's string response into a list of Python dictionaries."""
    if not response_text:
        return []
    
    # This regex is a robust way to find a JSON array, which is still needed.
    match = re.search(r'\[.*\]', response_text, re.DOTALL)
    if match:
        json_str = match.group(0)
        try:
            return json.loads(json_str)
        except json.JSONDecodeError:
            print(f"ERROR: Could not parse extracted JSON from Gemini response. Raw response: {json_str}")
            return []
    else:
        print(f"ERROR: No valid JSON array found in Gemini response. Raw response: {response_text}")
        return []

# The seed_database function remains IDENTICAL to the previous version.
# This demonstrates the power of separating the data generation from the database logic.
def seed_database():
    """Connects to MongoDB, clears, and seeds with a mix of manual and generated data."""
    try:
        client = pymongo.MongoClient(MONGO_URI)
        db = client.get_default_database()
        print(f"Successfully connected to MongoDB. Target database: '{db.name}'")
    except pymongo.errors.ConnectionFailure as e:
        print(f"ERROR: Could not connect to MongoDB. Details: {e}")
        sys.exit(1)

    db.quizzes.drop()
    db.questions.drop()
    print("Cleared 'quizzes' and 'questions' collections.")

    # 1. Create Quizzes
    quizzes_to_create = [
        { "_id": ObjectId(), "title": "World Landmarks & Statues", "description": "Identify iconic structures from around the globe.", "category": "Art & History", "difficulty": "Intermediate" },
        { "_id": ObjectId(), "title": "World Capitals Challenge", "description": "A comprehensive test of your geography knowledge.", "category": "Geography", "difficulty": "Beginner" }
    ]
    db.quizzes.insert_many(quizzes_to_create)
    quiz_id_map = {quiz['title']: quiz['_id'] for quiz in quizzes_to_create}
    print(f"Inserted {len(quizzes_to_create)} quizzes.")
    
    # 2. Define all manual (image-based) questions
    manual_questions = [
        {"quizId": quiz_id_map["World Landmarks & Statues"], "questionText": "What is the name of this famous statue in New York City?", "questionImage": IMAGE_MAP["statue_of_liberty"], "options": [{"text": "Statue of Unity", "isCorrect": False}, {"text": "Statue of Liberty", "isCorrect": True}, {"text": "Colossus of Rhodes", "isCorrect": False}, {"text": "The Motherland Calls", "isCorrect": False}], "explanation": "The Statue of Liberty was a gift from the people of France to the United States.", "timer": 30},
        {"quizId": quiz_id_map["World Landmarks & Statues"], "questionText": "This statue of Jesus Christ is located in which Brazilian city?", "questionImage": IMAGE_MAP["christ_the_redeemer"], "options": [{"text": "São Paulo", "isCorrect": False}, {"text": "Rio de Janeiro", "isCorrect": True}, {"text": "Brasília", "isCorrect": False}, {"text": "Salvador", "isCorrect": False}], "explanation": "Christ the Redeemer overlooks Rio de Janeiro from the peak of Corcovado mountain.", "timer": 30},
        {"quizId": quiz_id_map["World Capitals Challenge"], "questionText": "What is the capital of the country shown here?", "questionImage": IMAGE_MAP["map_france"], "options": [{"text": "Paris", "isCorrect": True}, {"text": "Berlin", "isCorrect": False}, {"text": "Madrid", "isCorrect": False}, {"text": "Rome", "isCorrect": False}], "explanation": "Paris, on the river Seine, is the capital and most populous city of France.", "timer": 25},
        {"quizId": quiz_id_map["World Capitals Challenge"], "questionText": "Tokyo is the capital of which country?", "questionImage": IMAGE_MAP["map_japan"], "options": [{"text": "Japan", "isCorrect": True}, {"text": "South Korea", "isCorrect": False}, {"text": "China", "isCorrect": False}, {"text": "Thailand", "isCorrect": False}], "explanation": "Tokyo is the capital of Japan, known for its Imperial Palace.", "timer": 20},
        {"quizId": quiz_id_map["World Landmarks & Statues"], "questionText": "This ancient amphitheater is a famous landmark in Rome, Italy.", "questionImage": IMAGE_MAP["colosseum"], "options": [{"text": "The Pantheon", "isCorrect": False}, {"text": "The Colosseum", "isCorrect": True}, {"text": "The Parthenon", "isCorrect": False}, {"text": "Ephesus", "isCorrect": False}], "explanation": "The Colosseum could hold an estimated 50,000 to 80,000 spectators.", "timer": 30},
        {"quizId": quiz_id_map["World Landmarks & Statues"], "questionText": "This iconic iron tower is located in which European capital?", "questionImage": IMAGE_MAP["eiffel_tower"], "options": [{"text": "London", "isCorrect": False}, {"text": "Berlin", "isCorrect": False}, {"text": "Paris", "isCorrect": True}, {"text": "Madrid", "isCorrect": False}], "explanation": "The Eiffel Tower is one of the most recognizable structures in the world.", "timer": 20},
        {"quizId": quiz_id_map["World Landmarks & Statues"], "questionText": "This series of fortifications was built across the historical northern borders of China.", "questionImage": IMAGE_MAP["great_wall_of_china"], "options": [{"text": "The Great Wall of China", "isCorrect": True}, {"text": "Hadrian's Wall", "isCorrect": False}, {"text": "The Silk Road", "isCorrect": False}, {"text": "The Maginot Line", "isCorrect": False}], "explanation": "The Great Wall of China is the world's longest wall and biggest ancient architecture.", "timer": 25},
        {"quizId": quiz_id_map["World Landmarks & Statues"], "questionText": "This ivory-white marble mausoleum is located in Agra, India.", "questionImage": IMAGE_MAP["taj_mahal"], "options": [{"text": "Humayun's Tomb", "isCorrect": False}, {"text": "Lotus Temple", "isCorrect": False}, {"text": "The Taj Mahal", "isCorrect": True}, {"text": "Red Fort", "isCorrect": False}], "explanation": "The Taj Mahal was commissioned in 1632 by the Mughal emperor Shah Jahan.", "timer": 25},
        {"quizId": quiz_id_map["World Landmarks & Statues"], "questionText": "These monolithic human figures were carved by the Rapa Nui people on which island?", "questionImage": IMAGE_MAP["moai_statues"], "options": [{"text": "Galapagos Islands", "isCorrect": False}, {"text": "Easter Island", "isCorrect": True}, {"text": "Svalbard", "isCorrect": False}, {"text": "Madagascar", "isCorrect": False}], "explanation": "The Moai statues were carved by the Rapa Nui people on Easter Island in eastern Polynesia.", "timer": 35},
        {"quizId": quiz_id_map["World Landmarks & Statues"], "questionText": "This famous performing arts centre is located in which Australian city?", "questionImage": IMAGE_MAP["sydney_opera_house"], "options": [{"text": "Melbourne", "isCorrect": False}, {"text": "Perth", "isCorrect": False}, {"text": "Brisbane", "isCorrect": False}, {"text": "Sydney", "isCorrect": True}], "explanation": "The Sydney Opera House is a multi-venue performing arts centre in Sydney, Australia.", "timer": 20},
    ]
    
    all_questions = list(manual_questions)

    # 3. Generate text-based questions
    topics_to_generate = { "World Capitals Challenge": 40, "World Landmarks & Statues": 30 }
    for title, num in topics_to_generate.items():
        llm_response = generate_text_questions(title, num)
        generated_questions = parse_llm_response(llm_response)
        
        if generated_questions:
            quiz_id = quiz_id_map[title]
            for q in generated_questions:
                q['quizId'] = quiz_id
            all_questions.extend(generated_questions)
            print(f"Successfully parsed and added {len(generated_questions)} questions for '{title}'.")

    # 4. Insert all combined questions
    if all_questions:
        db.questions.insert_many(all_questions)
        print(f"\nTotal of {len(all_questions)} questions inserted into the database.")
    
    client.close()
    print("Database seeding complete. Connection closed.")

if __name__ == "__main__":
    seed_database()