import Firestore from "@google-cloud/firestore";
import { createHmac } from "crypto";
import Redis from "redis";

export let rclient = new Redis.createClient();

rclient.on("connect", async() => {
  console.log("Redis connected!");
  //getCredits().then((data) => console.log(JSON.parse(data)));
});

const getCredits = async () => {
  return rclient.get("credits");
}

const setCredits = async (payload) => {
  return await rclient.set("credits", JSON.stringify(payload));
};


export async function SetCreditsPrices(payload){
  if(rclient.isOpen){
    await rclient.connect();
  }
  const resp = await setCredits(payload);

  return resp;
}

export async function GetCreditsPrices(){
  if(rclient.isOpen){
    await rclient.connect();
  }
  const resp = await getCredits();

  return resp;
}

//Instantiating Firestore with project details
const db = new Firestore({
  projectId: "pftc-msd-0000001",
  keyFilename: "./key.json",
});


export async function CreateUser(name, surname, email, credits) {
  const docRef = db.collection("usersData").doc();
  return await docRef.set({
    name: name,
    surname: surname,
    email: email,
    credits: credits,
    admin: false,
  });
}

//Get user based on Email search.
export async function GetUser(email) {
  const docRef = db.collection("usersData");
  const snapshot = await docRef.where("email", "==", email).get();
  let data = [];
  snapshot.forEach((doc) => {
    data.push(doc.data());
  });
  return data;
}

//Collection (Table)
//Document (Row)
//docRef selects the collection
// export async function AddDocument(collection, data) {
//   const docRef = db.collection(collection).doc();
//   return await docRef.set(data);
// }

// export async function GetDocument(collection, valueType, value) {
//   const docRef = db.collection(collection);
//   const snapshot = await docRef.where(valueType, "==", value).get();
//   let data = [];
//   snapshot.forEach((doc) => {
//     data.push(doc.data());
//   });
//   return data;
// }

// export function HashPassword(password) {
//   const secret = "i<3PfC";
//   return createHmac("sha256", password).update(secret).digest("hex");
// }