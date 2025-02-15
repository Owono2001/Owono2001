import fetch from 'node-fetch';

export default async function handler(req, res) {
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const tokenUrl = "https://accounts.spotify.com/api/token";

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken
    })
  });

  const { access_token } = await response.json();

  const nowPlayingUrl = "https://api.spotify.com/v1/me/player/currently-playing";

  const nowPlayingResponse = await fetch(nowPlayingUrl, {
    headers: { Authorization: `Bearer ${access_token}` }
  });

  if (nowPlayingResponse.status === 204 || nowPlayingResponse.status > 400) {
    return res.status(200).json({ isPlaying: false });
  }

  const nowPlaying = await nowPlayingResponse.json();

  res.status(200).json({
    isPlaying: true,
    song: nowPlaying.item.name,
    artist: nowPlaying.item.artists.map(artist => artist.name).join(", "),
    album: nowPlaying.item.album.name,
    albumImageUrl: nowPlaying.item.album.images[0].url,
    songUrl: nowPlaying.item.external_urls.spotify
  });
}