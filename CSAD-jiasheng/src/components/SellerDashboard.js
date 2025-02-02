import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { database, storage } from '../firebase';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import './SellerDashboard.css';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function SellerDashboard() {
  const { currentUser } = useAuth();
  const [listings, setListings] = useState([]);
  const [editingListing, setEditingListing] = useState(null);
  const [newListing, setNewListing] = useState({
    title: '',
    description: '',
    quantity: '',
    location: '',
    expiryDate: '',
    imageUrl: ''
  });
  const [stats, setStats] = useState({
    rating: 0,
    totalLikes: 0
  });
  const [analyticsData, setAnalyticsData] = useState({
    views: [],
    likes: [],
    interactions: []
  });
  const [imageUpload, setImageUpload] = useState(null);

  useEffect(() => {
    // Fetch seller's listings
    const listingsRef = database.ref(`listings/${currentUser.uid}`);
    listingsRef.on('value', (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Check if items exist in the data
        const items = data.items || {};
        setListings(Object.entries(items).map(([id, listing]) => ({
          id,
          ...listing
        })));
      } else {
        setListings([]);
      }
    });

    // Fetch seller stats
    const statsRef = database.ref(`Users/${currentUser.uid}/stats`);
    statsRef.on('value', (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setStats(data);
      } else {
        // Initialize stats if they don't exist
        database.ref(`Users/${currentUser.uid}/stats`).set({
          rating: 0,
          totalLikes: 0
        });
      }
    });

    // Fetch analytics data
    const analyticsRef = database.ref(`Users/${currentUser.uid}/analytics`);
    analyticsRef.on('value', (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setAnalyticsData(data);
      } else {
        // Initialize analytics if they don't exist
        const initialData = generateInitialAnalytics();
        database.ref(`Users/${currentUser.uid}/analytics`).set(initialData);
        setAnalyticsData(initialData);
      }
    });

    return () => {
      listingsRef.off();
      database.ref(`Users/${currentUser.uid}/stats`).off();
      database.ref(`Users/${currentUser.uid}/analytics`).off();
    };
  }, [currentUser]);

  // Generate sample data for the last 7 days
  const generateInitialAnalytics = () => {
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();
    
    return {
      views: last7Days.map(date => ({ date, count: 0 })),
      likes: last7Days.map(date => ({ date, count: 0 })),
      interactions: last7Days.map(date => ({ date, count: 0 }))
    };
  };

  // Chart configuration
  const createChartConfig = (data, label, color) => ({
    labels: data.map(item => item.date),
    datasets: [
      {
        label,
        data: data.map(item => item.count),
        borderColor: color,
        backgroundColor: color + '20',
        tension: 0.4,
        fill: true
      }
    ]
  });

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  const handleEdit = (listingId) => {
    const listing = listings.find(l => l.id === listingId);
    if (listing) {
      setEditingListing(listing);
      setNewListing({
        title: listing.title,
        description: listing.description,
        quantity: listing.quantity,
        location: listing.location,
        expiryDate: listing.expiryDate,
        imageUrl: listing.imageUrl
      });
    }
  };

  const handleDelete = async (listingId) => {
    if (window.confirm('Are you sure you want to delete this listing?')) {
      try {
        await database.ref(`listings/${currentUser.uid}/items/${listingId}`).set(null);
      } catch (error) {
        console.error('Error deleting listing:', error);
      }
    }
  };

  const resizeImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            resolve(new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            }));
          }, 'image/jpeg', 0.7);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const resizedFile = await resizeImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUpload(resizedFile);
        setNewListing(prev => ({ ...prev, imageUrl: reader.result }));
      };
      reader.readAsDataURL(resizedFile);
    }
  };

  const uploadImage = async (file) => {
    if (!file) return null;
    const storageRef = storage.ref();
    const fileRef = storageRef.child(`listings/${currentUser.uid}/${Date.now()}-${file.name}`);
    await fileRef.put(file);
    return await fileRef.getDownloadURL();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let imageUrl = newListing.imageUrl;
    
    if (imageUpload) {
      try {
        imageUrl = await uploadImage(imageUpload);
      } catch (error) {
        console.error('Error uploading image:', error);
        return;
      }
    }
    
    const listingsRef = database.ref(`listings/${currentUser.uid}`);
    
    if (editingListing) {
      // Update existing listing
      listingsRef.child('items').child(editingListing.id).update({
        ...newListing,
        imageUrl,
        sellerId: currentUser.uid,
        updatedAt: new Date().toISOString(),
        status: editingListing.status || 'available'
      });
      setEditingListing(null);
    } else {
      // Add new listing
      listingsRef.child('items').push({
        ...newListing,
        imageUrl,
        sellerId: currentUser.uid,
        createdAt: new Date().toISOString(),
        status: 'available'
      });
    }

    setNewListing({
      title: '',
      description: '',
      quantity: '',
      location: '',
      expiryDate: '',
      imageUrl: ''
    });
    setImageUpload(null);
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
            <h3>Rating</h3>
            <p>
              <span className="rating-stars">{'★'.repeat(Math.round(stats.rating))}</span>
              <span className="rating-number">({stats.rating.toFixed(1)})</span>
            </p>
          </div>
          <div className="stat-card">
            <h3>Total Likes</h3>
            <p>
              <span className="likes-icon">♥</span>
              <span className="likes-number">{stats.totalLikes}</span>
            </p>
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
            <div className="form-group">
              <label className="image-upload-label">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="image-input"
                />
                {newListing.imageUrl ? (
                  <div className="image-preview">
                    <img src={newListing.imageUrl} alt="Preview" />
                    <button type="button" onClick={() => {
                      setNewListing(prev => ({ ...prev, imageUrl: '' }));
                      setImageUpload(null);
                    }}>Remove</button>
                  </div>
                ) : (
                  <div className="upload-placeholder">
                    <i className="upload-icon">📷</i>
                    <span>Click to upload image</span>
                  </div>
                )}
              </label>
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
                    expiryDate: '',
                    imageUrl: ''
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
            {listings.length > 0 ? listings.map(listing => (
              <div key={listing.id} className="listing-card">
                {listing.imageUrl && (
                  <div className="listing-image">
                    <img src={listing.imageUrl} alt={listing.title} />
                  </div>
                )}
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
            )) : (
              <div className="no-listings">
                <p>No listings yet. Create your first listing above!</p>
              </div>
            )}
          </div>
        </div>

        <div className="analytics-section">
          <h2>Analytics</h2>
          <div className="charts-grid">
            <div className="chart-card">
              <h3>Views</h3>
              <Line 
                data={createChartConfig(analyticsData.views, 'Views', '#2196F3')} 
                options={chartOptions}
              />
            </div>
            <div className="chart-card">
              <h3>Likes</h3>
              <Line 
                data={createChartConfig(analyticsData.likes, 'Likes', '#FF4081')} 
                options={chartOptions}
              />
            </div>
            <div className="chart-card">
              <h3>Interactions</h3>
              <Line 
                data={createChartConfig(analyticsData.interactions, 'Interactions', '#4CAF50')} 
                options={chartOptions}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 