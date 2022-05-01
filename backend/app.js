import Express from "express";
import cors from "cors";
import https from "https";
import { fileURLToPath } from "url";
import path, { dirname } from "path";
import { SecretManagerServiceClient } from "@google-cloud/secret-manager";
import auth from "./routes/auth.js";
import upload from "./routes/upload.js";
import home from "./routes/home.js";
import { GetUser, SetCreditsPrices } from "./db.js";
import { CreateUser } from "./db.js";
import { METHODS } from "http";

const DEV = true;
const PORT = DEV ? 80 : 443;
const SECRET_MANAGER_CERT =
  "projects/88778565218/secrets/PublicKey/versions/latest";
const SECRET_MANAGER_PK =
  "projects/88778565218/secrets/PrivateKey/versions/latest";
// const SECRET_MANAGER_GET_OUT_PDF = 
//   "projects/88778565218/secrets/GetOutPDF/versions/latest";
const SECRET_MANAGER_CONVERT_SECRET = 
  "projects/88778565218/secrets/convertAPISecret/versions/latest";
const SECRET_MANAGER_CONVERT_KEY = 
  "projects/88778565218/secrets/convertApiKey/versions/latest";
  
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

const sm = new SecretManagerServiceClient({
  projectId: "pftc-msd-0000001",
  keyFlsilename: "./key.json",
});

export let CONVERT_SECRET = "";
export let CONVERT_KEY = "";

const startServer = async () => {
  //Load GetOutPDF API Key
  const [convSecret] = await sm.accessSecretVersion({
    name: SECRET_MANAGER_CONVERT_SECRET,
  });
  const [convAPI] = await sm.accessSecretVersion({
    name: SECRET_MANAGER_CONVERT_KEY,
  });
  CONVERT_SECRET = convSecret.payload.data.toString();
  CONVERT_KEY = convAPI.payload.data.toString();
  
  if (!DEV) {
    const [pub] = await sm.accessSecretVersion({
      name: SECRET_MANAGER_CERT,
    });

    const [prvt] = await sm.accessSecretVersion({
      name: SECRET_MANAGER_PK,
    });

    const sslOptions = {
      key: prvt.payload.data.toString(),
      cert: pub.payload.data.toString(),
    };

    https.createServer(sslOptions, app).listen(PORT, () => {
      console.log("Secure Server Listening on port:" + PORT);
    });
  } else {
    app.listen(PORT, () => console.log("Server Listening on port: " + PORT));
  }
};

const app = Express();
//enabled http -> https redirection
if (!DEV) {
  app.enable("trust proxy");
  app.use((req, res, next) => {
    req.secure ? next() : res.redirect("https://" + req.headers.host + req.url);
  });
}

//serve static files
app.use(Express.static(path.join(__dirname, "../frontend/public")));

//allow cross-origin reqs
app.use(cors());

//route auth traffic to auth.js
app.use("/auth", auth);

//route upload traffic to upload.js
app.use("/upload", upload);

//route home traffic to home.js
app.use("/home", home);

app.post("/getCreditPrices",(req, res)=>{
  SetCreditsPrices().then((result)=>{
    res.send({creditPrices: JSON.stringify(result)});
  })
})

//Delivering index.html;
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

startServer();