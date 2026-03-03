let recyclingCenters = [];
let map;
let markers = [];

let users = JSON.parse(localStorage.getItem("users")) || [];
let currentUser = null;

const authScreen = document.getElementById("auth-screen");
const townScreen = document.getElementById("town-screen");
const mainContent = document.getElementById("main-content");

function saveUsers() {
    localStorage.setItem("users", JSON.stringify(users));
}

document.getElementById("signup-btn").addEventListener("click", () => {
    const username = document.getElementById("signup-username").value.trim();
    const password = document.getElementById("signup-password").value.trim();

    if (!username || !password) {
        alert("Enter username and password.");
        return;
    }

    if (users.find(u => u.username === username)) {
        alert("User already exists.");
        return;
    }

    const newUser = {
        username,
        password,
        savedCenters: []
    };

    users.push(newUser);
    saveUsers();

    alert("Account created! You can now log in.");
});

document.getElementById("login-btn").addEventListener("click", () => {
    const username = document.getElementById("login-username").value.trim();
    const password = document.getElementById("login-password").value.trim();

    const user = users.find(u =>
        u.username === username && u.password === password
    );

    if (!user) {
        alert("Invalid login.");
        return;
    }

    currentUser = user;

    authScreen.style.display = "none";
    townScreen.style.display = "flex";

    document.getElementById("user-display").textContent =
        "Logged in as: " + currentUser.username;
});

document.getElementById("back-to-auth").onclick = () => {
    townScreen.style.display = "none";
    authScreen.style.display = "flex";
};

document.getElementById("back-to-town").onclick = () => {
    mainContent.style.display = "none";
    townScreen.style.display = "flex";
};

/* Reliable Connecticut towns API */
async function loadConnecticutTowns() {
    try {
        const response = await fetch(
            "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/data_connecticut_towns.json"
        );
        const data = await response.json();
        return data.map(town => town.toLowerCase());
    } catch (error) {
        return fallbackTowns;
    }
}

/* Backup list if API fails */
const fallbackTowns = [
"anson","ashford","avon","barkhamsted","beacon falls","berlin","bethany","bethel",
"bethlehem","bloomfield","bolton","bozrah","branford","bridgeport","bridgewater",
"bristol","brookfield","brooklyn","burlington","canaan","canterbury","canton",
"chaplin","cheshire","chester","clinton","colchester","colebrook","columbia",
"cornwall","coventry","cromwell","danbury","darien","deep river","derby","durham",
"east granby","east haddam","east hampton","east hartford","east haven",
"east lyme","east windsor","eastford","easton","ellington","enfield","essex",
"fairfield","farmington","franklin","glastonbury","goshen","granby","greenwich",
"griswold","groton","guilford","haddam","hamden","hampton","hartford","hartland",
"harwinton","hebron","killingly","killingworth","lebanon","ledyard","lisbon",
"litchfield","lyme","madison","manchester","mansfield","marlborough","meriden",
"middlebury","middlefield","middletown","milford","monroe","montville","morris",
"naugatuck","new britain","new canaan","new fairfield","new hartford","new haven",
"new london","new milford","newington","newtown","norfolk","north branford",
"north canaan","north haven","north stonington","norwalk","norwich","old lyme",
"old saybrook","orange","oxford","plainfield","plainville","plymouth","pomfret",
"portland","preston","prospect","putnam","redding","ridgefield","rocky hill",
"roxbury","salem","salisbury","scotland","seymour","sharon","shelton","sherman",
"simsbury","somers","south windsor","southbury","southington","sprague","stafford",
"stamford","sterling","stonington","stratford","suffield","thomaston","thompson",
"tolland","torrington","trumbull","union","vernon","voluntown","wallingford",
"warren","washington","waterbury","waterford","watertown","west hartford",
"west haven","westbrook","weston","westport","wethersfield","willington","wilton",
"winchester","windham","windsor","windsor locks","wolcott","woodbridge",
"woodbury","woodstock"
];

async function loadProfiles(town) {
    const response = await fetch("profile.json");
    const data = await response.json();

    const profile = data.profiles.find(p =>
        p.town.toLowerCase() === town.toLowerCase()
    );

    if (!profile) {
        alert("No recycling centers found for this town yet.");
        return;
    }

    recyclingCenters = profile.centers.map(center => ({
        name: center.name,
        address: center.address,
        materials: center.materials.join(", "),
        lat: center.lat,
        lng: center.lng
    }));

    initMap();
}

function initMap() {
    if (map) map.remove();

    map = L.map("map").setView(
        [recyclingCenters[0].lat, recyclingCenters[0].lng],
        14
    );

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

    const locationList = document.getElementById("location-list");
    locationList.innerHTML = "";

    recyclingCenters.forEach(center => {
        const marker = L.marker([center.lat, center.lng]).addTo(map)
        .bindPopup(`<b>${center.name}</b><br>${center.address}<br>${center.materials}`);

        const li = document.createElement("li");
        li.innerHTML = `
        <strong>${center.name}</strong><br>
        ${center.address}<br>
        <em>♻️ ${center.materials}</em>
        `;

        const saveBtn = document.createElement("button");
        saveBtn.textContent = "Save";

        saveBtn.onclick = () => {
            currentUser.savedCenters.push(center.name);
            saveUsers();
            alert("Saved");
        };

        li.appendChild(saveBtn);

        li.onclick = () => {
            map.setView([center.lat, center.lng], 16);
            marker.openPopup();
        };

        locationList.appendChild(li);
    });

    setTimeout(() => map.invalidateSize(), 100);
}

document.getElementById("search-btn").addEventListener("click", async () => {
    if (!currentUser) {
        alert("You must log in first.");
        return;
    }

    const town = document.getElementById("town-input").value.trim().toLowerCase();

    if (!town) {
        alert("Enter a town.");
        return;
    }

    const towns = await loadConnecticutTowns();

    if (!towns.includes(town)) {
        alert("Not a Connecticut town.");
        return;
    }

    townScreen.style.display = "none";
    mainContent.style.display = "flex";

    document.getElementById("map-title").textContent =
        town.charAt(0).toUpperCase() + town.slice(1) + " Recycling Centers";

    loadProfiles(town);
});