import React, { useState, useEffect } from "react";
import { ref, push } from "firebase/database";
import { database } from "../firebase";
import "./PopUpForm.css"; // Reuse existing pop-up styles

function CalendarPopupForm({ date, userId, selectedEvent, onClose, onAddEvent }) {
  const [eventDetails, setEventDetails] = useState({ title: "", location: "", date: "", time: "" });
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    console.log(selectedEvent); // Add this line to check the event data
    if (selectedEvent) {
      setEventDetails({
        title: selectedEvent.title || "",
        location: selectedEvent.location || "",
        date: selectedEvent.date || "",
        time: selectedEvent.time || ""
      });
    }
  }, [selectedEvent]);

  // Handle title change
  const handleChange = (e) => {
    setEventDetails({ ...eventDetails, [e.target.name]: e.target.value });
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!eventDetails.title.trim()) return;
    // Create event data

    // Save event to Firebase
    onAddEvent(eventDetails);

    // Set success message and reset the input
    setSuccessMessage(`Event "${eventDetails}" added successfully!`);
    setEventDetails(""); // Clear the input field

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
        <input type="text" name="title" placeholder="Event Title" value={eventDetails.title} onChange={handleChange} required />
          <input type="text" name="location" placeholder="Location" value={eventDetails.location} onChange={handleChange} />
          <input type="text" name="date" placeholder="Date" value={eventDetails.date} onChange={handleChange} />
          <input type="text" name="time" placeholder="Time" value={eventDetails.time} onChange={handleChange} />
          <button type="submit" className="submit-btn">Save</button>
        </form>
      </div>
    </div>
  );
}

export default CalendarPopupForm
