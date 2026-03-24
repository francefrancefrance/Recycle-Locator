let recyclingCenters = [];
let map;
let markers = [];
let currentUser = null;
let users = JSON.parse(localStorage.getItem("users")) || [];

// DOM Elements
const authScreen = document.getElementById("auth-screen");
const townScreen = document.getElementById("town-screen");
const mainContent = document.getElementById("main-content");

// Initialize
document.addEventListener("DOMContentLoaded", () => {
    initAuthTabs();
    initForms();
    initTownSearch();
    initQuickTowns();
    initProfile();
});

// Auth Tabs
function initAuthTabs() {
    const tabs = document.querySelectorAll(".tab-btn");
    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            tabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            
            const formId = tab.dataset.tab === "login" ? "login-form" : "signup-form";
            document.querySelectorAll(".auth-form").forEach(f => f.classList.remove("active"));
            document.getElementById(formId).classList.add("active");
        });
    });
}

// Forms
function initForms() {
    document.getElementById("login-form").addEventListener("submit", handleLogin);
    document.getElementById("signup-form").addEventListener("submit", handleSignup);
    document.getElementById("logout-btn").addEventListener("click", logout);
    document.getElementById("back-to-town").addEventListener("click", () => showScreen("town-screen"));
}

function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById("login-username").value.trim();
    const password = document.getElementById("login-password").value.trim();

    const user = users.find(u => u.username === username && u.password === password);
    
    if (!user) {
        showToast("Invalid username or password", "error");
        return;
    }

    currentUser = user;
    showScreen("town-screen");
    document.getElementById("user-display").textContent = username;
    showToast(`Welcome back, ${username}!`, "success");
}

function handleSignup(e) {
    e.preventDefault();
    const username = document.getElementById("signup-username").value.trim();
    const password = document.getElementById("signup-password").value.trim();

    if (!username || !password) {
        showToast("Please fill in all fields", "error");
        return;
    }

    if (users.find(u => u.username === username)) {
        showToast("Username already exists", "error");
        return;
    }

    users.push({ username, password, savedCenters: [] });
    localStorage.setItem("users", JSON.stringify(users));
    
    showToast("Account created! Please sign in", "success");
    
    // Switch to login tab
    document.querySelector('[data-tab="login"]').click();
    document.getElementById("login-username").value = username;
}

function logout() {
    currentUser = null;
    showScreen("auth-screen");
    document.getElementById("login-form").reset();
    document.getElementById("signup-form").reset();
}

// Screen Management
function showScreen(screenId) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    document.getElementById(screenId).classList.add("active");
}

// Town Search with Autocomplete
function initTownSearch() {
    const input = document.getElementById("town-input");
    const suggestions = document.getElementById("town-suggestions");
    const searchBtn = document.getElementById("search-btn");

    input.addEventListener("input", (e) => {
        const value = e.target.value.toLowerCase();
        if (value.length < 2) {
            suggestions.classList.remove("active");
            return;
        }

        const matches = connecticutTowns.filter(town => 
            town.toLowerCase().includes(value)
        ).slice(0, 5);

        if (matches.length > 0) {
            suggestions.innerHTML = matches.map(town => `
                <div class="suggestion-item" data-town="${town}">${town}</div>
            `).join("");
            suggestions.classList.add("active");

            suggestions.querySelectorAll(".suggestion-item").forEach(item => {
                item.addEventListener("click", () => {
                    input.value = item.dataset.town;
                    suggestions.classList.remove("active");
                    searchTown(item.dataset.town);
                });
            });
        } else {
            suggestions.classList.remove("active");
        }
    });

    input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") searchTown(input.value);
    });

    searchBtn.addEventListener("click", () => searchTown(input.value));

    // Close suggestions on click outside
    document.addEventListener("click", (e) => {
        if (!e.target.closest(".search-box")) {
            suggestions.classList.remove("active");
        }
    });
}

function initQuickTowns() {
    document.querySelectorAll(".town-chip").forEach(chip => {
        chip.addEventListener("click", () => {
            document.getElementById("town-input").value = chip.dataset.town;
            searchTown(chip.dataset.town);
        });
    });
}

