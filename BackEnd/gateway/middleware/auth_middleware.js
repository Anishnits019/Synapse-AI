import redis from '../../shared/redis/redis.js'
export const Protect=async(req,res,next)=>{
    try{
    const sessionID=req.cookies?.session
    if(!sessionID){
        return res.status(400).json({
           messages: "Unauthorized"
        })
    }
    const session=await redis.get(`session-${sessionID}`)
    if(!session){
        return res.status(400).json({
            messages:"Session expires"
        })
    }
    req.user=JSON.parse(session)
    next()
}
    catch(error){
        return res.status(500).json({
            messages:`protect error ${error}`
    })
}
}
