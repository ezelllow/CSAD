import React from 'react';
import Navbar from './Navbar';
import './App.css';
import Home from './pages/Home';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Services from './pages/Services';
import Products from './pages/Products';
import Signin from './Signin';       
import Login from './Login';        
import PrivateRoute from './PrivateRoute';  
import ForgotPassword from './ForgotPassword';  
import SignUp from './pages/SignUp'; 
import { AuthProvider } from '../context/AuthContext';  
import Dashboard from './Dashboard';  // Added Dashboard
import UpdateProfile from './UpdateProfile';  // Added UpdateProfile

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          {/* Public Routes */}
          <Route path="/signin" element={<Signin />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected Routes */}
          <Route element={<PrivateRoute />}>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} /> {/* Added */}
            <Route path="/update-profile" element={<UpdateProfile />} /> {/* Added */}
            <Route path="/services" element={<Services />} />
            <Route path="/products" element={<Products />} />
            <Route path="/sign-up" element={<SignUp />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
