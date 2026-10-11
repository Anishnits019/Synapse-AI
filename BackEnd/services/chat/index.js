import dotenv from "dotenv"
import express from "express"
import connectDB from "./config/db.js"
import chatRouter from "./routes/chatRoute.js"
dotenv.config()

const app=express()
const port=process.env.PORT

app.use(express.json())

app.get('/',(req,res)=>{
    res.json({message:"hello from chat"})
})
app.use("/",chatRouter)

app.listen(port,()=>{
    console.log(`Chat Service Started on port ${port}`)
    connectDB()
})