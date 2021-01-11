const express = require('express');
const auth = require('../../../modules/auth');
const jwt = require('../../../utils/jwt');
const gameLogic = require('../../../modules/gameLogic');
const router = express.Router();
const FRONTEND_HOST ="http://localhost:3000"
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
router.post('/register', async (req, res) => {
    const data = JSON.parse(JSON.stringify(req.body));
    //logic check
    if (data.Password == data.RePassword) {
        const s = await auth.register(data.Username, data.Password);
        res.json(s);
    }
    else {
        res.send;("Unmatching password");
    }
    //
   
});
module.exports = router;
