import Home from './pages/Home.jsx'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { setUserData, setUserLoading } from './redux/userSlice.js'
import { getCurrentUser } from './features/getCurrentUser.js'

function App() {
  const dispatch = useDispatch()

  useEffect(()=>{
     const getUser=async()=>{
      try {
        const data = await getCurrentUser()
        dispatch(setUserData(data))
      } finally {
        dispatch(setUserLoading(false))
      }
     }
     getUser()
  },[dispatch])
  return (
    <>
      <Home />
    </>
  )
}

export default App