// Profile Functions
function initProfile() {
    // Profile navigation
    document.getElementById("profile-btn").addEventListener("click", openProfile);
    document.getElementById("map-profile-btn").addEventListener("click", openProfile);
    document.getElementById("back-from-profile").addEventListener("click", () => {
        showScreen("town-screen");
    });
    document.getElementById("logout-from-profile").addEventListener("click", logout);
    
    // Clear all saved
    document.getElementById("clear-all-saved").addEventListener("click", () => {
        if (currentUser.savedCenters.length === 0) return;
        
        if (confirm("Are you sure you want to remove all saved centers?")) {
            currentUser.savedCenters = [];
            localStorage.setItem("users", JSON.stringify(users));
            renderSavedCenters();
            showToast("All saved centers cleared", "success");
        }
    });
    
    // Delete account
    document.getElementById("delete-account").addEventListener("click", () => {
        if (confirm("Are you sure you want to delete your account? This cannot be undone.")) {
            users = users.filter(u => u.username !== currentUser.username);
            localStorage.setItem("users", JSON.stringify(users));
            currentUser = null;
            showToast("Account deleted", "success");
            showScreen("auth-screen");
        }
    });
}

function openProfile() {
    if (!currentUser) return;
    
    document.getElementById("profile-username").textContent = currentUser.username;
    document.getElementById("profile-stats").textContent = 
        `${currentUser.savedCenters.length} saved center${currentUser.savedCenters.length !== 1 ? 's' : ''}`;
    
    renderSavedCenters();
    showScreen("profile-screen");
}

