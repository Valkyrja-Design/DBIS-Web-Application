import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import HashLoader from 'react-spinners/HashLoader';
import {AiOutlineLogout} from 'react-icons/ai';
import {TiDelete} from 'react-icons/ti';
import Button from 'react-bootstrap/Button';
import axios from 'axios';

export const Instructor = () => {

  let {instructor_id} = useParams()
  const [instName, setInstName]=useState("")
  const [dept, setDept]=useState("")
  const [curr_year, setCurrYear]=useState("")
  const [curr_sem, setCurrSem]=useState("")
  const [prevCourses, setPrevCourses]=useState(new Map())
  const [currCourses, setCurrCourses]=useState([])
  const [userName, setUserName]=useState("")

  const [loading, setLoading] = useState(true);
  const [color, setColor] = useState("#0074D9");
  const [showProfile, setShowProfile] = useState(true)
  const [showPrevCourses, setShowPrevCoures] = useState(false)
  const [showCurrCourses, setShowCurrCourses] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const f=async()=>{
      // assign user data
      const out=await axios.get("http://localhost:4000/getName", {withCredentials: true})
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
      const resp=await axios.post("http://localhost:4000/getInstructorInfo", {inst_id:instructor_id, cur_sem:r.data.curr_sem, cur_year:r.data.curr_year},  {withCredentials:true})
      if(resp.status!=200){
        logoutHandler();
      }
      setInstName(resp.data.inst_data.rows[0].name)
      setDept(resp.data.inst_data.rows[0].dept_name)

      setPrevCourses(()=>{
        let temp_prev_courses = new Map()
        for (let i=0;i<resp.data.prev_course_data.rowCount;i++){
          let row=resp.data.prev_course_data.rows[i]
          if(!temp_prev_courses.get(row["year"])){
            temp_prev_courses.set(row["year"], new Map())
          }
          if(!temp_prev_courses.get(row["year"]).get(row["semester"])){
            temp_prev_courses.get(row["year"]).set(row["semester"], [])
          }
          let course=[]
          course.push(row.course_id, row.title,row.dept_name,row.credits,row.sec_id,row.grade)
          temp_prev_courses.get(row["year"]).get(row["semester"]).push(course)
        }
        return temp_prev_courses;
      })
      setCurrCourses(()=>{
        let temp_curr_courses=[]
        for (let i=0;i<resp.data.cur_course_data.rowCount;i++){
          let row=resp.data.cur_course_data.rows[i]
          let course=[]
          course.push(row.course_id, row.title,row.dept_name,row.credits,row.sec_id)
          temp_curr_courses.push(course)
        }
        return temp_curr_courses;
      })

      // set loading to false
      setLoading(false)
    }
    f()
  }, [])

  const logoutHandler = async() => {
    // handler logout
    const resp=await axios.get("http://localhost:4000/destroySession",{withCredentials:true})
    navigate("/login")
  }

  return (
    <div>
    {loading ? 
      <div style={{display: 'flex',  justifyContent:'center', alignItems:'center', background:'white', height:'100vh'}}>
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
                <Navbar.Brand href="/home" onClick={() => navigate("/home", { from : 'Departments'})}>{userName}</Navbar.Brand>
                <Navbar.Toggle aria-controls="responsive-navbar-nav" />
                <Navbar.Collapse id="responsive-navbar-nav" className='justify-content-end'>
                <Nav className="me-auto">
                <Nav.Link href="" onClick={() => {
                    setShowCurrCourses(false)
                    setShowPrevCoures(false)
                    setShowProfile(true)
                }}>Profile</Nav.Link>
                <Nav.Link href="" onClick={() => {
                    setShowProfile(false)
                    setShowCurrCourses(false)
                    setShowPrevCoures(true)
                }}>Past Courses</Nav.Link>
                <Nav.Link href="" onClick={() => {
                    setShowProfile(false)
                    setShowPrevCoures(false)
                    setShowCurrCourses(true)
                }}>Current Courses</Nav.Link>
                </Nav>
                    <Nav>
                    <Nav.Link onClick={logoutHandler}>Logout
                    <AiOutlineLogout color='red' size={20}/>
                    </Nav.Link>
                    </Nav>
                    
                </Navbar.Collapse>
            </Container>
        </Navbar>
      {showProfile &&
        <section className="vh-100" style={{backgroundColor: '#eee'}}>
          <div className="container py-5 h-100">
            <div className="row d-flex justify-content-center align-items-center h-100">
              <div className="col-md-12 col-xl-4">
                <div className="card" style={{borderRadius: '15px'}}>
                  <div className="card-body text-center">
                    <h4 className="mb-2">{instName}</h4>
                    <div className="d-flex justify-content-center text-center mt-4 mb-2">
                      <div>
                        <p className="mb-2 h5">{dept}</p>
                        <p className="text-muted mb-0">Instructor Department</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>}
      {showPrevCourses &&
      <>
        <h2 style={{marginLeft:"2vw", marginTop:"1vh"}}>
          {instName}'s Past Courses
        </h2 >
        {[...prevCourses.keys()].map((key1, ind1)  => 
          {
            return [...prevCourses.get(key1).keys()].map((key2, ind2) => {
              return (<table className="table caption-top mt-3"  key={ind1+ind2} style={{marginLeft:"2vw"}}>
                <caption className="h4" style={{color:'black'}}>
                  {key1} {key2}
                </caption>
                <thead className="table-light">
                  <tr>
                    <th scope="col">Course Code</th>
                    <th scope="col">Course Name</th>
                  </tr>
                </thead>
                <tbody>
                  {
                    prevCourses.get(key1).get(key2).map((key3, index) => {
                      return (
                      <tr key={index}>
                        <th scope="row">{key3[0]}</th>
                        <td>{key3[1]}</td>
                      </tr>)
                    })
                  }
                </tbody>
              </table>
              )
            })
          }
        )}
      </>
      }
      {showCurrCourses && 
      <>
      <h2 style={{marginLeft:"2vw", marginTop:"1vh"}}>
        {instName}'s Current Courses
      </h2 >
      <table className="table caption-top mt-3" style={{marginLeft:"2vw"}} >
        <caption className="h4" style={{color:'black'}}>
          {curr_year} {curr_sem}
        </caption>
        <thead className="table-light">
          <tr>
            <th scope="col">Course Code</th>
            <th scope="col">Course Name</th>
          </tr>
        </thead>
        <tbody>
          {currCourses.map((key, index) => {
            return (
                        
                  <tr key={index}>
                    <th scope="row">{key[0]}</th>
                    <td>{key[1]}</td>
                  </tr>
                )
            })}
          </tbody>
        </table>
        </>
      }
    </div>
    }

</div>
  )
}
