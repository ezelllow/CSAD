import React, { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import { database } from "../firebase"; // Firebase setup
import { ref, onValue } from "firebase/database";
import PopupForm from "./PopUpForm"; // Import the popup form component
import "./BusinessEventSlider.css"; // Ensure styling for the slider
import { useNavigate } from "react-router-dom"; 

function BusinessEventSlider() {
  const [cooking, setCooking] = useState([]);
  const [donationDrive, setDonationDrive] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [formCategory, setFormCategory] = useState(""); // To store the category
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch Business Cooking Events (Announcements)
    const cookingRef = ref(database, "Announcements");
    onValue(cookingRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setCooking(Object.values(data));
      }
    });

    // Fetch Food Donation Drives
    const donationRef = ref(database, "DonationDrives");
    onValue(donationRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setDonationDrive(Object.values(data));
      }
    });
  }, []);

  // Function to open the popup form and set category
  const handleOpenPopup = (category) => {
    setFormCategory(category);
    setShowPopup(true);
  };

  const handleEventClick = (event) => {
    // Navigate to the calendar page and pass event data through state
    navigate("/calendar", { state: { selectedEvent: event } });
  };

  return (
    <div className="swiper-container">
      <h1 className="app" id="slider-section">Upcoming Events</h1>

      {/* Business Cooking Events Slider */}
      <div className="section-header">
        <h2 className="cooking-title">Community Cooking Events</h2>
        <button className="cooking-btn" onClick={() => handleOpenPopup("Announcements")}>
          + ADD EVENT
        </button>
      </div>
      <hr className="section-divider" />
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        navigation
        pagination={{ clickable: true }}
        autoplay={{ delay: 5000 }}
        loop={true}
        spaceBetween={30}
        slidesPerView={3}
      >
        {cooking.length > 0 ? (
          cooking.map((event, index) => (
            <SwiperSlide key={index} className="event-slide">
              <div className="event-content-center">
                <div className="event-image">
                  <p className="image-text">{event.image}</p>
                </div>
                <div className="event-content">
                  <h2>{event.title}</h2>
                  <p>{event.description}</p>
                  <div className="event-details">
                    <p><strong>Details:</strong> {event.details}</p>
                    <p><strong>Location:</strong> {event.location}</p>
                  </div>
                  <button className="remind-me-button" onClick={() => handleEventClick(event)}>
                    Remind Me
                  </button>
                </div>
              </div>
            </SwiperSlide>
          ))
        ) : (
          <p>No events available</p>
        )}
      </Swiper>

      {/* Business Food Donation Drives Slider */}
      <div className="section-header">
        <h2 className="donation-title">Food Donation Drives</h2>
        <button className="donation-btn" onClick={() => handleOpenPopup("DonationDrives")}>
          + ADD EVENT
        </button>
      </div>
      <hr className="section-divider" />
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        navigation
        pagination={{ clickable: true }}
        autoplay={{ delay: 5000 }}
        loop={true}
        spaceBetween={30}
        slidesPerView={3}
      >
        {donationDrive.length > 0 ? (
          donationDrive.map((event, index) => (
            <SwiperSlide key={index} className="event-slide">
              <div className="event-content-center">
                <div className="event-image">
                  <p className="image-text">{event.image}</p>
                </div>
                <div className="event-content">
                  <h2>{event.title}</h2>
                  <p>{event.description}</p>
                  <div className="event-details">
                    <p><strong>Details:</strong> {event.details}</p>
                    <p><strong>Location:</strong> {event.location}</p>
                  </div>
                  <button className="remind-me-button" onClick={() => handleEventClick(event)}>
                    Remind Me
                  </button>
                </div>
              </div>
            </SwiperSlide>
          ))
        ) : (
          <p>No donation drives available</p>
        )}
      </Swiper>

      {/* Popup Form Component */}
      {showPopup && <PopupForm category={formCategory} onClose={() => setShowPopup(false)} />}
    </div>
  );
}

export default BusinessEventSlider;