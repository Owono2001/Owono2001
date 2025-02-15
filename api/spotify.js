export default async function handler(req, res) {
    try {
        // 1️⃣ Fetch New Access Token Using Refresh Token
        const authString = Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64');
        const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${authString}`
            },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: process.env.SPOTIFY_REFRESH_TOKEN
            })
        });

        const tokenData = await tokenResponse.json();
        if (!tokenResponse.ok) {
            return res.status(500).json({ error: "Failed to refresh token", details: tokenData });
        }

        const accessToken = tokenData.access_token;

        // 2️⃣ Use New Access Token to Fetch Currently Playing Song
        const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        const data = await response.json();

        // 3️⃣ Handle Errors if No Song is Playing
        if (!data || data.error || !data.item) {
            return res.status(404).json({ error: "No song is currently playing." });
        }

        // 4️⃣ Return JSON Response with Song Info
        res.status(200).json({
            track: data.item.name,
            artist: data.item.artists.map(artist => artist.name).join(", "),
            album: data.item.album.name,
            url: data.item.external_urls.spotify
        });

    } catch (error) {
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
}
