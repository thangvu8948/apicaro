const express = require('express');
const { route } = require('../../../../routes');
const mAccount = require('../../../models/account');
const router = express.Router();
//If the data was sent as JSON
router.use(express.json());
//If the data was sent using Content-Type: application/x-www-form-urlencoded
router.use(express.urlencoded({ extended: false }));
//
router.get('/', async (req, res) => {
    res.json("admin");
});
router.get('/alluser', async (req, res) => {
    const usrs = await mAccount.getAll();
   
    usrs.forEach((item) => {
        delete item.Password;
    })
    console.log(usrs);
    res.json(usrs);
})
module.exports = router;
