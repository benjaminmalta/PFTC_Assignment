import Firestore from "@google-cloud/firestore";
import { createHmac } from "crypto";
import Redis from "redis";

const rclient = new Redis.createClient();

rclient.on('connect', function () {
  console.log('redis connected');
  // console.log(`connected ${rclient.connected}`);
}).on('error', function (error) {
  console.log(error);
});
rclient.connect();

const getCredits = async () => {
  return await rclient.get("credits");
}

const setCredits = async (payload) => {
  return await rclient.set("credits", JSON.stringify(payload));
};

export async function SetCreditsPrices(payload){
  if(rclient.isOpen){
    const resp = await setCredits(payload);
    return await resp;    
  }
  console.log(resp);

}

export async function GetCreditsPrices(){  
  //console.log("Getting Prices!");
  if(rclient.isOpen){
    const resp = await getCredits();
    return await resp;
  }  
  console.log(resp);
}

//Instantiating Firestore with project details
const db = new Firestore({
  projectId: "pftc-msd-0000001",
  keyFilename: "./key.json",
});


export async function CreateUser(name, email, credits) {
  const docRef = db.collection("userData").doc();
  return await docRef.set({
    name: name,
    email: email,
    credits: credits,
    admin: false,
  });
}

//Get user based on Email search.
export async function GetUser(email) {
  const docRef = db.collection("userData");
  const snapshot = await docRef.where("email", "==", email).get();
  let data = [];
  snapshot.forEach((doc) => {
    data.push(doc.data());
  });
  return data;
}


//Get user based on Email search.
export async function UpdateUserCredit(email, creditChange) {
  console.log(email + " "+ creditChange);
  const docRef = db.collection("userData");
  const snapshot = await docRef.where("email", "==", email).get();
  let data = [];
  snapshot.forEach((doc) => {
    data.push(doc.id);
  });
  console.log(data[0]);

  const userRef = db.collection("userData").doc(data[0]);

  try{
    await db.runTransaction(async (t) =>{
      const doc = await t.get(userRef);

      const newCredits = doc.data().credits + parseInt(creditChange);
      t.update(userRef, {credits: newCredits});
      console.log('Transaction success!');
    });
  }catch(e){
    console.log('Transaction failure:', e);
  }
  // return data;
}

export async function GetConversion(email, filename)
{
  //.where( "filename", "==", filename)
  const docRef = db.collection("conversions");
  const snapshot = await docRef.where("email", "==", email).where( "filename", "==", filename).get();
  let data = [];
  snapshot.forEach((doc) => {
    data.push(doc.data());
    console.log(doc.id);
  });
  return data;  
}

export async function GetUserCompleted(email)
{
  const docRef = db.collection("conversions");
  const snapshot = await docRef.where("email", "==", email).get();
  let data = [];
  snapshot.forEach((doc) => {
    if(doc.data().completed !== ""){
      data.push(doc.data());
    }
    //console.log(doc.id);
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