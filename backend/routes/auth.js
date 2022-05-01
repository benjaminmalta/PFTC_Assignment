import Express from "express";
import { OAuth2Client } from "google-auth-library";
import { GetUser } from "../db.js";
import { CreateUser } from "../db.js";
//import jwt from 'jsonwebtoken';

const CLIENT_ID =
  "88778565218-5kb5no6mb9dbulon762qjcrdn9cmoogj.apps.googleusercontent.com";
const auth = Express.Router();
const client = new OAuth2Client(CLIENT_ID);

export default auth;

let credits = 100;
let admin = false;

auth.route("/").post((req, res) => {
  const token = req.query.token;

  //console.log("Token Expires at: " + token.expiry);
  // jwt.verify(token, 'shhhhh', { algorithms: ['RS256']}, function(err, decoded) {
  //   if (err) {
  //     console.log(err.message);
  //     /*
  //       err = {
  //         name: 'TokenExpiredError',
  //         message: 'jwt expired',
  //         expiredAt: 1408621000
  //       }
  //     */
  //   }
  // });
  validateToken(token)
    .catch((error) => {
      console.log(error);
      res.send({ status: "401" });
    })
    .then(async function (ticket) {
      if (ticket) {
        const payload = ticket.getPayload();

        console.log(`${payload.name} has logged in.`);
        GetUser(payload.email).then(async function (response) {
          if (response.length < 1) {
            console.log("Create user");
            CreateUser(payload.name, payload.email, 100);
          }
          else {
            console.log(response[0].credits);
            credits = response[0].credits;
            admin = response[0].admin;
            console.log("Email already present in database!");
          }
          res.send({
            status: "200",
            name: payload.name,
            email: payload.email,
            picture: payload.picture,
            token: token,
            expiry: payload.exp,
            credits: credits,
            admin: admin,
          })
        });
      } else {
        res.send({ status: "401" });
      }
    })
    .catch((error) => {
      console.log("Token Expired");
      res.send({ status: "401" });
    });

});

export const validateToken = async (token) => {
  return await client.verifyIdToken({
    idToken: token,
    audience: CLIENT_ID,
  }).catch((error) => {
    console.log("Token Expired");
  });
};