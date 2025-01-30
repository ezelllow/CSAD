import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './Navbar'; // Navbar for home page
import HomeNavbar from './homeNavbar'; // Navbar for all other pages
import Home from './pages/Home';
import HomePage from './pages/homePage';
import Services from './pages/Services';
import Products from './pages/Products';    
import PrivateRoute from './PrivateRoute';  
import ForgotPassword from './ForgotPassword';  
import SignUp from './pages/SignUp'; 
import { AuthProvider } from '../context/AuthContext';  
import Dashboard from './Dashboard';  
import UpdateProfile from './UpdateProfile';  
import Map from './pages/map';

function ConditionalNavbar() {
  const location = useLocation();
  
  return location.pathname === '/' ? <Navbar /> : <HomeNavbar />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <ConditionalNavbar /> {/* Shows Navbar for home, HomeNavbar for other pages */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          {/* Protected Routes */}
          <Route element={<PrivateRoute />}>
            <Route path="/homePage" element={<HomePage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/update-profile" element={<UpdateProfile />} />
            <Route path="/services" element={<Services />} />
            <Route path="/products" element={<Products />} />
            <Route path="/map" element={<Map />} />
          </Route>
          
          <Route path="/sign-up" element={<SignUp />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
