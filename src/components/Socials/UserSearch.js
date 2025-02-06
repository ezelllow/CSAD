import React, { useState, useEffect } from 'react';
import { database } from '../../firebase';
import './UserSearch.css';

function UserSearch({ onStartChat, currentUser }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [allUsers, setAllUsers] = useState([]);

  // Fetch all users once when component mounts
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersRef = database.ref('Users');
        const snapshot = await usersRef.once('value');
        const usersData = snapshot.val();
        
        if (usersData) {
          const usersArray = Object.entries(usersData)
            .filter(([id]) => id !== currentUser.uid)
            .map(([id, user]) => ({
              id,
              ...user,
              isFriend: user.friends?.includes(currentUser.uid)
            }));
          setAllUsers(usersArray);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, [currentUser.uid]);

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    
    if (query.length < 1) {
      setSearchResults([]);
      return;
    }

    // Filter locally instead of querying Firebase
    const results = allUsers.filter(user => 
      user.username?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query)
    );

    setSearchResults(results);
  };

  const handleFriendAction = async (userId, isFriend) => {
    try {
      const userRef = database.ref(`Users/${currentUser.uid}/friends`);
      const targetUserRef = database.ref(`Users/${userId}/friends`);

      if (isFriend) {
        await userRef.transaction(friends => 
          (friends || []).filter(id => id !== userId)
        );
        await targetUserRef.transaction(friends => 
          (friends || []).filter(id => id !== currentUser.uid)
        );
      } else {
        await userRef.transaction(friends => 
          [...(friends || []), userId]
        );
        await targetUserRef.transaction(friends => 
          [...(friends || []), currentUser.uid]
        );
      }

      // Update local state
      setAllUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, isFriend: !isFriend }
          : user
      ));
      setSearchResults(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, isFriend: !isFriend }
          : user
      ));
    } catch (error) {
      console.error('Error updating friend status:', error);
    }
  };

  return (
    <div className="user-search">
      <div className="search-header">
        <div className="search-input-container">
          <i className="fas fa-search search-icon"></i>
          <input
            type="text"
            placeholder="Find or start a conversation"
            value={searchQuery}
            onChange={handleSearch}
            className="search-input"
          />
        </div>
      </div>

      <div className="search-sections">
        <div className="search-section">
          <h3 className="section-header">FRIENDS</h3>
          {allUsers.filter(user => user.isFriend).map(user => (
            <div key={user.id} className="user-result">
              <div className="user-info">
                <img 
                  src={user.profilePicture || "/pfp.png"} 
                  alt={user.username} 
                  className="user-avatar"
                />
                <div className="user-details">
                  <span className="username">{user.username}</span>
                  <span className="user-status">Online</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {searchQuery && (
          <div className="search-section">
            <h3 className="section-header">SEARCH RESULTS</h3>
            {searchResults.map(user => (
              <div key={user.id} className="user-result">
                <div className="user-info">
                  <img 
                    src={user.profilePicture || "/pfp.png"} 
                    alt={user.username} 
                    className="user-avatar"
                  />
                  <div className="user-details">
                    <span className="username">{user.username}</span>
                    <span className="user-status">
                      {user.isFriend ? 'Friends' : 'Not Friends'}
                    </span>
                  </div>
                </div>
                <div className="user-actions">
                  <button 
                    className={`action-button ${user.isFriend ? 'remove-friend' : 'add-friend'}`}
                    onClick={() => handleFriendAction(user.id, user.isFriend)}
                  >
                    {user.isFriend ? 'Remove Friend' : 'Add Friend'}
                  </button>
                  <button 
                    className="action-button message"
                    onClick={() => onStartChat(user.id)}
                  >
                    Message
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default UserSearch; 