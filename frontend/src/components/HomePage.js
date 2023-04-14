import React, { useEffect, useState } from 'react'
import { useNavigate } from "react-router-dom"
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import HashLoader from 'react-spinners/HashLoader';
import {AiOutlineLogout} from 'react-icons/ai';
import {TiDelete} from 'react-icons/ti';
import Button from 'react-bootstrap/Button';
import axios from 'axios';

export const HomePage = () => {

  const [basicInfo,setBasicInfo]=useState({}) //contain ID, name dept_name,total_cred
  const [curr_year, setCurrYear]=useState("")
  const [curr_sem, setCurrSem]=useState("")
  // let curr_year = 2008;
  // let curr_sem = 'Spring';

  // array of courses for every semester sorted by year and semester (fall then spring then summer)
  // maybe store like 
  // prev_courses = {'2021' :{ 
  //                         'Fall' : [['CS101', 'Intro to CS', 'CSE', 6],
  //                                   ['CS105', 'Intro to CS', 'CSE', 6], 
  //                                   ['CS207', 'Intro to CS', 'CSE', 6]], 
  //                         'Spring' : [['CS213', 'Intro to CS', 'CSE', 6],
  //                                    ['CS251', 'Intro to CS', 'CSE', 6]]
  //                       }
                        
  //                 ,
  //                 '2020' :{
  //                         'Spring' : [['CS101', 'Intro to CS', 'CSE', 6]],
  //                         'Summer' : [['CS101', 'Intro to CS', 'CSE', 6]],
  //                         }
  //               }
  const [prev_courses,setPrevCourses]=useState(new Map())
  const [currCourses, setCurrCourses] = useState([])  // courses taken this semester

  const [loading, setLoading] = useState(true);
  const [color, setColor] = useState("#0074D9");
  const [showProfile, setShowProfile] = useState(true)
  const [showPrevCourses, setShowPrevCoures] = useState(false)
  const [showCurrCourses, setShowCurrCourses] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // assign user data
    const func = async()=>{
      const r=await axios.get("http://localhost:4000/getCurrSemester", {withCredentials: true})
      if(r.status!=200){
        logoutHandler()
        return
      }
      setCurrSem(r.data.curr_sem)
      setCurrYear(r.data.curr_year)
      const result=await axios.get("http://localhost:4000/getStudentData", {withCredentials: true})
      if(result.status!=200 || result.data.basic.rowCount!=1){
        logoutHandler()
        return
      }
      setBasicInfo(result.data.basic.rows[0])
      console.log(result.data.courses)
      setPrevCourses(()=>{
        let temp_prev_courses = new Map()
        for (let i=0;i<result.data.courses.rowCount;i++){
          let row=result.data.courses.rows[i]
          if(row["year"]==r.data.curr_year && row["semester"]==r.data.curr_sem){
            continue;
          }
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
        for (let i=0;i<result.data.courses.rowCount;i++){
          let row=result.data.courses.rows[i]
          if(row["year"]==r.data.curr_year && row["semester"]==r.data.curr_sem){
            let course=[]
            course.push(row.course_id, row.title,row.dept_name,row.credits,row.sec_id)
            temp_curr_courses.push(course)
          }
        }
        return temp_curr_courses;
      })
      setLoading(false)
    }
    func()
    
  }, [])

  const dropCourseHandler = async(index) => {
    // drop course at given index
    let temp=currCourses[index]
    setCurrCourses((currCourses)=>{
      return [...currCourses.slice(0,index), ...currCourses.slice(index+1)]
    })
    const resp=await axios.post("http://localhost:4000/deleteCourse",{course_id:temp[0], section_id:temp[4], semester:curr_sem, year:curr_year}, {withCredentials:true})
    if(resp.status!=200){
      logoutHandler()
      // navigate("/login");
    }
  }

  const registerHandler = () => {
    navigate('/home/registration', {from : '/home'})
  }

  const logoutHandler = async() => {
    // handler logout
    const resp=await axios.get("http://localhost:4000/destroySession",{withCredentials:true})
    navigate("/login")
  }

  return (
    <div>
    {loading ? 
      <div style={{display: 'flex',  justifyContent:'center', alignItems:'center', background:'white',marginTop:'36vh'}}>
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
          <Navbar.Brand href="/home" onClick={() => {
            setShowCurrCourses(false)
            setShowPrevCoures(false)
            setShowProfile(true)
          }}>{basicInfo.name}</Navbar.Brand>
          <Navbar.Toggle aria-controls="responsive-navbar-nav" />
          <Navbar.Collapse id="responsive-navbar-nav">
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
              <Nav.Link onClick={registerHandler}>Registration</Nav.Link>
              <Nav.Link href="" onClick={() => {
                navigate("/course/running")
              }}>Running Courses</Nav.Link>
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
                    <h4 className="mb-2">{basicInfo.name}</h4>
                    <div className="d-flex justify-content-center text-center mt-4 mb-2">
                      <div>
                        <p className="mb-2 h5">{basicInfo.id}</p>
                        <p className="text-muted mb-0">Student ID</p>
                      </div>
                    </div>
                    <div className="d-flex justify-content-around text-center mt-5 mb-3">
                      <div>
                        <p className="mb-2 h5">{basicInfo.dept_name}</p>
                        <p className="text-muted mb-0">Department</p>
                      </div>
                      <div>
                        <p className="mb-2 h5">{basicInfo.tot_cred}</p>
                        <p className="text-muted mb-0">Total Credits</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>}
      {showPrevCourses && 
        [...prev_courses.keys()].map((key1, index1) => 
        {
            // console.log(key1, value1)
            let value1 = prev_courses.get(key1)
            return [...value1.keys()].map((key2, index2) => {
              let value2 = value1.get(key2)
              return (<table className="table caption-top mt-3 px-3" key={key1+key2}>
                <caption className="h4 px-1" style={{color:'black'}}>
                  {key1} {key2}
                </caption>
                <thead className="table-light px-3">
                  <tr>
                    <th scope="col">Course Code</th>
                    <th scope="col">Course Name</th>
                    <th scope="col">Department</th>
                    <th scope="col">Credits</th>
					<th scope="col">Sec. ID</th>
					<th scope="col">Grade</th>
                  </tr>
                </thead>
                <tbody className='px-3'>
                  {
                    value2.map((key3, index) => {
                      return (
                      <tr key={index}>
                        <th scope="row">{key3[0]}</th>
                        <td>{key3[1]}</td>
                        <td>{key3[2]}</td>
                        <td>{key3[3]}</td>
                        <td>{key3[4]}</td>
                        <td>{key3[5]}</td>
                      </tr>)
                    })
                  }
                </tbody>
              </table>
              )
            })
          }
        )
      }
      {(showCurrCourses ) && <table className="table caption-top mt-3">
        <caption className="h4 px-1" style={{color:'black'}}>
          {curr_year} {curr_sem}
        </caption>
        <thead className="table-light">
          <tr>
            <th scope="col">Course Code</th>
            <th scope="col">Course Name</th>
            <th scope="col">Department</th>
            <th scope="col">Credits</th>
			<th scope="col">Sec. ID</th>
            <th scope="col">Drop</th>
          </tr>
        </thead>
        <tbody>
          {currCourses.map((key, index) => {
            return (
                        
                  <tr key={index}>
                    <th scope="row">{key[0]}</th>
                    <td>{key[1]}</td>
                    <td>{key[2]}</td>
                    <td>{key[3]}</td>
					<td>{key[4]}</td>
                     <td>
                     <button type="button" className="btn btn-outline-danger" onClick={()=>dropCourseHandler(index)}><i className="far fa-trash-alt"></i></button>
                      </td>
                  </tr>
                )
            })}
          </tbody>
        </table>
      }
    </div>
    }

</div>
  )
}
