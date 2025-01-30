import React from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

const mapContainerStyle = {
  width: '100%',
  height: '600px',
};

const center = {
  lat: 1.3521, // Default center (Singapore)
  lng: 103.8198,
};

const locations = [
  { id: 1, name: "Location 1", lat: 1.290270, lng: 103.851959, link: "/location1" },
  { id: 2, name: "Location 2", lat: 1.340270, lng: 103.731959, link: "/location2" },
];

const MapPage = () => {
  return (
    <LoadScript googleMapsApiKey="YOUR_GOOGLE_MAPS_API_KEY">
      <GoogleMap mapContainerStyle={mapContainerStyle} center={center} zoom={12}>
        {locations.map((loc) => (
          <Marker
            key={loc.id}
            position={{ lat: loc.lat, lng: loc.lng }}
            onClick={() => window.location.href = loc.link}
          />
        ))}
      </GoogleMap>
    </LoadScript>
  );
};

export default MapPage;
