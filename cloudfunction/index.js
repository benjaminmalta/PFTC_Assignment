const Firestore = require("@google-cloud/firestore");

const db = new Firestore({
  projectId: "pftc-msd-0000001",
  keyFlsilename: "./key.json",
})


const AddDocument = async (collection, data) => {
  const docRef = db.collection(collection).doc();
  return await docRef.set(data);
};

export async function CheckIfAlreadyExists(email, filename) {
  const docRef = db.collection("conversions");
  const nameToCheck = filename.split(".")[0];
  const snapshot = await docRef.where("email", "==", email).get();
  let data = [];
  let count = 0;
  snapshot.forEach((doc) => {
    data.push(doc.data());
    //console.log(doc.id);
    if (data.filename.split(".")[0] == nameToCheck) {
      console.log("Found mathc of " + nameToCheck);
      count += 1;
    }
  });

  if (count > 0) {
    return true;
  } else {
    return false;
  }
};

//entry point of our application
exports.helloPubSub = (event, context) => {
  const data = Buffer.from(event.data, "base64").toString();
  const jsonData = JSON.parse(data);
  console.log(
    `File ${jsonData.filename} with url ${jsonData.url} uploaded to cloud storage by ${jsonData.email} on ${jsonData.date}`
  );
  //Adding a document to the database
  
  if(CheckIfAlreadyExists(jsonData.email,jsonData.filename))
  {
    
  }else
  {
    AddDocument("conversions", {
      email: jsonData.email,
      filename: jsonData.filename,
      date: jsonData.date,
      pending: jsonData.url,
      completed: jsonData.completed,
    });

  }




};