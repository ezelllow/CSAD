import React, { useState, useEffect } from 'react';
import { database } from '../firebase';
import ReactCardFlip from 'react-card-flip';
import './SellerCards.css';
import burgerImage from './burger.jpg'; 
import pizzaImage from './pizza.jpg'; 
import butterChickenImage from './butter_chicken.jpg';
import steakImage from './steak_fries.jpg';
import vegetarianImage from './veg_food.jpg';

const storeInfo = {
  'RW5ZlfzL7wcs1dMfzdpdmSn80TV2': {
    name: 'Green Earth Cafe',
    image: vegetarianImage,
    description: '"Sustainable vegetarian cuisine with a modern twist."',
    location: 'Bedok North Street 1',
    type: 'Vegetarian Restaurant Cafe'
  },
  'SAfhLlbX88eg0eB70iMS5rASGL82': {
    name: 'Spice Haven',
    image: butterChickenImage,
    description: '"Authentic Indian cuisine with a focus on traditional spices."',
    location: 'Tampines Street 81',
    type: 'Indian Restaurant'
  },
  'GWmlu7NEH6YzgRPfksakeVGBFmj1': {
    name: 'Big Burger Foods',
    image: burgerImage,
    description: '"Burgers to make your mouth water."',
    location: 'Bedok North Street 1',
    type: 'Burger Restaurant'
  },

  "l7mlg9VuOrdXVXEPzzhtjKgMg3g2": {
    name: 'Bird Bar',
    image: steakImage,
    description: '"Western cuisine to make your mouth water."',
    location: 'Marina Bay Sands',
    type: 'Western Restaurant Bar'

  },
  "pVWY6WL3HDUYzup9qnMKFLkk3ht2": {
    name: 'Pizza Planet',
    image: pizzaImage,
    description: '"Pizza everywhere!"',
    location: 'Bedok North Street 1',
    type: 'Pizza Restaurant'
  }
  // Add more store mappings as needed
};

function SellerCards() {
  const [sellers, setSellers] = useState([]);
  const [flippedStates, setFlippedStates] = useState({});

  useEffect(() => {
    const usersRef = database.ref('Users');
    usersRef.on('value', (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Filter users to only include those with role "Seller"
        const sellersList = Object.entries(data)
          .filter(([_, user]) => user.role === "Seller") // Filter for Sellers only
          .map(([id, user]) => ({
            id,
            ...user,
            storeInfo: storeInfo[id] || {
              name: 'Store Front',
              image: burgerImage,
              description: 'A local establishment',
              location: 'Singapore',
              type: 'Food Establishment'
            }
          }));

        setSellers(sellersList);
        
        // Initialize flip states only for sellers
        const initialFlipStates = {};
        sellersList.forEach(seller => {
          initialFlipStates[seller.id] = false;
        });
        setFlippedStates(initialFlipStates);
      }
    });

    return () => usersRef.off();
  }, []);

  const handleFlip = (sellerId) => {
    setFlippedStates(prev => ({
      ...prev,
      [sellerId]: !prev[sellerId]
    }));
  };

  // Only render the section if there are sellers
  if (sellers.length === 0) return null;

  return (
    <div className='seller-cards'>
      <h1>Our Partners</h1>
      <div className='cards__wrapper'>
        {sellers.map(seller => (
          <ReactCardFlip 
            key={seller.id} 
            isFlipped={flippedStates[seller.id]} 
            flipDirection="horizontal"
          >
            {/* Front of card */}
            <div className='seller-card' onClick={() => handleFlip(seller.id)}>
              <img 
                src={seller.storeInfo.image} 
                alt={seller.storeInfo.name} 
                className='seller-card__img'
              />
              <div className='seller-card__info'>
                <h3>{seller.storeInfo.name}</h3>
              </div>
            </div>

            {/* Back of card */}
            <div 
              className='seller-card seller-card-back' 
              onClick={() => handleFlip(seller.id)}
              style={{
                backgroundImage: `url(${seller.storeInfo.image})`
              }}
            >
              <div className="seller-card-back-overlay">
                <h3>{seller.storeInfo.name}</h3>
                <p>{seller.storeInfo.description}</p>
                <p className="location">📍 {seller.storeInfo.location}</p>
                <p className="type">🏪 {seller.storeInfo.type}</p>
                <p className="seller">👤 Managed by: {seller.username || seller.id}</p>
              </div>
            </div>
          </ReactCardFlip>
        ))}
      </div>
    </div>
  );
}

export default SellerCards; 