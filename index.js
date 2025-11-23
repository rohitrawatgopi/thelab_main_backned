import axios from "axios";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { GoogleAuth } from "google-auth-library";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;
const DEFAULT_TOPIC = process.env.TOPIC_NAME || "all_users";
const SERVICE_ACCOUNT = JSON.parse(process.env.SERVICE_ACCOUNT_JSON);
const SCOPES = ["https://www.googleapis.com/auth/firebase.messaging"];

async function sendFCM(topic, title, body, data = {}) {
  const auth = new GoogleAuth({
    credentials: SERVICE_ACCOUNT,
    scopes: SCOPES,
  });

  const client = await auth.getClient();
  const accessToken = await client.getAccessToken();

  const message = {
    message: {
      topic,
      notification: { title, body },
      data,
    },
  };

  const url = `https://fcm.googleapis.com/v1/projects/${process.env.FIREBASE_PROJECT_ID}/messages:send`;

  const res = await axios.post(url, message, {
    headers: {
      Authorization: `Bearer ${accessToken.token}`,
      "Content-Type": "application/json",
    },
  });

  return res.data;
}

app.post("/send", async (req, res) => {
  try {
    const { topic, title, body, data } = req.body;
    const response = await sendFCM(
      topic || DEFAULT_TOPIC,
      title,
      body,
      data || {}
    );
    res.status(200).json({ success: true, response });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res
      .status(500)
      .json({ success: false, error: err.response?.data || err.message });
  }
});

app.listen(PORT, () => {
  console.log(`FCM server running on port ${PORT}`);
});
