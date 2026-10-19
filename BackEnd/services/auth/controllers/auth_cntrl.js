import { getAuth } from "firebase-admin/auth";
import crypto from "crypto";
import UserModel from "../models/user_model.js";
import redis from "../../../shared/redis/redis.js";
import { AppError } from "../../../shared/errors.js";
import { getFirebaseApp } from "../config/firebase.js";

const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

const saveUserSession = async (sessionId, user) => {
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
            planExpiresAt: user.planExpiresAt,
        }),
        "EX",
        SESSION_TTL_SECONDS
    );
};

export const login = async (req, res) => {
    const { token } = req.body ?? {};
    if (!token) {
        throw new AppError(
            400,
            "AUTH_TOKEN_REQUIRED",
            "Please sign in before continuing."
        );
    }

    const decoded = await getAuth(getFirebaseApp()).verifyIdToken(token);
    let user = await UserModel.findOne({ firebaseUID: decoded.uid });

    if (!user) {
        user = await UserModel.create({
            firebaseUID: decoded.uid,
            name: decoded.name,
            email: decoded.email,
            avatar: decoded.picture || null,
        });
    } else {
        user.avatar = decoded.picture || user.avatar;
        await user.save();
    }

    const sessionId = crypto.randomUUID();
    await saveUserSession(sessionId, user);

    res.cookie("session", sessionId, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: SESSION_TTL_SECONDS * 1000,
    });
    
    return res.status(200).json(user);
};

export const logout = async (req, res) => {
    const sessionId = req.cookies?.session;
    if (!sessionId) {
        throw new AppError(
            401,
            "SESSION_NOT_FOUND",
            "You’re already signed out."
        );
    }

    await redis.del(`session-${sessionId}`);
    res.clearCookie("session", {
        httpOnly: true,
        secure: true,
        sameSite: "none",
    });
    return res.status(200).json({ message: "You have been signed out." });
};

export const getCurrentUser = async (req, res) => {
    const user = await UserModel.findById(req.user.userID);
    if (!user) {
        throw new AppError(404, "USER_NOT_FOUND", "We couldn't find your account.");
    }
    return res.status(200).json(user);
};

export const updateUserPayment = async (req, res) => {
    const { plan, credits, userId } = req.body ?? {};
    const creditAmount = Number(credits);

    if (!userId || !plan || !Number.isFinite(creditAmount) || creditAmount <= 0) {
        throw new AppError(
            400,
            "INVALID_PLAN_UPDATE",
            "The plan update details are incomplete or invalid."
        );
    }

    const user = await UserModel.findById(userId);
    if (!user) {
        throw new AppError(404, "USER_NOT_FOUND", "We couldn't find that account.");
    }

    user.plan = plan;
    user.credits = (user.credits || 0) + creditAmount;
    user.totalCredits = (user.totalCredits || 0) + creditAmount;
    user.planExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await user.save();

    const sessionId = req.cookies?.session;
    if (sessionId) {
        await saveUserSession(sessionId, user);
    }

    return res.status(200).json({
        success: true,
        message: "Your plan and credits have been updated.",
        user: {
            plan: user.plan,
            credits: user.credits,
            totalCredits: user.totalCredits,
            planExpiresAt: user.planExpiresAt,
        },
    });
};

export const deductCredit = async (req, res) => {
    const userId = req.body?.userId || req.headers["x-user-id"];
    if (!userId) {
        throw new AppError(
            400,
            "USER_ID_REQUIRED",
            "We couldn't identify your account. Please sign in and try again."
        );
    }

    const user = await UserModel.findOneAndUpdate(
        { _id: userId, credits: { $gt: 0 } },
        { $inc: { credits: -1 } },
        { new: true }
    );

    if (!user) {
        const existingUser = await UserModel.exists({ _id: userId });
        if (!existingUser) {
            throw new AppError(404, "USER_NOT_FOUND", "We couldn't find that account.");
        }
        throw new AppError(
            402,
            "INSUFFICIENT_CREDITS",
            "You’re out of credits. Choose a plan to continue."
        );
    }

    const sessionId = req.cookies?.session;
    if (sessionId) {
        await saveUserSession(sessionId, user);
    }

    return res.status(200).json({
        credits: user.credits,
        totalCredits: user.totalCredits,
    });
};
