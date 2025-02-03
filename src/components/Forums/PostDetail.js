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
  const [userLikes, setUserLikes] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const postRef = database.ref(`posts/${postId}`);
    const commentsRef = database.ref(`comments/${postId}`);

    postRef.on('value', async (snapshot) => {
      const postData = { id: snapshot.key, ...snapshot.val() };
      setPost(postData);
      
      if (postData.authorId) {
        const userRef = database.ref(`Users/${postData.authorId}`);
        const userSnapshot = await userRef.once('value');
        setUserData(prevData => ({
          ...prevData,
          [postData.authorId]: userSnapshot.val()
        }));
      }
      
      setLoading(false);
    });

    commentsRef.on('value', async (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const commentsArray = Object.entries(data).map(([id, comment]) => ({
          id,
          ...comment
        }));
        
        for (const comment of commentsArray) {
          if (comment.authorId && !userData[comment.authorId]) {
            const userRef = database.ref(`Users/${comment.authorId}`);
            const userSnapshot = await userRef.once('value');
            setUserData(prevData => ({
              ...prevData,
              [comment.authorId]: userSnapshot.val()
            }));
          }
        }
        
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

    const userLikesRef = database.ref(`users/${currentUser.uid}/likes`);
    userLikesRef.on('value', (snapshot) => {
      const likes = snapshot.val() || {};
      setUserLikes(likes);
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
    const userRole = (await database.ref(`Users/${currentUser.uid}/role`).once('value')).val();

    await commentsRef.push({
      content: newComment,
      authorId: currentUser.uid,
      authorRole: userRole,
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
    
    const userLikesRef = database.ref(`users/${currentUser.uid}/likes/${postId}`);
    const postRef = database.ref(`posts/${postId}`);

    try {
      const snapshot = await userLikesRef.once('value');
      const hasLiked = snapshot.val();

      if (hasLiked) {
        await userLikesRef.remove();
        await postRef.child('likes').transaction(likes => Math.max((likes || 0) - 1, 0));
      } else {
        await userLikesRef.set(true);
        await postRef.child('likes').transaction(likes => (likes || 0) + 1);
      }
    } catch (error) {
      console.error('Error handling like:', error);
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
        <h1>{post.title}</h1>
        {post.imageUrl && (
          <div className="post-image">
            <img src={post.imageUrl} alt={post.title} />
          </div>
        )}
        <p>{post.content}</p>
        <div className="post-stats">
          <span 
            onClick={(e) => {
              e.stopPropagation();
              handleLike();
            }}
            className={`like-button ${userLikes[postId] ? 'active' : ''}`}
          >
            {userLikes[postId] ? '❤️' : '🤍'} {post.likes || 0}
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
                    src={userData[comment.authorId]?.profilePicture || "/pfp.png"} 
                    alt="Profile" 
                    className="author-avatar"
                  />
                  <div className="author-info">
                    <span className="author-name">{userData[comment.authorId]?.username || 'Anonymous'}</span>
                    <span className="comment-time">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <span className={`user-flair flair-${comment.authorRole?.toLowerCase()}`}>
                  {comment.authorRole}
                </span>
              </div>
              <p>{comment.content}</p>
              <div className="comment-footer">
                <span>👍 {comment.likes || 0}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 