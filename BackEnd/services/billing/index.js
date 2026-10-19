import "dotenv/config"
import express from "express"
import cookieParser from "cookie-parser"
import connectDB from "./config/db.js"
import billingRouter from "./routes/billingRoutes.js"
import { errorHandler, notFoundHandler } from "../../shared/errors.js"

const app = express()
app.use(express.json())
app.use(cookieParser())

const port = process.env.PORT

app.get("/", (req, res) => {
    res.json({ message: "hello from billing" })
})

app.use("/", billingRouter)
app.use(notFoundHandler)
app.use(errorHandler)

const start = async () => {
    try {
        await connectDB()
        app.listen(port, () => {
            console.info(`Billing service listening on port ${port}`)
        }).on("error", (error) => {
            console.error("Billing service could not listen:", error)
            process.exitCode = 1
        })
    } catch (error) {
        console.error("Billing service could not start:", error)
        process.exitCode = 1
    }
}

void start()