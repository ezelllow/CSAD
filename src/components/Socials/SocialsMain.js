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
} from '@fortawesome/free-solid-svg-icons';
import { library } from '@fortawesome/fontawesome-svg-core';
import DirectMessageChat from '../Chat/DirectMessageChat';

// Add icons to library
library.add(faUserFriends, faCommentAlt, faSearch, faEllipsisV, faMessage);

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

  // Memoize the Chat component
  const ServerChat = useMemo(() => <Chat />, []);

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
          usersRef.on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
              setUserData(data);
              const usersArray = Object.entries(data)
                .filter(([id]) => id !== currentUser.uid)
                .map(([id, user]) => ({
                  id,
                  ...user
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

  const handleAddFriend = async (e) => {
    e.preventDefault();
    setAddFriendError('');
    setAddFriendSuccess('');

    try {
      // First, get all users and find by username
      const usersRef = database.ref('Users');
      const snapshot = await usersRef.once('value');
      const allUsers = snapshot.val();
      
      // Find user with matching username (case insensitive)
      const targetUser = Object.entries(allUsers).find(([_, user]) => 
        user.username?.toLowerCase() === friendUsername.toLowerCase()
      );

      if (!targetUser) {
        setAddFriendError("Couldn't find a user with that username");
        return;
      }

      const [targetUserId, targetUserData] = targetUser;

      // Don't allow adding yourself
      if (targetUserId === currentUser.uid) {
        setAddFriendError("You can't add yourself as a friend");
        return;
      }

      try {
        // Get current user's data
        const currentUserRef = database.ref(`Users/${currentUser.uid}`);
        const currentUserSnapshot = await currentUserRef.once('value');
        const currentUserData = currentUserSnapshot.val() || {};
        
        // Initialize friends array if it doesn't exist
        if (!currentUserData.friends) {
          currentUserData.friends = [];
        }

        // Check if already friends
        if (currentUserData.friends.includes(targetUserId)) {
          setAddFriendError('You are already friends with this user');
          return;
        }

        // Update current user's friends list
        await currentUserRef.update({
          friends: [...currentUserData.friends, targetUserId]
        });

        // Get target user's data
        const targetUserRef = database.ref(`Users/${targetUserId}`);
        const targetUserSnapshot = await targetUserRef.once('value');
        const targetUserFullData = targetUserSnapshot.val() || {};
        
        // Initialize friends array if it doesn't exist
        if (!targetUserFullData.friends) {
          targetUserFullData.friends = [];
        }

        // Update target user's friends list
        await targetUserRef.update({
          friends: [...targetUserFullData.friends, currentUser.uid]
        });

        setAddFriendSuccess(`Successfully added ${targetUserData.username} as a friend!`);
        setFriendUsername('');
        setTimeout(() => setShowAddFriend(false), 2000);

      } catch (error) {
        console.error('Error updating friends lists:', error);
        setAddFriendError('Error updating friends lists. Please try again.');
      }

    } catch (error) {
      console.error('Error adding friend:', error);
      setAddFriendError('Something went wrong. Please try again.');
    }
  };

  // Add menu handler
  const handleMenuClick = useCallback((e, userId) => {
    e.stopPropagation(); // Prevent chat selection when clicking menu
    setActiveMenu(activeMenu === userId ? null : userId);
  }, [activeMenu]);

  // Add friend/unfriend handler
  const handleFriendAction = useCallback(async (userId, isFriend) => {
    try {
      const currentUserRef = database.ref(`Users/${currentUser.uid}`);
      const targetUserRef = database.ref(`Users/${userId}`);

      if (isFriend) {
        // Unfriend
        await currentUserRef.child('friends').transaction(friends => 
          (friends || []).filter(id => id !== userId)
        );
        await targetUserRef.child('friends').transaction(friends => 
          (friends || []).filter(id => id !== currentUser.uid)
        );
      } else {
        // Add friend
        await currentUserRef.child('friends').transaction(friends => 
          [...(friends || []), userId]
        );
        await targetUserRef.child('friends').transaction(friends => 
          [...(friends || []), currentUser.uid]
        );
      }
    } catch (error) {
      console.error('Error updating friend status:', error);
    }
  }, [currentUser]);

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
            ServerChat
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
                  <button className="friends-nav-button">All</button>
                  <button className="friends-nav-button">Pending</button>
                  <button className="friends-nav-button">Blocked</button>
                  <button 
                    className="friends-nav-button add-friend"
                    onClick={() => setShowAddFriend(true)}
                  >
                    Add Friend
                  </button>
                </div>
              </div>

              <div className="friends-content">
                <div className="search-container">
                  <div className="search-input-wrapper">
                    <FontAwesomeIcon icon={faSearch} className="search-icon" />
                    <input
                      type="text"
                      placeholder="Search"
                      className="friends-search-input"
                    />
                  </div>
                </div>

                <div className="friends-list">
                  {/* Recent Direct Messages Section */}
                  {directMessages.length > 0 && (
                    <div className="section">
                      <h3 className="section-header">
                        <FontAwesomeIcon icon={faCommentAlt} /> RECENT MESSAGES
                      </h3>
                      {directMessages.map(chat => {
                        const otherUser = userData[chat.otherUserId] || {};
                        return (
                          <div 
                            key={chat.id} 
                            className={`friend-item ${selectedChat === chat.id ? 'active' : ''}`}
                            onClick={() => handleChatSelect(chat.id)}
                          >
                            <div className="friend-info-container">
                              <img 
                                src={otherUser.profilePicture || "/pfp.png"} 
                                alt={otherUser.username} 
                                className="friend-avatar"
                              />
                              <div className="friend-info">
                                <span className="friend-name">{otherUser.username}</span>
                                <span className="friend-status">{otherUser.role || 'User'}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* All Users Section */}
                  <div className="section">
                    <h3 className="section-header">
                      <FontAwesomeIcon icon={faUserFriends} /> ALL USERS
                    </h3>
                    {users.map(user => (
                      <div 
                        key={user.id} 
                        className={`friend-item ${selectedChat === user.id ? 'active' : ''}`}
                        onClick={() => handleChatSelect(user.id)}
                      >
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
                            className="action-button chat"
                            onClick={(e) => handleChatButtonClick(e, user.id)}
                            title="Start Chat"
                          >
                            <FontAwesomeIcon icon={faMessage} />
                          </button>
                          <div className="menu-container">
                            <button 
                              className="action-button menu"
                              onClick={(e) => handleMenuClick(e, user.id)}
                              title="More Actions"
                            >
                              <FontAwesomeIcon icon={faEllipsisV} />
                            </button>
                            {activeMenu === user.id && (
                              <div className="menu-dropdown">
                                <button 
                                  onClick={() => handleFriendAction(user.id, user.isFriend)}
                                  className={user.isFriend ? 'unfriend' : 'add-friend'}
                                >
                                  {user.isFriend ? 'Unfriend' : 'Add Friend'}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
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