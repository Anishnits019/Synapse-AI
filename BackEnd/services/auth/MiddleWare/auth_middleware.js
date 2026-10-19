import redis from "../../../shared/redis/redis.js"
import { AppError } from "../../../shared/errors.js"

export const Protect=async(req,res,next)=>{
    const sessionID=req.cookies?.session
    if(!sessionID){
        throw new AppError(
            401,
            "AUTHENTICATION_REQUIRED",
            "Please sign in to continue."
        )
    }
    const session=await redis.get(`session-${sessionID}`)
    if(!session){
        throw new AppError(
            401,
            "SESSION_EXPIRED",
            "Your session has expired. Please sign in again."
        )
    }
    try {
        req.user=JSON.parse(session)
    } catch (cause) {
        throw new AppError(
            401,
            "INVALID_SESSION",
            "Your session is no longer valid. Please sign in again.",
            { cause }
        )
    }
    return next()
}
