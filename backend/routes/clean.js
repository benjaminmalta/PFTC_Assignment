import Express from "express"
import { Storage } from "@google-cloud/storage";

const clean = Express.Router();
const bucketName = 'pftc-msd-0000001.appspot.com';

const storage = new Storage({
    projectId: "pftc-msd-0000001",
    keyFilename: "./key.json",
});

clean.route("/").post((req, res) => {
    let date_ob = new Date();

    console.log("Cron job works!");
    listFiles();
    res.send({ result: "cleaned" });
})

async function listFiles() {
    // Lists files in the bucket
    const [files] = await storage.bucket(bucketName).getFiles();

    console.log('Checking for files to delete');
    files.forEach(file => {
        if(file.name !== "completed/" && file.name !== "pending/")
        {
            getMetadataDateCreated(file.name).then((filedate) =>{
                //console.log(Date.parse(filedate));
                //console.log(Date.now());
                let timeDifference = Date.now() - Date.parse(filedate);
                if(new Date(timeDifference).getHours() > 2)
                {
                    //console.log(new Date(timeDifference).getHours());
                    deleteFile(file.name); 
                }
            })
        }
    });
}

async function getMetadataDateCreated(filename) {
    // Gets the metadata for the file
    const [metadata] = await storage
        .bucket(bucketName)
        .file(filename)
        .getMetadata();

    //console.log(`TimeCreated: ${new Date(metadata.timeCreated)}`);
    return new Date(metadata.timeCreated)

}

async function deleteFile(fileName) {
    await storage.bucket(bucketName).file(fileName).delete();
  
    console.log(`gs://${bucketName}/${fileName} deleted`);
  }
  


export default clean;