const express = require('express');
const auth = require('../../../modules/auth');
const router = express.Router();
//If the data was sent as JSON
router.use(express.json());
//If the data was sent using Content-Type: application/x-www-form-urlencoded
router.use(express.urlencoded({ extended: false }));
//
router.post('/login', async (req, res) => {
    const data = JSON.parse(JSON.stringify(req.body));
    const s = await auth.login(data.Username, data.Password);
    res.json(s);
});
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
