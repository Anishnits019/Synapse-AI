import "dotenv/config";
import crypto from "crypto";
import axios from "axios";
import { PLANS } from "../config/Plans.js";
import { getRazorpayClient } from "../config/razorpay.js";
import Payment from "../models/payment_model.js";
import {AppError} from "../../../shared/errors.js";

export const createOrder = async (req, res) => {
    const { plan } = req.body ?? {};
    const userId = req.headers["x-user-id"];
    const selectedPlan = PLANS[plan];

    if (!userId) {
        throw new AppError(
            401,
            "AUTHENTICATION_REQUIRED",
            "Please sign in before starting a payment."
        );
    }
    if (!selectedPlan || selectedPlan.amount <= 0) {
        throw new AppError(
            400,
            "INVALID_PLAN",
            "Please choose a valid paid plan."
        );
    }

    let order;
    try {
        order = await getRazorpayClient().orders.create({
            amount: selectedPlan.amount * 100,
            currency: "INR",
            receipt: `${Date.now()}`,
        });
    } catch (cause) {
        throw new AppError(
            502,
            "PAYMENT_PROVIDER_UNAVAILABLE",
            "We couldn't start checkout right now. Please try again in a moment.",
            { cause }
        );
    }

    await Payment.create({
        userId,
        orderId: order.id,
        amount: selectedPlan.amount,
        credits: selectedPlan.credits,
        plan: selectedPlan.id,
        currency: order.currency,
        status: "created",
    });

    return res.status(200).json({
        order,
        plan: selectedPlan,
    });
};

export const verifyPayment = async (req, res) => {
    const {
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
    } = req.body ?? {};
    const userId = req.headers["x-user-id"];

    if (!userId) {
        throw new AppError(
            401,
            "AUTHENTICATION_REQUIRED",
            "Please sign in before verifying a payment."
        );
    }
    if (!orderId || !paymentId || !signature) {
        throw new AppError(
            400,
            "PAYMENT_DETAILS_REQUIRED",
            "Payment details are incomplete. Please retry checkout."
        );
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
        throw new AppError(
            503,
            "PAYMENT_CONFIGURATION_ERROR",
            "Payment verification is temporarily unavailable. Please try again later."
        );
    }

    const generatedSignature = crypto
        .createHmac("sha256", secret)
        .update(`${orderId}|${paymentId}`)
        .digest("hex");
    const generatedSignatureBuffer = Buffer.from(generatedSignature);
    const receivedSignatureBuffer = Buffer.from(signature);
    const isSignatureValid =
        generatedSignatureBuffer.length === receivedSignatureBuffer.length
        && crypto.timingSafeEqual(generatedSignatureBuffer, receivedSignatureBuffer);

    if (!isSignatureValid) {
        throw new AppError(
            400,
            "PAYMENT_VERIFICATION_FAILED",
            "We couldn't verify this payment. Please check the payment details or contact support."
        );
    }

    const payment = await Payment.findOne({ orderId });
    if (!payment) {
        throw new AppError(
            404,
            "PAYMENT_NOT_FOUND",
            "We couldn't find this payment. Please contact support if you were charged."
        );
    }
    if (payment.userId !== userId) {
        throw new AppError(
            403,
            "PAYMENT_ACCESS_DENIED",
            "This payment doesn't belong to your account."
        );
    }
    if (payment.status === "paid") {
        return res.status(200).json({
            message: "This payment has already been verified.",
            payment,
        });
    }

    const authService = process.env.AUTH_SERVICE;
    if (!authService) {
        throw new AppError(
            503,
            "ACCOUNT_SERVICE_UNAVAILABLE",
            "Your payment was received, but we couldn't update your plan yet. Please contact support."
        );
    }

    try {
        await axios.post(
            `${authService}/update-plan`,
            {
                userId: payment.userId,
                plan: payment.plan,
                credits: payment.credits,
            },
            { timeout: 10000 }
        );
    } catch (cause) {
        throw new AppError(
            502,
            "ACCOUNT_UPDATE_FAILED",
            "Your payment was verified, but we couldn't update your plan yet. Please contact support.",
            { cause }
        );
    }

    payment.status = "paid";
    payment.paymentId = paymentId;
    await payment.save();

    return res.status(200).json({
        message: "Payment verified successfully.",
        payment,
    });
};
