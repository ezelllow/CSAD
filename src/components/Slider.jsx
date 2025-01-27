import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Navigation, Pagination, Autoplay } from "swiper/modules"; // Corrected import for modules
import "./Slider.css";

const images = [
  'images/homePage.jpg',
  'images/map.jpg',
  'images/fridge.jpg',
  'images/announcements.jpg',
  'images/calendar.jpg',
];

function Slider() {
  return (
    <div className="swiper-container">
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        navigation
        pagination={{ clickable: true }}
        autoplay={{ delay: 3000 }}
        loop={true}
        spaceBetween={30}
        slidesPerView={3} // Adjust to show multiple images at once
        breakpoints={{
          640: { slidesPerView: 1 }, // For smaller screens
          768: { slidesPerView: 2 },
          1024: { slidesPerView: 3 },
        }}
      >
        {images.map((src, index) => (
          <SwiperSlide key={index}>
            <img src={src} alt={`Slide ${index}`} className="slider-image" />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}

export default Slider;

