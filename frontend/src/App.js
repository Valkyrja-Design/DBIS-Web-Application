import React, { useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useRoutes,
  useLocation,
} from "react-router-dom";

import { LoginPage } from './components/LoginPage';
import { Redirect } from "./components/Redirect";
import { HomePage } from "./components/HomePage";
import { ErrorPage } from "./components/ErrorPage";
import axios from "axios";
import { RegisterPage } from "./components/RegisterPage";
import { Departments } from "./components/Departments";
import { Courses } from "./components/Courses";
import { Course } from "./components/Course";
import { Instructor } from "./components/Instructor";


function RequireAuth() {
	const [sessionState, setSessionState]=useState(true);
  	//Add auth condition
	const f=async()=>{
		try {
			const res=await axios.get("http://localhost:4000/validSession", {withCredentials: true});
			console.log(res.data)
			if(!res.data.session){
				setSessionState(false);
			}
		} catch (error) {
			console.log(error);
		}
	}
	f();
	return sessionState?<Outlet/>:<Navigate to="/login"/>;
}


function App() {
  return (
    <Router>
      <Routes>
      {/* redirect to login if not a valid session else home page */}
        <Route path="/" exact element={<Redirect />} />
        <Route path="/login" exact element={<LoginPage />} />
        <Route element={<RequireAuth />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/home/registration" element={<RegisterPage />} />
          <Route path="/course/running" element={<Departments />} />
          <Route path="/course/running/:dept_name" element={<Courses />} />
          <Route path="/course/:course_id" element={<Course />} />
          <Route path='/instructor/:instructor_id' element={<Instructor />} />
        </Route>
        <Route path="*" element={<ErrorPage />} />
      </Routes>
    </Router>
  );
}

export default App;
