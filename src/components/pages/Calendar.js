import React, { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction"; // For click events
import { ref, onValue, remove, set } from "firebase/database";
import { database } from "../../firebase"; // Import your Firebase instance
import { getAuth } from "firebase/auth";
import "./Calendar.css"; // Import the CSS file
import CalendarPopupForm from "../CalendarPopUpForm"; // Import pop-up form
import { Colors } from "chart.js";

const Calendar = () => {
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null); // Store selected date for pop-up form
  const [showPopup, setShowPopup] = useState(false);
  const auth = getAuth();
  const userId = auth.currentUser ? auth.currentUser.uid : null;

  useEffect(() => {
    if (!userId) return;

    const calendarRef = ref(database, `Users/${userId}/calendar`);

    onValue(calendarRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const formattedEvents = [];

        Object.keys(data).forEach((dateKey) => {
          Object.entries(data[dateKey]).forEach(([eventId, eventValue]) => {
            formattedEvents.push({
              id: eventId, // Firebase event ID
              title: eventValue, // Note content
              start: dateKey, // Date format: "YYYY-M-D"
            });
          });
        });

        setEvents(formattedEvents);
      }
    });
  }, [userId]);

  // Open pop-up form when clicking on a date
  const handleDateClick = (info) => {
    if (!userId) {
      alert("You must be logged in to add events.");
      return;
    }

    setSelectedDate(info.dateStr);
    setShowPopup(true);
  };

  // Close the pop-up form
  const closePopup = () => {
    setShowPopup(false);
    setSelectedDate(null);
  };

  // Delete an event
  const handleEventClick = (info) => {
    if (!userId) {
      alert("You must be logged in to delete events.");
      return;
    }

    if (window.confirm(`Delete event: "${info.event.title}"?`)) {
      const eventRef = ref(
        database,
        `Users/${userId}/calendar/${info.event.startStr}/${info.event.id}`
      );
      remove(eventRef);
    }
  };

  // Add a "Remind Me" event to the calendar
  const handleAddEvent = (event) => {
    if (!userId) {
      alert("You must be logged in to add events.");
      return;
    }

    const eventDate = selectedDate; // Get the selected date
    const newEventId = new Date().getTime().toString(); // Generate a unique event ID
    const eventRef = ref(database, `Users/${userId}/calendar/${eventDate}/${newEventId}`);

    set(eventRef, event.title)
      .then(() => {
        alert(`Event "${event.title}" has been added to your calendar!`);
        setEvents((prevEvents) => [
          ...prevEvents,
          { id: newEventId, title: event.title, start: eventDate },
        ]);
        closePopup();
      })
      .catch((error) => {
        alert("Error adding event: " + error.message);
      });
  };

  return (
    <div className="calendar-container">
      <h1 className="colors">CALENDAR</h1>
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events}
        dateClick={handleDateClick} // Click to add event
        eventClick={handleEventClick} // Click to delete event
      />

      {showPopup && (
        <CalendarPopupForm
          date={selectedDate}
          userId={userId}
          onClose={closePopup}
          onAddEvent={handleAddEvent} // Pass the add event function to the popup
        />
      )}
    </div>
  );
};

export default Calendar;