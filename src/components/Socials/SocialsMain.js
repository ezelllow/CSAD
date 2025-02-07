import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { database } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import Chat from '../Chat/Chat';
import UserSearch from './UserSearch';
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
} from '@fortawesome/free-solid-svg-icons';
import { library } from '@fortawesome/fontawesome-svg-core';
import DirectMessageChat from '../Chat/DirectMessageChat';
import ServerChat from '../Chat/ServerChat';
import firebase from 'firebase/compat/app';

// Add icons to library
library.add(faUserFriends, faCommentAlt, faSearch, faEllipsisV, faMessage, faCompass, faServer);

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
              // Get current user's friends list
              const currentUserData = data[currentUser.uid];
              const friendsList = currentUserData?.friends || [];

              const usersArray = Object.entries(data)
                .filter(([id]) => id !== currentUser.uid)
                .map(([id, user]) => ({
                  id,
                  ...user,
                  isFriend: friendsList.includes(id)
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
  const handleStartChat = useCallback(async (userId) => {
    try {
      // Create chat ID by sorting UIDs to ensure consistency
      const chatId = [currentUser.uid, userId].sort().join('-');
      
      // Get the other user's data
      const otherUserData = userData[userId];
      
      if (!otherUserData) {
        console.error('Could not find user data');
        return;
      }

      // Update direct messages data
      const chatRef = database.ref(`directMessages/${chatId}`);
      
      // First check if chat exists
      const chatSnapshot = await chatRef.once('value');
      if (!chatSnapshot.exists()) {
        // Only create new chat if it doesn't exist
        await chatRef.set({
          participants: {
            [currentUser.uid]: {
              id: currentUser.uid,
              username: currentUser.displayName || currentUser.email || 'You',
              profilePicture: currentUser.photoURL || '/pfp.png',
              role: currentUser.role || 'User'
            },
            [userId]: {
              id: userId,
              username: otherUserData.username,
              profilePicture: otherUserData.profilePicture || '/pfp.png',
              role: otherUserData.role || 'User'
            }
          },
          createdAt: Date.now(),
          lastUpdated: Date.now()
        });
      }

      // Switch to DMs tab and select the chat
      setActiveTab('dms');
      setSelectedDM(chatId);
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  }, [currentUser, userData]);

  // Update the direct messages effect
  useEffect(() => {
    if (!currentUser) return;

    const directMessagesRef = database.ref('directMessages');
    const query = directMessagesRef.orderByChild(`participants/${currentUser.uid}/id`).equalTo(currentUser.uid);

    query.on('value', (snapshot) => {
      const chats = snapshot.val();
      if (chats) {
        const chatArray = Object.entries(chats).map(([id, chat]) => {
          const otherUserId = Object.keys(chat.participants).find(uid => uid !== currentUser.uid);
          const otherUserInfo = chat.participants[otherUserId];
          
          return {
            id,
            ...chat,
            otherUserId,
            otherUser: otherUserInfo
          };
        });
        
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
    
    userRef.child('pendingFriends').on('value', (snapshot) => {
      const pendingData = snapshot.val() || [];
      setPendingFriends(pendingData);
    });

    userRef.child('blockedUsers').on('value', (snapshot) => {
      const blockedData = snapshot.val() || [];
      setBlockedUsers(blockedData);
    });

    return () => userRef.off();
  }, [currentUser]);

  // Update handleAddFriend to send a friend request instead of directly adding
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

      // Check if user is blocked
      if (blockedUsers.includes(targetUserId)) {
        setAddFriendError("You have blocked this user");
        return;
      }

      // Get target user's blocked list
      const targetBlockedSnapshot = await database.ref(`Users/${targetUserId}/blockedUsers`).once('value');
      const targetBlockedUsers = targetBlockedSnapshot.val() || [];
      
      if (targetBlockedUsers.includes(currentUser.uid)) {
        setAddFriendError("You cannot send a friend request to this user");
        return;
      }

      const updates = {};
      updates[`Users/${targetUserId}/pendingFriends`] = [...(targetUserData.pendingFriends || []), currentUser.uid];
      
      await database.ref().update(updates);
      setAddFriendSuccess(`Friend request sent to ${targetUserData.username}!`);
      setFriendUsername('');
      setTimeout(() => setShowAddFriend(false), 2000);

    } catch (error) {
      console.error('Error sending friend request:', error);
      setAddFriendError('Something went wrong. Please try again.');
    }
  };

  // Update the handleMenuClick function
  const handleMenuClick = (e, userId) => {
    e.stopPropagation(); // Prevent event bubbling
    
    // If clicking the same menu, close it
    if (activeMenu === userId) {
      setActiveMenu(null);
      return;
    }

    const buttonRect = e.currentTarget.getBoundingClientRect();
    setMenuPosition({
      top: buttonRect.top - 100, // Position above the button
      left: buttonRect.right - 150 // Align with right edge of button
    });
    setActiveMenu(userId);
  };

  // Update the handleAddFriendFromMenu function
  const handleAddFriendFromMenu = async (userId) => {
    try {
      // Get current user's data
      const userRef = database.ref(`Users/${currentUser.uid}`);
      const targetUserRef = database.ref(`Users/${userId}`);

      const [userSnapshot, targetSnapshot] = await Promise.all([
        userRef.once('value'),
        targetUserRef.once('value')
      ]);

      const userData = userSnapshot.val();
      const targetUserData = targetSnapshot.val();

      if (!targetUserData) {
        console.error("Couldn't find user");
        return;
      }

      // Check if already friends
      const currentFriends = userData.friends || [];
      if (currentFriends.includes(userId)) {
        console.error("Already friends with this user");
        return;
      }

      // Check if already pending
      const pendingFriends = targetUserData.pendingFriends || [];
      if (pendingFriends.includes(currentUser.uid)) {
        console.error("Friend request already sent");
        return;
      }

      // Add to target user's pending friends
      await targetUserRef.update({
        pendingFriends: [...pendingFriends, currentUser.uid]
      });

      // Add to current user's sent requests
      const currentSentRequests = userData.sentFriendRequests || [];
      await userRef.update({
        sentFriendRequests: [...currentSentRequests, userId]
      });

      // Close menu after sending request
      setActiveMenu(null);

    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  // Add useEffect to fetch pending friends
  useEffect(() => {
    if (!currentUser) return;

    const userRef = database.ref(`Users/${currentUser.uid}`);
    userRef.on('value', (snapshot) => {
      const userData = snapshot.val();
      if (userData) {
        // Get incoming friend requests
        setPendingFriends(userData.pendingFriends || []);
      }
    });

    return () => userRef.off();
  }, [currentUser]);

  // Update the handleAcceptFriend function
  const handleAcceptFriend = async (userId) => {
    try {
      const updates = {};
      
      // Add to current user's friends list
      const currentUserRef = database.ref(`Users/${currentUser.uid}`);
      const targetUserRef = database.ref(`Users/${userId}`);

      const [currentUserSnapshot, targetUserSnapshot] = await Promise.all([
        currentUserRef.once('value'),
        targetUserRef.once('value')
      ]);

      const currentUserData = currentUserSnapshot.val() || {};
      const targetUserData = targetUserSnapshot.val() || {};

      // Create new friends arrays
      const updatedCurrentFriends = [...(currentUserData.friends || []), userId];
      const updatedTargetFriends = [...(targetUserData.friends || []), currentUser.uid];

      // Update friends lists
      updates[`Users/${currentUser.uid}/friends`] = updatedCurrentFriends;
      updates[`Users/${userId}/friends`] = updatedTargetFriends;
      
      // Remove from pending lists
      updates[`Users/${currentUser.uid}/pendingFriends`] = pendingFriends.filter(id => id !== userId);
      
      // Remove from sent requests if exists
      if (targetUserData.sentFriendRequests) {
        updates[`Users/${userId}/sentFriendRequests`] = targetUserData.sentFriendRequests.filter(
          id => id !== currentUser.uid
        );
      }

      await database.ref().update(updates);
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  };

  // Add friend/unfriend handler
  const handleFriendAction = async (userId) => {
    try {
      // Remove friend logic
      const userRef = database.ref(`Users/${currentUser.uid}/friends`);
      const targetUserRef = database.ref(`Users/${userId}/friends`);
      
      await userRef.transaction(friends => {
        if (friends) {
          return friends.filter(id => id !== userId);
        }
        return friends;
      });
      
      await targetUserRef.transaction(friends => {
        if (friends) {
          return friends.filter(id => id !== currentUser.uid);
        }
        return friends;
      });
      
      setActiveMenu(null); // Close menu after action
    } catch (error) {
      console.error('Error removing friend:', error);
    }
  };

  // Add function to handle blocking users
  const handleBlockUser = async (userId) => {
    try {
      // Block user logic
      const blockedRef = database.ref(`Users/${currentUser.uid}/blocked`);
      await blockedRef.transaction(blocked => {
        if (!blocked) return [userId];
        if (!blocked.includes(userId)) {
          return [...blocked, userId];
        }
        return blocked;
      });
      
      setActiveMenu(null); // Close menu after action
    } catch (error) {
      console.error('Error blocking user:', error);
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
      const userRef = database.ref(`Users/${currentUser.uid}`);
      const updatedBlocked = blockedUsers.filter(id => id !== userId);
      await userRef.update({ blockedUsers: updatedBlocked });
    } catch (error) {
      console.error('Error unblocking user:', error);
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
                        onClick={() => setSelectedServer(server.id)}
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
                      <div className="search-input-wrapper">
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
                  {directMessages.map(chat => (
                    <div 
                      key={chat.id} 
                      className={`dm-item ${selectedDM === chat.id ? 'active' : ''}`}
                      onClick={() => setSelectedDM(chat.id)}
                    >
                      <img 
                        src={chat.otherUser?.profilePicture || "/pfp.png"} 
                        alt={chat.otherUser?.username} 
                        className="dm-avatar"
                      />
                      <div className="dm-info">
                        <span className="dm-name">{chat.otherUser?.username}</span>
                        <span className="dm-status">
                          {chat.lastMessage?.content 
                            ? `${chat.lastMessage.content.substring(0, 25)}${chat.lastMessage.content.length > 25 ? '...' : ''}`
                            : chat.otherUser?.role || 'User'}
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
                  ))}
                </div>
              </div>
              <div className="dm-chat">
                {selectedDM ? (
                  <DirectMessageChat 
                    chatId={selectedDM} 
                    otherUser={directMessages.find(dm => dm.id === selectedDM)?.otherUser}
                  />
                ) : (
                  <div className="dm-placeholder">
                    <div className="dm-placeholder-content">
                      <FontAwesomeIcon icon={faMessage} size="2x" />
                      <h3>Select a conversation</h3>
                      <p>Choose a friend to start chatting</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="friends-section">
              <div className="friends-header">
                <div className="friends-nav">
                  <button className="friends-nav-button active">
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
                {friendsView === 'all' && (
                  <div className="section">
                    <h3 className="section-header">
                      <FontAwesomeIcon icon={faCommentAlt} /> ALL USERS
                    </h3>
                    {users.map(user => {
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
                              onClick={() => handleStartChat(user.id)}
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
                              <div 
                                className="menu-backdrop" 
                                onClick={() => setActiveMenu(null)}
                              />
                              <div 
                                className="menu-dropdown"
                                style={{
                                  position: 'fixed',
                                  top: menuPosition.top,
                                  left: menuPosition.left
                                }}
                              >
                                {user.isFriend ? (
                                  <>
                                    <button 
                                      onClick={() => {
                                        handleFriendAction(user.id);
                                        setActiveMenu(null);
                                      }}
                                      className="unfriend"
                                    >
                                      Remove Friend
                                    </button>
                                    <button 
                                      onClick={() => {
                                        handleBlockUser(user.id);
                                        setActiveMenu(null);
                                      }}
                                      className="block"
                                    >
                                      Block
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button 
                                      onClick={() => {
                                        handleAddFriendFromMenu(user.id);
                                        setActiveMenu(null);
                                      }}
                                      className="add-friend"
                                    >
                                      Add Friend
                                    </button>
                                    <button 
                                      onClick={() => {
                                        handleBlockUser(user.id);
                                        setActiveMenu(null);
                                      }}
                                      className="block"
                                    >
                                      Block
                                    </button>
                                  </>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {friendsView === 'pending' && (
                  <div className="section">
                    <h3 className="section-header">
                      <FontAwesomeIcon icon={faUserFriends} /> PENDING FRIENDS
                    </h3>
                    {pendingFriends.map(userId => (
                      <div key={userId} className="friend-request">
                        <div className="friend-info">
                          <img src={userData[userId]?.profilePicture || "/pfp.png"} alt={userData[userId]?.username} />
                          <span>{userData[userId]?.username}</span>
                        </div>
                        <div className="request-actions">
                          <button onClick={() => handleAcceptFriend(userId)} className="accept-button">
                            Accept
                          </button>
                          <button onClick={() => handleRejectFriend(userId)} className="reject-button">
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {friendsView === 'blocked' && (
                  <div className="section">
                    <h3 className="section-header">
                      <FontAwesomeIcon icon={faUserFriends} /> BLOCKED USERS
                    </h3>
                    {blockedUsers.map(userId => (
                      <div key={userId} className="blocked-user">
                        <div className="friend-info">
                          <img src={userData[userId]?.profilePicture || "/pfp.png"} alt={userData[userId]?.username} />
                          <span>{userData[userId]?.username}</span>
                        </div>
                        <button onClick={() => handleUnblockUser(userId)} className="unblock-button">
                          Unblock
                        </button>
                      </div>
                    ))}
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