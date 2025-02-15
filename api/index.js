import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables

const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;
const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

// 🔐 Function to Get a New Access Token
async function getAccessToken() {
    const authString = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${authString}`
        },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken
        })
    });

    const data = await response.json();
    if (data.error) {
        console.error("❌ Spotify API Error:", data.error_description);
        return null;
    }

    return data.access_token;
}

// 🎵 Function to Get Currently Playing Track
async function getCurrentlyPlayingTrack() {
    const accessToken = await getAccessToken();
    if (!accessToken) return { error: "Failed to fetch access token" };

    const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });

    const data = await response.json();
    if (!data || data.error) {
        return { error: "No song is currently playing or API error." };
    }

    return {
        song: data.item.name,
        artist: data.item.artists.map(artist => artist.name).join(", "),
        album: data.item.album.name,
        url: data.item.external_urls.spotify
    };
}

// 🟢 API Handler for Vercel
export default async function handler(req, res) {
    const track = await getCurrentlyPlayingTrack();
    if (track.error) {
        return res.status(404).json(track);
    }
    res.json(track);
}
