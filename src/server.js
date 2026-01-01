const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");


const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");


dotenv.config();
connectDB();


const app = express();

// Middleware
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);


// Test route
app.get("/", (req, res) => {
  res.send("Backend API is running 🚀");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
