import React, { useState, useEffect } from "react";
import { ref, push } from "firebase/database";
import { database } from "../firebase";
import "./PopUpForm.css"; // Reuse existing pop-up styles

function CalendarPopupForm({ date, userId, onClose, onAddEvent }) {
  const [eventTitle, setEventTitle] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Handle title change
  const handleChange = (e) => {
    setEventTitle(e.target.value);
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!eventTitle.trim()) return; // Prevent empty event titles

    // Create event data
    const event = { title: eventTitle };

    // Save event to Firebase
    onAddEvent(event);

    // Set success message and reset the input
    setSuccessMessage(`Event "${eventTitle}" added successfully!`);
    setEventTitle(""); // Clear the input field

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
          <input
            type="text"
            name="eventTitle"
            placeholder="Enter event title"
            value={eventTitle}
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