import express from "express"
import { deductCredit, getCurrentUser, login,logout, updateUserPayment } from "../controllers/auth_cntrl.js"
import { Protect } from "../MiddleWare/auth_middleware.js"

const authRouter = express.Router()

authRouter.post("/login", login)
authRouter.post("/logout", logout)
authRouter.post("/update-plan", updateUserPayment)
authRouter.post("/deduct-credit", deductCredit)

authRouter.get("/me", Protect, getCurrentUser)


export default authRouter