function renderSavedCenters() {
    const list = document.getElementById("saved-list");
    const emptyState = document.getElementById("no-saved-message");
    const clearBtn = document.getElementById("clear-all-saved");
    
    list.innerHTML = "";
    
    if (currentUser.savedCenters.length === 0) {
        list.style.display = "none";
        emptyState.classList.add("active");
        clearBtn.style.display = "none";
        return;
    }
    
    list.style.display = "flex";
    emptyState.classList.remove("active");
    clearBtn.style.display = "block";
    
    currentUser.savedCenters.forEach((savedCenter, index) => {
        const item = document.createElement("div");
        item.className = "saved-item";
        
        const centerData = typeof savedCenter === 'object' ? savedCenter : {
            name: savedCenter,
            address: "Connecticut",
            materials: ["Various"],
            lat: null,
            lng: null,
            town: null
        };
        
        item.innerHTML = `
            <div class="saved-icon">
                <i class="fas fa-recycle"></i>
            </div>
            <div class="saved-details">
                <h4>${centerData.name}</h4>
                <p>${centerData.address} • ${Array.isArray(centerData.materials) ? centerData.materials.slice(0, 3).join(", ") : 'Recyclables'}</p>
            </div>
            <div class="saved-actions">
                <button class="btn-icon-small" onclick="viewSavedCenter(${index})" title="View on map">
                    <i class="fas fa-map-marker-alt"></i>
                </button>
                <button class="btn-icon-small" onclick="removeSavedCenter(${index})" title="Remove">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        list.appendChild(item);
    });
}

function findCenterByName(name) {
    const found = recyclingCenters.find(c => c.name === name);
    if (found) return found;
    
    return {
        name: name,
        address: "Connecticut",
        materials: ["Recyclables"]
    };
}

function removeSavedCenter(index) {
    currentUser.savedCenters.splice(index, 1);
    localStorage.setItem("users", JSON.stringify(users));
    renderSavedCenters();
    
    document.getElementById("profile-stats").textContent = 
        `${currentUser.savedCenters.length} saved center${currentUser.savedCenters.length !== 1 ? 's' : ''}`;
    
    showToast("Removed from saved", "success");
}

function viewSavedCenter(index) {
    const savedCenter = currentUser.savedCenters[index];
    const centerData = typeof savedCenter === 'object' ? savedCenter : null;
    
    if (!centerData || !centerData.lat || !centerData.lng) {
        const found = recyclingCenters.find(c => c.name === (centerData?.name || savedCenter));
        if (found) {
            navigateToMapAndShowPin(found);
        } else {
            if (centerData?.town) {
                showToast("Loading location...", "success");
                reloadTownAndShowPin(centerData.town, centerData.name);
            } else {
                showToast("Location details not available. Please search for the town again.", "error");
            }
        }
    } else {
        navigateToMapAndShowPin(centerData);
    }
}

function navigateToMapAndShowPin(center) {
    // Switch to main content screen
    showScreen("main-content");
    
    // Ensure map is initialized
    if (!map) {
        recyclingCenters = [center];
        initMap();
    } else {
        map.setView([center.lat, center.lng], 16);
        
        // Try to find existing marker
        let marker = markers.find(m => {
            const pos = m.getLatLng();
            return Math.abs(pos.lat - center.lat) < 0.0001 && Math.abs(pos.lng - center.lng) < 0.0001;
        });
        
        // If no marker exists, create one temporarily
        if (!marker) {
            marker = L.marker([center.lat, center.lng])
                .addTo(map)
                .bindPopup(`
                    <div class="popup-title">${center.name}</div>
                    <div class="popup-address">${center.address}</div>
                    <div class="popup-materials">
                        ${center.materials.map(m => `<span>${m}</span>`).join("")}
                    </div>
                `);
        }
        
        marker.openPopup();
    }
    
    if (center.town) {
        document.getElementById("map-title").textContent = `${center.town} Recycling Centers`;
    }
    
    if (currentUser) {
        document.getElementById("map-user-display").textContent = currentUser.username;
    }
}

async function reloadTownAndShowPin(town, centerName) {
    // Reload the town data
    await loadTownData(town);
    r
    const index = recyclingCenters.findIndex(c => c.name === centerName);
    if (index !== -1) {
        highlightLocation(index);
    } else {
        showToast("Could not locate that specific center", "error");
    }
}

// All 169 Connecticut Towns
const connecticutTowns = [
    "Andover", "Ansonia", "Ashford", "Avon", "Barkhamsted", "Beacon Falls", "Berlin",
    "Bethany", "Bethel", "Bethlehem", "Bloomfield", "Bolton", "Bozrah", "Branford",
    "Bridgeport", "Bridgewater", "Bristol", "Brookfield", "Brooklyn", "Burlington",
    "Canaan", "Canterbury", "Canton", "Chaplin", "Cheshire", "Chester", "Clinton",
    "Colchester", "Colebrook", "Columbia", "Cornwall", "Coventry", "Cromwell", "Danbury",
    "Darien", "Deep River", "Derby", "Durham", "East Granby", "East Haddam",
    "East Hampton", "East Hartford", "East Haven", "East Lyme", "East Windsor",
    "Eastford", "Easton", "Ellington", "Enfield", "Essex", "Fairfield", "Farmington",
    "Franklin", "Glastonbury", "Goshen", "Granby", "Greenwich", "Griswold", "Groton",
    "Guilford", "Haddam", "Hamden", "Hampton", "Hartford", "Hartland", "Harwinton",
    "Hebron", "Killingly", "Killingworth", "Lebanon", "Ledyard", "Lisbon", "Litchfield",
    "Lyme", "Madison", "Manchester", "Mansfield", "Marlborough", "Meriden", "Middlebury",
    "Middlefield", "Middletown", "Milford", "Monroe", "Montville", "Morris", "Naugatuck",
    "New Britain", "New Canaan", "New Fairfield", "New Hartford", "New Haven",
    "New London", "New Milford", "Newington", "Newtown", "Norfolk", "North Branford",
    "North Canaan", "North Haven", "North Stonington", "Norwalk", "Norwich", "Old Lyme",
    "Old Saybrook", "Orange", "Oxford", "Plainfield", "Plainville", "Plymouth",
    "Pomfret", "Portland", "Preston", "Prospect", "Putnam", "Redding", "Ridgefield",
    "Rocky Hill", "Roxbury", "Salem", "Salisbury", "Scotland", "Seymour", "Sharon",
    "Shelton", "Sherman", "Simsbury", "Somers", "South Windsor", "Southbury",
    "Southington", "Sprague", "Stafford", "Stamford", "Sterling", "Stonington",
    "Stratford", "Suffield", "Thomaston", "Thompson", "Tolland", "Torrington",
    "Trumbull", "Union", "Vernon", "Voluntown", "Wallingford", "Warren", "Washington",
    "Waterbury", "Waterford", "Watertown", "West Hartford", "West Haven", "Westbrook",
    "Weston", "Westport", "Wethersfield", "Willington", "Wilton", "Winchester",
    "Windham", "Windsor", "Windsor Locks", "Wolcott", "Woodbridge", "Woodbury",
    "Woodstock"
];

async function searchTown(town) {
    if (!town) return;
    
    const normalizedTown = town.trim();
    const townLower = normalizedTown.toLowerCase();
    
    const found = connecticutTowns.find(t => t.toLowerCase() === townLower);
    
    if (!found) {
        showToast("Please enter a valid Connecticut town", "error");
        return;
    }

    await loadTownData(found);
}

async function fetchRecyclingCentersFromOverpass(town) {
    //Town center coordinates
    const townCoords = await getTownCoords(town);
    if (!townCoords) {
        throw new Error("Could not locate town center");
    }

    // Search 15km radius
    const radius = 15000;
    
    // Build a comprehensive query that searches by distance from town center
    const query = `
    [out:json][timeout:30];
    (
      // Recycling centers (dedicated facilities)
      node["amenity"="recycling"](around:${radius},${townCoords.lat},${townCoords.lon});
      way["amenity"="recycling"](around:${radius},${townCoords.lat},${townCoords.lon});
      relation["amenity"="recycling"](around:${radius},${townCoords.lat},${townCoords.lon});
      
      // Waste transfer stations (often accept recyclables)
      node["amenity"="waste_transfer_station"](around:${radius},${townCoords.lat},${townCoords.lon});
      way["amenity"="waste_transfer_station"](around:${radius},${townCoords.lat},${townCoords.lon});
      
      // Scrap yards (metal recycling)
      node["industrial"="scrap_yard"](around:${radius},${townCoords.lat},${townCoords.lon});
      way["industrial"="scrap_yard"](around:${radius},${townCoords.lat},${townCoords.lon});
      
      // Landfills and dumps (often have recycling areas)
      node["landuse"="landfill"](around:${radius},${townCoords.lat},${townCoords.lon});
      way["landuse"="landfill"](around:${radius},${townCoords.lat},${townCoords.lon});
      node["amenity"="waste_disposal"](around:${radius},${townCoords.lat},${townCoords.lon});
      way["amenity"="waste_disposal"](around:${radius},${townCoords.lat},${townCoords.lon});
    );
    out tags center;
    `;

    const url = "https://overpass-api.de/api/interpreter";

    try {
        const response = await fetch(url, {
            method: "POST",
            body: query
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Process and deduplicate results
        const centers = new Map();
        
        data.elements.forEach(el => {
            const tags = el.tags || {};
            const lat = el.lat || el.center?.lat;
            const lon = el.lon || el.center?.lon;
            
            if (!lat || !lon) return;
            
            // Create unique key based on name & coordinates
            const key = `${tags.name || 'unnamed'}_${lat.toFixed(3)}_${lon.toFixed(3)}`;
            
            if (centers.has(key)) return;
            
            // Determine type and materials
            const { type, materials } = categorizeRecyclingType(tags);
            
            // Calculate distance from town center
            const distance = calculateDistance(
                townCoords.lat, townCoords.lon,
                lat, lon
            );
            
            centers.set(key, {
                name: tags.name || generateName(tags, type),
                address: formatAddress(tags, town),
                materials: materials,
                lat: lat,
                lng: lon,
                distance: distance,
                type: type,
                phone: tags.phone || tags["contact:phone"] || null,
                website: tags.website || tags["contact:website"] || null,
                openingHours: tags.opening_hours || null,
                town: town // Store which town this belongs to
            });
        });

        // Convert to array and sort by distance
        const results = Array.from(centers.values())
            .sort((a, b) => a.distance - b.distance);
        
        // Limit to 20 closest results 
        return results.slice(0, 20);

    } catch (error) {
        console.error("Overpass API error:", error);
    }
}

// Categorize the type of recycling facility and extract materials
function categorizeRecyclingType(tags) {
    let type = "Recycling Center";
    let materials = [];
    
    // Check for specific amenity types
    if (tags.amenity === "waste_transfer_station") {
        type = "Transfer Station";
    } else if (tags.industrial === "scrap_yard") {
        type = "Scrap Yard";
        materials = ["Metal", "Copper", "Aluminum", "Steel"];
    } else if (tags.landuse === "landfill") {
        type = "Landfill & Recycling";
    } else if (tags.amenity === "waste_disposal") {
        type = "Waste Disposal";
    }
    
    // Extract materials from recycling:* tags
    if (tags.recycling) {
        const mats = tags.recycling.split(";").map(m => m.trim());
        materials = mats.map(m => m.charAt(0).toUpperCase() + m.slice(1));
    }
    
    // Check for specific recycling tags
    const recyclingKeys = Object.keys(tags).filter(k => k.startsWith("recycling:") && tags[k] === "yes");
    if (recyclingKeys.length > 0) {
        materials = recyclingKeys.map(k => {
            const material = k.replace("recycling:", "").replace(/_/g, " ");
            return material.charAt(0).toUpperCase() + material.slice(1);
        });
    }
    
    // Default materials if none specified
    if (materials.length === 0) {
        materials = ["Mixed Recyclables", "Paper", "Plastic", "Glass"];
    }
    
    return { type, materials };
}

// Generate a descriptive name if none exists
function generateName(tags, type) {
    if (tags.operator) {
        return `${tags.operator} ${type}`;
    }
    if (tags.amenity === "waste_transfer_station") {
        return "Transfer Station";
    }
    if (tags.industrial === "scrap_yard") {
        return "Scrap Metal Recycling";
    }
    return type;
}

// Format address from OSM tags
function formatAddress(tags, town) {
    const parts = [];
    if (tags["addr:housenumber"]) parts.push(tags["addr:housenumber"]);
    if (tags["addr:street"]) parts.push(tags["addr:street"]);
    if (parts.length === 0 && tags["addr:place"]) parts.push(tags["addr:place"]);
    
    const street = parts.join(" ");
    if (street) {
        return `${street}, ${town}, CT`;
    }
    return `${town}, CT`;
}

// Calculate distance between two coordinates in km 
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

async function getTownCoords(town) {
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(town + ', Connecticut')}`);
        const data = await res.json();

        if (!data.length) return null;

        return {
            lat: parseFloat(data[0].lat),
            lon: parseFloat(data[0].lon)
        };
    } catch (error) {
        console.error("Geocoding error:", error);
        return null;
    }
}

