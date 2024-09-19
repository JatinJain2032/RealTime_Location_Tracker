const socket = io();

// Check if geolocation is supported
if (navigator.geolocation) {
  navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      socket.emit("send-location", { latitude, longitude });
    },
    (error) => {
      console.error("Geolocation error:", error);
    },
    {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    }
  );
}

// Initialize the map
const map = L.map("map").setView([0, 0], 16);

// Add OpenStreetMap tiles
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Store markers
const markers = {};

// Add compass directions
const compassControl = L.Control.extend({
  onAdd: function (map) {
    const div = L.DomUtil.create('div', 'leaflet-control-compass');
    div.innerHTML = `
      <div class="compass">
        <div class="north">N</div>
        <div class="east">E</div>
        <div class="south">S</div>
        <div class="west">W</div>
      </div>
    `;
    L.DomEvent.on(div, 'click', (e) => {
      const target = e.target;
      if (target.classList.contains('north')) {
        map.setView([map.getCenter().lat + 0.01, map.getCenter().lng], map.getZoom());
      } else if (target.classList.contains('east')) {
        map.setView([map.getCenter().lat, map.getCenter().lng + 0.01], map.getZoom());
      } else if (target.classList.contains('south')) {
        map.setView([map.getCenter().lat - 0.01, map.getCenter().lng], map.getZoom());
      } else if (target.classList.contains('west')) {
        map.setView([map.getCenter().lat, map.getCenter().lng - 0.01], map.getZoom());
      }
    });
    return div;
  }
});

L.control.compass = function (opts) {
  return new compassControl(opts);
};
L.control.compass({ position: 'topright' }).addTo(map);

// Listen for location updates
socket.on("receive-location", (data) => {
  const { id, latitude, longitude } = data;

  // Update the map view to the latest location
  map.setView([latitude, longitude]);

  // Update or add a marker for the user
  if (markers[id]) {
    markers[id].setLatLng([latitude, longitude]);
  } else {
    markers[id] = L.marker([latitude, longitude]).addTo(map);
  }
});

// Handle user disconnection
socket.on("user-disconnected", (id) => {
  if (markers[id]) {
    map.removeLayer(markers[id]);
    delete markers[id];
  }
});
