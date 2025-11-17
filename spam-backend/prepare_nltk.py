# prepare_nltk.py
import nltk
for pkg in ("punkt","stopwords"):
    try:
        nltk.data.find(f"tokenizers/{pkg}" if pkg=="punkt" else f"corpora/{pkg}")
    except LookupError:
        nltk.download(pkg)
print("NLTK prepare done")
