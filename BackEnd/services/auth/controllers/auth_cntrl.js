import {getAuth} from 'firebase-admin/auth'
import {app} from "../config/firebase.js"
import crypto from "crypto"
import UserModel from "../models/user_model.js"
import redis from '../../../shared/redis/redis.js'

export const login =async(req,res)=>{
    try{
        const {token}=req.body
        const decoded=await getAuth(app).verifyIdToken(token)
        console.log(decoded)

        let user =await UserModel.findOne({
            firebaseUID:decoded.uid
        })
         console.log("Database user:", user)

        if(!user){
            user=await UserModel.create({
                firebaseUID:decoded.uid,
                name:decoded.name,
                email:decoded.email,
                avatar:decoded.picture || null
            })
        }else {
               user.avatar = decoded.picture || user.avatar
               await user.save()
}
       console.log(user)
       const sessionId = crypto.randomUUID()
       
       await redis.set(`session-${sessionId}`,
        JSON.stringify({
            userID:user._id,
            name:user.name,
            email:user.email,
            avatar:user.avatar
        }),"EX",7*24*60*60)


       res.cookie("session",sessionId,{
        httpOnly:true,
        secure:false,
        sameSite:"strict",
        maxAge:7*24*60*60*1000
       })
       return res.status(200).json(user)

    }
    catch(error){
               console.error("Login error:", error)
               return res.status(500).json({
                "message":`Login error${error}`
               
    })

    }
}

export const logout =async(req,res)=>{
    try{
        const sessionId=req.cookies?.session
        await redis.del(`session-${sessionId}`)


       res.clearCookie("session")
       return res.status(200).json({"message":"logout successfully"})

    }catch(error){
           return res.status(500).json({
            "messages":`logout error ${error}`
           })
    }
}

export const getCurrentUser=async(req,res)=>{
    try{
            const user = await UserModel.findById(req.user.userID)
            if (!user) {
                return res.status(404).json({ message: "User not found" })
            }
            return res.status(200).json(user)
    }catch(error){
        return res.status(500).json({
            message:`get current user error ${error}`
        })
    }
}

export const updateUserPayment = async (req, res) => {
    try {
        const { plan, credits, userId } = req.body;
        const creditAmount = Number(credits) || 0;

        const user = await UserModel.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        user.plan = plan;
        user.credits = (user.credits || 0) + creditAmount;
        user.totalCredits = (user.totalCredits || 0) + creditAmount;

        const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        user.planExpiresAt = expiryDate;

        await user.save();

        const sessionId = req.cookies?.session;
        if (sessionId) {
            await redis.set(
                `session-${sessionId}`,
                JSON.stringify({
                    userID: user._id,
                    name: user.name,
                    email: user.email,
                    avatar: user.avatar,
                    plan: user.plan,
                    credits: user.credits,
                    totalCredits: user.totalCredits,
                    planExpiresAt: user.planExpiresAt
                }),
                "EX",
                7 * 24 * 60 * 60
            );
        }

        return res.status(200).json({
            success: true,
            message: "User payment and credits updated successfully",
            user: {
                plan: user.plan,
                credits: user.credits,
                totalCredits: user.totalCredits,
                planExpiresAt: user.planExpiresAt
            }
        });

    } catch (error) {
        console.error("Error updating user payment:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

export const deductCredit = async (req, res) => {
    try {
        const userId = req.body.userId || req.headers["x-user-id"];
        if (!userId) {
            return res.status(400).json({ message: "User ID is required" });
        }

        const user = await UserModel.findOneAndUpdate(
            { _id: userId, credits: { $gt: 0 } },
            { $inc: { credits: -1 } },
            { new: true }
        );

        if (!user) {
            return res.status(402).json({ message: "Insufficient credits" });
        }

        const sessionId = req.cookies?.session;
        if (sessionId) {
            await redis.set(
                `session-${sessionId}`,
                JSON.stringify({
                    userID: user._id,
                    name: user.name,
                    email: user.email,
                    avatar: user.avatar,
                    plan: user.plan,
                    credits: user.credits,
                    totalCredits: user.totalCredits,
                    planExpiresAt: user.planExpiresAt
                }),
                "EX",
                7 * 24 * 60 * 60
            );
        }

        return res.status(200).json({
            credits: user.credits,
            totalCredits: user.totalCredits
        });
    } catch (error) {
        console.error("Error deducting credit:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};