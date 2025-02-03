import React from 'react';
import HeroSection from './HeroSection';
import ChatbotButton from './ChatbotButton';
import Cards from './Cards';

export default function Home() {
  return (
    <div className="home-container">
      <HeroSection />
      <Cards />
      <ChatbotButton />
    </div>
  );
} 