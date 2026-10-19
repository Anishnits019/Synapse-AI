import proxy from 'express-http-proxy'
import { AppError } from '../../shared/errors.js'

export const proxyWithHeader=(serviceUrl)=>{
    if (!serviceUrl) {
        return (req, res, next) => next(new AppError(
            503,
            "SERVICE_UNAVAILABLE",
            "This service is temporarily unavailable. Please try again in a moment."
        ))
    }

    return proxy(serviceUrl,{
        limit: '100mb',
        proxyErrorHandler:(error,res,next)=>{
            next(new AppError(
                502,
                "SERVICE_UNAVAILABLE",
                "This service is temporarily unavailable. Please try again in a moment.",
                { cause: error }
            ))
        },
        proxyReqOptDecorator:(proxyReqOpts,srcReq)=>{
            if(srcReq.user){
                proxyReqOpts.headers['x-user-id'] = srcReq.user.userID
            }
            return proxyReqOpts
        }
   })
}