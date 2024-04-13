from flask import Flask, request, jsonify
from joblib import load
import numpy as np

app = Flask(__name__)

# Load  trained model
model_path = './model/resumeClassifier.pkl'  
model = load(model_path)

# Define a route for your prediction
@app.route('/predict', methods=['POST'])
def predict():
    # Get resume data from the POST request
    data = request.get_json(force=True)
    resume_text = data['resume']

    # Preprocess the resume text here (similar to how you preprocessed training data)
    # For example:
    # cleaned_resume = cleanResume(resume_text)

    # Transform the cleaned resume using your text vectorization method (e.g., TF-IDF)
    # Assume `word_vectorizer` is your vectorizer and it's loaded or defined elsewhere
    # resume_vec = word_vectorizer.transform([cleaned_resume])

    # Predict the category
    prediction = model.predict(resume_vec)

    # Return the prediction
    return jsonify({'prediction': str(prediction[0])})

if __name__ == '__main__':
    app.run(debug=True)
