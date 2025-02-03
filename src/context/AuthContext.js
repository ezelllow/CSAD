import React, { useContext, useState, useEffect } from 'react';
import { auth } from '../firebase';
import { database } from '../firebase';

const AuthContext = React.createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  function signup(email, password, username, role) {
    console.log('Signing up with role:', role); // Debug log
    return auth.createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      
      const initialAnalytics = {
        views: Array(7).fill().map((_, i) => ({
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          count: 0
        })).reverse(),
        likes: Array(7).fill().map((_, i) => ({
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          count: 0
        })).reverse(),
        interactions: Array(7).fill().map((_, i) => ({
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          count: 0
        })).reverse()
      };

      // Save user data including role to database
      return database.ref(`Users/${user.uid}`).set({
        username: username,
        email: email,
        role: role,
        stats: {
          rating: 0,
          totalLikes: 0
        },
        analytics: initialAnalytics
      }).then(() => {
        console.log('User data saved with role:', role); // Debug log
        return userCredential;
      });
    });
  }

  function login(email, password) {
    return auth.signInWithEmailAndPassword(email, password);
  }

  function logout() {
    return auth.signOut();
  }

  function resetPassword(email) {
    return auth.sendPasswordResetEmail(email);
  }

  function updateEmail(email) {
    return currentUser.updateEmail(email);
  }

  function updatePassword(password) {
    return currentUser.updatePassword(password);
  }

  // Add function to check if user is a seller
  function checkIsSeller() {
    return database.ref(`Users/${currentUser.uid}/role`).once('value')
      .then(snapshot => snapshot.val() === 'Seller');
  }

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe; // Clean up subscription on component unmount
  }, []);

  const value = {
    currentUser,
    login,
    signup,
    logout,
    resetPassword,
    updateEmail,
    updatePassword,
    checkIsSeller
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}