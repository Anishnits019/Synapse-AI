import { signInWithPopup } from 'firebase/auth'
import { auth, googleprovider } from '../../utils/firebase.js'
import api from '../../utils/axios.js'
import { useDispatch, useSelector } from 'react-redux'
import { setUserData } from '../redux/userSlice.js'
import {Sidebar} from '../components/Sidebar.jsx'
import {ChatArea} from '../components/ChatArea.jsx'
// import Artifact from '../components/Artifact.jsx'
export const Home = () => {
  const {userData} =useSelector(state=>state.user)
  const isAuthLoading = useSelector(state=>state.user.isLoading)
  const dispatch=useDispatch()

  console.log(userData)
  const handlelogin =async(token)=>{
    try{
        const {data}=await api.post('/auth/login',{token})
        // The axios return object have attribute called data nto response i was intially
        // using response so that's why it is giving error
        console.log(data)
        dispatch(setUserData(data))
    }catch(error){
      console.error("Login request failed", error)
    }
  }
  const googleLogin = async () => {
    try {

      const data = await signInWithPopup(auth, googleprovider)
      // data is a Firebase UserCredential Object it contains signed-in Firebase  user

      // we have to first verify the accessToken inside the user.accesstoken such that i can get the user 

      const token =await data.user.getIdToken()

      // this is the acessToken inside them so they did that 
      await handlelogin(token)
    } catch (error) {
      console.error("Login failed", error)
    }
  }

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-[#090b10] text-slate-100">
    <Sidebar onLogin={googleLogin}/>
    
    <main className="flex min-w-0 flex-1 flex-col bg-[#0b0d12] pt-16 lg:pt-0">
      <ChatArea/>
    </main>

    {/* <Artifact/> */}
    {!isAuthLoading && !userData &&
    <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-[340px] rounded-2xl border border-white/10 bg-[#12151c] p-8 flex flex-col items-center gap-6 shadow-2xl shadow-black/40">
        {/* Logo/Icon area */}
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <span className="text-white text-2xl font-bold">S</span>
        </div>

        <div className="text-center">
          <h2 className="text-white text-2xl font-semibold">
            Welcome to Synapse AI
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Sign in to continue
          </p>
        </div>

        <button
          onClick={googleLogin}
          className="w-full h-12 bg-white text-gray-800 rounded-lg font-medium hover:bg-gray-100 active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-sm"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </button>

        <p className="text-gray-500 text-xs text-center">
          By continuing, you agree to our{" "}
          <span className="underline cursor-pointer hover:text-gray-300">Terms</span> and{" "}
          <span className="underline cursor-pointer hover:text-gray-300">Privacy Policy</span>
        </p>
      </div>

    </div>}

    </div>
  );
}

export default Home