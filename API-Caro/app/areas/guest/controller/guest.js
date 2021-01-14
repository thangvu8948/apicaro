const express = require('express');
const auth = require('../../../modules/auth');
const jwt = require('../../../utils/jwt');
const gameLogic = require('../../../modules/gameLogic');
const Mail = require('../../../modules/mailtransport');
const mAccount = require('../../../models/account');
const router = express.Router();
const FRONTEND_HOST = "https://simple-caro.herokuapp.com";
//const FRONTEND_HOST = "http://127.0.0.1:3000";

const timelife = 10;
const passport = require('passport');
require('../../../middlewares/passport')(passport); // pass passport for configuration
//If the data was sent as JSON
router.use(express.json());
//router.use(passport.initialize());
//router.use(passport.session()); // persistent login sessions
//If the data was sent using Content-Type: application/x-www-form-urlencoded
router.use(express.urlencoded({ extended: false }));
//
router.get('/', async (req, res) => {
    res.json("hello");
});


router.post('/login', async (req, res) => {
    const data = JSON.parse(JSON.stringify(req.body));
    const s = await auth.login(data.Username, data.Password);
    res.json(s);
});
router.get('/auth/facebook', passport.authenticate('facebook', { session: false,
    scope: ['public_profile', 'email']
}));
router.get("/auth/facebook/callback", passport.authenticate("facebook", {
    failureRedirect: "/verifyfail",
        session:false
    }),
    async (req, res) =>{
        // Successful authentication, redirect home.
        const usr = req.user;
        delete usr.Password;
        const token = await jwt.generateToken(usr);
        //res.send({ "token": token });
        res.redirect(FRONTEND_HOST+`/splash/${token}`);
    }
);
router.get("/verifyfail", (req, res) => {
    res.redirect(FRONTEND_HOST);
});
router.get('/auth/google', passport.authenticate('google', { session: false, scope: ['profile', 'email'] }));
router.get("/auth/google/callback", passport.authenticate("google", {
    failureRedirect: "/verifyfail",
    session: false
}),
    async (req, res) => {
        // Successful authentication, redirect home.
        const usr = req.user;
        delete usr.Password;
        const token = await jwt.generateToken(usr);
        //res.send({ "token": token });
        res.redirect(FRONTEND_HOST + `/splash/${token}`);
    }
);
router.get('/verify/:code', async (req, res) => {
    const str = atob(req.params.code);
    const value = str.split('|');
    const start = Number(value[0]);
    const now = Date.now();
    console.log((now - start) / 1000 / 60 );
    if ((now - start) / 1000 / 60 < 10) {
        await auth.verifyEmail(Number(value[1]));
        res.redirect(FRONTEND_HOST);
    } else {
        res.redirect(FRONTEND_HOST + `/notify/y${req.params.code}`);
    }
});
router.post('/forgotpass', async (req, res) => {
    const data = JSON.parse(JSON.stringify(req.body));
    console.log(data);
    const accs = await mAccount.where(`Email='${data.email}' and SocialID=0`);
    const acc = accs[0];
    if (acc) {
        host = req.get('host');
        link = "https://" + req.get('host') + "/forgotpassword/" + btoa(acc.ID + '|' + acc.Email);
        mailOptions = {
            to: data.email,
            subject: "Forgot Password",
            html: `Hello,<br> Please Click on the link to take password within ${timelife} .<br><a href=` + link + ">Click here</a>"
        }
        console.log(mailOptions);
        const ok = await Mail.send(mailOptions);
        if (ok) {
            //res.redirect(`/didsend/x${btoa(rand)}`);
            res.json(true);
        }
        else {
            res.json(false);
        }
    }
    else{
        res.json(false);
    }
  

});
router.get('/forgotpassword/:code', async (req, res) => {
    res.redirect(FRONTEND_HOST + `/changepassword/${req.params.code}`);
});
router.post('/changepassword/:id', async (req, res) => {
    const data = JSON.parse(JSON.stringify(req.body));
    console.log(data);
    const o = await mAccount.update({ ID: req.params.id, Password: data.newpass })
    if (o) {
        res.json(true);
    }
    else {
        res.json(false);
    }
});
router.post('/resend/:id', async (req, res) => {
    const data = JSON.parse(JSON.stringify(req.body));
    const rand = Date.now() + "|" + req.params.id+ '|'+ data.email;
    host = req.get('host');
    link = "https://" + req.get('host') + "/verify/" +  btoa(rand);
    mailOptions = {
        to: data.email,
        subject: "Please confirm your Email account",
        html: `Hello,<br> Please Click on the link to verify your email within ${timelife} .<br><a href=` + link + ">Click here to verify</a>"
    }
    console.log(mailOptions);
    const ok = await Mail.send(mailOptions);
    if (ok) {
        //res.redirect(`/didsend/x${btoa(rand)}`);
        res.json(true);
    }
    else {
        res.json(false);
    }
});
router.get('/didsend/:data', async (req, res) => {
    res.redirect(FRONTEND_HOST + `/notify/x${req.params.data}`);
})
router.post('/register', async (req, res) => {
    const data = JSON.parse(JSON.stringify(req.body));
    //logic check
    console.log(data);
    if (data.Password == data.RePassword) {
        const s = await auth.register(data.newuser, data.newpass, data.email);
        if (Boolean(s)) {
            const rand = Date.now() + "|" + s + "|" + data.email;
            host = req.get('host');
            link = "https://" + req.get('host') + "/verify/" + btoa(rand);
            mailOptions = {
                to: data.email,
                subject: "Please confirm your Email account",
                html: `Hello,<br> Please Click on the link to verify your email within ${timelife} .<br><a href=` + link + ">Click here to verify</a>"
            }
            const ok = await Mail.send(mailOptions);
            if (ok) {
                //res.redirect(`/didsend/x${btoa(rand)}`);
                res.json(`x${btoa(rand)}`);
            } else {
                res.send("Send mail failed");
            }
        }
        else {
            res.json(-1);
        }
        
    }
    else {
        res.send("Unmatching password");
    }
    //
   
});
function btoa(str) {
    return Buffer.from(str).toString('base64');
}
function atob(b64Encoded) {
    return Buffer.from(b64Encoded, 'base64').toString();
}
module.exports = router;
