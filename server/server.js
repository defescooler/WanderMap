import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import { nanoid } from "nanoid";
import fetch from "node-fetch";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ─── LowDB setup ────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbFile = new JSONFile(join(__dirname, "db.json"));
const defaultData = { trips: [] };
const db = new Low(dbFile, defaultData);
await db.read();

// ─── Helpers ────────────────────────────────────────────────────────
const byDate = (a, b) => new Date(a.date) - new Date(b.date);

// ─── Routes ─────────────────────────────────────────────────────────
// GET all trips for a user
app.get("/api/trips", async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "userId required" });
  
  const trips = (db.data.trips || [])
    .filter(t => t.userId === userId)
    .sort(byDate);
  
  res.json(trips);
});

// POST a new trip
app.post("/api/trips", async (req, res) => {
  const { userId, place, date, note, lat, lng } = req.body;
  
  if (!userId || !place || !date) {
    return res.status(400).json({ error: "userId, place, date required" });
  }
  
  const trip = { 
    id: nanoid(), 
    userId, 
    place, 
    date, 
    note, 
    lat: parseFloat(lat), 
    lng: parseFloat(lng),
    createdAt: new Date().toISOString()
  };
  
  db.data.trips.push(trip);
  await db.write();
  
  res.status(201).json(trip);
});

// PUT (edit) an existing trip
app.put("/api/trips/:id", async (req, res) => {
  const { id } = req.params;
  const idx = db.data.trips.findIndex(t => t.id === id);
  
  if (idx === -1) return res.status(404).json({ error: "trip not found" });
  
  const updatedTrip = { 
    ...db.data.trips[idx], 
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  
  // Convert lat/lng to numbers if present
  if (req.body.lat) updatedTrip.lat = parseFloat(req.body.lat);
  if (req.body.lng) updatedTrip.lng = parseFloat(req.body.lng);
  
  db.data.trips[idx] = updatedTrip;
  await db.write();
  
  res.json(updatedTrip);
});

// Geocoding autocomplete proxy
app.get("/api/autocomplete", async (req, res) => {
  const { q } = req.query;
  if (!q) return res.json([]);
  
  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?types=country,place&access_token=${process.env.MAPBOX_TOKEN}&limit=5`;
    const mbRes = await fetch(url);
    
    if (!mbRes.ok) {
      throw new Error(`Mapbox API error: ${mbRes.status}`);
    }
    
    const data = await mbRes.json();
    
    const suggestions = data.features.map(f => ({
      place: f.place_name,
      lat: f.center[1],
      lng: f.center[0]
    }));
    
    res.json(suggestions);
  } catch (error) {
    console.error("Geocoding error:", error);
    res.status(500).json({ error: "Geocoding service unavailable" });
  }
});

// Serve the client
app.use(express.static(join(__dirname, "..", "client")));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✔ WanderMap API running on port ${PORT}`);
});
