from io import BytesIO
import os
import json
import random
import requests

from colorthief import ColorThief
from base64 import b64encode
from dotenv import load_dotenv, find_dotenv
from flask import Flask, Response, render_template, request

load_dotenv(find_dotenv())

# Spotify API URLs
REFRESH_TOKEN_URL = "https://accounts.spotify.com/api/token"
NOW_PLAYING_URL = "https://api.spotify.com/v1/me/player/currently-playing"
RECENTLY_PLAYING_URL = "https://api.spotify.com/v1/me/player/recently-played?limit=10"

# Load environment variables
SPOTIFY_CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
SPOTIFY_CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")
SPOTIFY_REFRESH_TOKEN = os.getenv("SPOTIFY_REFRESH_TOKEN")
SPOTIFY_TOKEN = ""

app = Flask(__name__)

def getAuth():
    return b64encode(f"{SPOTIFY_CLIENT_ID}:{SPOTIFY_CLIENT_SECRET}".encode()).decode("ascii")

def refreshToken():
    data = {
        "grant_type": "refresh_token",
        "refresh_token": SPOTIFY_REFRESH_TOKEN,
    }
    headers = {"Authorization": "Basic {}".format(getAuth())}
    response = requests.post(REFRESH_TOKEN_URL, data=data, headers=headers).json()
    return response.get("access_token")

def get(url):
    global SPOTIFY_TOKEN
    if not SPOTIFY_TOKEN:
        SPOTIFY_TOKEN = refreshToken()
    response = requests.get(url, headers={"Authorization": f"Bearer {SPOTIFY_TOKEN}"})
    if response.status_code == 401:
        SPOTIFY_TOKEN = refreshToken()
        response = requests.get(url, headers={"Authorization": f"Bearer {SPOTIFY_TOKEN}"})
    return response.json()

def getTemplate():
    return "spotify.html.j2"

def loadImageB64(url):
    response = requests.get(url)
    return b64encode(response.content).decode("ascii")

@app.route("/")
def home():
    try:
        data = get(NOW_PLAYING_URL)
    except:
        data = get(RECENTLY_PLAYING_URL)
    
    if not data or "error" in data:
        return Response("No song playing", mimetype="text/plain")
    
    return render_template(getTemplate(), track=data)

if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=True, port=5000)
