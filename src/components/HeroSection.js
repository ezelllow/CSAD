import React from 'react';
import './App.css';
import { Button } from './Button';
import './HeroSection.css';

function HeroSection() {
  const handleDownload = () => {
    const apkUrl = '/images/event.jpg'; 
    const link = document.createElement('a');
    link.href = apkUrl;
    link.download = 'HarvestHub.apk'; // filename when downloading
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  return (
    <div className='hero-container'id='hero-section'>
      <div className='hero-overlay'></div> {/* Overlay for background dimming */}
      <video src='/videos/fridge.mp4' autoPlay loop muted />
      <h1>
        <span className='green'>LESS WASTE</span>
        <br />
        <span className='orange'>MORE TASTE</span>
      </h1>
      <p>What are you waiting for?</p>
      <div className='hero-btns'>
        <Button
          className='btns'
          buttonStyle='btn--primary'
          buttonSize='btn--large'
          onClick={handleDownload} // Call the function to download the APK
        >
          Get the App <i className='fas fa-download' />
        </Button>
      </div>
    </div>
  );
}


export default HeroSection;
