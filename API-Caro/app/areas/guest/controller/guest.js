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
    const s = await auth.login(data.username, data.password);
    res.json(s);
});
router.post('/register', async (req, res) => {
    const data = JSON.parse(JSON.stringify(req.body));
    //logic check

    //
    const s = await auth.register(data.username, data.password);
    res.json(s);
});
module.exports = router;
