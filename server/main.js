import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { PORT } from "./config/env.js";
import { clerkMiddleware } from "@clerk/express";

const app = express();
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());
app.use(clerkMiddleware());

app.listen(PORT, () => {
  console.log(`Server is running on port localhost:${PORT}`);
});
