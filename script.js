let recyclingCenters = [
    {
        name: "New London Transfer Station",
        address: "80 Shaw St, New London, CT",
        materials: "Plastic, Metal, Glass, Paper",
        lat: 41.3550,
        lng: -72.0995
    },
    {
        name: "ConnPost Recycling Center",
        address: "50 Mechanic St, New London, CT",
        materials: "Electronics, Plastic, Paper",
        lat: 41.3501,
        lng: -72.0998
    },
    {
        name: "South Park Recycling Drop-off",
        address: "100 South Park Blvd, New London, CT",
        materials: "Plastic, Glass",
        lat: 41.3525,
        lng: -72.1015
    }
];

let map;
let markers = [];

function initMap() {
    map = L.map('map').setView([41.3520, -72.0995], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(map);

    markers.forEach(marker => map.removeLayer(marker));
    markers = [];

    const locationList = document.getElementById("location-list");
    locationList.innerHTML = "";

    recyclingCenters.forEach((center) => {
        const popupContent = `
            <h3>${center.name}</h3>
            <p>${center.address}</p>
            <p><strong>Materials:</strong> ${center.materials}</p>
        `;

        const marker = L.marker([center.lat, center.lng])
            .addTo(map)
            .bindPopup(popupContent);

        markers.push(marker);

        const li = document.createElement("li");
        li.innerHTML = `
            <strong>${center.name}</strong>
            ${center.address}
            <em>♻️ ${center.materials}</em>
        `;

        li.addEventListener("click", () => {
            map.setView([center.lat, center.lng], 16);
            marker.openPopup();

            document.querySelectorAll('#location-list li').forEach(item => {
                item.style.backgroundColor = '';
                item.style.borderColor = '';
            });
            li.style.backgroundColor = '#e0f2ff';
            li.style.borderColor = 'var(--primary)';
        });

        locationList.appendChild(li);
    });

    setTimeout(() => {
        map.invalidateSize();
    }, 100);
}

document.getElementById("search-btn").addEventListener("click", () => {
    const town = document.getElementById("town-input").value.trim();

    if (town === "") {
        alert("Please enter a town.");
        return;
    }

    document.getElementById("landing-screen").style.display = "none";
    document.getElementById("main-content").style.display = "flex";
    document.getElementById("map-title").textContent = `${town} Recycling Centers`;

    initMap();
});

document.getElementById("town-input").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        document.getElementById("search-btn").click();
    }
});
