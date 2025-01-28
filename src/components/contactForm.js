import React, { useRef } from 'react';
import emailjs from 'emailjs-com';
import './ContactForm.css';

function ContactForm({ setShowForm }) {
  const form = useRef();

  const sendEmail = (e) => {
    e.preventDefault();

    emailjs
      .sendForm(
        'YOUR_SERVICE_ID',
        'YOUR_TEMPLATE_ID',
        form.current,
        'YOUR_PUBLIC_KEY'
      )
      .then(
        (result) => {
          console.log('Email sent:', result.text);
          alert('Email sent successfully!');
          setShowForm(false); // Hide modal after sending
        },
        (error) => {
          console.log('Failed to send email:', error.text);
          alert('Failed to send email. Please try again.');
        }
      );

    e.target.reset();
  };

  return (
    <div className="contact-form-container">
      <form ref={form} onSubmit={sendEmail} className="contact-form">
        <h2>Contact Us</h2>
        <label>Name</label>
        <input type="text" name="user_name" required />

        <label>Email</label>
        <input type="email" name="user_email" required />

        <label>Message</label>
        <textarea name="message" required />

        <button type="submit">Send Email</button>
      </form>
    </div>
  );
}

export default ContactForm;
