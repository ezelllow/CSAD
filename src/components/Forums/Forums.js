import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { database } from '../../firebase';
import CreatePost from './CreatePost';
import { useNavigate } from 'react-router-dom';
import './Forums.css';

export default function Forums() {
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [posts, setPosts] = useState([]);
  const [sortBy, setSortBy] = useState('hot');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [usersData, setUsersData] = useState({});
  const [userProfilePic, setUserProfilePic] = useState('../pfp.png'); // Default profile pic

  // Define communities
  const communities = [
    { id: 1, name: 'Food Rescue' },
    { id: 2, name: 'Recipes & Tips' },
    { id: 3, name: 'Community Events' }
  ];

  // Fetch posts and user data
  useEffect(() => {
    const postsRef = database.ref('posts');
    
    postsRef.on('value', async (snapshot) => {
      const data = snapshot.val();
      if (data) {
        let postsArray = Object.entries(data).map(([id, post]) => ({
          id,
          ...post
        }));

        // Fetch user data for each post
        const userPromises = postsArray.map(post => 
          database.ref(`Users/${post.authorId}`).once('value')
        );

        const userSnapshots = await Promise.all(userPromises);
        const userData = {};
        userSnapshots.forEach((snapshot, index) => {
          if (snapshot.exists()) {
            userData[postsArray[index].authorId] = snapshot.val();
          }
        });

        setUsersData(userData);

        // Apply sorting
        switch (sortBy) {
          case 'hot':
            postsArray.sort((a, b) => (b.likes || 0) + (b.commentCount || 0) - (a.likes || 0) - (a.commentCount || 0));
            break;
          case 'new':
            postsArray.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
          case 'top':
            postsArray.sort((a, b) => (b.likes || 0) - (a.likes || 0));
            break;
          default:
            break;
        }

        // Apply category filter
        if (selectedCategory !== 'all') {
          postsArray = postsArray.filter(post => post.community === selectedCategory);
        }

        setPosts(postsArray);
      }
    });

    return () => postsRef.off();
  }, [sortBy, selectedCategory]);
  
    // Fetch current user's profile picture
    useEffect(() => {
      if (currentUser) {
        const userRef = database.ref(`Users/${currentUser.uid}/profilePicture`);
        userRef.on('value', (snapshot) => {
          const profilePic = snapshot.val();
          setUserProfilePic(profilePic || '/pfp.png'); // Use default if no profile pic exists
        });
  
        return () => userRef.off();
      }
    }, [currentUser]);

  const handlePostClick = (postId) => {
    navigate(`/forums/post/${postId}`);
  };

  // Add state to track liked posts
  const [userLikes, setUserLikes] = useState({});

  // Fetch user's likes when component mounts
  useEffect(() => {
    if (!currentUser) return;

    const userLikesRef = database.ref(`Users/${currentUser.uid}/likes`);
    userLikesRef.on('value', (snapshot) => {
      const likes = snapshot.val() || {};
      setUserLikes(likes);
    });

    return () => userLikesRef.off();
  }, [currentUser]);

  const handleLike = async (postId, e) => {
    e.stopPropagation(); // Prevent post click event
    if (!currentUser) {
      alert("Please log in to like posts");
      return;
    }
    
    try {
      const userLikesRef = database.ref(`Users/${currentUser.uid}/likes/${postId}`);
      const postLikesRef = database.ref(`posts/${postId}/likes`);

      // Get current like status
      const likeSnapshot = await userLikesRef.once('value');
      const hasLiked = likeSnapshot.val();

      if (hasLiked) {
        await userLikesRef.remove();
        await postLikesRef.transaction(currentLikes => 
          currentLikes ? currentLikes - 1 : 0
        );
      } else {
        await userLikesRef.set(true);
        await postLikesRef.transaction(currentLikes => 
          (currentLikes || 0) + 1
        );
      }
    } catch (error) {
      console.error('Error handling like:', error);
    }
  };

  return (
    <div className="forums-container">
      <div className="forums-sidebar">
        <div className="sidebar-section">
          <h3>Categories</h3>
          {communities.map(community => (
            <div 
              key={community.id} 
              className={`filter-item ${selectedCategory === community.name ? 'active' : ''}`}
              onClick={() => setSelectedCategory(community.name)}
            >
              <span>{community.name}</span>
            </div>
          ))}
          <div 
            className={`filter-item ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            <span>All Categories</span>
          </div>
        </div>
      </div>

      <div className="forums-main">
        <div className="forums-header">
          <div className="forums-tabs">
            <button 
              className={sortBy === 'hot' ? 'active' : ''} 
              onClick={() => setSortBy('hot')}
            >
              Hot
            </button>
            <button 
              className={sortBy === 'new' ? 'active' : ''} 
              onClick={() => setSortBy('new')}
            >
              New
            </button>
            <button 
              className={sortBy === 'top' ? 'active' : ''} 
              onClick={() => setSortBy('top')}
            >
              Top
            </button>
          </div>
          <button className="create-post-btn" onClick={() => setShowCreatePost(true)}>
            + Create
          </button>
        </div>
        
        <div className="posts-grid">
          {posts.map(post => (
            <div 
              key={post.id} 
              className="post-card"
              onClick={() => handlePostClick(post.id)}
            >
              {post.imageUrl && (
                <div className="post-image">
                  <img src={post.imageUrl} alt={post.title} />
                </div>
              )}
              <div className="post-content">
                <div className="post-header">
                  <div className="post-author">
                    <img
                      src={usersData[post.authorId]?.profilePicture || "/pfp.png"}
                      alt="Profile"
                      className="author-avatar"
                    />
                    <div className="author-info">
                      <span className="author-name">
                        {usersData[post.authorId]?.username || 'Anonymous'}
                      </span>
                      <div className="post-meta">
                        <span className="post-community">{post.community}</span>
                        <span>•</span>
                        <span className="post-time">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className={`user-flair flair-${post.authorRole?.toLowerCase()}`}>
                    {post.authorRole}
                  </span>
                </div>
                <h3>{post.title}</h3>
                <p>{post.content}</p>
                <div className="post-footer">
                  <div className="post-stats">
                    <span 
                      onClick={(e) => handleLike(post.id, e)}
                      className={`like-button ${userLikes[post.id] ? 'active' : ''}`}
                    >
                      {userLikes[post.id] ? '❤️' : '🤍'} {post.likes || 0}
                    </span>
                    <span>💬 {post.commentCount || 0}</span>
                  </div>
                  <span className="post-time">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="forums-right-sidebar">
        <div className="create-section">
          <h3>Start a discussion</h3>
          <button className="create-thread-btn" onClick={() => setShowCreatePost(true)}>
            Start a discussion thread
          </button>
          <button className="ask-question-btn" onClick={() => setShowCreatePost(true)}>
            Ask a question
          </button>
          <button className="share-media-btn" onClick={() => setShowCreatePost(true)}>
            Share media
          </button>
          <button className="share-status-btn" onClick={() => setShowCreatePost(true)}>
            Share a status
          </button>
        </div>
        <div className="trending-communities">
          <h3>Trending Communities</h3>
          {communities.map(community => (
            <div 
              key={community.id} 
              className="community-item"
              onClick={() => setSelectedCategory(community.name)}
            >
              <img src="/images/food-rescue.png" alt={community.name} />
              <div className="community-info">
                <h4>{community.name}</h4>
                <p>Active Community</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showCreatePost && (
        <CreatePost 
          onClose={() => setShowCreatePost(false)} 
          communities={communities}
        />
      )}
    </div>
  );
} 