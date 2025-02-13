import { Octokit } from "@octokit/rest";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

export default async function handler(req, res) {
  try {
    const spotifyToken = process.env.SPOTIFY_TOKEN;
    const githubToken = process.env.PERSONAL_ACCESS_TOKEN;

    if (!spotifyToken || !githubToken) {
      return res.status(500).json({ error: "Missing API credentials" });
    }

    // Fetch Top Tracks
    const fetchWebApi = async (endpoint, method) => {
      const response = await fetch(`https://api.spotify.com/${endpoint}`, {
        headers: { Authorization: `Bearer ${spotifyToken}` },
        method
      });
      return await response.json();
    };

    const tracks = await fetchWebApi("v1/me/top/tracks?time_range=short_term&limit=5", "GET");

    if (!tracks || !tracks.items) {
      return res.status(500).json({ error: "Spotify API Error", response: tracks });
    }

    const trackList = tracks.items.map(
      ({ name, artists }) => `🎵 ${name} by ${artists.map(a => a.name).join(", ")}`
    ).join("\n");

    const octokit = new Octokit({ auth: githubToken });

    const { data: readmeData } = await octokit.repos.getContent({
      owner: "Owono2001",
      repo: "Owono2001",
      path: "README.md"
    });

    const sha = readmeData.sha;

    await octokit.repos.createOrUpdateFileContents({
      owner: "Owono2001",
      repo: "Owono2001",
      path: "README.md",
      message: "🔄 Updated Spotify Now Playing",
      content: Buffer.from(trackList).toString("base64"),
      sha
    });

    res.status(200).json({ success: true, message: "README updated successfully!" });

  } catch (error) {
    console.error("❌ Error updating README:", error);
    res.status(500).json({ error: "Failed to update README", details: error.message });
  }
}
