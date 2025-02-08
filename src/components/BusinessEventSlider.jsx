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
  const [flippedCookingCards, setFlippedCookingCards] = useState({});
  const [flippedDonationCards, setFlippedDonationCards] = useState({});
  const navigate = useNavigate(); // Hook to navigate to other pages

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

  // Toggle flip for cooking event cards
  const toggleFlipCooking = (index) => {
    setFlippedCookingCards((prevState) => ({
      ...prevState,
      [index]: !prevState[index],
    }));
  };

  // Toggle flip for donation drive event cards
  const toggleFlipDonation = (index) => {
    setFlippedDonationCards((prevState) => ({
      ...prevState,
      [index]: !prevState[index],
    }));
  };

// Function to handle "Remind me" button click
const handleReminderClick = (e) => {
  e.stopPropagation(); // ✅ This will now work correctly
  navigate("/calendar"); // Redirect to calendar page
};


  // Reset flipped cards when slider changes for Community Cooking Events
  const handleCookingSlideChange = () => {
    setFlippedCookingCards({});
  };

  // Reset flipped cards when slider changes for Food Donation Drives
  const handleDonationSlideChange = () => {
    setFlippedDonationCards({});
  };

  const handleEventClick = (event) => {
    event.stopPropagation(); // Prevent card from flipping
    navigate("/calendar"); // Redirect to calendar page
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
          loop={false}
          spaceBetween={30}
          slidesPerView={3}
          onSlideChange={handleCookingSlideChange} // Reset flipped cards when sliding
        >
        {cooking.length > 0 ? (
          cooking.map((event, index) => (
            <SwiperSlide key={index} className="event-slide">
              <div className={`event-card ${flippedCookingCards[index] ? "flipped" : ""}`} onClick={() => toggleFlipCooking(index)}>
                <div className="event-card-inner">
                  {/* Front Side */}
                  <div className="event-card-front">
                    <img src={event.image} alt={event.title} className="event-image"  />
                    <div className="event-details">
                      <h3 className="event-title">{event.title}</h3>
                      <p className="event-location">📍 {event.location}</p>
                      <div className="event-meta">
                        <p>📅 Date: {event.date}</p>
                        <p>⏰ Time: {event.time}</p>
                      </div>
                      <button className="reminder-button" onClick={(e) => handleReminderClick(e)}>📅 Remind me</button>
                      {/* Pass setSelectedEvent to the popup or other child components */}
                      
                    </div>
                  </div>
                  {/* Back Side */}
                  <div className="event-card-back">
                    <strong>✍️ Details:</strong>
                    <div className="details-line"></div>
                    <p>{event.description}</p>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))
        ) : (
          <p>No events available</p>
        )}
      </Swiper>
  
      {/* Food Donation Drives Slider */}
      
      <div className="section-header">
        <h2 className="donation-title">Food Donation Drives</h2>
        <button className="donation-btn" onClick={() => handleOpenPopup("DonationDrives")}>
          + ADD EVENT
        </button>
      </div>
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        navigation
        pagination={{ clickable: true }}
        autoplay={{ delay: 5000 }}
        loop={false}
        spaceBetween={30}
        slidesPerView={3}
        onSlideChange={handleDonationSlideChange}
      >
        {donationDrive.length > 0 ? (
          donationDrive.map((event, index) => (
            <SwiperSlide key={index} className="event-slide">
              <div className={`event-card ${flippedDonationCards[index] ? "flipped" : ""}`} onClick={() => toggleFlipDonation(index)}>
                <div className="event-card-inner">
                  {/* Front Side */}
                  <div className="event-card-front">
                    <img src={event.image} alt={event.title} className="event-image" />
                    <div className="event-details">
                      <h3 className="event-title">{event.title}</h3>
                      <p className="event-location">📍 {event.location}</p>
                      <div className="event-meta">
                        <p>📅 Date: {event.date}</p>
                        <p>⏰ Time: {event.time}</p>
                      </div>
                      <button className="reminder-button" onClick={(e) => handleReminderClick(e)}>📅 Remind me</button>
                     
                    </div>
                  </div>
                  {/* Back Side */}
                  <div className="event-card-back2">
                    <strong>✍️ Details:</strong>
                    <div className="details-line"></div>
                    <p>{event.description}</p>
                  </div>
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
  