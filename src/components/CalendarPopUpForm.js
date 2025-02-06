import React, { useState, useEffect } from "react";
import { database } from "../firebase";
import { ref, push } from "firebase/database";
import "./PopUpForm.css"; // Reuse existing pop-up styles

function CalendarPopupForm({ date, userId, onClose, onAddEvent }) {
  const [formData, setFormData] = useState({
    title: "",
    time: "",
    location: "",
  });

  const [successMessage, setSuccessMessage] = useState("");

  // Handle form input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) return; // Prevent empty event titles

    // Create event object with all details
    const event = {
      title: formData.title,
      time: formData.time,
      location: formData.location,
    };

    // Save event to Firebase
    onAddEvent(event);

    // Show success message and reset the input fields
    setSuccessMessage(`Event "${formData.title}" added successfully!`);
    setFormData({
      title: "",
      time: "",
      location: "",
    });

    // Hide success message and close form after 2 seconds
    setTimeout(() => {
      setSuccessMessage("");
      onClose();
    }, 2000);
  };

  // Close the pop-up when clicking outside of it
  const handleOutsideClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  useEffect(() => {
    // Add event listener to close the pop-up when clicking outside
    document.addEventListener("mousedown", handleOutsideClick);

    // Cleanup event listener when the component unmounts
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  return (
    <div className="popup-overlay" onClick={handleOutsideClick}>
      <div className="popup-container">
        {successMessage && <p className="success-message">{successMessage}</p>}
        <h2>Add Event for {date}</h2>
        <form onSubmit={handleSubmit}>
          <label>Title:</label>
          <input
            type="text"
            name="title"
            placeholder="Enter event title"
            value={formData.title}
            onChange={handleChange}
            required
          />

          <label>Time:</label>
          <input
            type="time"
            name="time"
            value={formData.time}
            onChange={handleChange}
            required
          />

          <label>Location:</label>
          <input
            type="text"
            name="location"
            placeholder="Enter event location"
            value={formData.location}
            onChange={handleChange}
            required
          />

          <button type="submit" className="submit-btn">Save</button>
        </form>
      </div>
    </div>
  );
}

export default CalendarPopupForm;
