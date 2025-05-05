/* global L */

const API = window.location.hostname === "localhost" 
  ? "http://localhost:4000/api" 
  : "/api";

// Session initialization
let userId = localStorage.getItem("wanderUserId");
let nickname = localStorage.getItem("wanderNickname");

async function initSession() {
  if (!nickname) {
    nickname = prompt("Welcome! Choose a nickname:");
    if (!nickname) nickname = "Traveler"; // Default if user cancels
  }
  
  if (!userId) {
    userId = crypto.randomUUID();
  }
  
  localStorage.setItem("wanderUserId", userId);
  localStorage.setItem("wanderNickname", nickname);
  document.getElementById("nick").textContent = nickname;
}

// Map initialization
let map;

function initMap() {
  map = L.map("map").setView([20, 0], 2);
  
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors"
  }).addTo(map);
  
  map.on("click", e => openModal({ lat: e.latlng.lat, lng: e.latlng.lng }));
}

// Modal & Form handling
const modal = document.getElementById("tripModal");
const form = document.getElementById("tripForm");
const placeInput = document.getElementById("placeInput");
const dateInput = document.getElementById("dateInput");
const noteInput = document.getElementById("noteInput");
const latInput = document.getElementById("latInput");
const lngInput = document.getElementById("lngInput");
const suggList = document.getElementById("suggestions");
const cancelBtn = document.getElementById("cancelBtn");
let editId = null;

function openModal({ lat, lng, trip } = {}) {
  editId = trip?.id || null;
  document.getElementById("modalTitle").textContent = trip ? "Edit Trip" : "Add Trip";
  
  placeInput.value = trip?.place || "";
  dateInput.value = trip?.date || "";
  noteInput.value = trip?.note || "";
  latInput.value = trip?.lat || lat;
  lngInput.value = trip?.lng || lng;
  
  modal.showModal();
}

cancelBtn.addEventListener("click", () => {
  modal.close();
  suggList.innerHTML = "";
});

modal.addEventListener("close", () => {
  suggList.innerHTML = "";
});

// Autocomplete
let debounce;
placeInput.addEventListener("input", () => {
  clearTimeout(debounce);
  debounce = setTimeout(async () => {
    const q = placeInput.value.trim();
    if (!q) return (suggList.innerHTML = "");
    
    try {
      const res = await fetch(`${API}/autocomplete?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      
      suggList.innerHTML = "";
      data.forEach(s => {
        const li = document.createElement("li");
        li.textContent = s.place;
        li.onclick = () => {
          placeInput.value = s.place;
          latInput.value = s.lat;
          lngInput.value = s.lng;
          suggList.innerHTML = "";
        };
        suggList.appendChild(li);
      });
    } catch (err) {
      console.error("Autocomplete error:", err);
    }
  }, 300);
});

// Save trip
form.addEventListener("submit", async e => {
  e.preventDefault();
  
  const payload = {
    userId,
    place: placeInput.value,
    date: dateInput.value,
    note: noteInput.value,
    lat: parseFloat(latInput.value),
    lng: parseFloat(lngInput.value)
  };
  
  try {
    if (editId) {
      await fetch(`${API}/trips/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } else {
      await fetch(`${API}/trips`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    }
    
    modal.close();
    await renderTrips();
  } catch (err) {
    console.error("Error saving trip:", err);
    alert("Failed to save trip. Please try again.");
  }
});

// Render feed & markers
let markers = [];

async function fetchTrips() {
  try {
    const res = await fetch(`${API}/trips?userId=${userId}`);
    return await res.json();
  } catch (err) {
    console.error("Error fetching trips:", err);
    return [];
  }
}

async function renderTrips() {
  const trips = await fetchTrips();
  const ul = document.getElementById("tripList");
  ul.innerHTML = "";
  
  trips.forEach(t => {
    const li = document.createElement("li");
    li.innerHTML = `
      <h4>${t.place}</h4>
      <div class="date">${new Date(t.date).toLocaleDateString()}</div>
      ${t.note ? `<div class="note">${t.note}</div>` : ""}
      <button data-id="${t.id}">✎ Edit</button>
    `;
    ul.appendChild(li);
  });
  
  ul.querySelectorAll("button").forEach(btn => {
    btn.onclick = () => {
      const t = trips.find(x => x.id === btn.dataset.id);
      openModal({ trip: t });
    };
  });
  
  // Clear existing markers
  markers.forEach(m => map.removeLayer(m));
  markers = [];
  
  // Add new markers
  trips
    .filter(t => t.lat && t.lng)
    .forEach(t => {
      const marker = L.marker([t.lat, t.lng])
        .addTo(map)
        .bindPopup(`
          <strong>${t.place}</strong><br>
          ${new Date(t.date).toLocaleDateString()}<br>
          ${t.note || ""}
        `);
      markers.push(marker);
    });
}

// Initialize app
async function initApp() {
  await initSession();
  initMap();
  await renderTrips();
}

// Start the app
initApp();
