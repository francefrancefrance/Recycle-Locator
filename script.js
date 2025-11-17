const recyclingCenters = [
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
    // Initialize map centered in New London, CT
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 41.3550, lng: -72.0995 },
        zoom: 14
    });

    const infoWindow = new google.maps.InfoWindow();

    recyclingCenters.forEach((center) => {
        // Create marker
        const marker = new google.maps.Marker({
            position: { lat: center.lat, lng: center.lng },
            map: map,
            title: center.name
        });

        // Add info window on marker click
        marker.addListener("click", () => {
            infoWindow.setContent(`
                <h3>${center.name}</h3>
                <p>${center.address}</p>
                <p><strong>Materials:</strong> ${center.materials}</p>
            `);
            infoWindow.open(map, marker);
        });

        // Add to location list
        const locationList = document.getElementById("location-list");
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

// Initialize map after window loads
window.onload = initMap;