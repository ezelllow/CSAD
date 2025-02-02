import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SellerRoute() {
  const { currentUser, checkIsSeller } = useAuth();
  const [isSeller, setIsSeller] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (currentUser) {
      checkIsSeller().then(result => {
        setIsSeller(result);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [currentUser, checkIsSeller]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return currentUser && isSeller ? <Outlet /> : <Navigate to="/" />;
} 