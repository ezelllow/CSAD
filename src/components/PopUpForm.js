import React, { useState } from "react";
import { database } from "../firebase";
import { ref, push } from "firebase/database";
import "./PopUpForm.css"; // Ensure styles for the pop-up form

function PopupForm({ category, onClose }) {
  const [formData, setFormData] = useState({
    image: "",
    title: "",
    description: "",
    details: "",
    location: ""
  });
  const [successMessage, setSuccessMessage] = useState("");

  // Handle input change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    // Reference the correct Firebase node based on category
    const eventRef = ref(database, category);
    push(eventRef, formData)
      .then(() => {
        setSuccessMessage("Event added successfully!");
        setFormData({ image: "", title: "", description: "", details: "", location: "" });

        // Hide success message after 2 seconds and close form
        setTimeout(() => {
          setSuccessMessage("");
          onClose();
        }, 2000);
      })
      .catch((error) => {
        console.error("Error adding event: ", error);
      });
  };

  return (
    <div className="popup-overlay">
      <div className="popup-container">
        {successMessage && <p className="success-message">{successMessage}</p>}
        <h2>Add New Event</h2>
        <form onSubmit={handleSubmit}>
          <input type="text" name="image" placeholder="Image URL" value={formData.image} onChange={handleChange} required />
          <input type="text" name="title" placeholder="Title" value={formData.title} onChange={handleChange} required />
          <textarea name="description" placeholder="Description" value={formData.description} onChange={handleChange} required />
          <input type="text" name="details" placeholder="Details" value={formData.details} onChange={handleChange} required />
          <input type="text" name="location" placeholder="Location" value={formData.location} onChange={handleChange} required />
          <button type="submit" className="submit-btn">Submit</button>
          <button type="button" className="close-btn" onClick={onClose}>Close</button>
        </form>
      </div>
    </div>
  );
}

export default PopupForm;
