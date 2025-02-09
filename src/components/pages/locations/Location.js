import React from 'react';

const locations = {
  Punggol: "Punggol",
  TeckWhye: "TeckWhye",
  Woodlands: "Woodlands",
  Bedok: "Bedok", // Include Bedok as well
};

const Location = ({ name }) => {
  return <h1 className='products'>{locations[name]}</h1>;
};

export default Location;
