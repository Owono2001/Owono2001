import { Octokit } from "@octokit/rest";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

const token = process.env.SPOTIFY_TOKEN;
const githubToken = process.env.GITHUB_TOKEN;

// Spotify API Fetch Function
async function fetchWebApi(endpoint, method, body) {
  const res = await fetch(`https://api.spotify.com/${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
    method,
    body: JSON.stringify(body),
  });
  return await res.json();
}

// Fetch Top Tracks
async function getTopTracks() {
  const tracks = await fetchWebApi(
    "v1/me/top/tracks?time_range=short_term&limit=5",
    "GET"
  );
  return tracks.items.map(
    ({ name, artists }) => `🎵 ${name} by ${artists.map((a) => a.name).join(", ")}`
  ).join("\n");
}

// Update README
async function updateReadme() {
  const octokit = new Octokit({ auth: githubToken });

  // Fetch top tracks
  const trackList = await getTopTracks();

  // Spotify Playlist Embed
  const playlistId = "1ovl1EfATYpVidXAP4d0nH";  // ✅ Use your actual Spotify Playlist ID
  const embedCode = `<iframe src="https://open.spotify.com/embed/playlist/${playlistId}" width="80%" height="360" frameborder="0" allow="encrypted-media"></iframe>`;

  // Read README
  let content = fs.readFileSync("README.md", "utf8");

  // Replace placeholders
  content = content
    .replace(/<!-- TOP_TRACKS_START -->[\s\S]*<!-- TOP_TRACKS_END -->/, 
      `<!-- TOP_TRACKS_START -->\n${trackList}\n<!-- TOP_TRACKS_END -->`)
    .replace(/<!-- PLAYLIST_EMBED_START -->[\s\S]*<!-- PLAYLIST_EMBED_END -->/,
      `<!-- PLAYLIST_EMBED_START -->\n${embedCode}\n<!-- PLAYLIST_EMBED_END -->`);

  fs.writeFileSync("README.md", content);

  // Commit changes
  await octokit.repos.createOrUpdateFileContents({
    owner: "Owono2001",
    repo: "Owono2001",
    path: "README.md",
    message: "🔄 Updated Spotify Now Playing",
    content: Buffer.from(content).toString("base64"),
    sha: await getFileSha("README.md"),
  });
}
updateReadme();