async function loadTownData(town) {
    try {
        showToast("Loading recycling data...", "success");

        recyclingCenters = await fetchRecyclingCentersFromOverpass(town);

        if (!recyclingCenters.length) {
            const townCoords = await getTownCoords(town);
            if (townCoords) {
                recyclingCenters = generateFallbackCenters(town, townCoords);
                showToast("Showing nearby facilities", "info");
            } else {
                showToast("No recycling centers found for this town", "error");
                return;
            }
        }

        document.getElementById("map-title").textContent = `${town} Recycling Centers`;
        document.getElementById("map-user-display").textContent = currentUser.username;

        showScreen("main-content");
        initMap();
        renderLocationList();

    } catch (error) {
        console.error(error);
        showToast("Error loading recycling data", "error");
    }
}

function initMap() {
    if (map) map.remove();

    map = L.map("map").setView(
        [recyclingCenters[0].lat, recyclingCenters[0].lng],
        13
    );

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors"
    }).addTo(map);

    markers = [];
    
    recyclingCenters.forEach((center, index) => {
        const marker = L.marker([center.lat, center.lng])
            .addTo(map)
            .bindPopup(`
                <div class="popup-title">${center.name}</div>
                <div class="popup-address">${center.address}</div>
                <div style="font-size: 12px; color: #64748b; margin-bottom: 8px;">
                    ${center.distance ? `~${center.distance.toFixed(1)} km away` : ''}
                </div>
                <div class="popup-materials">
                    ${center.materials.map(m => `<span>${m}</span>`).join("")}
                </div>
            `);
        
        marker.on("click", () => highlightLocation(index));
        markers.push(marker);
    });

    // Fit bounds to show all markers
    if (markers.length > 1) {
        const group = new L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.1));
    }

    setTimeout(() => map.invalidateSize(), 100);
}

