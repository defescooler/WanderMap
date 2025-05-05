# 🌍 WanderMap

A lightweight full‑stack app for logging your trips on an interactive world map and replaying them as a travel feed.

---

## Live demo

https://youtu.be/LlmEwdIJOAQ
---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or newer) and **npm**  
- **Git**

Verify installations:

```bash
node --version   # >=16.x
npm --version    # >=8.x
git --version


Installation & Run

1. Clone the repo

git clone https://github.com/defescooler/WanderMap.git
cd WanderMap

2. Configure the backend

cd server
cp .env.example .env
Open server/.env and replace the placeholder:

3. MAPBOX_TOKEN=pk.*************************************
PORT=4000
with your actual Mapbox token from https://account.mapbox.com/.

4. Install backend dependencies
npm install

5. Start the backend server
npm run dev

You should see:
✔ WanderMap API running on port 4000

6. Open the frontend
In your browser, navigate to:
http://localhost:4000

The Express server serves the static client/ files automatically—no build step needed.
