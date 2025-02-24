const express = require("express");
const next = require("next");
const fs = require("fs");
const https = require("https");
const path = require("path");

const dev = process.env.NODE_ENV !== "production";

if (!dev) {
    console.log("❌ server.js is not required in production. Exiting...");
    process.exit(1);
}

const app = next({ dev });
const handle = app.getRequestHandler();
const PORT = 3000;


const useHttps = fs.existsSync(path.join(__dirname, "localhost+2-key.pem")) && fs.existsSync(path.join(__dirname, "localhost+2.pem"));

app.prepare().then(() => {
    const server = express();

    server.all("*", (req, res) => handle(req, res));

    if (useHttps) {
        const options = {
            key: fs.readFileSync(path.join(__dirname, "localhost+2-key.pem")),
            cert: fs.readFileSync(path.join(__dirname, "localhost+2.pem")),
        };

        https.createServer(options, server).listen(PORT, '0.0.0.0', () => {
          console.log(`HTTPS Server running at https://YOUR_LOCAL_IP:${PORT}`);
        });
    } else {
        server.listen(PORT, () => {
            console.log(`🌍 Server running at http://localhost:${PORT}`);
        });
    }
});
