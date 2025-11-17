#!/usr/bin/env bash
# install python deps (Vercel also installs requirements automatically; this ensures nltk step runs)
python -m pip install --upgrade pip
pip install -r requirements.txt
python prepare_nltk.py
