import React, { useState } from 'react';
import '../../App.css';
import Cards from '../Cards';
import HeroSection from '../HeroSection';
import Footer from '../Footer';
import { Button } from '../Button';

function Home() {
  const [count, setCount] = useState(0);

  return (
    <>
      <button onClick={() => {setCount(count + 1)}}>{count}</button>
      <p>{count}</p>
      <HeroSection />
      <Cards />
      <Footer />
    </>
  );
}

export default Home;
