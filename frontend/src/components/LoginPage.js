import React, { useEffect, useState } from 'react'
import axios from 'axios';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Card from 'react-bootstrap/Card';
import { useNavigate } from "react-router-dom";
import HashLoader from 'react-spinners/HashLoader';

export const LoginPage = () => {
	const [username, setUsername]=useState("")
	const [password, setPassword]=useState("")
	const [loading, setLoading]=useState(true);
	const [alreadyLogged, setAlredyLogged]=useState(false);
	const [color, setColor] = useState("#0074D9");
	const navigate=useNavigate();
	useEffect(()=>{
		const f=async()=>{
			try {
			const res=await axios.get("http://localhost:4000/validSession", {withCredentials: true});
			console.log(res.data)
			if(res.data.session){
				setAlredyLogged(true);
			}
			} catch (error) {
				console.log(error);
			}
			setLoading(false);
		}
		f();
	},[])
	const submitInfo= async(e)=>{
		e.preventDefault();
		console.log("Submit Clicked")
    	try {
      		const res=await axios.post("http://localhost:4000/verifyLogin", {username,password}, {withCredentials: true});
			console.log(res)
			if(res.data.valid==1){
				navigate("/home");
			}
			else{
				setUsername("");
				setPassword("");
				alert("Wrong username or password");
			}
		} catch (error) {
			console.log(error)
		}
	}
	const logoutHandler = async() => {
		// handler logout
		const resp=await axios.get("http://localhost:4000/destroySession",{withCredentials:true})
		setAlredyLogged(false);
		setLoading(false);
	  }
	return (
		loading?
			<div style={{display: 'flex',  justifyContent:'center', alignItems:'center', background:'white',marginTop:'36vh'}}>
			<HashLoader
			color={color}
			loading={loading}
			size={150}
			aria-label="Loading Spinner"
			data-testid="loader"
			/></div> 
		:
		(
		alreadyLogged ?
			<div>
				<Card>
				<Card.Body>
					<Card.Title>Confirm</Card.Title>
					<Card.Text>
						You are already logged in, you need to log out before logging in as different user.
					</Card.Text>
					<Button variant="primary" onClick={()=>{setLoading(true);logoutHandler();}}>Log Out</Button>
					<Button variant="white" style={{marginLeft:"16px"}}onClick={()=>{navigate("/home")}}>Cancel</Button>
				</Card.Body>
				</Card>
			</div>
		:
		(
			<div style={{display: 'flex',  justifyContent:'center', alignItems:'center',marginTop:'30vh'}}>
			<Form>
				<Form.Group className="mb-3" controlId="formBasicEmail">
				<Form.Label>Student ID</Form.Label>
				<Form.Control placeholder="Enter Student ID" value={username} onChange={(e) => {setUsername(e.target.value)}}/>
				</Form.Group>
				<Form.Group className="mb-3" controlId="formBasicPassword">
				<Form.Label>Password</Form.Label>
				<Form.Control type="password" placeholder="Enter Password" value={password} onChange={(e) => {setPassword(e.target.value)}}/>
				</Form.Group>
				<Button variant="primary" onClick={submitInfo}>
					Submit
				</Button>
			</Form>
		</div>
	  )
	))
}
