import React, { useRef, useState } from 'react'
import { Form, Button, Card, Alert } from 'react-bootstrap'
import { useAuth } from '../context/AuthContext'
import { Link, useNavigate } from "react-router-dom"
import { EmailAuthProvider, reauthenticateWithCredential, sendEmailVerification } from 'firebase/auth';
import './updateProfile.css'

export default function UpdateProfile() {
    const emailRef = useRef()
    const passwordRef = useRef()
    const passwordConfirmRef = useRef()
    const currentPasswordRef = useRef();

    const { currentUser, updatePassword, updateEmail } = useAuth()
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)  //set to false as it doesnt load on default
    const navigate = useNavigate()

    async function handleSubmit(e) {
        e.preventDefault();

        // Check if the new passwords match
        if (passwordRef.current.value !== passwordConfirmRef.current.value) {
            return setError('Passwords do not match');
        }

        setError('');
        setLoading(true);
        const promises = [];
        const user = currentUser;

        // Check if email needs to be updated
        if (emailRef.current.value !== user.email) {
            try {
                // 🔥 Use the entered current password for re-authentication
                const credential = EmailAuthProvider.credential(
                    user.email,
                    currentPasswordRef.current.value // Use entered password
                );
                await reauthenticateWithCredential(user, credential);
                
                // Step 1: Send email verification
                await updateEmail(user, emailRef.current.value);
                await sendEmailVerification(user); // Send verification email to the new email

                setError("A verification email has been sent to your new email address. Please verify it.");
            } catch (error) {
                console.error("Re-authentication failed:", error);
                setError('Re-authentication failed. Please check your password.');
                setLoading(false);
                return;
            }
        }

        // Check if password needs to be updated
        if (passwordRef.current.value) {
            promises.push(updatePassword(passwordRef.current.value));
        }

        // Update the profile
        Promise.all(promises)
            .then(() => {
                navigate('/');
            })
            .catch((error) => {
                console.error("Update failed:", error);
                setError('Failed to update account');
            })
            .finally(() => {
                setLoading(false);
            });
    }


    return (
        <div className="update-profile-container"> {/* ✅ Centering wrapper */}
            <Card className="update-profile-card"> {/* ✅ Applied correct class */}
                <Card.Body>
                    <h2 className='text-center mb-4'>Update Profile</h2>
                    {error && <Alert variant="danger">{error}</Alert>}
                    <Form onSubmit={handleSubmit}>
                        <Form.Group id="email">
                            <Form.Label>Email</Form.Label>
                            <Form.Control type="email" ref={emailRef} required defaultValue={currentUser.email} />
                        </Form.Group>
                        <Form.Group id="password">
                            <Form.Label>Current Password</Form.Label>
                            <Form.Control type="password" ref={currentPasswordRef} required placeholder="Enter current password" />
                        </Form.Group>
                        <Form.Group id="password">
                            <Form.Label>New Password</Form.Label>
                            <Form.Control type="password" ref={passwordRef} placeholder="Leave blank to keep the same" />
                        </Form.Group>
                        <Form.Group id="password-confirm">
                            <Form.Label>Confirm New Password</Form.Label>
                            <Form.Control type="password" ref={passwordConfirmRef} placeholder="Leave blank to keep the same" />
                        </Form.Group>
                        <Button disabled={loading} className="update-btn w-100" type="submit">Update</Button>
                    </Form>
                </Card.Body>
            </Card>
            <div className='w-100 text-center mt-3'>
                <Link to="/profile" className="back-link">Back</Link>
            </div>
        </div>
    )
}