function renderLocationList() {
    const list = document.getElementById("location-list");
    const count = document.getElementById("result-count");
    
    count.textContent = `${recyclingCenters.length} found`;
    list.innerHTML = "";

    recyclingCenters.forEach((center, index) => {
        const item = document.createElement("div");
        item.className = "location-item";
        
        // Add distance badge if available
        const distanceBadge = center.distance ? 
            `<span style="float: right; font-size: 12px; color: #059669; font-weight: 600;">${center.distance.toFixed(1)} km</span>` : '';
        
        item.innerHTML = `
            <h4>${center.name} ${distanceBadge}</h4>
            <div class="address">${center.address}</div>
            <div style="font-size: 12px; color: #64748b; margin-bottom: 8px;">
                <i class="fas fa-map-marker-alt"></i> ${center.type || 'Recycling Center'}
            </div>
            <div class="materials">
                ${center.materials.map(m => `<span class="material-tag">${m}</span>`).join("")}
            </div>
            <div class="actions">
                <button class="btn-save" onclick="toggleSave(this, '${center.name.replace(/'/g, "\\'")}', ${index})">
                    <i class="far fa-bookmark"></i>
                    <span>Save</span>
                </button>
            </div>
        `;
        
        item.addEventListener("click", (e) => {
            if (!e.target.closest(".btn-save")) {
                highlightLocation(index);
            }
        });
        
        list.appendChild(item);
    });
}

