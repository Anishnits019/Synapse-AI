import React from 'react'
import Home from './pages/Home.jsx'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { setUserData } from './redux/userSlice.js'
import { getCurrentUser } from './features/getCurrentUser.js'

function App() {
  const dispatch = useDispatch()

  useEffect(()=>{
     const getUser=async()=>{
      const data = await getCurrentUser()
      dispatch(setUserData(data))
     }
     getUser()
  },[])
  return (
    <>
      <Home />
    </>
  )
}

export default App