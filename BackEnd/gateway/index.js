import express from "express"
import "dotenv/config"
import proxy from "express-http-proxy"
import cors from "cors"
import cookieParser from "cookie-parser"
import { proxyWithHeader } from "./Utils/proxyWithHeader.js"
import { Protect } from "./middleware/auth_middleware.js"
import morgan from "morgan"
import { AppError, errorHandler, notFoundHandler } from "../shared/errors.js"

const app = express()

app.use(express.json())
app.use(cookieParser())

app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
}))

const port = process.env.PORT || 3000

app.get("/", (req, res) => {
    res.json({ message: "hello from gateway" })
})

app.use(morgan("dev"))
const authProxy = process.env.AUTH_SERVICE
    ? proxy(process.env.AUTH_SERVICE, {
    proxyErrorHandler: (error, res, next) => {
        next(new AppError(
            502,
            "AUTH_SERVICE_UNAVAILABLE",
            "Sign-in is temporarily unavailable. Please try again in a moment.",
            { cause: error }
        ))
    },
})
    : (_req, _res, next) => next(new AppError(
        503,
        "AUTH_SERVICE_UNAVAILABLE",
        "Sign-in is temporarily unavailable. Please try again in a moment."
    ))
app.use("/auth", authProxy)
app.use("/chat", Protect, proxyWithHeader(process.env.CHAT_SERVICE))
app.use("/agent", Protect, proxyWithHeader(process.env.AGENT_SERVICE))
app.use("/billing", Protect, proxyWithHeader(process.env.BILLING_SERVICE))
app.use(notFoundHandler)
app.use(errorHandler)

const server = app.listen(port, () => {
    console.info(`Gateway listening on port ${port}`)
})
server.on("error", (error) => {
    console.error("Gateway could not start:", error)
    process.exitCode = 1
})