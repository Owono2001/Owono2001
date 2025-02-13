import { Octokit } from "@octokit/rest";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

const githubToken = process.env.PERSONAL_ACCESS_TOKEN;
const spotifyToken = process.env.SPOTIFY_TOKEN;

// Debugging: Log the GitHub Token Status
console.log("GitHub Token:", githubToken ? "Loaded Successfully" : "Not Found");

// Spotify API Fetch Function
async function fetchWebApi(endpoint, method, body) {
  try {
    const res = await fetch(`https://api.spotify.com/${endpoint}`, {
      headers: { Authorization: `Bearer ${spotifyToken}`, "Content-Type": "application/json" },
      method,
      body: body ? JSON.stringify(body) : null,
    });

    if (!res.ok) {
      console.error(`❌ Spotify API Error: ${res.status} ${res.statusText}`);
      return null;
    }

    return await res.json();
  } catch (error) {
    console.error("❌ Error fetching from Spotify API:", error);
    return null;
  }
}

// Fetch Top Tracks
async function getTopTracks() {
  console.log("🎵 Fetching top tracks from Spotify...");
  const tracks = await fetchWebApi(
    "v1/me/top/tracks?time_range=short_term&limit=5",
    "GET"
  );

  console.log("Spotify API Response:", tracks);

  if (!tracks || !tracks.items) {
    console.error("⚠️ Error: Spotify API did not return expected data!");
    return ["⚠️ Error fetching top tracks"];
  }

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
  const playlistId = "1ovl1EfATYpVidXAP4d0nH"; // ✅ Your Spotify Playlist ID
  const embedCode = `<iframe src="https://open.spotify.com/embed/playlist/${playlistId}" width="80%" height="360" frameborder="0" allow="encrypted-media"></iframe>`;

  console.log("🔄 Fetching README.md from GitHub...");
  try {
    const { data: readmeData } = await octokit.repos.getContent({
      owner: "Owono2001",
      repo: "Owono2001",
      path: "README.md",
    });

    console.log("✅ README.md found!");
    const sha = readmeData.sha;

    let content = Buffer.from(readmeData.content, 'base64').toString("utf8");
    content = content
      .replace(/<!-- TOP_TRACKS_START -->[\s\S]*<!-- TOP_TRACKS_END -->/, 
        `<!-- TOP_TRACKS_START -->\n${trackList}\n<!-- TOP_TRACKS_END -->`)
      .replace(/<!-- PLAYLIST_EMBED_START -->[\s\S]*<!-- PLAYLIST_EMBED_END -->/,
        `<!-- PLAYLIST_EMBED_START -->\n${embedCode}\n<!-- PLAYLIST_EMBED_END -->`);

    await octokit.repos.createOrUpdateFileContents({
      owner: "Owono2001",
      repo: "Owono2001",
      path: "README.md",
      message: "🔄 Updated Spotify Now Playing",
      content: Buffer.from(content).toString("base64"),
      sha,
    });

    console.log("✅ README updated successfully!");
  } catch (error) {
    console.error("❌ Error: README.md not found or cannot be accessed!", error);
  }
}

updateReadme();
