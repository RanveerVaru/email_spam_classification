from fastapi import FastAPI
from pydantic import BaseModel
import pickle
import nltk, string
from nltk.corpus import stopwords
from nltk.stem.porter import PorterStemmer
from fastapi.middleware.cors import CORSMiddleware
import os
import nltk

origins = [
    "http://localhost:5173",    # Vite dev server
    "http://localhost:3000",    # if you used CRA earlier
    "https://email-spam-classification-2-z0kt.onrender.com",  # production frontend
    # "https://your-render-backend.onrender.com" is NOT needed here — backend origin isn't added as client
]

# ensure nltk resources available at runtime (safe fallback)


# make sure nltk looks in a persistent, known location on Render
NLTK_DATA_DIR = os.getenv("NLTK_DATA", "/opt/render/nltk_data")
# ensure the directory exists
os.makedirs(NLTK_DATA_DIR, exist_ok=True)
# add it to nltk search path (highest priority)
if NLTK_DATA_DIR not in nltk.data.path:
    nltk.data.path.insert(0, NLTK_DATA_DIR)

def ensure_nltk():
    # download the exact resources used by your code
    needed = ("punkt_tab", "punkt", "stopwords")
    for pkg in needed:
        try:
            # try a small lookup that triggers package-specific exceptions
            if pkg == "punkt_tab":
                nltk.data.find("tokenizers/punkt_tab/english")
            elif pkg == "punkt":
                nltk.data.find("tokenizers/punkt")
            else:
                nltk.data.find(f"corpora/{pkg}")
        except LookupError:
            print(f"Downloading NLTK package: {pkg} -> {NLTK_DATA_DIR}")
            nltk.download(pkg, download_dir=NLTK_DATA_DIR)
    print("NLTK prepare done, paths:", nltk.data.path)

# call it asap (before any tokenization)
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
    allow_origins= "https://email-spam-classification-2-z0kt.onrender.com",      # or ["*"] for testing
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
