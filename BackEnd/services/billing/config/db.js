import mongoose from "mongoose"
import { AppError } from "../../../shared/errors.js"

const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI
        if (!uri) {
            throw new AppError(
                500,
                "DATABASE_CONFIGURATION_ERROR",
                "The billing service is missing its database configuration."
            )
        }
        await mongoose.connect(uri)
        console.info("Billing database connected")
    } catch (error) {
        if (error instanceof AppError) {
            throw error
        }
        throw new AppError(
            503,
            "DATABASE_UNAVAILABLE",
            "Billing is temporarily unavailable. Please try again later.",
            { cause: error }
        )
    }
}

export default connectDB