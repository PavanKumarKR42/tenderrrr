const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const bidRoutes = require("./routes/bid");

require("dotenv").config();
connectDB(); // connect to Atlas

const app = express();
app.use(cors());
app.use(express.json());

app.use("/government", require("./routes/governmentAuth"));
app.use("/bidder", require("./routes/bidderAuth"));
app.use("/login", require("./routes/login"));
app.use("/tender", require("./routes/tender"));
app.use("/bid", bidRoutes);



app.listen(5000, () => console.log("🚀 Server running on port 5000"));
