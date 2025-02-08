import React, { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import { database } from "../firebase"; // Firebase setup
import { ref, onValue } from "firebase/database";
import { useNavigate } from "react-router-dom"; 
import "./UserEventSlider.css"; // Ensure styling for the slider
import CalendarPopUpForm from './CalendarPopUpForm'; // Corrected the filename case



function UserEventSlider() {
  const [cooking, setCooking] = useState([]);
  const [donationDrive, setDonationDrive] = useState([]);
  const [flippedCookingCards, setFlippedCookingCards] = useState({});
  const [flippedDonationCards, setFlippedDonationCards] = useState({});
  const [selectedEvent, setSelectedEvent] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch Community Cooking Events
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

  const handleReminderClick = (event) => {
    //event.stopPropagation(); // Prevent flipping
    setSelectedEvent(event);
    navigate("/calendar");
  };

  const toggleFlipCooking = (index) => {
    setFlippedCookingCards((prevState) => ({
      ...prevState,
      [index]: !prevState[index],
    }));
  };

  const toggleFlipDonation = (index) => {
    setFlippedDonationCards((prevState) => ({
      ...prevState,
      [index]: !prevState[index],
    }));
  };

  const handleCookingSlideChange = () => {
    setFlippedCookingCards({});
  };

  const handleDonationSlideChange = () => {
    setFlippedDonationCards({});
  };

  return (
    <div className="swiper-container">
      <h1 className="app" id="slider-section">Upcoming Events</h1>
      <div className="section-header">
      {/* Community Cooking Events Slider */}
      <h2 className="cooking-title">Community Cooking Events</h2>
      </div>
      
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        navigation
        pagination={{ clickable: true }}
        autoplay={{ delay: 5000 }}
        loop={false}
        spaceBetween={30}
        slidesPerView={3}
        onSlideChange={handleCookingSlideChange}
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
                      <button className="reminder-button" onClick={() => handleReminderClick(event)}>📅 Remind me</button>
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
      <div className="section-header">
      {/* Food Donation Drives Slider */}
      <h2 className="donation-title">Food Donation Drives</h2>
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
                      <button className="reminder-button" onClick={(e) => handleReminderClick(event)}>📅 Remind me</button>
                     
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
    </div>
  );
}

export default UserEventSlider;
