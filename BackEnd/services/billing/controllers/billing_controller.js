import "dotenv/config";
import crypto from "crypto";
import razorpay from "../config/razorpay.js";
import { PLANS } from "../config/Plans.js";
import Payment from "../models/payment_model.js";
import axios from "axios";

export const createOrder = async (req, res) => {
    try {
        const { plan } = req.body;
        const userId = req.headers["x-user-id"];
        const selectedPlan = PLANS[plan];
        console.log(selectedPlan)
        if (!userId) {
            return res.status(401).json({ message: "User ID is required" });
        }

        if (!selectedPlan) {
            return res.status(404).json({
                message: "Plan not found"
            });
        }

        const order = await razorpay.orders.create({
            amount: selectedPlan.amount * 100,
            currency: "INR",
            receipt: `${Date.now()}`
        });
        
        await Payment.create({
            userId,
            orderId: order.id,
            amount: selectedPlan.amount,
            credits: selectedPlan.credits,
            plan: selectedPlan.id,
            currency: order.currency,
            status: "created"
        });

        return res.status(200).json({
            order,
            plan: selectedPlan
        });
    } catch (error) {
        return res.status(500).json({
            message: `${error}`
        });
    }
};

export const verifyPayment = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;

        const userId = req.headers["x-user-id"];
        if (!userId) {
            return res.status(401).json({ message: "User ID is required" });
        }

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ message: "Incomplete payment details" });
        }

        const generatedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        if (generatedSignature !== razorpay_signature) {
            return res.status(400).json({
                message: "Payment Verification Failed"
            });
        }

        const payment = await Payment.findOne({
            orderId: razorpay_order_id
        });

        if (!payment) {
            return res.status(404).json({
                message: "Payment Not Found"
            });
        }

        if (payment.userId !== userId) {
            return res.status(403).json({ message: "Payment does not belong to this user" });
        }

        if (payment.status === "paid") {
            return res.status(200).json({
                message: "Payment already verified",
                payment
            });
        }

        if (!process.env.AUTH_SERVICE) {
            return res.status(500).json({ message: "AUTH_SERVICE is not configured" });
        }

        await axios.post(`${process.env.AUTH_SERVICE}/update-plan`,{
            userId:payment.userId,
            plan:payment.plan,
            credits:payment.credits
        })

        payment.status = "paid";
        payment.paymentId = razorpay_payment_id;
        await payment.save();


        return res.status(200).json({
            message: "Payment verified successfully",
            payment
        });
    } catch (error) {
        return res.status(500).json({
            message: `${error}`
        });
    }
};