import React from 'react';
import HeroSection from './HeroSection';
import ChatbotButton from './ChatbotButton';
import Footer from './Footer';
import Cards from './Cards';

function Home() {
  return (
    <div>
      <HeroSection />
      <Cards />
      <ChatbotButton />
      <Footer />
    </div>
  );
}

export default Home; 