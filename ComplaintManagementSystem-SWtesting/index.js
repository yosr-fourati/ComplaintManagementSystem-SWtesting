require("dotenv").config();

const app = require("./App");
const port = process.env.PORT || 8000;

const connectDB = require("./db");
connectDB();

app.listen(port, () => console.log(`listening on port ${port}!`));
