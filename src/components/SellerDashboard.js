import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { database } from '../firebase';
import './SellerDashboard.css';

export default function SellerDashboard() {
  const { currentUser } = useAuth();
  const [listings, setListings] = useState([]);
  const [editingListing, setEditingListing] = useState(null);
  const [newListing, setNewListing] = useState({
    title: '',
    description: '',
    quantity: '',
    location: '',
    expiryDate: ''
  });

  useEffect(() => {
    // Fetch seller's listings
    const listingsRef = database.ref(`listings/${currentUser.uid}`);
    listingsRef.on('value', (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setListings(Object.entries(data).map(([id, listing]) => ({
          id,
          ...listing
        })));
      }
    });

    return () => listingsRef.off();
  }, [currentUser]);

  const handleEdit = (listingId) => {
    const listing = listings.find(l => l.id === listingId);
    if (listing) {
      setEditingListing(listing);
      setNewListing({
        title: listing.title,
        description: listing.description,
        quantity: listing.quantity,
        location: listing.location,
        expiryDate: listing.expiryDate
      });
    }
  };

  const handleDelete = async (listingId) => {
    if (window.confirm('Are you sure you want to delete this listing?')) {
      try {
        await database.ref(`listings/${currentUser.uid}/${listingId}`).remove();
      } catch (error) {
        console.error('Error deleting listing:', error);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const listingsRef = database.ref(`listings/${currentUser.uid}`);
    
    if (editingListing) {
      // Update existing listing
      listingsRef.child(editingListing.id).update({
        ...newListing,
        updatedAt: new Date().toISOString()
      });
      setEditingListing(null);
    } else {
      // Add new listing
      listingsRef.push({
        ...newListing,
        createdAt: new Date().toISOString(),
        status: 'available'
      });
    }

    setNewListing({
      title: '',
      description: '',
      quantity: '',
      location: '',
      expiryDate: ''
    });
  };

  return (
    <div className="seller-dashboard">
      <div className="dashboard-header">
        <h1>Seller Dashboard</h1>
        <div className="stats">
          <div className="stat-card">
            <h3>Active Listings</h3>
            <p>{listings.filter(l => l.status === 'available').length}</p>
          </div>
          <div className="stat-card">
            <h3>Total Rescued</h3>
            <p>{listings.filter(l => l.status === 'claimed').length}</p>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="new-listing-section">
          <h2>{editingListing ? 'Edit Listing' : 'Add New Listing'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <input
                type="text"
                placeholder="Food Item Title"
                value={newListing.title}
                onChange={(e) => setNewListing({...newListing, title: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <textarea
                placeholder="Description"
                value={newListing.description}
                onChange={(e) => setNewListing({...newListing, description: e.target.value})}
                required
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <input
                  type="number"
                  placeholder="Quantity"
                  value={newListing.quantity}
                  onChange={(e) => setNewListing({...newListing, quantity: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Location"
                  value={newListing.location}
                  onChange={(e) => setNewListing({...newListing, location: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="datetime-local"
                  placeholder="Expiry Date"
                  value={newListing.expiryDate}
                  onChange={(e) => setNewListing({...newListing, expiryDate: e.target.value})}
                  required
                />
              </div>
            </div>
            <button type="submit" className="submit-btn">
              {editingListing ? 'Update Listing' : 'Add Listing'}
            </button>
            {editingListing && (
              <button
                type="button"
                className="cancel-btn"
                onClick={() => {
                  setEditingListing(null);
                  setNewListing({
                    title: '',
                    description: '',
                    quantity: '',
                    location: '',
                    expiryDate: ''
                  });
                }}
              >
                Cancel Edit
              </button>
            )}
          </form>
        </div>

        <div className="listings-section">
          <h2>Your Listings</h2>
          <div className="listings-grid">
            {listings.map(listing => (
              <div key={listing.id} className="listing-card">
                <h3>{listing.title}</h3>
                <p>{listing.description}</p>
                <div className="listing-details">
                  <span>Quantity: {listing.quantity}</span>
                  <span>Location: {listing.location}</span>
                  <span className={`status ${listing.status}`}>
                    {listing.status}
                  </span>
                </div>
                <div className="listing-actions">
                  <button onClick={() => handleEdit(listing.id)}>Edit</button>
                  <button onClick={() => handleDelete(listing.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 