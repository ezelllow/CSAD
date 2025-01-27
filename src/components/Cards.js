import React, { useState } from 'react';
import './Cards.css';
import CardItem from './CardItem';
import ReactCardFlip from 'react-card-flip'

function Cards() {
  const [flippedStates, setFlippedStates] = useState({
    card1: false,
    card2: false,
    card3: false,
    card4: false,
  });
  const handleFlip = (cardKey) => {
    setFlippedStates((prevState) => ({
      ...prevState,
      [cardKey]: !prevState[cardKey],
    }));
  };
  return (
    <div className='cards'>
      <h1>Check out our Community Events!</h1>
      <div className='cards__container'>
        <div className='cards__wrapper'>
          <ul className='cards__items'>
            <ReactCardFlip isFlipped={flippedStates.card1} flipDirection="horizontal">
              <div className='card' onClick={() => handleFlip('card1')}>
              <CardItem
                  src='images/market.jpg'
                  text='SG Farmers’ Market @ Bishan Community Club'
                  label='Community Events'
                  path='/services'
                />
              </div>
              <div className='card card-back' onClick={() => handleFlip('card1')} 
                
                style={{
                  backgroundImage: `url(images/market.jpg)`, // Use the same image as the front
                }}

                >
                
                <div className="card-back-overlay">
                  <h2>More Info</h2>
                  <p>
                  SG Farmers’ Market went to Tampines for the first time on 11 & 12 January 2020! Organised by SAFEF and supported by Singapore Food Agency, North East Community Development Council and Our Tampines Hub, the event was graced by Mr Masagos Zulkifli, Minister for the Environment and Water Resources.
                  </p>
                </div>
    
              </div>
            </ReactCardFlip>
            <ReactCardFlip isFlipped={flippedStates.card2} flipDirection="horizontal">
              <div className='card' onClick={() => handleFlip('card2')}>
                <CardItem
                src='images/event.jpg'
                text='SG Farmers’ Market went to Tampines for the first time on 11 & 12 January 2020!'
                label='Community Events'
                path='/services'
              />
              </div>
              <div className='card card-back' onClick={() => handleFlip('card2')} 
                
                style={{
                  backgroundImage: `url(images/event.jpg)`, // Use the same image as the front
                }}

                >
                
                <div className="card-back-overlay">
                  <h2>More Info</h2>
                  <p>
                  SG Farmers’ Market went to Bishan for the first time on 28 & 29 September 2019! Organised by SAFEF in partnership with co-organisers Central Singapore Community Development Council and Bishan East-Thomson Grassroots Organisations, the event was supported by Singapore Food Agency and graced by Dr Amy Khor, Senior Minister of State for the Environment and Water Resources.
                  </p>
                </div>
    
              </div>
            </ReactCardFlip>
            
          </ul>
          <ul className='cards__items'>
          <ReactCardFlip isFlipped={flippedStates.card3} flipDirection="horizontal">
              <div className='card' onClick={() => handleFlip('card3')}>
                <CardItem
                src='images/3event.jpg'
                text='Set Sail in the Atlantic Ocean visiting Uncharted Waters'
                label='Mystery'
                path='/services'
                />
              </div>
              <div className='card card-back' onClick={() => handleFlip('card3')} 
                
                style={{
                  backgroundImage: `url(images/3event.jpg)`, // Use the same image as the front
                }}

                >
                
                <div className="card-back-overlay">
                  <h2>More Info</h2>
                  <p>
                  Back by popular demand, SG Farmers’ Market returned to Hillion Mall for the second year running. Organised by SAFEF and supported by Singapore Food Agency and venue partner Hillion Mall, the event was graced by Dr Teo Ho Pin, Mayor of North West District & MP for Bukit Panjang Constituency.
                  </p>
                </div>
    
              </div>
            </ReactCardFlip>
            <ReactCardFlip isFlipped={flippedStates.card4} flipDirection="horizontal">
              <div className='card' onClick={() => handleFlip('card4')}>
                <CardItem
                src='images/4event.jpg'
                text='Experience Football on Top of the Himilayan Mountains'
                label='Adventure'
                path='/products'
                />
              </div>
              <div className='card card-back' onClick={() => handleFlip('card4')} 
                
                style={{
                  backgroundImage: `url(images/4event.jpg)`, // Use the same image as the front
                }}

                >
                
                <div className="card-back-overlay">
                  <h2>More Info</h2>
                  <p>
                    First indoor Chinese New Year edition of the SG Farmers’ Market was co-organised with AVA and Cairnhill Community Club. Featuring 18 Singapore farms, the event was graced by Mr Melvin Yong, Grassroots Advisor & MP for Tanjong Pagar GRC, and drew 2,000 visitors who came to buy fresh farm produce, find out the fun facts about eggs at N&N-Egg Story’s “Let’s Talk About EGGS!”, learn how to grow vegetables at Kok Fah’s “My Mini Farm Workshop!”, and pick up special CNY recipes at the cooking demonstrations.
                  </p>
                </div>
    
              </div>
            </ReactCardFlip>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Cards;
