import React, { useRef, useState } from 'react'
import { Form, Button, Card, Alert } from 'react-bootstrap'
import { useAuth } from '../context/AuthContext'
import { Link } from "react-router-dom"

export default function ForgotPassword() {
    const emailRef = useRef()
    const { resetPassword } = useAuth()
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)  //set to false as it doesnt load on default
    

    async function handleSubmit(e) {
        e.preventDefault()  //prevents form from refreshing

        try {
            setMessage('')
            setError("")
            setLoading(true)  //button not available to press during signup
            await resetPassword(emailRef.current.value)
            setMessage('Check your inbox for further instructions')
        } catch {  //goes here if there is a failure
            setError('Failed to reset password')
            setLoading(false) //button appears after done waiting for signup
        }
        //setLoading(false) //button appears after done waiting for signup
    }

  return (
    <>
        <Card>
            <Card.Body>
                <h2 className='text-center mb-4'>Password Reset</h2>
                {error && <Alert variant="danger">{error}</Alert> }
                {message && <Alert variant="success">{message}</Alert> }
                <Form onSubmit={handleSubmit}>
                    <Form.Group id="email">
                       <Form.Label>Email</Form.Label> 
                       <Form.Control type="email" ref={emailRef} required />
                    </Form.Group>
                    <Button disabled={loading} className="w-100" type="submit">Reset Password</Button>
                </Form>
                <div className="w-100 text-center mt-3">
                    <Link to="/login">Login</Link>
                </div>
            </Card.Body>
        </Card>
        <div className='w-100 text-center mt-2'>
            Need an account? <Link to="/signup">Sign Up</Link>
        </div>
       
    </>   
  )
}
