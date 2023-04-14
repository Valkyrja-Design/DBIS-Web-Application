import React, { useEffect, useState } from 'react'
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import HashLoader from 'react-spinners/HashLoader';
import {AiOutlineLogout} from 'react-icons/ai';
import { ReactSearchAutocomplete } from 'react-search-autocomplete';
import { useNavigate } from "react-router-dom";
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import axios from 'axios';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import "./register.css"

export const RegisterPage = () => {

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [color, setColor] = useState("#0074D9");
  const [selectedSections, setSelectedSections] = useState([])
  const [alertInfo, setAlertInfo] = useState({show: false, info: "", type:"Failed"})
  const [inpStr, setInpStr]=useState("");
  const navigate = useNavigate();
  const [curr_year, setCurrYear]=useState("")
  const [curr_sem, setCurrSem]=useState("")

  // all courses running in the current semester
  // id is just index
  const [items,setItems]=useState([])
  const [results, setResults] = useState([]);

  useEffect(()=>{
    const func=async()=>{
      const r=await axios.get("http://localhost:4000/getCurrSemester", {withCredentials: true})
      if(r.status!=200){
        logoutHandler()
        return
      }
      setCurrSem(r.data.curr_sem)
      setCurrYear(r.data.curr_year)
      const response= await axios.post("http://localhost:4000/getRunningCourses",{curr_sem:r.data.curr_sem, curr_year:r.data.curr_year}, {withCredentials:true})
      if(response.status!=200){
        // navigate("/login")
        logoutHandler()
        return
      }
      console.log("runningCourse", response)
      let res=response.data.running_courses.rows
      //To merge section IDs
      let result = res.reduce(function (r, a) {
          r[a.course_id] = r[a.course_id] || [];
          r[a.course_id].push(a);
          return r;
      }, {});
      console.log(result)

      let item=[]
      Object.keys(result).map((res,ind)=>{
        let temp={};
        temp.id=ind;
        temp.course_id=result[res][0].course_id
        temp.credits=result[res][0].credits
        temp.dept_name=result[res][0].dept_name
        temp.title=result[res][0].title
        temp.selectedSection=null
        temp.section=[]
        for(let i=0;i<result[res].length;i++){
          temp.section.push(result[res][i].sec_id)
        }
        item.push(temp)
      })
      setItems(item)
      setResults(item)
      setName(response.data.name)
      setLoading(false)
    }
    func()
  },[])

  const logoutHandler = async () => {
    // handler logout
    const resp=await axios.get("http://localhost:4000/destroySession",{withCredentials:true})
    navigate("/login")
  }

  const registerCourseHandler = async (index) => {
    if (!results[index].selectedSection) {
     setAlertInfo({show: true, info: "No Section Selected!", type:"Failed"})
      return
    }
    // register course at given index
    console.log(results[index])

    const response =  await axios.post("http://localhost:4000/register",
                                {curr_sem:curr_sem,
                                 curr_year:curr_year,
                                 course_id: results[index].course_id,
                                 sec_id: results[index].selectedSection
                                }, {withCredentials:true})
    
    if (response.data.alreadyTaken){
      setAlertInfo({show: true, info: "Course already taken!", type:"Failed"})
    } else if (response.data.pre_req_fail){
      setAlertInfo({show: true, info: "Pre-requisites not fulfilled!", type:"Failed"})
    } else if (response.data.slot_clashes){
      // alert("Slot clashes!")
      setAlertInfo({show: true, info: "Slot clashes!", type:"Failed"})
    } else{
      // registration successful

      // set results to null
      setAlertInfo({show: true, info: "Successfully Registered!", type: "Success"})
      // and reset selected sections
    }

  }

  const handleOnSearch = (string, res) => {
    // onSearch will have as the first callback parameter
    // the string searched and for the second the results.
    // console.log("Results: ", string, res)
    if(string===""){
      setResults(items)
    }
    else{
      setResults(res)
    }
  }

  const formatResult = (item) => {
    return (
      <>
        <span style={{ display: 'block', textAlign: 'left' }}>{item.course_id}: {item.title}</span>
      </>
    )
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
          <Navbar.Brand href="/home" onClick={() => navigate("/home", { from : 'registration'})}>{name}</Navbar.Brand>
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
      <div style={{display: 'flex',  justifyContent:'center',marginTop:'4vh', background:'white'}}>
        <div className="App">
            <header className="App-header">
                <div style={{ width: 400 }}>
                <ReactSearchAutocomplete
                    items={items}
                    onSearch={handleOnSearch}
                    placeholder="Enter Course Code or Name"
                    formatResult={formatResult}
                    fuseOptions={{keys: ['course_id', 'title']}}
                    resultStringKeyName='course_id'
                />
                </div>
            </header>
        </div>
      </div>
      {(results != null && results.length > 0) && <table className="table mt-3">
        <thead className="table-light">
          <tr>
            <th scope="col">Course Code</th>
            <th scope="col">Course Name</th>
            <th scope="col">Section</th>
            <th scope="col"></th>
          </tr>
        </thead>
        <tbody>
          {results.map((key, index) => {
            return (
                  <tr key={index}>
                    <th scope="row">{key.course_id}</th>
                    <td>{key.title}</td>
                    <td>
                      <DropdownButton id="dropdown-basic-button"  title={key.selectedSection || "Select Section"}>
                        {key.section.map((sect, ind) => {
                          return (<Dropdown.Item key={ind} onClick={() => {
                              setResults((result)=>{
                                return [...result.slice(0, index), {...key, selectedSection:sect}, ...result.slice(index+1)];
                              })
                            }}>{sect}</Dropdown.Item>)
                          })}
                      </DropdownButton>
                    </td>
                    <td>
                      <button type="button" className="btn btn-outline-primary" onClick={() => registerCourseHandler(index)}><span>Register</span></button>
                    </td>
                  </tr>
                )
            })}
          </tbody>
        </table>
      }
      {
        results.length<=0 && (
          <div style={{marginLeft:"42vw", marginTop:"30vh"}}>
            <h4 className="mb-2">No Matching Results</h4>
        </div>
        )
      }
      <Modal centered show={alertInfo.show} onHide={() => setAlertInfo({show: false, info: ""})}>
        <Modal.Header closeButton>
          <Modal.Title>Registration {alertInfo.type}!</Modal.Title>
        </Modal.Header>
        <Modal.Body>{alertInfo.info}</Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() =>{
            if(alertInfo.type==="Success"){
              window.location.reload()
            }
            setAlertInfo({show: false, info: ""})
          }}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
    }

</div>
  )
}
