import express from "express"
import "dotenv/config"
import proxy from "express-http-proxy"
import cors from 'cors'
import cookieParser from "cookie-parser"
import { proxyWithHeader } from './Utils/proxyWithHeader.js'
import {Protect} from "./middleware/auth_middleware.js"
import morgan from "morgan"
 
const app=express()

app.use(express.json())
app.use(cookieParser())

app.use(cors({
    origin:process.env.FRONTEND_URL,
    credentials:true,
}))

const port=process.env.PORT


app.get("/",(req,res)=>{
    res.json({message:"hello from gateway"})
})

app.use(morgan("dev"))
app.use("/auth",proxy(process.env.AUTH_SERVICE))
app.use("/chat",Protect,proxyWithHeader(process.env.CHAT_SERVICE))
app.use("/agent",Protect,proxyWithHeader(process.env.AGENT_SERVICE))
app.use("/billing",Protect,proxyWithHeader(process.env.BILLING_SERVICE))

app.listen(port,()=>{
    console.log(`Gateway Started ${port}`)
})