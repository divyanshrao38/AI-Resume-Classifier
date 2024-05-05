import re
import string
from pdfminer.high_level import extract_text
import os
technical_keywords = {
    'programming_languages': ['python', 'java', 'c++', 'c#', 'ruby', 'javascript', 'php', 'swift', 'scala', 'kotlin'],
    'technologies': ['docker', 'kubernetes', 'aws', 'azure', 'gcp', 'git', 'jenkins', 'ansible'],
    'frameworks': ['django', 'flask', 'react', 'angular', 'vue', 'spring', 'node.js'],
    'databases': ['mysql', 'postgresql', 'mongodb', 'redis', 'cassandra', 'oracle'],
    'concepts': ['machine learning', 'data visualization', 'big data', 'deep learning', 'rest', 'microservices', 'cloud computing']
}


def filter_text_by_keywords(text):
    # Normalize the text by removing punctuation and converting to lowercase
    normalized_text = text.lower().translate(str.maketrans('', '', string.punctuation))
    found_keywords = set()
    # Check for each keyword in the text
    for category in technical_keywords:
        for keyword in technical_keywords[category]:
            if keyword in normalized_text:
                found_keywords.add(keyword)
    return found_keywords

def compare_keywords(jd_keywords, resume_keywords):
    common = jd_keywords.intersection(resume_keywords)
    missing = jd_keywords.difference(resume_keywords)
    return common, missing
#export these functions

def cleanResume(resumeText):
    resumeText = re.sub('httpS+s*', ' ', resumeText)  # remove URLs
    resumeText = re.sub('RT|cc', ' ', resumeText)  # remove RT and cc
    resumeText = re.sub('#S+', '', resumeText)  # remove hashtags
    resumeText = re.sub('@S+', '  ', resumeText)  # remove mentions
    resumeText = re.sub('[%s]' % re.escape("""!"#$%&'()*+,-./:;<=>?@[]^_`{|}~"""), ' ', resumeText)  # remove punctuations
    resumeText = re.sub(r'[^x00-x7f]',r' ', resumeText)
    resumeText = re.sub('s+', ' ', resumeText)  # remove extra whitespace
    return resumeText


def extract_text_from_pdf(file):
    temp_pdf_path = "temp_file.pdf"
    file.save(temp_pdf_path)
    text = extract_text(temp_pdf_path)
    os.remove(temp_pdf_path)
    return text