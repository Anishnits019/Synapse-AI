import {initializeApp,cert} from "firebase-admin"
import "dotenv/config";
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
export const app=initializeApp({
  credential:cert(serviceAccount)
});

