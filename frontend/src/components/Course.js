import React, { useEffect, useState } from 'react'
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import HashLoader from 'react-spinners/HashLoader';
import {AiOutlineLogout} from 'react-icons/ai';
import { ReactSearchAutocomplete } from 'react-search-autocomplete';
import { useNavigate, useParams } from "react-router-dom";
import { MDBTable, MDBTableHead, MDBTableBody, MDBBtn } from 'mdb-react-ui-kit';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import axios from 'axios';


export const Course = () => {

  const {course_id} = useParams()
  const [curr_year, setCurrYear]=useState("")
  const [curr_sem, setCurrSem]=useState("")
  const [courseName,setCourseName]=useState("")
  const [credits,setCredits]=useState("")
  const [userName,setUserName]=useState("")
  // course_id and name pairs
  // let pre_req = [['CS101', 'Intro to CS'], ['CS251', 'System Software Lab']]
  const [prereq,setPrereq]=useState([])
  // instructor id and name pairs
  const [instructors, setInstructors]=useState([])

  const [loading, setLoading] = useState(true);
  const [color, setColor] = useState("#0074D9");

  const navigate = useNavigate();

  useEffect(() => {
    const f=async()=>{
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
      const response=await axios.post("http://localhost:4000/getCourseInfo",{courseId:course_id, curr_sem:r.data.curr_sem, curr_year:r.data.curr_year}, {withCredentials:true})
      if(response.status!=200){
        logoutHandler();
        return;
      }
      console.log("resp", response)
      setCourseName(response.data.course_data.rows[0].title)
      setCredits(response.data.course_data.rows[0].credits)
      setInstructors(response.data.instructors.rows)
      setPrereq(response.data.prereq.rows)
      // set loading to false
      setLoading(false)
    }
    f()
  }, [course_id])

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
        <section className="vh-100" style={{backgroundColor: '#eee'}}>
          <div className="container py-5 h-100">
            <div className="row d-flex justify-content-center align-items-center h-100">
              <div className="col-md-12 col-xl-4">
                <div className="card" style={{borderRadius: '15px'}}>
                  <div className="card-body text-center">
                    <h4 className="mb-2">{courseName}</h4>
                    <div className="d-flex justify-content-center text-center mt-4 mb-2">
                      <div>
                        <p className="mb-2 h5">{course_id}</p>
                        <p className="text-muted mb-0">Course Code</p>
                      </div>
                    </div>
                    <div className="d-flex justify-content-around text-center mt-5 mb-3">
                      <div>
                        <p className="mb-2 h5">{credits}</p>
                        <p className="text-muted mb-0">Credits</p>
                      </div>
                    </div>
                    <div className="d-flex justify-content-around text-center mt-5 mb-3">
                      {prereq.length>0 && <div>
                      <DropdownButton id="dropdown-basic-button" title="Pre-requisites">
                        {prereq.map((key, ind) => {
                          return (<Dropdown.Item key={ind} onClick={() => navigate(`/course/${key.prereq_id}`)}>{key.prereq_id}: {key.title}</Dropdown.Item>)
                          })}
                      </DropdownButton>
                      </div>}
                      {instructors.length>0 && <div>
                        <DropdownButton id="dropdown-basic-button" title="Instructors">
                            {instructors.map((key, ind) => {
                            return (<Dropdown.Item key={ind} onClick={() => navigate(`/instructor/${key.id}`)}>{key.name}</Dropdown.Item>)
                            })}
                        </DropdownButton>
                      </div>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
    </div>
    }
</div>
  )
}
