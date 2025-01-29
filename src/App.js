import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar'; // Default Navbar
import HomePageNavbar from './components/homeNavbar'; // New Navbar for Homepage
import './App.css';
import Home from './components/pages/Home';
import HomePage from './components/pages/homePage';
import Products from './components/pages/Products';
import SignUp from './components/pages/SignUp';

function App() {
  return (
    <Router>
      <ConditionalNavbar /> {/* This will display the correct navbar */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/homePage" element={<HomePage />} />
        <Route path="/products" element={<Products />} />
        <Route path="/sign-up" element={<SignUp />} />
      </Routes>
    </Router>
  );
}

// Function to determine which Navbar to show
function ConditionalNavbar() {
  const location = useLocation(); // Get current route

  if (location.pathname === '/homePage') {
    return <HomePageNavbar />; // Show a different navbar for homePage
  }

  return <Navbar />; // Show the default navbar for other pages
}

export default App;
