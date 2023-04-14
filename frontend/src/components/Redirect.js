import axios from 'axios';
import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export const Redirect = () => {
  const navigate=useNavigate();
  useEffect(()=>{
    const f=async()=>{
      try {
        const res=await axios.get("http://localhost:4000/validSession", {withCredentials: true});
        console.log(res.data)
        if(!res.data.session){
          navigate("/login");
        }
        else{
          navigate("/home");
        }
      } catch (error) {
        console.log(error);
      }
    }
    f();
  },[])
  return (
    <div></div>
  )
}
