import React, { useRef, useState } from 'react'
import { Form, Button, Card, Alert } from 'react-bootstrap'
import { useAuth } from '../context/AuthContext'
import { Link, useNavigate } from "react-router-dom"

export default function Signup() {
    const emailRef = useRef()
    const passwordRef = useRef()
    const passwordConfirmRef = useRef()
    const { signup } = useAuth()
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)  //set to false as it doesnt load on default
    const navigate = useNavigate()

    async function handleSubmit(e) {
        e.preventDefault()  //prevents form from refreshing

        if (passwordRef.current.value !== passwordConfirmRef.current.value){
            return setError('Passwords do not match')  //exits out of the function immediately when there is an error
        }

        try {
            setError("")
            setLoading(true)  //button not available to press during signup
            await signup(emailRef.current.value, passwordRef.current.value) //waits for signup to finmish
            navigate("/")
        } catch {  //goes here if there is a failure
            setError('Failed to create an account')
        }
        setLoading(false) //button appears after done waiting for signup
    }

  return (
    <>
        <Card>
            <Card.Body>
                <h2 className='text-center mb-4'>Sign Up</h2>
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
                    <Form.Group id="password-confirm">
                       <Form.Label>Confirm Password</Form.Label> 
                       <Form.Control type="password" ref={passwordConfirmRef} required />
                    </Form.Group>
                    <Button disabled={loading} className="w-100" type="submit">Sign Up</Button>
                </Form>
            </Card.Body>
        </Card>
        <div className='w-100 text-center mt-2'>
            Already have an account? <Link to="/login">Log In</Link>
        </div>
       
    </>   
  )
}
