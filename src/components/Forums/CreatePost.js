import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { database, storage } from '../../firebase';
import './CreatePost.css';

export default function CreatePost({ onClose, communities }) {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    community: '',
    imageUrl: ''
  });
  const [imageUpload, setImageUpload] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUpload(file);
        setFormData(prev => ({ ...prev, imageUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file) => {
    if (!file) return null;
    const storageRef = storage.ref();
    const fileRef = storageRef.child(`posts/${currentUser.uid}/${Date.now()}-${file.name}`);
    await fileRef.put(file);
    return await fileRef.getDownloadURL();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = '';
      if (imageUpload) {
        imageUrl = await uploadImage(imageUpload);
      }

      const postsRef = database.ref('posts');
      await postsRef.push({
        ...formData,
        imageUrl,
        authorId: currentUser.uid,
        authorRole: (await database.ref(`Users/${currentUser.uid}/role`).once('value')).val(),
        createdAt: new Date().toISOString(),
        likes: 0,
        commentCount: 0
      });

      onClose();
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-post-modal">
      <div className="modal-content">
        <h2>Create Post</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <select
              value={formData.community}
              onChange={(e) => setFormData(prev => ({ ...prev, community: e.target.value }))}
              required
            >
              <option value="">Select Community</option>
              {communities.map(community => (
                <option key={community.id} value={community.name}>
                  {community.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <input
              type="text"
              placeholder="Title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <textarea
              placeholder="Content"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label className="image-upload-label">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="image-input"
              />
              {formData.imageUrl ? (
                <div className="image-preview">
                  <img src={formData.imageUrl} alt="Preview" />
                  <button 
                    type="button" 
                    onClick={() => {
                      setFormData(prev => ({ ...prev, imageUrl: '' }));
                      setImageUpload(null);
                    }}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="upload-placeholder">
                  <i className="upload-icon">📷</i>
                  <span>Click to upload image</span>
                </div>
              )}
            </label>
          </div>
          <div className="form-actions">
            <button type="button" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 