import React, { useRef, useState } from 'react'
import { Form, Button, Card, Alert } from 'react-bootstrap'
import { useAuth } from '../context/AuthContext'
import { Link, useNavigate } from "react-router-dom"

export default function Login() {
    const emailRef = useRef()
    const passwordRef = useRef()
    const { login } = useAuth()
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)  //set to false as it doesnt load on default
    const navigate = useNavigate()

    async function handleSubmit(e) {
        e.preventDefault()  //prevents form from refreshing

        try {
            setError("")
            setLoading(true)  //button not available to press during signup
            await login(emailRef.current.value, passwordRef.current.value) //waits for signup to finmish
            navigate("/")
        } catch {  //goes here if there is a failure
            setError('Failed to log in')
        }
        setLoading(false) //button appears after done waiting for signup
    }

  return (
    <>
        <Card>
            <Card.Body>
                <h2 className='text-center mb-4'>Log In</h2>
                {error && <Alert variant="danger">{error}</Alert> }
                <Form onSubmit={handleSubmit}>
                    <Form.Group id="email">
                       <Form.Label>Email</Form.Label> 
                       <Form.Control type="email" ref={emailRef} required />
                    </Form.Group>
                    <Form.Group id="password">
                       <Form.Label>Password</Form.Label> 
                       <Form.Control type="password" ref={passwordRef} required />
                    </Form.Group>
                    <Button disabled={loading} className="w-100" type="submit">Log In</Button>
                </Form>
                <div className="w-100 text-center mt-3">
                    <Link to="/forgot-password">Forgot Password?</Link>
                </div>
            </Card.Body>
        </Card>
        <div className='w-100 text-center mt-2'>
            Need an account? <Link to="/signup">Sign Up</Link>
        </div>
       
    </>   
  )
}
