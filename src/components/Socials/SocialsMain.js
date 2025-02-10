import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { database } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import Chat from '../Chat/Chat';
import './SocialsMain.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUserFriends, 
  faCommentAlt,
  faSearch,
  faEllipsisV,
  faMessage,
  faCompass,
  faServer,
  faCheck,
  faTimes,
  faUserPlus,
} from '@fortawesome/free-solid-svg-icons';
import { library } from '@fortawesome/fontawesome-svg-core';
import DirectMessageChat from '../Chat/DirectMessageChat';
import ServerChat from '../Chat/ServerChat';
import firebase from 'firebase/compat/app';
import { getDatabase, ref, get, push } from 'firebase/database';

// Add icons to library
library.add(faUserFriends, faCommentAlt, faSearch, faEllipsisV, faMessage, faCompass, faServer, faCheck, faTimes, faUserPlus);

function SocialsMain() {
  const [activeTab, setActiveTab] = useState('servers');
  const [blinks, setBlinks] = useState([]);
  const [users, setUsers] = useState([]);
  const { currentUser } = useAuth();
  const [selectedChat, setSelectedChat] = useState(null);
  const [userData, setUserData] = useState({});
  const [showSearch, setShowSearch] = useState(false);
  const [showFriends, setShowFriends] = useState(false);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [friendUsername, setFriendUsername] = useState('');
  const [addFriendError, setAddFriendError] = useState('');
  const [addFriendSuccess, setAddFriendSuccess] = useState('');
  const [activeMenu, setActiveMenu] = useState(null);
  const [directMessages, setDirectMessages] = useState([]);
  const [selectedDM, setSelectedDM] = useState(null);
  const [servers, setServers] = useState([]);
  const [selectedServer, setSelectedServer] = useState(null);
  const [showExplore, setShowExplore] = useState(false);
  const [serverSearch, setServerSearch] = useState('');
  const [friendsView, setFriendsView] = useState('all'); // 'all', 'pending', 'blocked'
  const [pendingFriends, setPendingFriends] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [friends, setFriends] = useState([]);
  const [chatPartner, setChatPartner] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Separate useEffect for cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup all listeners when component unmounts
      database.ref('Users').off();
      database.ref('blinks/status').off();
      database.ref('directMessages').off();
    };
  }, []);

  // Data fetching useEffect
  useEffect(() => {
    if (!currentUser) return;

    // Cleanup function for current listeners
    const cleanup = () => {
      database.ref('Users').off();
      database.ref('blinks/status').off();
      database.ref('directMessages').off();
    };

    const setupListeners = async () => {
      try {
        // Clean up existing listeners before setting up new ones
        cleanup();

        // Only set up relevant listeners based on active tab
        if (activeTab === 'friends') {
          const usersRef = database.ref('Users');
          usersRef.on('value', async (snapshot) => {
            const data = snapshot.val();
            if (data) {
              // Get current user's friends and blocked users
              const currentUserData = data[currentUser.uid];
              const friendsList = currentUserData?.friends || {};
              const blockedList = currentUserData?.blockedUsers || {};

              // Filter users for DM list (excluding current user and blocked users)
              const usersArray = Object.entries(data)
                .filter(([id]) => 
                  id !== currentUser.uid && // Not current user
                  !blockedList[id] // Not blocked
                )
                .map(([id, user]) => ({
                  id,
                  ...user,
                  isFriend: !!friendsList[id],
                  isPending: false,
                  isBlocked: false
                }));
              
              setUsers(usersArray);
            }
          });
        } else if (activeTab === 'servers') {
          // Clear users data when switching to servers
          setUsers([]);
          setUserData({});
          
          const blinksRef = database.ref('blinks/status');
          blinksRef.on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
              const blinksArray = Object.entries(data).map(([id, blink]) => ({
                id,
                ...blink
              }));
              setBlinks(blinksArray);
            }
          });
        }
      } catch (error) {
        console.error('Error setting up listeners:', error);
      }
    };

    setupListeners();

    // Cleanup when dependencies change
    return cleanup;
  }, [currentUser, activeTab]);

  // Add effect to fetch user data for DMs
  useEffect(() => {
    if (!currentUser) return;

    const usersRef = database.ref('Users');
    usersRef.on('value', (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setUserData(data);
      }
    });

    return () => usersRef.off();
  }, [currentUser]);

  // Update the handleStartChat function
  const handleStartChat = async (userId) => {
    try {
      if (!currentUser || !userId) return;

      // Create a unique chat ID using both user IDs (sorted to ensure consistency)
      const chatId = [currentUser.uid, userId].sort().join('-');
      
      // Get user data for both participants
      const [partnerSnapshot, currentUserSnapshot] = await Promise.all([
        database.ref(`Users/${userId}`).once('value'),
        database.ref(`Users/${currentUser.uid}`).once('value')
      ]);

      const partnerData = partnerSnapshot.val();
      const currentUserData = currentUserSnapshot.val();

      if (!partnerData || !currentUserData) {
        console.error('Could not fetch user data');
        return;
      }

      // Create the participants object first
      const participants = {
        [currentUser.uid]: {
          id: currentUser.uid,
          username: currentUserData.username,
          profilePicture: currentUserData.profilePicture || '/default-avatar.jpg'
        },
        [userId]: {
          id: userId,
          username: partnerData.username,
          profilePicture: partnerData.profilePicture || '/default-avatar.jpg'
        }
      };

      // Create or update the chat in the database
      const chatRef = database.ref(`directMessages/${chatId}`);
      await chatRef.update({
        createdAt: Date.now(),
        lastUpdated: Date.now(),
        participants
      });

      // Update local state
      const newChat = {
        id: chatId,
        participants,
        otherUser: participants[userId],
        lastMessage: null,
        createdAt: Date.now()
      };

      setDirectMessages(prev => {
        const exists = prev.find(chat => chat.id === chatId);
        return exists ? prev : [...prev, newChat];
      });

      // Switch to messages view and select this chat
      setActiveTab('dms');
      setSelectedDM(chatId);
      setShowFriends(false);

    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };

  // Update the direct messages effect
  useEffect(() => {
    if (!currentUser) return;

    const directMessagesRef = database.ref('directMessages');
    const query = directMessagesRef.orderByChild(`participants/${currentUser.uid}/id`).equalTo(currentUser.uid);

    query.on('value', (snapshot) => {
      const chats = snapshot.val();
      if (chats) {
        const chatArray = Object.entries(chats).map(([id, chat]) => {
          // Add null check for chat and participants
          if (!chat || !chat.participants) {
            return null;
          }
          
          const otherUserId = Object.keys(chat.participants).find(uid => uid !== currentUser.uid);
          const otherUserInfo = otherUserId ? chat.participants[otherUserId] : null;
          
          if (!otherUserInfo) {
            return null;
          }
          
          return {
            id,
            ...chat,
            otherUserId,
            otherUser: otherUserInfo
          };
        }).filter(Boolean); // Remove any null entries
        
        // Sort by last message timestamp or creation time
        chatArray.sort((a, b) => {
          const aTime = a.lastMessage?.timestamp || a.lastUpdated || a.createdAt || 0;
          const bTime = b.lastMessage?.timestamp || b.lastUpdated || b.createdAt || 0;
          return bTime - aTime;
        });
        setDirectMessages(chatArray);
      } else {
        setDirectMessages([]);
      }
    });

    return () => query.off();
  }, [currentUser]);

  // Update handleTabChange to preserve selectedDM
  const handleTabChange = useCallback((tab) => {
    if (tab !== activeTab) {
      // Clean up data and listeners when switching tabs
      setUsers([]);
      setBlinks([]);
      // Don't reset selectedDM here
      setUserData({});
      
      // Remove listeners before switching tabs
      database.ref('Users').off();
      database.ref('blinks/status').off();
    }
    setActiveTab(tab);
    if (tab === 'friends') {
      setShowFriends(true);
    }
  }, [activeTab]);

  const handleChatSelect = useCallback((userId) => {
    setSelectedChat(userId);
  }, []);

  // Add chat button handler
  const handleChatButtonClick = useCallback((e, userId) => {
    e.stopPropagation(); // Prevent chat selection when clicking button
    handleStartChat(userId);
  }, [handleStartChat]);

  // Add this useEffect to fetch pending and blocked users
  useEffect(() => {
    if (!currentUser) return;

    const userRef = database.ref(`Users/${currentUser.uid}`);
    
    userRef.child('pendingFriends').on('value', async (snapshot) => {
      const pendingData = snapshot.val() || {};
      // Convert to array of user objects with request data
      const pendingArray = await Promise.all(
        Object.keys(pendingData).map(async (senderId) => {
          const userSnapshot = await database.ref(`Users/${senderId}`).once('value');
          const userData = userSnapshot.val();
          return userData ? { 
            id: senderId,
            username: userData.username,
            profilePicture: userData.profilePicture,
            status: pendingData[senderId] 
          } : null;
        })
      );
      setPendingFriends(pendingArray.filter(Boolean)); // Filter out null entries
    });

    userRef.child('blockedUsers').on('value', async (snapshot) => {
      const blockedData = snapshot.val() || {};
      // Convert object to array of user objects
      const blockedArray = await Promise.all(
        Object.keys(blockedData).map(async (userId) => {
          const userSnapshot = await database.ref(`Users/${userId}`).once('value');
          return {
            id: userId,
            ...userSnapshot.val()
          };
        })
      );
      setBlockedUsers(blockedArray);
    });

    return () => userRef.off();
  }, [currentUser]);

  // Update the useEffect for pending friends to better handle the data structure
  useEffect(() => {
    if (!currentUser) return;

    const userRef = database.ref(`Users/${currentUser.uid}`);
    
    const fetchPendingRequests = async () => {
      try {
        // Get both pending and outgoing requests
        const [pendingSnapshot, outgoingSnapshot] = await Promise.all([
          database.ref(`Users/${currentUser.uid}/pendingFriends`).once('value'),
          database.ref(`Users/${currentUser.uid}/outgoingRequests`).once('value')
        ]);

        const pendingData = pendingSnapshot.val() || {};
        const outgoingData = outgoingSnapshot.val() || {};

        // Only process valid requests (non-null values)
        const validPending = Object.entries(pendingData)
          .filter(([_, status]) => status === 'pending')
          .map(([id]) => id);

        const validOutgoing = Object.entries(outgoingData)
          .filter(([_, status]) => status === true)
          .map(([id]) => id);

        // Fetch user data for valid requests
        const requests = await Promise.all([
          ...validPending.map(async (senderId) => {
            const userSnapshot = await database.ref(`Users/${senderId}`).once('value');
            const userData = userSnapshot.val();
            return userData ? {
              id: senderId,
              status: 'incoming',
              ...userData
            } : null;
          }),
          ...validOutgoing.map(async (receiverId) => {
            const userSnapshot = await database.ref(`Users/${receiverId}`).once('value');
            const userData = userSnapshot.val();
            return userData ? {
              id: receiverId,
              status: 'outgoing',
              ...userData
            } : null;
          })
        ]);

        // Filter out null values and set state
        setPendingFriends(requests.filter(Boolean));
      } catch (error) {
        console.error('Error fetching requests:', error);
      }
    };

    // Set up real-time listener for changes
    const pendingListener = userRef.child('pendingFriends').on('value', fetchPendingRequests);
    const outgoingListener = userRef.child('outgoingRequests').on('value', fetchPendingRequests);

    return () => {
      userRef.child('pendingFriends').off('value', pendingListener);
      userRef.child('outgoingRequests').off('value', outgoingListener);
    };
  }, [currentUser]);

  // Add this useEffect to fetch friends
  useEffect(() => {
    if (!currentUser) return;

    const userRef = database.ref(`Users/${currentUser.uid}/friends`);
    
    userRef.on('value', async (snapshot) => {
      const friendsData = snapshot.val() || {};
      // Convert to array of user objects
      const friendsArray = await Promise.all(
        Object.keys(friendsData).map(async (friendId) => {
          const userSnapshot = await database.ref(`Users/${friendId}`).once('value');
          const userData = userSnapshot.val();
          return userData ? {
            id: friendId,
            username: userData.username,
            profilePicture: userData.profilePicture,
            status: userData.status || 'offline'
          } : null;
        })
      );
      setFriends(friendsArray.filter(Boolean));
    });

    return () => userRef.off();
  }, [currentUser]);

  // Update the handleAcceptFriend function
  const handleAcceptFriend = async (userId) => {
    try {
      const updates = {};
      // Add to current user's friends list as an object entry
      updates[`Users/${currentUser.uid}/friends/${userId}`] = true;
      // Add to other user's friends list as an object entry
      updates[`Users/${userId}/friends/${currentUser.uid}`] = true;
      // Remove from pending requests
      updates[`Users/${currentUser.uid}/pendingFriends/${userId}`] = null;

      await database.ref().update(updates);
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  };

  // Update the handleFriendAction function
  const handleFriendAction = async (userId) => {
    try {
      // Remove friend from both users' friend lists
      const updates = {};
      updates[`Users/${currentUser.uid}/friends/${userId}`] = null;  // Use null to remove the entry
      updates[`Users/${userId}/friends/${currentUser.uid}`] = null;
      
      await database.ref().update(updates);
      setActiveMenu(null);
    } catch (error) {
      console.error('Error removing friend:', error);
    }
  };

  // Update the handleBlockUser function
  const handleBlockUser = async (userId) => {
    try {
      // Get user data before blocking
      const userSnapshot = await database.ref(`Users/${userId}`).once('value');
      const userData = userSnapshot.val();

      // Create updates object for all changes
      const updates = {};
      
      // Add user to blocked list
      updates[`Users/${currentUser.uid}/blockedUsers/${userId}`] = true;
      
      // Remove from friends list if they are friends
      updates[`Users/${currentUser.uid}/friends/${userId}`] = null;
      updates[`Users/${userId}/friends/${currentUser.uid}`] = null;
      
      // Remove any pending friend requests in both directions
      updates[`Users/${currentUser.uid}/pendingFriends/${userId}`] = null;
      updates[`Users/${userId}/pendingFriends/${currentUser.uid}`] = null;
      updates[`Users/${currentUser.uid}/outgoingRequests/${userId}`] = null;
      updates[`Users/${userId}/outgoingRequests/${currentUser.uid}`] = null;

      // Apply all updates atomically
      await database.ref().update(updates);
      
      // Update all relevant UI states
      setBlockedUsers(prev => {
        const isAlreadyBlocked = prev.some(user => user.id === userId);
        if (isAlreadyBlocked) return prev;
        return [...prev, { id: userId, ...userData }];
      });
      setPendingFriends(prev => prev.filter(friend => friend.id !== userId));
      setFriends(prev => prev.filter(friend => friend.id !== userId));
      setUsers(prev => prev.filter(user => user.id !== userId)); // Remove from all users list
      
      // Close the menu
      setActiveMenu(null);

    } catch (error) {
      console.error("Error blocking user:", error);
    }
  };

  // Add effect to fetch servers
  useEffect(() => {
    if (!currentUser || activeTab !== 'servers') return;

    const serversRef = database.ref('Servers');
    serversRef.on('value', (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const serversArray = Object.entries(data).map(([id, server]) => ({
          id,
          ...server
        }));
        setServers(serversArray);
      }
    });

    return () => serversRef.off();
  }, [currentUser, activeTab]);

  // Add server join/leave handler
  const handleJoinServer = async (serverId) => {
    try {
      // First check if the server exists and has channels
      const serverRef = database.ref(`Servers/${serverId}`);
      const serverSnapshot = await serverRef.once('value');
      const serverData = serverSnapshot.val();

      if (!serverData.channels) {
        // Initialize channels if they don't exist
        await serverRef.child('channels').set({
          general: {
            id: 'general',
            name: 'general',
            createdAt: Date.now(),
            type: 'text'
          }
        });
      }

      // Add user to members
      await serverRef.child(`members/${currentUser.uid}`).set({
        joinedAt: Date.now(),
        role: 'member'
      });

      setSelectedServer(serverId);
      setShowExplore(false);
    } catch (error) {
      console.error('Error joining server:', error);
    }
  };

  // Add search filter function
  const filteredServers = servers.filter(server => 
    server.name.toLowerCase().includes(serverSearch.toLowerCase()) ||
    server.description?.toLowerCase().includes(serverSearch.toLowerCase())
  );

  // Add function to handle rejecting friend requests
  const handleRejectFriend = async (userId) => {
    try {
      const userRef = database.ref(`Users/${currentUser.uid}`);
      const updatedPending = pendingFriends.filter(id => id !== userId);
      await userRef.update({ pendingFriends: updatedPending });
    } catch (error) {
      console.error('Error rejecting friend request:', error);
    }
  };

  // Add function to handle unblocking users
  const handleUnblockUser = async (userId) => {
    try {
      // Remove from blocked users list
      await database.ref(`Users/${currentUser.uid}/blockedUsers/${userId}`).remove();
      
      // Update local states
      setBlockedUsers(prev => prev.filter(user => user.id !== userId));
      
      // Get the user data to add back to all users list
      const userSnapshot = await database.ref(`Users/${userId}`).once('value');
      const userData = userSnapshot.val();
      
      if (userData) {
        setUsers(prev => {
          // Check if user is already in the list
          const exists = prev.some(user => user.id === userId);
          if (!exists) {
            return [...prev, {
              id: userId,
              ...userData,
              isFriend: false,
              isPending: false,
              isBlocked: false
            }];
          }
          return prev;
        });
      }
    } catch (error) {
      console.error('Error unblocking user:', error);
    }
  };

  // Add function to handle canceling outgoing requests
  const handleCancelOutgoingRequest = async (userId) => {
    try {
      const updates = {};
      // Remove from current user's outgoing requests
      updates[`Users/${currentUser.uid}/outgoingRequests/${userId}`] = null;
      // Remove from other user's pending requests
      updates[`Users/${userId}/pendingFriends/${currentUser.uid}`] = null;

      await database.ref().update(updates);
      
      // Update local state
      setPendingFriends(prev => prev.filter(friend => friend.id !== userId));
    } catch (error) {
      console.error('Error canceling friend request:', error);
    }
  };

  // Update the handleAddFriend function
  const handleAddFriend = async (e) => {
    e.preventDefault();
    setAddFriendError('');
    setAddFriendSuccess('');

    try {
      const usersRef = database.ref('Users');
      const snapshot = await usersRef.once('value');
      const allUsers = snapshot.val();
      
      const targetUser = Object.entries(allUsers).find(([_, user]) => 
        user.username?.toLowerCase() === friendUsername.toLowerCase()
      );

      if (!targetUser) {
        setAddFriendError("Couldn't find a user with that username");
        return;
      }

      const [targetUserId, targetUserData] = targetUser;

      if (targetUserId === currentUser.uid) {
        setAddFriendError("You can't add yourself as a friend");
        return;
      }

      // Check if already in pending requests
      if (pendingFriends.some(friend => friend.id === targetUserId)) {
        setAddFriendError("Friend request already sent");
        return;
      }

      const updates = {};
      // Add to target user's pending requests
      updates[`Users/${targetUserId}/pendingFriends/${currentUser.uid}`] = 'pending';
      // Add to current user's outgoing requests
      updates[`Users/${currentUser.uid}/outgoingRequests/${targetUserId}`] = true;
      
      await database.ref().update(updates);
      
      setAddFriendSuccess(`Friend request sent to ${targetUserData.username}!`);
      setFriendUsername('');
      setFriendsView('pending');

      // Close modal after a delay
      setTimeout(() => {
        setShowAddFriend(false);
        setAddFriendSuccess('');
      }, 2000);

    } catch (error) {
      console.error('Error sending friend request:', error);
      setAddFriendError('Something went wrong. Please try again.');
    }
  };

  // Update the handleMenuClick function
  const handleMenuClick = (e, userId) => {
    e.preventDefault();
    
    console.log('Menu Click:', {
      userId,
      currentActiveMenu: activeMenu,
      clickEvent: e,
      menuPosition: {
        x: e.clientX,
        y: e.clientY
      }
    });

    setActiveMenu(prevMenu => {
      const newMenu = prevMenu === userId ? null : userId;
      console.log('Setting Active Menu:', {
        previousMenu: prevMenu,
        newMenu: newMenu,
        userId
      });
      return newMenu;
    });

    // Add delay to check state update
    setTimeout(() => {
      console.log("🔄 After state update: Active Menu should be:", activeMenu);
    }, 200);
  };

  // Update the handleAddFriendFromMenu function
  const handleAddFriendFromMenu = async (userId) => {
    try {
      // Check for existing requests first
      const existingRequest = pendingFriends.find(
        req => req.id === userId && req.status === 'outgoing'
      );
      if (existingRequest) {
        alert('Friend request already sent');
        return;
      }

      // Optimistic UI update
      const tempRequest = {
        id: userId,
        status: 'outgoing',
        username: users.find(u => u.id === userId)?.username,
        profilePicture: users.find(u => u.id === userId)?.profilePicture
      };
      setPendingFriends(prev => [...prev, tempRequest]);

      // Firebase transaction
      const updates = {};
      updates[`Users/${userId}/pendingFriends/${currentUser.uid}`] = 'pending';
      updates[`Users/${currentUser.uid}/outgoingRequests/${userId}`] = true;
      
      await database.ref().update(updates);

    } catch (error) {
      // Rollback on error
      setPendingFriends(prev => prev.filter(req => req.id !== userId));
      console.error("Error sending friend request:", error);
    }
  };

  // Update the handleSendFriendRequest function to clean up old requests
  const handleSendFriendRequest = async (recipientId) => {
    if (!currentUser) return;

    try {
      const db = getDatabase();
      
      // Clean up any existing requests first
      const updates = {};
      updates[`Users/${currentUser.uid}/outgoingRequests/${recipientId}`] = true;
      updates[`Users/${recipientId}/pendingFriends/${currentUser.uid}`] = 'pending';
      
      // Remove any old/invalid requests
      updates[`Users/${currentUser.uid}/friends/${recipientId}`] = null;
      updates[`Users/${recipientId}/friends/${currentUser.uid}`] = null;
      
      await database.ref().update(updates);
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  // Add the search functionality
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    
    if (e.target.value.length < 1) {
      setSearchResults([]);
      return;
    }

    // Filter locally
    const results = users.filter(user => 
      user.username?.toLowerCase().includes(e.target.value.toLowerCase()) ||
      user.email?.toLowerCase().includes(e.target.value.toLowerCase())
    );

    setSearchResults(results);
  };

  // Add this function with your other handler functions
  const handleRemoveFriend = async (friendId) => {
    if (!currentUser) return;

    try {
      // Remove from both users' friends lists
      const updates = {};
      updates[`Users/${currentUser.uid}/friends/${friendId}`] = null;
      updates[`Users/${friendId}/friends/${currentUser.uid}`] = null;

      // Update the database
      await database.ref().update(updates);

      // Update local state
      setFriends(prev => prev.filter(friend => friend.id !== friendId));
      
    } catch (error) {
      console.error('Error removing friend:', error);
    }
  };

  return (
    <div className="socials-main">
      <div className="socials-content">
        <div className="socials-tabs">
          <button 
            className={`tab-button ${activeTab === 'servers' ? 'active' : ''}`}
            onClick={() => handleTabChange('servers')}
          >
            <FontAwesomeIcon icon={faCommentAlt} /> Servers
          </button>
          <button 
            className={`tab-button ${activeTab === 'dms' ? 'active' : ''}`}
            onClick={() => handleTabChange('dms')}
          >
            <FontAwesomeIcon icon={faMessage} /> Direct Messages
          </button>
          <button 
            className={`tab-button ${activeTab === 'friends' ? 'active' : ''}`}
            onClick={() => handleTabChange('friends')}
          >
            <FontAwesomeIcon icon={faUserFriends} /> Friends
          </button>
        </div>

        <div className="content-area">
          {activeTab === 'servers' ? (
            <div className="servers-container">
              <div className="servers-sidebar">
                <div className="servers-header">
                  <h3>SERVERS</h3>
                  <button 
                    className="explore-button"
                    onClick={() => setShowExplore(true)}
                  >
                    <FontAwesomeIcon icon={faCompass} /> Explore
                  </button>
                </div>
                
                <div className="servers-list">
                  {servers
                    .filter(server => server.members?.[currentUser.uid])
                    .map(server => (
                      <div 
                        key={server.id}
                        className={`server-item ${selectedServer === server.id ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedServer(server.id);
                          setShowExplore(false);
                        }}
                      >
                        <img 
                          src={server.icon || "/server-icon.png"} 
                          alt={server.name} 
                          className="server-icon"
                        />
                        <div className="server-info">
                          <span className="server-name">{server.name}</span>
                          <span className="server-member-count">
                            {Object.keys(server.members || {}).length} members
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {showExplore ? (
                <div className="explore-servers">
                  <div className="explore-header">
                    <h2>Explore Servers</h2>
                    <div className="search-container">
                      <FontAwesomeIcon icon={faSearch} className="search-icon" />
                      <input 
                        type="text" 
                        value={serverSearch}
                        onChange={(e) => setServerSearch(e.target.value)}
                        placeholder="Search servers..."
                        className="server-search"
                      />
                    </div>
                  </div>

                  <div className="servers-grid">
                    {filteredServers.map(server => (
                      <div key={server.id} className="server-card">
                        <img 
                          src={server.icon || "/server-icon.png"} 
                          alt={server.name} 
                          className="server-card-icon"
                        />
                        <div className="server-card-info">
                          <h3>{server.name}</h3>
                          <p>{server.description}</p>
                          <div className="server-card-stats">
                            <span>{Object.keys(server.members || {}).length} members</span>
                            <span>{Object.keys(server.channels || {}).length} channels</span>
                          </div>
                        </div>
                        <button 
                          className={`join-button ${server.members?.[currentUser.uid] ? 'joined' : ''}`}
                          onClick={() => handleJoinServer(server.id)}
                          disabled={server.members?.[currentUser.uid]}
                        >
                          {server.members?.[currentUser.uid] ? 'Joined' : 'Join'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : selectedServer ? (
                <ServerChat serverId={selectedServer} />
              ) : (
                <div className="select-server-placeholder">
                  <FontAwesomeIcon icon={faServer} size="2x" />
                  <h3>Select a Server</h3>
                  <p>Choose a server to start chatting</p>
                </div>
              )}
            </div>
          ) : activeTab === 'dms' ? (
            <div className="direct-messages-container">
              <div className="dm-sidebar">
                <div className="dm-header">
                  <h3>Direct Messages</h3>
                </div>
                <div className="dm-list">
                  {directMessages.map(chat => {
                    const otherParticipant = Object.values(chat.participants)
                      .find(p => p.id !== currentUser.uid);
                      
                    return (
                      <div 
                        key={chat.id} 
                        className={`dm-item ${selectedDM === chat.id ? 'active' : ''}`}
                        onClick={() => setSelectedDM(chat.id)}
                      >
                        <img 
                          src={otherParticipant?.profilePicture || "/pfp.png"} 
                          alt={otherParticipant?.username} 
                          className="dm-avatar"
                        />
                        <div className="dm-info">
                          <span className="dm-name">{otherParticipant?.username}</span>
                          <span className="dm-status">
                            {chat.lastMessage?.content 
                              ? `${chat.lastMessage.content.substring(0, 25)}${chat.lastMessage.content.length > 25 ? '...' : ''}`
                              : ''}
                          </span>
                        </div>
                        {chat.lastMessage?.timestamp && (
                          <span className="dm-timestamp">
                            {new Date(chat.lastMessage.timestamp).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="dm-chat">
                {selectedDM && (
                  <DirectMessageChat 
                    chatId={selectedDM}
                    otherParticipant={directMessages.find(chat => 
                      chat.id === selectedDM
                    )?.otherUser}
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="friends-section">
              <div className="friends-header">
                <div className="friends-nav">
                  <button 
                    className={`friends-nav-button ${friendsView === 'online' ? 'active' : ''}`}
                    onClick={() => setFriendsView('online')}
                  >
                    <FontAwesomeIcon icon={faUserFriends} /> Online
                  </button>
                  <button 
                    className={`friends-nav-button ${friendsView === 'all' ? 'active' : ''}`}
                    onClick={() => setFriendsView('all')}
                  >
                    All
                  </button>
                  <button 
                    className={`friends-nav-button ${friendsView === 'pending' ? 'active' : ''}`}
                    onClick={() => setFriendsView('pending')}
                  >
                    Pending ({pendingFriends.length})
                  </button>
                  <button 
                    className={`friends-nav-button ${friendsView === 'blocked' ? 'active' : ''}`}
                    onClick={() => setFriendsView('blocked')}
                  >
                    Blocked ({blockedUsers.length})
                  </button>
                  <button 
                    className="friends-nav-button add-friend"
                    onClick={() => setShowAddFriend(true)}
                  >
                    Add Friend
                  </button>
                </div>
              </div>

              <div className="friends-content">
                {friendsView === 'online' && (
                  <div className="section">
                    <h3 className="section-header">
                      <FontAwesomeIcon icon={faUserFriends} />
                      <span>FRIENDS — {friends.length}</span>
                    </h3>
                    <div className="friends-list">
                      {friends.map(friend => (
                        <div key={friend.id} className="friend-item">
                          <div className="friend-info-container">
                            <img 
                              src={friend.profilePicture || '/pfp.png'} 
                              alt={friend.username} 
                              className="friend-avatar"
                            />
                            <div className="friend-info">
                              <span className="friend-name">{friend.username}</span>
                              <span className="friend-status">{friend.status}</span>
                            </div>
                          </div>
                          <div className="friend-actions">
                            <button 
                              className="action-button message"
                              onClick={() => handleStartChat(friend.id)}
                            >
                              <FontAwesomeIcon icon={faMessage} />
                            </button>
                            <button 
                              className="action-button menu"
                              onClick={(e) => handleMenuClick(e, friend.id)}
                            >
                              <FontAwesomeIcon icon={faEllipsisV} />
                            </button>
                          </div>
                          {activeMenu === friend.id && (
                            <>
                              <div className="menu-backdrop" onClick={() => setActiveMenu(null)} />
                              <div 
                                className="menu-dropdown" 
                                key={`${activeMenu}-${friend.id}`} 
                                onClick={(e) => e.stopPropagation()}
                              >
                                {console.log("✅ Rendering `.menu-dropdown` for:", friend.id, "ActiveMenu:", activeMenu)}
                                <div className="menu-dropdown-section">
                                  {console.log("🛠 Rendering `.menu-dropdown-section` for:", friend.id)}
                                  <button 
                                    onClick={() => {
                                      console.log("Removing friend:", friend.id);
                                      handleRemoveFriend(friend.id);
                                      setActiveMenu(null);
                                    }} 
                                    className="unfriend"
                                  >
                                    Remove Friend
                                  </button>
                                  <button 
                                    onClick={() => {
                                      console.log("Blocking user:", friend.id);
                                      handleBlockUser(friend.id);
                                      setActiveMenu(null);
                                    }} 
                                    className="block"
                                  >
                                    Block
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {friendsView === 'all' && (
                  <div className="section">
                    <h3 className="section-header">
                      <FontAwesomeIcon icon={faCommentAlt} /> ALL USERS
                    </h3>
                    <div className="search-container">
                      <FontAwesomeIcon icon={faSearch} className="search-icon" />
                      <input
                        type="text"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={handleSearch}
                        className="search-input"
                      />
                    </div>
                    <div className="users-list">
                      {(searchQuery ? searchResults : users).map(user => {
                        if (user.id === currentUser.uid) return null; // Don't show current user
                        
                        return (
                          <div key={user.id} className="friend-item">
                            <div className="friend-info-container">
                              <img 
                                src={user.profilePicture || "/pfp.png"} 
                                alt={user.username} 
                                className="friend-avatar"
                              />
                              <div className="friend-info">
                                <span className="friend-name">{user.username}</span>
                                <span className="friend-status">{user.role || 'User'}</span>
                              </div>
                            </div>
                            <div className="friend-actions">
                              <button 
                                className="action-button message"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartChat(user.id);
                                }}
                              >
                                <FontAwesomeIcon icon={faMessage} />
                              </button>
                              <button 
                                className="action-button menu"
                                onClick={(e) => handleMenuClick(e, user.id)}
                              >
                                <FontAwesomeIcon icon={faEllipsisV} />
                              </button>
                            </div>
                            {activeMenu === user.id && (
                              <>
                                <div className="menu-backdrop" onClick={() => setActiveMenu(null)} />
                                <div 
                                  className="menu-dropdown" 
                                  key={`${activeMenu}-${user.id}`} 
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {console.log("✅ Rendering `.menu-dropdown` for:", user.id, "ActiveMenu:", activeMenu)}
                                  <div className="menu-dropdown-section">
                                    {console.log("🛠 Rendering `.menu-dropdown-section` for:", user.id)}
                                    <button 
                                      onClick={() => {
                                        console.log("Adding friend:", user.id);
                                        handleAddFriendFromMenu(user.id);
                                        setActiveMenu(null);
                                      }}
                                      className={pendingFriends.some(f => f.id === user.id && f.status === 'outgoing') ? 'pending' : 'add-friend'}
                                      disabled={pendingFriends.some(f => f.id === user.id && f.status === 'outgoing')}
                                    >
                                      {pendingFriends.some(f => f.id === user.id && f.status === 'outgoing') ? 'Request Sent' : 'Add Friend'}
                                    </button>
                                    <button 
                                      onClick={() => {
                                        console.log("Blocking user:", user.id);
                                        handleBlockUser(user.id);
                                        setActiveMenu(null);
                                      }}
                                      className={user.isBlocked ? 'blocked' : 'block'}
                                    >
                                      {user.isBlocked ? 'Blocked' : 'Block'}
                                    </button>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {friendsView === 'pending' && (
                  <>
                    {/* Incoming Requests Section */}
                    <div className="section">
                      <h3 className="section-header">
                        INCOMING REQUESTS — {pendingFriends.filter(req => req.status === 'incoming').length}
                      </h3>
                      <div className="pending-requests">
                        {pendingFriends
                          .filter(request => request.status === 'incoming')
                          .map(request => (
                            <div key={request.id} className="pending-request-item">
                              <div className="user-info">
                                <img 
                                  src={request.profilePicture || '/pfp.png'} 
                                  alt={request.username} 
                                  className="user-avatar"
                                />
                                <div className="user-details">
                                  <span className="username">{request.username}</span>
                                  <span className="request-type">Incoming Friend Request</span>
                                </div>
                              </div>
                              <div className="request-actions">
                                <button 
                                  className="accept-button"
                                  onClick={() => handleAcceptFriend(request.id)}
                                >
                                  <FontAwesomeIcon icon={faCheck} />
                                </button>
                                <button 
                                  className="reject-button"
                                  onClick={() => handleRejectFriend(request.id)}
                                >
                                  <FontAwesomeIcon icon={faTimes} />
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Outgoing Requests Section */}
                    <div className="section">
                      <h3 className="section-header">
                        OUTGOING REQUESTS — {pendingFriends.filter(req => req.status === 'outgoing').length}
                      </h3>
                      <div className="pending-requests">
                        {pendingFriends
                          .filter(request => request.status === 'outgoing')
                          .map(request => (
                            <div key={request.id} className="pending-request-item">
                              <div className="user-info">
                                <img 
                                  src={request.profilePicture || '/pfp.png'} 
                                  alt={request.username} 
                                  className="user-avatar"
                                />
                                <div className="user-details">
                                  <span className="username">{request.username}</span>
                                  <span className="request-type">Outgoing Friend Request</span>
                                </div>
                              </div>
                              <div className="request-actions">
                                <button 
                                  className="reject-button"
                                  onClick={() => handleCancelOutgoingRequest(request.id)}
                                >
                                  <FontAwesomeIcon icon={faTimes} />
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </>
                )}

                {friendsView === 'blocked' && (
                  <div className="section">
                    <h3 className="section-header">
                      BLOCKED USERS — {blockedUsers.length}
                    </h3>
                    <div className="blocked-users">
                      {blockedUsers.map(user => (
                        <div key={user.id} className="blocked-user-item">
                          <img 
                            src={user.profilePicture || '/pfp.png'} 
                            alt={user.username} 
                            className="blocked-user-avatar"
                          />
                          <div className="blocked-user-info">
                            <span className="blocked-user-name">{user.username}</span>
                            <span className="blocked-label">Blocked</span>
                          </div>
                          <button 
                            className="unblock-button"
                            onClick={() => handleUnblockUser(user.id)}
                          >
                            Unblock
                          </button>
                        </div>
                      ))}
                      {blockedUsers.length === 0 && (
                        <div className="empty-state">
                          <p>You haven't blocked anyone</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showAddFriend && (
        <div className="modal-overlay" onClick={() => setShowAddFriend(false)}>
          <div className="add-friend-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Friend</h3>
              <button 
                className="close-button"
                onClick={() => setShowAddFriend(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddFriend}>
              <div className="modal-content">
                <p className="modal-description">
                  You can add friends with their HarvestHub username.
                </p>
                <input
                  type="text"
                  placeholder="Enter a username"
                  value={friendUsername}
                  onChange={(e) => setFriendUsername(e.target.value)}
                  className="friend-input"
                  autoFocus
                />
                {addFriendError && (
                  <p className="error-message">{addFriendError}</p>
                )}
                {addFriendSuccess && (
                  <p className="success-message">{addFriendSuccess}</p>
                )}
              </div>
              <div className="modal-footer">
                <button type="submit" className="send-friend-request">
                  Send Friend Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SocialsMain; 