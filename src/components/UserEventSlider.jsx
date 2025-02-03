import React, { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import { database } from "../firebase"; // Firebase setup
import { ref, onValue } from "firebase/database";
import "./UserEventSlider.css"; // Ensure styling for the slider

function UserEventSlider() {
  const [cooking, setCooking] = useState([]);
  const [donationDrive, setDonationDrive] = useState([]);

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

  return (
    <div className="swiper-container">
      {/* "Upcoming Events" Heading */}
      <h1 className="app" id="slider-section">Upcoming Events</h1>

      {/* Community Cooking Events Slider */}
      <h2 className="section-title cooking-title">Community Cooking Events</h2>
      <hr className="section-divider" />
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        navigation
        pagination={{ clickable: true }}
        autoplay={{ delay: 5000 }}
        loop={true}
        spaceBetween={30}
        slidesPerView={1}
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
                </div>
              </div>
            </SwiperSlide>
          ))
        ) : (
          <p>No events available</p>
        )}
      </Swiper>

      {/* Food Donation Drives Slider */}
      <h2 className="section-title donation-title">Food Donation Drives</h2>
      <hr className="section-divider" />
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        navigation
        pagination={{ clickable: true }}
        autoplay={{ delay: 5000 }}
        loop={true}
        spaceBetween={30}
        slidesPerView={1}
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
