from flask import Flask, request, jsonify, send_file
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import os
from pdfminer.high_level import extract_text
from openai import OpenAI
from flask_cors import CORS
from io import BytesIO
from sqlalchemy.orm import joinedload
import joblib
from utils import filter_text_by_keywords, compare_keywords, cleanResume, extract_text_from_pdf

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///site.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)
CORS(app)

# OpenAI API setup
os.environ['OPENAI_API_KEY'] = ''
client = OpenAI(api_key=os.environ['OPENAI_API_KEY'])

# Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    hashed_password = db.Column(db.String(128), nullable=False)
    type = db.Column(db.String(20), nullable=False)

class Opening(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    opening_id = db.Column(db.String(20), unique=True, nullable=False)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    applicants = db.relationship('Applicant', backref='opening', lazy=True)

class Applicant(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    predicted_category = db.Column(db.String(100), nullable=True)
    linkedin_profile = db.Column(db.String(255))
    resume_score = db.Column(db.Float)
    opening_id = db.Column(db.Integer, db.ForeignKey('opening.id'), nullable=False)
    resume = db.Column(db.LargeBinary)  # Optional: Store resumes as binary data if needed
    resume_feedback = db.Column(db.String(10000), nullable=False)
    matching_keywords = db.Column(db.String(1000), nullable=False)
    missing_keywords = db.Column(db.String(1000), nullable=False)



# Load the classifier, vectorizer, and label encoder
clf = joblib.load('./model/resumeclassifier.pkl')
vectorizer = joblib.load('./model/vectorizer.pkl')
label_encoder = joblib.load('./model/labelencoder.pkl')



def predict_category(resume_text):
    # Clean the resume text
    cleaned_resume = cleanResume(resume_text)

    # Transform the cleaned resume text into a feature vector
    resume_vec = vectorizer.transform([cleaned_resume])

    # Predict the category of the resume using the trained classifier
    prediction = clf.predict(resume_vec)

    # Decode the predicted category label back to its original value
    predicted_category = label_encoder.inverse_transform(prediction)[0]

    print(f"Predicted Category: {predicted_category}")
    return predicted_category




# Create the tables
@app.before_request
def create_tables():
    # The following line will remove this handler, making it
    # only run on the first request
    app.before_request_funcs[None].remove(create_tables)

    db.create_all()




@app.route('/getCandidateResume', methods=['GET'])
def get_candidate_resume():
    email = request.args.get('email')
    if not email:
        return "Missing email parameter", 400

    # Retrieve the applicant by email
    applicant = Applicant.query.filter_by(email=email).first()
    if not applicant:
        return "No applicant found with that email", 404

    # Create a BytesIO object from the binary resume data
    resume_file = BytesIO(applicant.resume)
    resume_file.seek(0)  # Ensure the cursor is at the start of the stream

    # Send the file; you might want to specify a filename or use the applicant's name
    return send_file(
        resume_file,
        as_attachment=True,
        download_name=f"{applicant.name}_resume.pdf",
        mimetype='application/pdf'
    )

@app.route('/getAllOpenings', methods=['GET'])
def get_all_openings():
    openings = Opening.query.options(joinedload(Opening.applicants)).all()
    openings_data = []
    
    for opening in openings:
        openings_data.append({
            'opening_id': opening.opening_id,
            'title': opening.title,
            'description': opening.description,
            'applicants': [
                {
                    'name': applicant.name,
                    'email': applicant.email,
                    'linkedin_profile': applicant.linkedin_profile,
                    'resume_score': applicant.resume_score,
                    'predicted_category': applicant.predicted_category,
                    'resume_feedback': applicant.resume_feedback if applicant.resume_feedback else "No feedback available",
                    'matching_keywords': applicant.matching_keywords,
                    'missing_keywords': applicant.missing_keywords
                } for applicant in opening.applicants
            ]
        })
    return jsonify(openings_data), 200

@app.route('/createOpening', methods=['POST'])
def create_opening():
    data = request.get_json()
    new_opening = Opening(opening_id=data['opening_id'], title=data['title'], description=data['description'])
    db.session.add(new_opening)
    db.session.commit()
    return jsonify({"message": "Opening created successfully"}), 201

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if User.query.filter_by(email=data['email']).first():
        return jsonify({"error": "User already exists"}), 409

    hashed_password = generate_password_hash(data['password'])
    new_user = User(email=data['email'], hashed_password=hashed_password, type=data['role'])
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"message": "User registered successfully"}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data['email']).first()
    if user and check_password_hash(user.hashed_password, data['password']):
        return jsonify({"message": "Login successful", "user": data['email'], "type": user.type}), 200
    return jsonify({"error": "Invalid credentials"}), 401

