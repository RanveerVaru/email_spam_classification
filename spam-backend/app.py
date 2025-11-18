from fastapi import FastAPI
from pydantic import BaseModel
import pickle
import nltk, string
from nltk.corpus import stopwords
from nltk.stem.porter import PorterStemmer
from fastapi.middleware.cors import CORSMiddleware

origins = [
    "http://localhost:5173",    # Vite dev server
    "http://localhost:3000",    # if you used CRA earlier
    "https://email-spam-classification-2-z0kt.onrender.com",  # production frontend
    # "https://your-render-backend.onrender.com" is NOT needed here — backend origin isn't added as client
]

# ensure nltk resources available at runtime (safe fallback)
def ensure_nltk():
    try:
        nltk.data.find('tokenizers/punkt')
    except LookupError:
        nltk.download('punkt')
    try:
        nltk.data.find('corpora/stopwords')
    except LookupError:
        nltk.download('stopwords')

ensure_nltk()



ps = PorterStemmer()

def transform_text(text):
    text = text.lower()
    text = nltk.word_tokenize(text)

    y = []
    for i in text:
        if i.isalnum():
            y.append(i)

    text = y[:]
    y.clear()

    for i in text:
        if i not in stopwords.words('english') and i not in string.punctuation:
            y.append(ps.stem(i))

    return " ".join(y)

class Payload(BaseModel):
    text: str

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,      # or ["*"] for testing
    allow_credentials=True,
    allow_methods=["*"],        # important — allow OPTIONS/GET/POST/...
    allow_headers=["*"],        # allow Content-Type and other headers
)

vectorizer = pickle.load(open("vectorizer.pkl", "rb"))
model = pickle.load(open("model.pkl", "rb"))

@app.post("/predict")
def predict(data: Payload):
    processed = transform_text(data.text)
    X = vectorizer.transform([processed])
    pred = model.predict(X)[0]
    return {"prediction": int(pred)}
