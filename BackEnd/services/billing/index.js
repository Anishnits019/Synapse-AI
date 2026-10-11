import "dotenv/config"
import express from "express"
import cookieParser from "cookie-parser"
import connectDB from "./config/db.js"
import billingRouter from "./routes/billingRoutes.js"

const app=express()


app.use(express.json())
app.use(cookieParser())

const port = process.env.PORT

app.get("/",(req,res)=>{
    res.json({message:"hello from auth"})
})

app.use("/",billingRouter)

app.listen(port,()=>{
    console.log(`Billing Started ${process.env.PORT}`)
    connectDB()
})