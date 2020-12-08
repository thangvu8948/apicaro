
const fs = require('fs');
const jwt = require('jsonwebtoken');

// use 'utf8' to get string instead of byte array 
var privateKEY = fs.readFileSync('./private.key', 'utf8'); // to sign JWT
//console.log(privateKEY);
var publicKEY = fs.readFileSync('./public.key', 'utf8'); 	// to verify JWT
//console.log(publicKEY);
let generateToken = (payload) => {
    return new Promise((resolve, reject) => {
        jwt.sign(
            payload,
            privateKEY,
            {
                algorithm: "RS256",
            },
            (error, token) => {
                if (error) {
                    return reject(error);
                }
                resolve(token);
            });
    });
}


let verifyToken = (token) => {
    return new Promise((resolve, reject) => {
        const verifyOptions = {
            algorithms: ["RS256"]
        };
        jwt.verify(token, publicKEY, verifyOptions, (error, decoded) => {
            if (error) {
                return reject(error);
            }
            resolve(decoded);
        });
    });
}
module.exports = {
    generateToken: generateToken,
    verifyToken: verifyToken,
};