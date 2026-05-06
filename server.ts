import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { scrapeHargapangan } from "./scraper.ts";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // In-memory cache for scraped data
  let cachedData: any = null;
  let lastScrapeTime: number = 0;

  // In-memory store for tasks
  let tasks = [
    { id: "1", title: "Cek harga Pasar Gadang", completed: false, priority: "High" },
    { id: "2", title: "Update data Beras Premium", completed: true, priority: "Medium" }
  ];

  app.get("/api/tasks", (req, res) => {
    res.json({ success: true, data: tasks });
  });

  app.post("/api/tasks", express.json(), (req, res) => {
    const { title, priority } = req.body;
    const newTask = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      completed: false,
      priority: priority || "Low"
    };
    tasks.push(newTask);
    res.json({ success: true, data: newTask });
  });

  app.patch("/api/tasks/:id", express.json(), (req, res) => {
    const { id } = req.params;
    const { completed, title, priority } = req.body;
    tasks = tasks.map(t => t.id === id ? { ...t, 
      completed: completed !== undefined ? completed : t.completed,
      title: title || t.title,
      priority: priority || t.priority
    } : t);
    res.json({ success: true });
  });

  app.delete("/api/tasks/:id", (req, res) => {
    const { id } = req.params;
    tasks = tasks.filter(t => t.id !== id);
    res.json({ success: true });
  });

  app.get("/api/prices", async (req, res) => {
    try {
      const region = (req.query.region as string) || "Malang Raya";
      
      // Refresh cache every 5 minutes or if region is different
      // Note: In a real app, you'd cache per region.
      if (!cachedData || Date.now() - lastScrapeTime > 5 * 60 * 1000) {
        console.log(`Fetching fresh data via scraper for ${region}...`);
        cachedData = await scrapeHargapangan(region);
        lastScrapeTime = Date.now();
      }
      res.json({
        success: true,
        data: cachedData,
        lastUpdated: new Date(lastScrapeTime).toISOString()
      });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to scrape data" });
    }
  });

  app.get("/api/stats", (req, res) => {
    res.json({
        ingestedToday: 2842,
        changeFromYesterday: 12.4,
        quotaUsed: 720,
        quotaMax: 1000,
        serverHealth: {
            cpu: 24,
            memory: 512,
            latency: 45
        }
    });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
