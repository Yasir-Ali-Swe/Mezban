import "dotenv/config";

const PORT = process.env.PORT;
const DATABASE_URL = process.env.DATABASE_URL;
const GOOGLE_GENAI_API_KEY = process.env.GOOGLE_GENAI_API_KEY;
const CLERK_PUBLISHABLE_KEY = process.env.CLERK_PUBLISHABLE_KEY;
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const cloud_name = process.env.cloud_name;
const api_key = process.env.api_key;
const api_secret = process.env.api_secret;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const FRONTEND_URL = process.env.FRONTEND_URL
export {
  GEMINI_API_KEY,
  PORT,
  DATABASE_URL,
  GOOGLE_GENAI_API_KEY,
  CLERK_PUBLISHABLE_KEY,
  CLERK_SECRET_KEY,
  cloud_name,
  api_key,
  api_secret,
  FRONTEND_URL
};
