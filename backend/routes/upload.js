import Express from "express";
import multer from "multer";
import { fileURLToPath } from "url";
import path, { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const upload = Express.Router();

import {Storage} from "@google-cloud/storage";
import {PubSub } from "@google-cloud/pubsub"

import { validateToken } from "./auth.js";


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

upload.route("/").post(imageUpload.single("image"), function (req, res) {
  const token = req.headers.cookie.split("token=")[1].split(";")[0];
  validateToken(token).then(async function (rsp){
    const email = rsp.getPayload().email;
    if (req.file) {
      console.log(`File:  ${req.file.originalname}, email: ${email} ` + " It's Valid File");
      //Upload to google cloud
      //Convert to base64
      //Send to PDF Conversion API
      uploadFileToCloud("pending/", req.file ).then(([r]) => {
        publishMessage({
          url: r.metadata.medialink,
          data: new Date().toUTCString(),
          email: email,
          filename: req.file.originalname,
        });
      });

      var resp = await uploadFileToCloud(req.file).catch(console.error);
      
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
const filePath = './uploads/' + destFileName;

const storage = new Storage({
  projectId: "pftc-msd-0000001",
  keyFilename: "./key.json",
});

const pubsub = new PubSub({
  projectId: "pftc-msd-0000001",
  keyFilename: "./key.json",
});

const uploadFileToCloud = async (folder, file) =>{
  console.log(`File:  ${file.originalname}`);
  await storage.bucket(bucketName).upload(filePath, {    
    destination: folder + file.originalname,
  });

  console.log(`${filePath} uploaded to ${bucketName}`);
}

const callbackPubSub = (error, msgId) => {
  if(error){
    console.log(error);
  }
}

async function publishMessage(payload){
  const dataBuffer = Buffer.from(JSON.stringify(payload), "utf8");
  await pubsub.topic("queue").publish(dataBuffer, {}, callbackPubSub)
}

//uploadFile().catch(console.error);
//storage.getBuckets().then(x => console.log(x));

export default upload;