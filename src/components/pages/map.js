import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import './map.css';
// Import custom marker image
import markerIcon from "./arrow.png"; // Ensure this file exists in your project

// Define locations with lat, lng, and corresponding page routes
const locations = [
  {
    name: "Punggol Fridge",
    lat: 1.4022,
    lng: 103.9111,
    path: "/punggol",
  },
  {
    name: "Bedok Block 702 Fridge",
    lat: 1.3375,
    lng: 103.9188,
    path: "/bedok",
  },
  {
    name: "Woodlands Fridge",
    lat: 1.4418,
    lng: 103.8012,
    path: "/woodlands",
  },
  {
    name: "Teck Whye Fridge",
    lat: 1.3900,
    lng: 103.7551,
    path: "/teckwhye",
  },
];

const MapPage = () => {
  const navigate = useNavigate(); // Hook for navigation
  const [hoveredMarker, setHoveredMarker] = useState(null);

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <MapContainer
        center={[1.3521, 103.8198]} // Singapore center
        zoom={12}
        style={{ height: "100%", width: "100%" }}
      >
        {/* OpenStreetMap Tile Layer */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Add Markers with Hover Effect */}
        {locations.map((loc, index) => (
          <Marker
            key={index}
            position={[loc.lat, loc.lng]}
            icon={
              new L.Icon({
                iconUrl: markerIcon,
                iconSize: hoveredMarker === index ? [110, 50] : [90, 40], // Increase size on hover
                iconAnchor: [20, 40],
                popupAnchor: [0, -40],
              })
            }
            eventHandlers={{
              mouseover: () => setHoveredMarker(index), // Increase size on hover
              mouseout: () => setHoveredMarker(null), // Revert size on mouse out
            }}
          >
            <Popup>
              <strong>{loc.name}</strong>
              <br />
              <button
                onClick={() => navigate(loc.path)} // Redirect only when button is clicked
                style={{
                  marginTop: "5px",
                  padding: "5px 10px",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                }}
              >
                View Location
              </button>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapPage;
