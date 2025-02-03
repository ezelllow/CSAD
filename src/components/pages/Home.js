import React, { useState } from 'react';
import '../App.css';
import Cards from '../Cards';
import HeroSection from '../HeroSection';
import Slider from '../Slider';

function Home() {
  return (
    <>
      <div id="hero-section"> {/* Add ID here */}
        <HeroSection />
      </div>
      <div id="cards-section"> {/* Add ID here */}
        <Cards />
      </div>
      <div id="slider-section"> {/* Add ID here */}
        <Slider />
      </div>
    </>
  );
}

export default Home;
