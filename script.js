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

function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 41.3550, lng: -72.0995 },
        zoom: 14
    });

    const infoWindow = new google.maps.InfoWindow();

    const locationList = document.getElementById("location-list");
    locationList.innerHTML = "";

    recyclingCenters.forEach(center => {
        const marker = new google.maps.Marker({
            position: { lat: center.lat, lng: center.lng },
            map: map,
            title: center.name
        });

        marker.addListener("click", () => {
            infoWindow.setContent(`
                <h3>${center.name}</h3>
                <p>${center.address}</p>
                <p><strong>Materials:</strong> ${center.materials}</p>
            `);
            infoWindow.open(map, marker);
        });

        const li = document.createElement("li");
        li.innerHTML = `<strong>${center.name}</strong><br>${center.address}<br><em>${center.materials}</em>`;
        li.addEventListener("click", () => {
            map.setCenter({ lat: center.lat, lng: center.lng });
            map.setZoom(16);
            infoWindow.setContent(`
                <h3>${center.name}</h3>
                <p>${center.address}</p>
                <p><strong>Materials:</strong> ${center.materials}</p>
            `);
            infoWindow.open(map, marker);
        });
        locationList.appendChild(li);
    });
}

// Handle town search
document.getElementById("search-btn").addEventListener("click", () => {
    const town = document.getElementById("town-input").value.trim();
    if (town === "") {
        alert("Please enter a town.");
        return;
    }

    document.getElementById("landing-screen").style.display = "none";
    document.getElementById("main-content").style.display = "flex";
    document.getElementById("map-title").textContent = `${town} Recycling Centers`;

  //What it will look like in the future with APIs searching for seperate cities. 
    initMap();
});
