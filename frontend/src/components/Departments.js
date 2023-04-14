import React, { useEffect, useState } from 'react'
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import HashLoader from 'react-spinners/HashLoader';
import {AiOutlineLogout} from 'react-icons/ai';
import { ReactSearchAutocomplete } from 'react-search-autocomplete';
import { useNavigate } from "react-router-dom";
import { MDBTable, MDBTableHead, MDBTableBody, MDBBtn } from 'mdb-react-ui-kit';
import axios from 'axios';


export const Departments = () => {

	const  [departments,setDepartments]=useState([])
	const [loading, setLoading] = useState(true);
	const [color, setColor] = useState("#0074D9");
	const [curr_year, setCurrYear]=useState("")
  	const [curr_sem, setCurrSem]=useState("")
	const [userName,setUserName]=useState("")
	

	const navigate = useNavigate();

	useEffect(() => {
		// set departments offering courses this semester
		const func=async()=>{
			const out=await axios.get("http://localhost:4000/getName", {withCredentials: true})
			console.log("out", out)
			if(out.status!=200){
				logoutHandler()
				return
			}
			setUserName(out.data.name)
			const r=await axios.get("http://localhost:4000/getCurrSemester", {withCredentials: true})
			if(r.status!=200){
				logoutHandler()
				return
			}
			setCurrSem(r.data.curr_sem)
			setCurrYear(r.data.curr_year)
			const res=await axios.post("http://localhost:4000/getRunningDepartments", {cur_sem:r.data.curr_sem, cur_year:r.data.curr_year}, {withCredentials:true})
			if(res.status!=200){
				logoutHandler();
			  }
			setDepartments(res.data.rows)
			// set loading to false
			setLoading(false)
		}
		func()
	}, [])

	const logoutHandler = async() => {
		// handler logout
		const resp=await axios.get("http://localhost:4000/destroySession",{withCredentials:true})
		navigate("/login")
	  }

	return (
		<div>
		{loading ? 
		<div style={{display: 'flex',  justifyContent:'center', alignItems:'center', height: '100vh', background:'white'}}>
		<HashLoader
		color={color}
		loading={loading}
		size={150}
		aria-label="Loading Spinner"
		data-testid="loader"
		/></div> 
		: 
		<div>
			<Navbar collapseOnSelect expand="lg" bg="dark" variant="dark">
				<Container>
				<Navbar.Brand href="/home" onClick={() => navigate("/home")}>{userName}</Navbar.Brand>
					<Navbar.Toggle aria-controls="responsive-navbar-nav" />
					<Navbar.Collapse id="responsive-navbar-nav" className='justify-content-end'>
						<Nav>
						<Nav.Link onClick={logoutHandler}>Logout
						<AiOutlineLogout color='red' size={20}/>
						</Nav.Link>
						</Nav>
					</Navbar.Collapse>
				</Container>
			</Navbar>
			
		<div style={{display: 'flex', marginLeft:'1%', background:'white'}}>
			{
				departments && 
				<MDBTable borderless className='caption-top'>
					<caption className='h4 mt-3'> Offering Departments</caption>
					<MDBTableBody>
						{
							departments.map((key, index) => {
								return (
									<tr key={index}>
									<td scope='row'>
										<MDBBtn rounded rippleColor='dark' onClick={() => navigate(`/course/running/${key.dept_name}`, { from : "Departments"})}>
											{key.dept_name}
										</MDBBtn></td>
									</tr>
								)
							})
						}
					</MDBTableBody>
				</MDBTable>
			}
			</div>
		</div>
		}
	</div>
  )
}
