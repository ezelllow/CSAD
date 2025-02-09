import React, { useState, useEffect } from 'react';
import { database } from '../../firebase';
import './UserSearch.css';
import { useAuth } from '../../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMessage, faCheck, faUserFriends, faUserPlus } from '@fortawesome/free-solid-svg-icons';

function UserSearch({ onStartChat, currentUser }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [onlineFriends, setOnlineFriends] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const { currentUser: authUser } = useAuth();

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

  useEffect(() => {
    if (!authUser) return;

    // Listen to pending friend requests
    const pendingRef = database.ref(`Users/${authUser.uid}/pendingFriends`);
    pendingRef.on('value', async (snapshot) => {
      const requests = [];
      const data = snapshot.val() || {};
      
      // Fetch sender details for each request
      for (const [senderId, status] of Object.entries(data)) {
        const senderSnapshot = await database.ref(`Users/${senderId}`).once('value');
        const senderData = senderSnapshot.val();
        if (senderData) {
          requests.push({
            id: senderId,
            username: senderData.username,
            profilePicture: senderData.profilePicture,
            status
          });
        }
      }
      setPendingRequests(requests);
    });

    // Listen to friends list
    const friendsRef = database.ref(`Users/${authUser.uid}/friends`);
    friendsRef.on('value', async (snapshot) => {
      const friendsList = [];
      const data = snapshot.val() || {};
      
      for (const [friendId, status] of Object.entries(data)) {
        const friendSnapshot = await database.ref(`Users/${friendId}`).once('value');
        const friendData = friendSnapshot.val();
        if (friendData) {
          friendsList.push({
            id: friendId,
            username: friendData.username,
            profilePicture: friendData.profilePicture
          });
        }
      }
      setFriends(friendsList);
    });

    return () => {
      pendingRef.off();
      friendsRef.off();
    };
  }, [authUser]);

  useEffect(() => {
    if (!authUser) return;

    // Reference to online status of friends
    const onlineStatusRef = database.ref('status');
    const friendsRef = database.ref(`Users/${authUser.uid}/friends`);

    const updateOnlineStatus = async () => {
      const friendsSnapshot = await friendsRef.once('value');
      const friendsData = friendsSnapshot.val() || {};
      const friendIds = Object.keys(friendsData);

      // Get online status for all friends
      const onlineStatusSnapshot = await onlineStatusRef.once('value');
      const onlineStatus = onlineStatusSnapshot.val() || {};

      // Filter and map online friends with their data
      const onlineFriendsList = [];
      for (const friendId of friendIds) {
        if (onlineStatus[friendId]?.state === 'online') {
          const friendSnapshot = await database.ref(`Users/${friendId}`).once('value');
          const friendData = friendSnapshot.val();
          if (friendData) {
            onlineFriendsList.push({
              id: friendId,
              username: friendData.username,
              profilePicture: friendData.profilePicture
            });
          }
        }
      }
      setOnlineFriends(onlineFriendsList);
    };

    // Listen for changes in online status
    onlineStatusRef.on('value', updateOnlineStatus);
    friendsRef.on('value', updateOnlineStatus);

    // Set up own online status
    const userStatusRef = database.ref(`status/${authUser.uid}`);
    userStatusRef.onDisconnect().remove();
    userStatusRef.set({
      state: 'online',
      lastChanged: database.ServerValue.TIMESTAMP
    });

    return () => {
      onlineStatusRef.off();
      friendsRef.off();
      userStatusRef.remove();
    };
  }, [authUser]);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    
    if (e.target.value.length < 1) {
      setSearchResults([]);
      return;
    }

    // Filter locally instead of querying Firebase
    const results = allUsers.filter(user => 
      user.username?.toLowerCase().includes(e.target.value.toLowerCase()) ||
      user.email?.toLowerCase().includes(e.target.value.toLowerCase())
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

  const handleAcceptRequest = async (senderId) => {
    try {
      // Add to friends list for both users
      await database.ref(`Users/${authUser.uid}/friends/${senderId}`).set(true);
      await database.ref(`Users/${senderId}/friends/${authUser.uid}`).set(true);
      
      // Remove from pending requests
      await database.ref(`Users/${authUser.uid}/pendingFriends/${senderId}`).remove();
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  };

  const handleRejectRequest = async (senderId) => {
    try {
      // Simply remove from pending requests
      await database.ref(`Users/${authUser.uid}/pendingFriends/${senderId}`).remove();
    } catch (error) {
      console.error('Error rejecting friend request:', error);
    }
  };

  const handleRemoveFriend = async (friendId) => {
    try {
      // Remove from both users' friends lists
      await database.ref(`Users/${authUser.uid}/friends/${friendId}`).remove();
      await database.ref(`Users/${friendId}/friends/${authUser.uid}`).remove();
    } catch (error) {
      console.error('Error removing friend:', error);
    }
  };

  const handleAddFriend = async (userId) => {
    if (!authUser) return;
    
    try {
      // Add to their pending requests
      await database.ref(`Users/${userId}/pendingFriends/${authUser.uid}`).set('pending');
      
      // Update button state in UI
      setSearchResults(prevResults => 
        prevResults.map(user => 
          user.id === userId 
            ? { ...user, friendStatus: 'pending' }
            : user
        )
      );
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  return (
    <div className="user-search-container">
      <div className="search-section">
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
      </div>

      <div className="friends-nav">
        <button 
          className={`friends-nav-button ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All
        </button>
        <button 
          className={`friends-nav-button ${activeTab === 'online' ? 'active' : ''}`}
          onClick={() => setActiveTab('online')}
        >
          <svg 
            aria-hidden="true" 
            focusable="false" 
            data-prefix="fas" 
            data-icon="user-group" 
            className="svg-inline--fa fa-user-group" 
            role="img" 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 640 512"
          >
            <path fill="currentColor" d="M96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM0 482.3C0 383.8 79.8 304 178.3 304h91.4C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7H29.7C13.3 512 0 498.7 0 482.3zM609.3 512H471.4c5.4-9.4 8.6-20.3 8.6-32v-8c0-60.7-27.1-115.2-69.8-151.8c2.4-.1 4.7-.2 7.1-.2h61.4C567.8 320 640 392.2 640 481.3c0 17-13.8 30.7-30.7 30.7zM432 256c-31 0-59-12.6-79.3-32.9C372.4 196.5 384 163.6 384 128c0-26.8-6.6-52.1-18.3-74.3C384.3 40.1 407.2 32 432 32c61.9 0 112 50.1 112 112s-50.1 112-112 112z"/>
          </svg>
          Online
        </button>
        <button 
          className={`friends-nav-button ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending ({pendingRequests.length})
        </button>
        <button 
          className={`friends-nav-button ${activeTab === 'blocked' ? 'active' : ''}`}
          onClick={() => setActiveTab('blocked')}
        >
          Blocked
        </button>
      </div>

      <div className="results-section">
        {activeTab === 'online' && (
          <div className="online-friends">
            <div className="friends-subsection">
              <h3 className="subsection-header">Friends ({onlineFriends.length})</h3>
              {onlineFriends.map(friend => (
                <div key={friend.id} className="user-card online">
                  <div className="avatar-container">
                    <img 
                      src={friend.profilePicture || '/pfp.png'} 
                      alt={friend.username} 
                      className="user-avatar"
                    />
                    <span className="online-indicator"></span>
                  </div>
                  <div className="user-info">
                    <span className="username">{friend.username}</span>
                    <button 
                      className="message-button"
                      onClick={() => onStartChat(friend.id)}
                    >
                      <FontAwesomeIcon icon={faMessage} />
                    </button>
                  </div>
                </div>
              ))}
              {onlineFriends.length === 0 && (
                <p className="empty-state">No friends online right now</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'pending' && (
          <div className="friend-requests">
            {pendingRequests.map(request => (
              <div key={request.id} className="user-card">
                <img 
                  src={request.profilePicture || '/pfp.png'} 
                  alt={request.username} 
                  className="user-avatar"
                />
                <div className="user-info">
                  <span className="username">{request.username}</span>
                  <div className="friend-actions">
                    <button onClick={() => handleAcceptRequest(request.id)}>Accept</button>
                    <button onClick={() => handleRejectRequest(request.id)}>Reject</button>
                  </div>
                </div>
              </div>
            ))}
            {pendingRequests.length === 0 && <p>No pending friend requests</p>}
          </div>
        )}

        {activeTab === 'all' && (
          <div className="search-results">
            {searchResults.map(user => (
              <div key={user.id} className="user-card">
                <img 
                  src={user.profilePicture || '/pfp.png'} 
                  alt={user.username} 
                  className="user-avatar"
                />
                <div className="user-info">
                  <span className="username">{user.username}</span>
                  <div className="user-actions">
                    {pendingRequests.some(f => f.id === user.id && f.status === 'outgoing') ? (
                      <span className="request-sent-text">
                        <FontAwesomeIcon icon={faCheck} />
                        Request Sent
                      </span>
                    ) : friends.some(f => f.id === user.id) ? (
                      <span className="already-friends-text">
                        <FontAwesomeIcon icon={faUserFriends} />
                        Friends
                      </span>
                    ) : (
                      <button
                        className="add-friend-button"
                        onClick={() => handleAddFriend(user.id)}
                        disabled={user.friendStatus === 'pending'}
                      >
                        <FontAwesomeIcon icon={faUserPlus} />
                        Add Friend
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'blocked' && (
          <div className="blocked-users">
            <p>No blocked users</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserSearch; 