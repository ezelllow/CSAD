import React, { useRef, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import emailjs from 'emailjs-com';
import './ContactForm.css';

function ContactForm({ onClose }) {
  const form = useRef();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    setTimeout(() => setIsVisible(true), 10); // Delay to trigger animation

    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const handleClose = (e) => {
    e.stopPropagation();
    setIsVisible(false);
    setTimeout(() => onClose(), 300); // Delay closing for animation
  };

  const sendEmail = (e) => {
    e.preventDefault();

    emailjs
      .sendForm(
        'service_0latjzk',
        'template_3jdv687',
        form.current,
        '7n3dYj_qNQ1mWiG23'
      )
      .then(
        (result) => {
          console.log('Email sent:', result.text);
          alert('Email sent successfully!');
          handleClose(e);
        },
        (error) => {
          console.log('Failed to send email:', error.text);
          alert('Failed to send email. Please try again.');
        }
      );

    e.target.reset();
  };

  const modalContent = (
    <div className={`contact-modal-overlay ${isVisible ? 'active' : ''}`} onClick={handleClose}>
      <div className="contact-modal-content" onClick={e => e.stopPropagation()}>
        <button className="contact-modal-close" onClick={handleClose}>×</button>
        <form ref={form} onSubmit={sendEmail} className="contact-modal-form">
          <h2 className="contact-modal-title">Contact Us</h2>
          <div className="contact-form-group">
            <label className="contact-form-label">Name</label>
            <input type="text" name="user_name" className="contact-form-input" required />
          </div>

          <div className="contact-form-group">
            <label className="contact-form-label">Email</label>
            <input type="email" name="user_email" className="contact-form-input" required />
          </div>

          <div className="contact-form-group">
            <label className="contact-form-label">Message</label>
            <textarea name="message" className="contact-form-textarea" required />
          </div>

          <button type="submit" className="contact-form-submit">Send Email</button>
        </form>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}

export default ContactForm;
