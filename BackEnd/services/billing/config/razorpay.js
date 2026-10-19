import Razorpay from "razorpay";
import dotenv from "dotenv";
import { AppError } from "../../../shared/errors.js";

dotenv.config();

let razorpay;

export const getRazorpayClient = () => {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
        throw new AppError(
            503,
            "PAYMENT_CONFIGURATION_ERROR",
            "Payments are temporarily unavailable. Please try again later."
        );
    }

    if (!razorpay) {
        razorpay = new Razorpay({
            key_id: keyId,
            key_secret: keySecret,
        });
    }
    return razorpay;
};