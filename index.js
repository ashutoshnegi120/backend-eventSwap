import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import routes from "./routes/routes.js";
import ConnectDB from "./database/connect.js";

dotenv.config();
const app = express();
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/", routes);

const PORT = 8080;

// Start Server only after DB connects
const startServer = async () => {
    try {
        await ConnectDB();
        console.log("✅ MongoDB Connected");

        const server = app.listen(PORT, "0.0.0.0", () => {
            console.log(`🚀 Server listening on port ${PORT}`);
        });

        // Graceful Shutdown
        const gracefulShutdown = () => {
            console.log("Shutting down gracefully...");
            server.close(() => {
                console.log("Closed out remaining connections.");
                process.exit(0);
            });

            setTimeout(() => {
                console.error("Forcing shutdown...");
                process.exit(1);
            }, 10000);
        };

        process.on("SIGTERM", gracefulShutdown);
        process.on("SIGINT", gracefulShutdown);

    } catch (err) {
        console.error("❌ Failed to connect to database", err.message);
        process.exit(1);
    }
};

startServer();
