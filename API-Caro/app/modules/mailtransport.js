const nodemailer = require("nodemailer");
const smtpTransport = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: "sangdoan654@gmail.com",
        pass: "Sang12345"
    }
});
exports.send = (mailOptions) => {
    return new Promise((resolve, reject) => {
        smtpTransport.sendMail(mailOptions, function (err, response) {
            // in addition to parsing the value, deal with possible errors
            if (err) return reject(err);
            try {
                resolve(response);
            } catch (e) {
                reject(e);
            }
        })
    })
};