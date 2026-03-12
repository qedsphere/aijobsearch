import express from "express";
import { createServer as createViteServer } from "vite";
import https from "https";
import http from "http";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/check-url", async (req, res) => {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ valid: false, error: "No URL provided" });
    }

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5"
        },
        signal: AbortSignal.timeout(8000)
      });

      if (!response.ok) {
        return res.json({ valid: false, statusCode: response.status });
      }

      const html = await response.text();
      const lowerHtml = html.toLowerCase();
      
      // Check for negative keywords indicating a dead link
      const negativeKeywords = [
        "page not found",
        "job not found",
        "sorry, no job openings",
        "no longer available",
        "position has been filled",
        "404 not found",
        "this job is closed",
        "no longer accepting applications"
      ];

      const isDeadLink = negativeKeywords.some(keyword => lowerHtml.includes(keyword));

      if (isDeadLink) {
        return res.json({ valid: false, statusCode: response.status, reason: "Dead link keywords found" });
      }
      
      // Check for keywords indicating an active job posting
      const hasApplyButton = 
        lowerHtml.includes('apply') || 
        lowerHtml.includes('submit') || 
        lowerHtml.includes('application') ||
        lowerHtml.includes('join') ||
        lowerHtml.includes('careers');

      res.json({ valid: hasApplyButton, statusCode: response.status });
    } catch (error: any) {
      res.json({ valid: false, error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