@app.route('/apply', methods=['POST'])
def apply():
    email = request.form['email']
    name = request.form['name']
    linkedin = request.form['linkedinProfile']
    opening_id = request.form['openingId']
    file = request.files['resume']

    if not file or not file.filename.endswith('.pdf'):
        return jsonify({"error": "Unsupported file type or no file uploaded"}), 400

    # Read the PDF file directly from the file stream
    # Read the file data into memory
    resume_data = file.read()
    temp_pdf_path = "temp_resume.pdf"

    with open(temp_pdf_path, 'wb') as temp_file:
        temp_file.write(resume_data)
    
    resume_text = extract_text(temp_pdf_path)

    # Retrieve the opening by opening_id
    opening = Opening.query.filter_by(opening_id=opening_id).first()
    if not opening:
        return jsonify({"error": "Opening not found"}), 404

    # Check if this email has already applied to this opening
    existing_applicant = Applicant.query.filter_by(email=email, opening_id=opening.id).first()
    if existing_applicant:
        return jsonify({"error": "You have already applied to this opening"}), 409

    # Analyze the resume with OpenAI
    job_description = opening.description
    resume_score = analyze_resume_with_openai(resume_text, job_description)
    resume_feedback = analyze_resume_with_openai_feedback(resume_text, job_description)
    category = predict_category(resume_text)
    # Extract technical keywords from the job description and resume
    jd_keywords = filter_text_by_keywords(job_description)
    resume_keywords = filter_text_by_keywords(resume_text)
    matching_keywords, missing_keywords = compare_keywords(jd_keywords, resume_keywords)

    # Create a new applicant record including the binary data of the resume
    new_applicant = Applicant(
        name=name,
        email=email,
        linkedin_profile=linkedin,
        resume_score=resume_score,
        opening_id=opening.id,
        resume=resume_data,
        resume_feedback=resume_feedback,  # Store the binary data of the resume
        predicted_category=category,
        matching_keywords= ", ".join(matching_keywords) if matching_keywords else "None",
        missing_keywords= ", ".join(missing_keywords) if missing_keywords else "None"
    )
    db.session.add(new_applicant)
    db.session.commit()

    return jsonify({"message": "Application submitted successfully", "score": resume_score}), 200


def analyze_resume_with_openai(resume_text, job_description):
    # Make sure to set your OpenAI API key in environment variables
    # openai.api_key = os.environ.get('OPENAI_API_KEY')

    prompt = f"Given the job description: {job_description}, evaluate the following resume to give ONLY a NUMERICAL SCORE out of 10 and NOTHING else  {resume_text}"

    response = client.chat.completions.create(
        model="gpt-4-turbo",
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
    return response.choices[0].message.content


def analyze_resume_with_openai_feedback(resume_text, job_description):
    # Make sure to set your OpenAI API key in environment variables
    # openai.api_key = os.environ.get('OPENAI_API_KEY')

    prompt = f"Given the job description: {job_description}, evaluate the following resume to give ONLY feedback on resume as per job description in thrid person in IN ONLY 100 WORDS and NOTHING else  {resume_text}"

    response = client.chat.completions.create(
        model="gpt-4-turbo",
        # response_format={ "type": "json_object" },
        messages=[
            {"role": "system", "content": "You are a helpful resume analyzing assistant."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.7,
        top_p=1
    )

    return response.choices[0].message.content

if __name__ == '__main__':
    app.run(debug=True)
