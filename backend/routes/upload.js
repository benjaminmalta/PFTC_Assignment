import Express, { response } from "express";
//import fileUpload from "express-fileupload";
import fs from "fs";
//import axios from "axios";
import ConvertAPI from "convertapi";
import multer from "multer";
import { fileURLToPath } from "url";
import path, { dirname } from "path";
import { CONVERT_KEY } from "../app.js";
import { CONVERT_SECRET } from "../app.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const upload = Express.Router();



//upload.use(fileUpload());

import { Storage } from "@google-cloud/storage";
import { PubSub } from "@google-cloud/pubsub"

import { validateToken } from "./auth.js";
import { appendFile } from "fs";
import { GetConversion } from "../db.js";



let imageUpload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname, "../uploads/"));
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname);
    },
  }),
  fileFilter: function (req, file, callback) {
    var ext = path.extname(file.originalname);
    if (ext !== ".png" && ext !== ".jpg" && ext !== ".gif" && ext !== ".jpeg") {
      return callback(new Error("Only images are allowed"));
    }
    callback(null, true);
  },
  limits: {
    fileSize: 2621441,
  },
});

upload.route("/").post(imageUpload.single("image"), (req, res) => {
  const token = req.headers.cookie.split("token=")[1].split(";")[0];
  validateToken(token).then(async function (rsp) {
    const email = rsp.getPayload().email;
    //console.log(`File:  ${req.files.image.name}, email: ${email} ` + " It's Valid File top");
    //console.log(req.file);
    if (req.file) {
      //Upload to google cloud
      //Convert to base64
      //Send to PDF Conversion API
      //console.log(`File:  ${req.files.image.name}, email: ${email} ` + " It's Valid File bottom");
      uploadFileToCloud("pending/", req.file).then(() => {
        publishMessage({
          url: "https://storage.googleapis.com/" + bucketName + "/pending/" + req.file.originalname,
          date: new Date().toUTCString(),
          email: email,
          filename: req.file.originalname,
          completed: "",
        }).then(() => {
          //console.log(req.file.originalname.split(".")[1]);          
          const convertapi = new ConvertAPI(CONVERT_SECRET)
          convertapi.convert('pdf', {
            File: req.file.path,
          }, 'jpg').then(function (result) {
            result.file.save('converted/'+result.file.fileName);
            //console.log("converted");
            uploadCovertedFileToCloud("completed/", result.file.fileName).then(() =>{
              GetConversion(email,req.file.originalname).then((r) =>{
                //console.log(r[0].id);
                publishMessage({
                  url: "",
                  date: new Date().toUTCString(),
                  email: email,
                  filename: result.file.fileName,
                  completed: "https://storage.googleapis.com/" + bucketName + "/completed/" + result.file.fileName,
                  //doc: r[0].id,
                }).then(()=>{
                  console.log("Firestore completed");
                })
              })
            })
          });

          //let base64Image = convertToBase64(req.file.path);

          //console.log(convertToBase64(req.file.path));
        }
        );
      }).catch(console.error);

      //var resp = await uploadFileToCloud(req.file).catch(console.error);

      res.send({
        status: "200",
        message: "File uploaded successfully! Processing..",
      });
    }
  })

});


// The ID of your GCS bucket
const bucketName = 'pftc-msd-0000001.appspot.com';

// The new ID for your GCS file
const destFileName = 'wat.jpg';

// The path to your file to upload
//const filePath = './uploads/' + destFileName;

const storage = new Storage({
  projectId: "pftc-msd-0000001",
  keyFilename: "./key.json",
});

const pubsub = new PubSub({
  projectId: "pftc-msd-0000001",
  keyFilename: "./key.json",
});

const uploadFileToCloud = async (folder, file) => {
  //console.log(`File:  ${file.originalname}`);
  await storage.bucket(bucketName).upload(file.path, {
    destination: folder + file.originalname,
  });
  console.log(`${file.path} uploaded to ${bucketName}`);
}
const uploadCovertedFileToCloud = async (folder, fileName) => {
  //console.log(`File:  ${file.originalname}`);
  await storage.bucket(bucketName).upload('converted/'+fileName, {
    destination: folder + fileName,
  });
  console.log(`../converted/ ${fileName} uploaded to ${bucketName}`);
}

const callbackPubSub = (error, msgId) => {
  if (error) {
    console.log(error);
  }
}

async function publishMessage(payload) {
  //console.log(payload);
  const dataBuffer = Buffer.from(JSON.stringify(payload), "utf8");
  await pubsub.topic("queue").publish(dataBuffer, {}, callbackPubSub)
  //console.dir(dataBuffer);
}

async function convertToBase64(data) {
  var temp = fs.readFileSync(data);
  var base64image = Buffer.from(temp);
  return base64image.toString("base64");
}

//uploadFile().catch(console.error);
//storage.getBuckets().then(x => console.log(x));

export default upload;