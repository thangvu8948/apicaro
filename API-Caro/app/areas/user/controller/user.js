const express = require('express');
const router = express.Router();
const mUser = require('../../../models/user');
const mAccount = require('../../../models/account');
const mBattle = require('../../../models/battle');
const mChat = require('../../../models/conversation');
const mMoving = require('../../../models/moving');
const { route } = require('../../../../routes');
//If the data was sent as JSON
router.use(express.json());
//If the data was sent using Content-Type: application/x-www-form-urlencoded
router.use(express.urlencoded({ extended: false }));
//
router.get('/', async (req, res) => {
    res.json("users");
});
router.post('/:id/avatar', async (req, res) => {
    const data = JSON.parse(JSON.stringify(req.body));
    const re = await mUser.update({ ID: req.params.id, Avatar: data.avatar });
    res.json(re);
});
router.post('/:id/profile', async (req, res) => {
    const data = JSON.parse(JSON.stringify(req.body));
    console.log(data);
    const re = await mUser.update({ ID: req.params.id, Name: data.Name, DOB: data.DOB, Gender: data.Gender });
    const re2 = await mAccount.update({ ID: data.ID, Email: data.Email });
    res.json(re);
});
router.get('/:id/info', async (req, res) => {
    const usrs = await mAccount.findByID(req.params.id);

    usrs.forEach((item) => {
        delete item.Password;
    })
    console.log(usrs[0]);
    res.json(usrs[0]);
})
router.get('/alluser', async (req, res) => {
    let usrs = await mAccount.getAll();
    usrs = usrs.filter((u, i) => u.IsBanned === 0);
    usrs.forEach((item) => {
        delete item.Password;
    })
    res.json(usrs);
});
router.get('/:id/recentfive', async (req, res) => {
    const fives = await mBattle.findByUserID(req.params.id);
    console.log(fives.slice(0, 5));
    res.json(fives.slice(0, 5));
})
router.get('/:id/battles', async (req, res) => {
    const bt = await mBattle.findByUserID(req.params.id);
    console.log(bt);
    res.json(bt);
})

router.get('/battles/:id/moves', async (req, res) => {
    const mv = await mMoving.findByID(req.params.id);
    res.json(mv[0]);
})
router.get('/battles/:id/chat', async (req, res) => {
    const chat = await mChat.findByID(req.params.id);
    res.json(chat[0]);
})
router.get("/auth", (req, res) => {
     res.json(true);
});
router.get('/account/:id', async (req, res) => {
    const usrs = await mUser.findByAccountID(req.params.id);

    usrs.forEach((item) => {
        delete item.Password;
    })
    console.log(usrs[0]);
    res.json(usrs[0]);
})
module.exports = router;
