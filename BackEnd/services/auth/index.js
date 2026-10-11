import "dotenv/config"
import express from "express"
import cookieParser from "cookie-parser"
import {connectDB} from "./config/db.js"
import authRouter from "./routes/authRoutes.js"

const app=express()


app.use(express.json())

app.use(cookieParser())
const port = process.env.PORT

app.get("/",(req,res)=>{
    res.json({message:"hello from auth"})
})
app.use("/",authRouter)

app.listen(port,()=>{
    console.log(`Auth Service Started ${process.env.PORT}`)
    connectDB()
})