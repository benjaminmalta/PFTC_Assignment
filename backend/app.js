import Express from "express";
import cors from "cors";
import https from "https";
import { fileURLToPath } from "url";
import path, { dirname } from "path";
import { SecretManagerServiceClient } from "@google-cloud/secret-manager";
import auth, { validateToken } from "./routes/auth.js";
import upload from "./routes/upload.js";
import home from "./routes/home.js";
import { GetUser, SetCreditsPrices, GetCreditsPrices, UpdateUserCredit, GetUserCompleted } from "./db.js";
import { CreateUser } from "./db.js";
import { METHODS } from "http";
import clean from "./routes/clean.js";


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
app.use(Express.json());
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

app.use("/clean", clean);

app.post("/getUserCompleted", (req, res) => {
  const token = req.headers.cookie.split("token=")[1].split(";")[0];
  validateToken(token).then(async function (rsp) {
    const email = rsp.getPayload().email;
    GetUserCompleted(email).then((response) => {
      res.send({ result: "getCompleted", completed: JSON.stringify(response) });      
    })
  }).catch((error) => {
    console.log(error);
    res.send({ status: "401" });
  })
})

app.post("/getCreditPrices", (req, res) => {
  GetCreditsPrices().then((result) => {
    res.send({ result: "getCreditPrices", creditPrices: JSON.stringify(result) });
    //console.log(result);
  })
})

app.post("/getUserCredits", (req, res) => {
  const token = req.headers.cookie.split("token=")[1].split(";")[0];
  validateToken(token).then(async function (rsp) {
    const email = rsp.getPayload().email;
    GetUser(email).then((response) => {
      //console.log("this "+response[0].credits);
      res.send({ result: "getUserCredits", creditValue: JSON.stringify(response[0].credits) });
    })
  }).catch((error) => {
    console.log(error);
    res.send({ status: "401" });
  })
})

app.post("/setCreditPrices", (req, res) => {
  //console.log(req.body);
  SetCreditsPrices(req.body).then((result) => {
    res.send({ result: "setCreditPrices" })
  });
});

app.post("/setUserCredit", (req, res) => {
  const token = req.headers.cookie.split("token=")[1].split(";")[0];
  validateToken(token).then(async function (rsp) {
    const email = rsp.getPayload().email;
    UpdateUserCredit(email, req.body.creditChange).then((result) => {
      res.send({ result: "setCreditValue" })
    });
  }).catch((error) => {
    console.log(error);
    res.send({ status: "401" });
  });
});

//Delivering index.html;
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

startServer();