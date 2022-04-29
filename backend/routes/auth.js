import Express from "express";
import { OAuth2Client } from "google-auth-library";
import jwt from 'jsonwebtoken';

const CLIENT_ID =
  "88778565218-5kb5no6mb9dbulon762qjcrdn9cmoogj.apps.googleusercontent.com";
const auth = Express.Router();
const client = new OAuth2Client(CLIENT_ID);

export default auth;



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
    .then((ticket) => {
      if (ticket) {
        const payload = ticket.getPayload();        
        res
        .send({
          status: "200",
          name: payload.name,
          email: payload.email,
          picture: payload.picture,
          token: token,
          expiry: payload.exp,
        })
        
        console.log(`${payload.name} has logged in.`);
      } else {
        res.send({ status: "401" });
      }
    })
    .catch((error) => {
      console.log("Token Expired");
      res.send({status: "401"});
    });  

});

export const validateToken = async (token) => {
  return await client.verifyIdToken({
    idToken: token,
    audience: CLIENT_ID,
  }).catch((error) =>
  { 
    console.log("Token Expired");      
  });
};