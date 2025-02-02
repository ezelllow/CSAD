import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar'; // Original navbar for home page
import HomeNavbar from './components/homeNavbar'; // Navbar for other pages
import Home from './components/pages/Home';
import HomePage from './components/pages/homePage';
import Services from './components/pages/Services';
import Products from './components/pages/Products';
import Bannoun from './components/pages/Bannoun';
import Uannouncements from './components/pages/Uannouncements';
import PrivateRoute from './components/PrivateRoute';
import ForgotPassword from './components/ForgotPassword';
import SignUp from './pages/SignUp';
import { AuthProvider } from './context/AuthContext';
import Profile from './components/profile';
import UpdateProfile from './components/UpdateProfile';
import Map from './components/pages/map';
import Punggol from './components/pages/locations/Punggol';
import Bedok from './components/pages/locations/Bedok';
import Woodlands from './components/pages/locations/Woodlands';
import TeckWhye from './components/pages/locations/TeckWhye';
import ChatbotButton from './components/ChatbotButton';
import SellerRoute from './components/SellerRoute';
import SellerDashboard from './components/SellerDashboard';
import ForumsPage from "./components/Forums/ForumsPage";
import PostDetail from "./components/Forums/PostDetail";
import SocialsPage from "./components/Socials/SocialsPage";
import Footer from './components/Footer';

function ConditionalNavbar() {
  const location = useLocation();
  return location.pathname === '/' ? <Navbar /> : <HomeNavbar />;
}

function App() {
  return (
    <AuthProvider>
      <ConditionalNavbar />
      <ChatbotButton />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/sign-up" element={<SignUp />} />
        
        {/* Protected Routes */}
        <Route element={<PrivateRoute />}>
          <Route path="/homePage" element={<HomePage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/update-profile" element={<UpdateProfile />} />
          <Route path="/services" element={<Services />} />
          <Route path="/products" element={<Products />} />
          <Route path="/map" element={<Map />} />
          <Route path="/punggol" element={<Punggol />} />
          <Route path="/bedok" element={<Bedok />} />
          <Route path="/woodlands" element={<Woodlands />} />
          <Route path="/teckwhye" element={<TeckWhye />} />
          <Route path="/uannouncements" element={<Uannouncements />} />
          <Route path="/bannoun" element={<Bannoun />} />
          <Route path="/forums" element={<ForumsPage />} />
          <Route path="/forums/post/:postId" element={<PostDetail />} />
          <Route path="/socials" element={<SocialsPage />} />
        </Route>

        {/* Seller Routes */}
        <Route element={<SellerRoute />}>
          <Route path="/seller-dashboard" element={<SellerDashboard />} />
        </Route>
      </Routes>
      <Footer />
    </AuthProvider>
  );
}

export default App; 