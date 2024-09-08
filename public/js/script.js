// Initialize the map
const map = L.map("map").setView([0, 0], 2);

// Load and display map tiles
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 18,
}).addTo(map);

// Initialize the socket connection
const socket = io();

// Store markers for each client
let markers = {};

// Send the device's location to the server
if (navigator.geolocation) {
  navigator.geolocation.watchPosition(
    (position) => {
      const locationData = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        id: socket.id,
        accuracy: position.coords.accuracy, // Optional, shows accuracy in meters
      };

      // Send the current location to the server
      socket.emit("deviceLocation", locationData);
    },
    (error) => {
      console.error("Geolocation error:", error);
    },
    {
      enableHighAccuracy: true, // Request the most accurate location data
      maximumAge: 0, // Do not cache position results
      timeout: 10000, // Timeout if location retrieval takes too long
    }
  );
} else {
  alert("Geolocation is not supported by your browser.");
}

// On receiving location updates
socket.on("updateLocation", (locationData) => {
  const { lat, lng, id, accuracy } = locationData;

  console.log(
    `Location for ${id}: Latitude: ${lat}, Longitude: ${lng}, Accuracy: ${accuracy} meters`
  );

  // If the marker for this device exists, move it. Otherwise, create a new one.
  if (markers[id]) {
    map.removeLayer(markers[id].marker);
    map.removeLayer(markers[id].accuracyCircle);
  }

  // Create new marker and accuracy circle
  markers[id] = {
    marker: L.marker([lat, lng]).addTo(map).bindPopup(`Device: ${id}`),
    accuracyCircle: L.circle([lat, lng], { radius: accuracy }).addTo(map),
  };

  // Move the map view to the new location
  map.setView([lat, lng], 13);
});

// Handle location sharing
const shareLocationBtn = document.getElementById("shareLocationBtn");
shareLocationBtn.addEventListener("click", () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((position) => {
      const locationData = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        id: socket.id,
      };

      // Send the location to the server to generate a share code
      socket.emit("shareLocation", locationData);
    });
  } else {
    alert("Geolocation is not supported by your browser.");
  }
});

// Display the generated share code
socket.on("shareCodeGenerated", (shareCode) => {
  const shareCodeDisplay = document.getElementById("shareCodeDisplay");
  const shareCodeSpan = document.getElementById("shareCode");

  // Display the share code in the UI
  shareCodeSpan.textContent = shareCode;
  shareCodeDisplay.style.display = "block"; // Make the share code visible
});

// Handle viewing shared locations
const viewSharedLocationBtn = document.getElementById("viewSharedLocationBtn");
viewSharedLocationBtn.addEventListener("click", () => {
  const shareCodeInput = document.getElementById("shareCodeInput").value;

  if (shareCodeInput) {
    socket.emit("viewSharedLocation", shareCodeInput);
  } else {
    alert("Please enter a share code.");
  }
});

// Display the shared location on the map
socket.on("sharedLocationData", (locationData) => {
  const { lat, lng } = locationData;

  // Add a marker for the shared location
  L.marker([lat, lng]).addTo(map).bindPopup("Shared Location").openPopup();
  map.setView([lat, lng], 13);
});

// Handle errors
socket.on("error", (message) => {
  alert(message);
});
