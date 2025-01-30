import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

const containerStyle = { width: '100%', height: '90vh' };
const center = { lat: 1.3521, lng: 103.8198 };

const locations = [
  { id: 1, name: "Bukit Batok Fridge", lat: 1.3496, lng: 103.7499, path: "/bukitbatok" },
  { id: 2, name: "Tampines Fridge", lat: 1.3541, lng: 103.9457, path: "/tampines" },
];

export default function MapPage() {
  return (
    <LoadScript googleMapsApiKey="AIzaSyDygiyK5pjtseTqWT2EotjWfiD28SBV-ZU">
      <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={12}>
        {locations.map((loc) => (
          <Marker key={loc.id} position={{ lat: loc.lat, lng: loc.lng }} onClick={() => window.location.href = loc.path} />
        ))}
      </GoogleMap>
    </LoadScript>
  );
}
