import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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

  useEffect(() => {
    const postRef = database.ref(`posts/${postId}`);
    const commentsRef = database.ref(`comments/${postId}`);

    postRef.on('value', (snapshot) => {
      setPost({ id: snapshot.key, ...snapshot.val() });
      setLoading(false);
    });

    commentsRef.on('value', (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setComments(Object.entries(data).map(([id, comment]) => ({
          id,
          ...comment
        })));
      }
    });

    return () => {
      postRef.off();
      commentsRef.off();
    };
  }, [postId]);

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

    // Update comment count
    await database.ref(`posts/${postId}/commentCount`).transaction(count => (count || 0) + 1);

    setNewComment('');
  };

  if (loading) return <div>Loading...</div>;
  if (!post) return <div>Post not found</div>;

  return (
    <div className="post-detail">
      <div className="post-content">
        <div className="post-header">
          <span className="post-community">{post.community}</span>
          <span className={`user-flair flair-${post.authorRole?.toLowerCase()}`}>
            {post.authorRole}
          </span>
        </div>
        <h1>{post.title}</h1>
        {post.imageUrl && (
          <div className="post-image">
            <img src={post.imageUrl} alt={post.title} />
          </div>
        )}
        <p>{post.content}</p>
        <div className="post-stats">
          <span>👍 {post.likes || 0}</span>
          <span>💬 {post.commentCount || 0}</span>
          <span className="post-time">{new Date(post.createdAt).toLocaleDateString()}</span>
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
                <span className={`user-flair flair-${comment.authorRole?.toLowerCase()}`}>
                  {comment.authorRole}
                </span>
                <span className="comment-time">
                  {new Date(comment.createdAt).toLocaleDateString()}
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