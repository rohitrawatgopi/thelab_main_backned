import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { GoogleAuth } from "google-auth-library";
import fetch from "node-fetch";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;
const SERVICE_ACCOUNT_PATH = process.env.SERVICE_ACCOUNT_PATH;
const DEFAULT_TOPIC = process.env.TOPIC_NAME || "all_users";

// Scope for FCM API
const SCOPES = ["https://www.googleapis.com/auth/firebase.messaging"];

async function sendFCMToTopic(topic, title, body, data = {}) {
  const auth = new GoogleAuth({
    keyFile: SERVICE_ACCOUNT_PATH,
    scopes: SCOPES,
  });

  const client = await auth.getClient();
  const accessToken = await client.getAccessToken();

  const message = {
    message: {
      topic: topic,
      notification: { title, body },
      data,
    },
  };

  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${process.env.FIREBASE_PROJECT_ID}/messages:send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    }
  );

  return await res.json();
}

app.post("/send", async (req, res) => {
  try {
    const { topic, title, body, data } = req.body;
    const response = await sendFCMToTopic(
      topic || DEFAULT_TOPIC,
      title,
      body,
      data || {}
    );
    res.status(200).json({ success: true, response });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`FCM server running on port ${PORT}`);
});
