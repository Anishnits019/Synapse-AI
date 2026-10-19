import { cert, initializeApp } from "firebase-admin"
import "dotenv/config"
import { AppError } from "../../../shared/errors.js"

let firebaseApp

export const getFirebaseApp = () => {
    if (firebaseApp) {
        return firebaseApp
    }

    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT
    if (!serviceAccountJson) {
        throw new AppError(
            503,
            "AUTHENTICATION_UNAVAILABLE",
            "Sign-in is temporarily unavailable. Please try again later."
        )
    }

    let serviceAccount
    try {
        serviceAccount = JSON.parse(serviceAccountJson)
    } catch (cause) {
        throw new AppError(
            500,
            "AUTHENTICATION_CONFIGURATION_ERROR",
            "Sign-in is temporarily unavailable. Please try again later.",
            { cause }
        )
    }

    try {
        firebaseApp = initializeApp({ credential: cert(serviceAccount) })
        return firebaseApp
    } catch (cause) {
        throw new AppError(
            500,
            "AUTHENTICATION_CONFIGURATION_ERROR",
            "Sign-in is temporarily unavailable. Please try again later.",
            { cause }
        )
    }
}
