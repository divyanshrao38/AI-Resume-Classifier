from flask import Flask, request, jsonify, send_file
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import os
from pdfminer.high_level import extract_text
from openai import OpenAI
from flask_cors import CORS
import base64
from io import BytesIO
from sqlalchemy.orm import joinedload
import joblib
import re

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



# Load the classifier, vectorizer, and label encoder
clf = joblib.load('./model/resumeclassifier.pkl')
vectorizer = joblib.load('./model/vectorizer.pkl')
label_encoder = joblib.load('./model/labelencoder.pkl')

def cleanResume(resumeText):
    resumeText = re.sub('httpS+s*', ' ', resumeText)  # remove URLs
    resumeText = re.sub('RT|cc', ' ', resumeText)  # remove RT and cc
    resumeText = re.sub('#S+', '', resumeText)  # remove hashtags
    resumeText = re.sub('@S+', '  ', resumeText)  # remove mentions
    resumeText = re.sub('[%s]' % re.escape("""!"#$%&'()*+,-./:;<=>?@[]^_`{|}~"""), ' ', resumeText)  # remove punctuations
    resumeText = re.sub(r'[^x00-x7f]',r' ', resumeText)
    resumeText = re.sub('s+', ' ', resumeText)  # remove extra whitespace
    return resumeText

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

# Routes
# @app.route('/getResume', methods=['GET'])
# def get_resume():
#     applicant_id = request.args.get('applicantId')
#     applicant = Applicant.query.filter_by(id=applicant_id).first()
#     if not applicant:
#         return jsonify({"error": "Applicant not found"}), 404

#     # Return the resume as a file
#     return send_file(BytesIO(applicant.resume), attachment_filename='resume.pdf', as_attachment=True)    

from flask import send_file, request, abort

@app.route('/getCandidateResume', methods=['GET'])
def get_candidate_resume():
    email = request.args.get('email')
    if not email:
        return "Missing email parameter", 400

    # Retrieve the applicant by email
    applicant = Applicant.query.filter_by(email=email).first()
    if not applicant:
        return "No applicant found with that email", 404

    # Check if the applicant has a resume stored
    print("applicant", applicant.name, applicant.email, applicant.resume_score, applicant.resume)
    # if not applicant.resume:
    #     return "No resume available for this applicant", 404

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
        for applicant in opening.applicants:
            print("applicant", applicant.name, applicant.email, applicant.resume_score, applicant.resume)
        print("openings", opening.applicants)
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

    # resume_text = extract_text_from_pdf(file)  # Extract text using the stream
    # resume_data = file
    print("resume_text", len(resume_text))
    # print("resume_data", len(resume_data))
    print("file", len(request.files['resume'].read()) )
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
    print("resume_Category", category)
    # Create a new applicant record including the binary data of the resume
    new_applicant = Applicant(
        name=name,
        email=email,
        linkedin_profile=linkedin,
        resume_score=resume_score,
        opening_id=opening.id,
        resume=resume_data,
        resume_feedback=resume_feedback,  # Store the binary data of the resume
        predicted_category=category
    )
    db.session.add(new_applicant)
    db.session.commit()

    return jsonify({"message": "Application submitted successfully", "score": resume_score}), 200

# Helper functions
def extract_text_from_pdf(file):
    temp_pdf_path = "temp_file.pdf"
    file.save(temp_pdf_path)
    text = extract_text(temp_pdf_path)
    os.remove(temp_pdf_path)
    return text

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
    print("response", response)

    # response_data = response if isinstance(response, dict) else response.__dict__
    # print("response_data", response_data)
    # Optionally, extract specific fields from the response_data to return
    # For example, you might only want to return text from the first choice
    # feedback = response_data['choices'][0]['message']['content']

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
