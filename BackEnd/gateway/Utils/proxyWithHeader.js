import proxy from 'express-http-proxy'

export const proxyWithHeader=(serviceUrl)=>{
    return proxy(serviceUrl,{
        limit: '100mb',
        proxyReqOptDecorator:(proxyReqOpts,srcReq)=>{
            if(srcReq.user){
                proxyReqOpts.headers['x-user-id'] = srcReq.user.userID
            }
            return proxyReqOpts
        }
   })
}