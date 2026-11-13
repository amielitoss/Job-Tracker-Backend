import express from "express";
import applicationsRouter from "./routes/applications.routes.js";
import authRouter from "./routes/auth.routes.js";
import cookieParser from "cookie-parser";

const app = express();
app.use(express.json());

app.use(cookieParser());

app.use("/api/applications", applicationsRouter);

app.use("/api/auth", authRouter);

app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "JobTrackly API is running" });
});



app.listen(5000, () => {
  console.log("server listening to port 5000..");
});
