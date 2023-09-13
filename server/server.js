const express = require("express");
const bodyParser = require("body-parser");
const routesHandler = require("./routes/handler.js");

const app = express();
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use("/", routesHandler);

const PORT = 5000;

app.listen(PORT, ()=>console.log(`server listening on port ${PORT}...`))

module.exports = app;