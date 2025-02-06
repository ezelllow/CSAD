import React, { useState, useEffect } from "react";
import { database, storage } from "../firebase"; 
import { ref, push } from "firebase/database";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import "./PopUpForm.css"; 

function PopupForm({ category, onClose }) {
  const [formData, setFormData] = useState({
    image: "",
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  // Close popup when ESC key is pressed
  useEffect(() => {
    const handleEscClose = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscClose);
    return () => {
      document.removeEventListener("keydown", handleEscClose);
    };
  }, [onClose]);

  // Close popup when clicking outside the form
  const handleOutsideClick = (event) => {
    if (event.target.classList.contains("popup-overlay")) {
      onClose();
    }
  };

  // Handle text input change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle image file selection
  const handleImageChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let imageUrl = "";

      // If an image file is selected, upload it to Firebase Storage
      if (imageFile) {
        const imageStorageRef = storageRef(storage, `event_images/${imageFile.name}`);
        await uploadBytes(imageStorageRef, imageFile);
        imageUrl = await getDownloadURL(imageStorageRef);
      }

      // Prepare data for Firebase Realtime Database
      const eventData = {
        ...formData,
        image: imageUrl || formData.image, // Use uploaded image URL or fallback to existing input
      };

      // Push event data to Firebase Realtime Database
      const eventRef = ref(database, category);
      await push(eventRef, eventData);

      setSuccessMessage("Event added successfully!");
      setFormData({
        image: "",
        title: "",
        description: "",
        date: "",
        time: "",
        location: "",
      });
      setImageFile(null);

      setTimeout(() => {
        setSuccessMessage("");
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Error adding event: ", error);
    }
  };

  // Close the popup if the overlay (background) is clicked
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose(); // Close the form when the background is clicked
    }
  };

  return (
    <div className="popup-overlay" onClick={handleOutsideClick}>
      <div className="popup-container">
        {successMessage && <p className="success-message">{successMessage}</p>}
        <form onSubmit={handleSubmit}>
          <label>Event Image:</label>
          <input type="file" accept="image/*" onChange={handleImageChange} />

          <label>Title:</label>
          <input type="text" name="title" value={formData.title} onChange={handleChange} required />

          <label>Description:</label>
          <textarea name="description" value={formData.description} onChange={handleChange} required />

          <label>Date:</label>
          <input type="date" name="date" value={formData.date} onChange={handleChange} required />

          <label>Time:</label>
          <input type="time" name="time" value={formData.time} onChange={handleChange} required />

          <label>Location:</label>
          <input type="text" name="location" value={formData.location} onChange={handleChange} required />

          <button type="submit" className="submit-btn">Submit</button>
        </form>
      </div>
    </div>
  );
}

export default PopupForm;
