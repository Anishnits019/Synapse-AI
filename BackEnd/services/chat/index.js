import dotenv from "dotenv"
import express from "express"
import connectDB from "./config/db.js"
import chatRouter from "./routes/chatRoute.js"
import { errorHandler, notFoundHandler } from "../../shared/errors.js"
dotenv.config()

const app = express()
const port = process.env.PORT

app.use(express.json())

app.get("/", (req, res) => {
    res.json({ message: "hello from chat" })
})
app.use("/", chatRouter)
app.use(notFoundHandler)
app.use(errorHandler)

const start = async () => {
    try {
        await connectDB()
        app.listen(port, () => {
            console.info(`Chat service listening on port ${port}`)
        }).on("error", (error) => {
            console.error("Chat service could not listen:", error)
            process.exitCode = 1
        })
    } catch (error) {
        console.error("Chat service could not start:", error)
        process.exitCode = 1
    }
}

void start()