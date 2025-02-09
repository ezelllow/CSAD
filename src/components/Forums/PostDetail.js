import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { database } from '../../firebase';
import './PostDetail.css';

export default function PostDetail() {
  const { postId } = useParams();
  const { currentUser } = useAuth();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState({});
  const [showMenu, setShowMenu] = useState(false);
  const [postLikes, setPostLikes] = useState({});
  const [commentLikes, setCommentLikes] = useState({});
  const navigate = useNavigate();

  // Move fetchedUserData outside useEffect to persist between renders
  const fetchUserData = async (userId) => {
    if (!userId) return null;
    try {
      const userRef = database.ref(`Users/${userId}`);
      const snapshot = await userRef.once('value');
      return snapshot.val();
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  };

  useEffect(() => {
    const postRef = database.ref(`posts/${postId}`);
    const commentsRef = database.ref(`comments/${postId}`);

    const fetchData = async () => {
      // Fetch post data
      const postSnapshot = await postRef.once('value');
      const postData = { id: postSnapshot.key, ...postSnapshot.val() };
      setPost(postData);

      // Fetch post author data
      if (postData.authorId) {
        const authorData = await fetchUserData(postData.authorId);
        if (authorData) {
          setUserData(prev => ({
            ...prev,
            [postData.authorId]: authorData
          }));
        }
      }

      // Fetch comments and their authors
      const commentsSnapshot = await commentsRef.once('value');
      const commentsData = commentsSnapshot.val();
      
      if (commentsData) {
        const commentsArray = Object.entries(commentsData).map(([id, comment]) => ({
          id,
          ...comment
        }));

        // Get unique user IDs from comments
        const uniqueUserIds = [...new Set(commentsArray.map(comment => comment.authorId))];
        
        // Fetch user data for all unique users
        const userDataPromises = uniqueUserIds.map(fetchUserData);
        const usersData = await Promise.all(userDataPromises);

        // Update userData state with all fetched user data
        const newUserData = {};
        uniqueUserIds.forEach((userId, index) => {
          if (usersData[index]) {
            newUserData[userId] = usersData[index];
          }
        });

        setUserData(prev => ({
          ...prev,
          ...newUserData
        }));

        setComments(commentsArray);
      }

      setLoading(false);
    };

    fetchData();

    // Set up real-time listeners for updates
    postRef.on('value', snapshot => {
      const data = snapshot.val();
      if (data) {
        setPost({ id: snapshot.key, ...data });
      }
    });

    commentsRef.on('value', snapshot => {
      const data = snapshot.val();
      if (data) {
        const commentsArray = Object.entries(data).map(([id, comment]) => ({
          id,
          ...comment
        }));
        setComments(commentsArray);
      }
    });

    return () => {
      postRef.off();
      commentsRef.off();
    };
  }, [postId]);

  useEffect(() => {
    if (!currentUser) return;

    const userLikesRef = database.ref(`Users/${currentUser.uid}/likes`);
    userLikesRef.on('value', (snapshot) => {
      const likes = snapshot.val() || {};
      setPostLikes(likes);
    });

    return () => userLikesRef.off();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;

    const userLikesRef = database.ref(`Users/${currentUser.uid}/commentLikes`);
    userLikesRef.on('value', (snapshot) => {
      const likes = snapshot.val() || {};
      setCommentLikes(likes);
    });

    return () => userLikesRef.off();
  }, [currentUser]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.meatballs-menu')) {
        setShowMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const commentsRef = database.ref(`comments/${postId}`);
    const userRef = database.ref(`Users/${currentUser.uid}`);
    const userSnapshot = await userRef.once('value');
    const userData = userSnapshot.val();

    await commentsRef.push({
      content: newComment,
      authorId: currentUser.uid,
      authorRole: userData.role,
      username: userData.username,
      profilePicture: userData.profilePicture,
      createdAt: new Date().toISOString(),
      likes: 0
    });

    await database.ref(`posts/${postId}/commentCount`).transaction(count => (count || 0) + 1);
    setNewComment('');
  };

  const handleDelete = async () => {
    if (!currentUser || (currentUser.uid !== post.authorId)) {
      alert("You don't have permission to delete this post");
      return;
    }

    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await database.ref(`posts/${postId}`).remove();
        navigate('/forums');
      } catch (error) {
        console.error('Error deleting post:', error);
      }
    }
  };

  const handleBookmark = async () => {
    if (!currentUser) return;
    
    const bookmarkRef = database.ref(`users/${currentUser.uid}/bookmarks/${postId}`);
    const snapshot = await bookmarkRef.once('value');
    
    if (snapshot.exists()) {
      await bookmarkRef.remove();
    } else {
      await bookmarkRef.set({
        postId: postId,
        savedAt: new Date().toISOString()
      });
    }
  };

  const handleLike = async () => {
    if (!currentUser) {
      alert("Please log in to like posts");
      return;
    }
    
    try {
      const userLikesRef = database.ref(`Users/${currentUser.uid}/likes/${postId}`);
      const postLikesRef = database.ref(`posts/${postId}/likes`);

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

  const handleCommentLike = async (commentId) => {
    if (!currentUser) {
      alert("Please log in to like comments");
      return;
    }
    
    try {
      const userLikesRef = database.ref(`Users/${currentUser.uid}/commentLikes/${commentId}`);
      const commentLikesRef = database.ref(`comments/${postId}/${commentId}/likes`);

      const likeSnapshot = await userLikesRef.once('value');
      const hasLiked = likeSnapshot.val();

      if (hasLiked) {
        await userLikesRef.remove();
        await commentLikesRef.transaction(currentLikes => 
          currentLikes ? currentLikes - 1 : 0
        );
      } else {
        await userLikesRef.set(true);
        await commentLikesRef.transaction(currentLikes => 
          (currentLikes || 0) + 1
        );
      }
    } catch (error) {
      console.error('Error handling comment like:', error);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!post) return <div>Post not found</div>;

  return (
    <div className="post-detail">
      <div className="post-content">
        <div className="post-header">
          <div className="post-author">
            <img 
              src={userData[post.authorId]?.profilePicture || "/pfp.png"} 
              alt="Profile" 
              className="author-avatar"
            />
            <div className="author-info">
              <span className="author-name">{userData[post.authorId]?.username || 'Anonymous'}</span>
              <div className="post-meta">
                <span className="post-community">{post.community}</span>
                <span>•</span>
                <span className="post-time">{new Date(post.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          <div className="post-actions">
            <span className={`user-flair flair-${post.authorRole?.toLowerCase()}`}>
              {post.authorRole}
            </span>
            <div className="meatballs-menu">
              <button 
                className="menu-trigger"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
              >
                ⋮
              </button>
              {showMenu && (
                <div className="menu-content">
                  <button onClick={handleBookmark}>
                    🔖 Bookmark
                  </button>
                  {currentUser?.uid === post.authorId && (
                    <button onClick={handleDelete} className="delete-button">
                      🗑️ Delete Post
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        <h1 className="post-title">{post.title}</h1>
        
        {post.imageUrl && (
          <img 
            src={post.imageUrl} 
            alt={post.title}
            className="post-image"
          />
        )}
        
        <p className="post-text">{post.content}</p>

        <div className="post-stats">
          <span 
            onClick={handleLike}
            className={`like-button ${postLikes[postId] ? 'active' : ''}`}
          >
            {postLikes[postId] ? '❤️' : '🤍'} {post.likes || 0}
          </span>
          <span>💬 {post.commentCount || 0}</span>
        </div>
      </div>

      <div className="comments-section">
        <h2>Comments</h2>
        <form onSubmit={handleComment} className="comment-form">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            required
          />
          <button type="submit">Comment</button>
        </form>

        <div className="comments-list">
          {comments.map(comment => (
            <div key={comment.id} className="comment">
              <div className="comment-header">
                <div className="comment-author">
                  <img 
                    src={comment.profilePicture || userData[comment.authorId]?.profilePicture || "/pfp.png"} 
                    alt="Profile" 
                    className="author-avatar"
                  />
                  <div className="author-info">
                    <span className="author-name">
                      {comment.username || userData[comment.authorId]?.username || 'Anonymous'}
                    </span>
                    <span className="comment-time">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                {comment.authorRole && (
                  <span className={`user-flair flair-${comment.authorRole.toLowerCase()}`}>
                    {comment.authorRole}
                  </span>
                )}
              </div>
              <p className="comment-content">{comment.content}</p>
              <div className="comment-footer">
                <span 
                  onClick={() => handleCommentLike(comment.id)}
                  className={`comment-like-button ${commentLikes[comment.id] ? 'active' : ''}`}
                >
                  {commentLikes[comment.id] ? '❤️' : '🤍'} {comment.likes || 0}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 