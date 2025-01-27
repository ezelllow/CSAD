import React, { useState } from 'react';
import './Slider.css';

const images = [
  'images/img-1.jpg',
  'images/img-2.jpg',
  'images/img-3.jpg',
  'images/img-4.jpg',
];

function Slider() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  return (
    <div className="slider-container">
      <button className="slider-btn left" onClick={handlePrev}>
        &#8249;
      </button>
      <img
        src={images[currentIndex]}
        alt={`Slide ${currentIndex}`}
        className="slider-image"
      />
      <button className="slider-btn right" onClick={handleNext}>
        &#8250;
      </button>
    </div>
  );
}

export default Slider;
