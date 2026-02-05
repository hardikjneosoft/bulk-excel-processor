import { startProcessing } from "./services/processor.js";
import express from "express";
import statusMonitor from "express-status-monitor";
startProcessing()
  .then(() => {
    console.log("\nDone!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Error:", err.message);
    process.exit(1);
  });

const app = express();

app.use(statusMonitor());
app.get("/", (req, res) => res.send("OK"));

app.listen(3000);

process.on("SIGINT", () => {
  console.log("\nShutting down...");
  process.exit(0);
});
