from flask import Flask, request, jsonify
import os
from pdfminer.high_level import extract_text
from openai import OpenAI
import os
from flask_cors import CORS
from tinydb import TinyDB, Query
from pymongo import MongoClient
import bcrypt
from flask_cors import CORS
import os

os.environ['OPENAI_API_KEY'] =  ''

# Initialize TinyDB
db = TinyDB('db.json')
users_table = db.table('users')
opening_table = db.table('openings')

app = Flask(__name__)
client = OpenAI()
CORS(app)

@app.route('/getAllOpenings', methods=['GET'])
def get_all_openings():
    openings = opening_table.all()
    return jsonify(openings), 200

@app.route('/createOpening', methods=['POST'])
def create_opening():
    title = request.json.get('title')
    description = request.json.get('description')
    opening_id = request.json.get('opening_id')
    opening_table.insert({"opening_id":opening_id,'title': title, 'description': description, 'applicants': []})
    return jsonify({"message": "Opening created successfully"}), 201

@app.route('/apply', methods=['POST'])
def apply():
   

    email = request.form.get('email')
    name = request.form.get('name')
    linkedin = request.form.get('linkedinProfile')
    opening_id = int(request.form.get('openingId'))

    print("email", email  )
    print("opening_id", opening_id)
    opening = opening_table.get(doc_id=opening_id)
    print("opening", opening)
    if not opening:
        return jsonify({"error": "Opening not found"}), 404

    applicants = opening.get('applicants', [])
    if email in applicants:
        return jsonify({"error": "You have already applied to this opening"}), 409

    # Assuming the resume is sent as part of the same request
    if 'resume' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['resume']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if file and file.filename.endswith('.pdf'):
        # Extract text from the uploaded PDF resume
        resume_text = extract_text_from_pdf(file)
        print("here", resume_text)
        job_description = opening.get('description', "Default job description if not specified.")

        # Call the OpenAI API for analysis (this is a placeholder for actual implementation)
        response = analyze_resume_with_openai(resume_text, job_description)
        
        # Update the database with the new applicant and their score
        
        applicant_data = {
            "email": email,
            "resume_score": response,
            "name": name,
            "linkedin": linkedin,
        }
        applicants.append(applicant_data)
        opening_table.update({'applicants': applicants}, doc_ids=[opening_id])
        # Assuming there's a separate collection or table for applicant details
        
        
        return jsonify({"message": "Application submitted successfully", "score": response}), 200

    return jsonify({"error": "Unsupported file type"}), 400
@app.route('/register', methods=['POST'])
def register():
    email = request.json.get('email')
    password = request.json.get('password')
    user_type = request.json.get('role')  # Admin or Candidate

    # Validate input
    if not email or not password or user_type not in ['Admin', 'Candidate']:
        return jsonify({"error": "Invalid registration information"}), 400
    print("email", email, password, user_type)
    User = Query()
    if users_table.search(User.email == email):
        return jsonify({"error": "User already exists"}), 409

    # Hash the password before storing it
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    # Insert the new user into the database with the type
    users_table.insert({'email': email, 'password': password, 'type': user_type})

    return jsonify({"message": "User registered successfully"}), 201

@app.route('/login', methods=['POST'])
def login():
    email = request.json.get('email')
    password = request.json.get('password')

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    User = Query()
    user = users_table.get(User.email == email)
    # password = user['password']

    if user and password == user['password']:
        # Include the user type in the login success response
        return jsonify({"message": "Login successful", "user": email, "type": user['type']}), 200
    else:
        return jsonify({"error": "Invalid credentials"}), 401
    
@app.route('/upload', methods=['POST'])
def upload_file():
    print("Request received", request.files)
    if 'resume' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['resume']

    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if file and file.filename.endswith('.pdf'):
        # Extract text from the uploaded PDF resume
        resume_text = extract_text_from_pdf(file)

        # Assume you have a job description. Replace this with the actual job description.
        job_description = "Job description text here"
       

        # Call the OpenAI API for analysis
        response = analyze_resume_with_openai(resume_text, job_description)
        print("score", response)
        # Ensure the response from OpenAI is JSON serializable
        return jsonify({"score": response, }), 200

    return jsonify({"error": "Unsupported file type"}), 400

def extract_text_from_pdf(file):
    # PdfMiner requires a file path, so we need to save the uploaded file temporarily
    temp_pdf_path = "temp_file.pdf"
    file.save(temp_pdf_path)

    # Extract text using PdfMiner
    text = extract_text(temp_pdf_path)

    # Remove the temporary file after use
    os.remove(temp_pdf_path)

    return text

def analyze_resume_with_openai(resume_text, job_description):
    # Make sure to set your OpenAI API key in environment variables
    # openai.api_key = os.environ.get('OPENAI_API_KEY')

    prompt = f"Given the job description: {job_description}, evaluate the following resume to give ONLY a numerical score out of 10 and NOTHING else  {resume_text}"

    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        # response_format={ "type": "json_object" },
        messages=[
            {"role": "system", "content": "You are a helpful resume analyzing assistant."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.7,
        top_p=1
    )

    # Assuming you want to return the entire response for now, but you may want to extract specific information
    # Convert the OpenAI API response to a dictionary if not already
    print("response", response)

    # response_data = response if isinstance(response, dict) else response.__dict__
    # print("response_data", response_data)
    # Optionally, extract specific fields from the response_data to return
    # For example, you might only want to return text from the first choice
    # feedback = response_data['choices'][0]['message']['content']

    return response.choices[0].message.content

if __name__ == '__main__':
    app.run(debug=True)
