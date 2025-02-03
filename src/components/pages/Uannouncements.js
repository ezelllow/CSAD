import React from 'react';
import UserEventSlider from "../UserEventSlider";
import './Uannouncements.css';

export default function Uannouncements() {
  return (
    <div className="announcements-page">
      <UserEventSlider /> {/* Insert the slider component here */}
    </div>
  );
}