function highlightLocation(index) {
    document.querySelectorAll(".location-item").forEach((item, i) => {
        item.classList.toggle("active", i === index);
    });
    
    const center = recyclingCenters[index];
    map.setView([center.lat, center.lng], 16);
    markers[index].openPopup();
}

function toggleSave(btn, centerName, centerIndex) {
    const isSaved = btn.classList.contains("saved");
    
    if (isSaved) {
        btn.classList.remove("saved");
        btn.innerHTML = '<i class="far fa-bookmark"></i><span>Save</span>';
        
        currentUser.savedCenters = currentUser.savedCenters.filter(c => {
            const savedName = typeof c === 'object' ? c.name : c;
            return savedName !== centerName;
        });
        
        showToast("Removed from saved", "success");
    } else {
        btn.classList.add("saved");
        btn.innerHTML = '<i class="fas fa-bookmark"></i><span>Saved</span>';
        
        // Get the full center data
        const centerData = recyclingCenters[centerIndex];
        
        // Store complete object with all necessary data for later viewing
        const savedData = {
            name: centerData.name,
            address: centerData.address,
            materials: centerData.materials,
            lat: centerData.lat,
            lng: centerData.lng,
            town: centerData.town || document.getElementById("map-title").textContent.replace(" Recycling Centers", ""),
            type: centerData.type || "Recycling Center"
        };
        
        currentUser.savedCenters.push(savedData);
        showToast("Location saved!", "success");
    }
    
    localStorage.setItem("users", JSON.stringify(users));
    
    // Update profile view if it's currently open
    if (document.getElementById("profile-screen").classList.contains("active")) {
        renderSavedCenters();
        document.getElementById("profile-stats").textContent = 
            `${currentUser.savedCenters.length} saved center${currentUser.savedCenters.length !== 1 ? 's' : ''}`;
    }
}

// Toast Notifications
function showToast(message, type = "success") {
    const existing = document.querySelector(".toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add("show"), 10);
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
