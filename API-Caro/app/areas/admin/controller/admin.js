const express = require('express');
const mAccount = require('../../../models/account');
const mBattle = require('../../../models/battle');
const mMoving = require('../../../models/moving');
const mChat = require('../../../models/conversation');
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
    res.json(usrs);
})
router.get('/infouser/:id', async (req, res) => {
    const usrs = await mAccount.findByID(req.params.id);

    //usrs.forEach((item) => {
    //    delete item.Password;
    //})
    delete usrs[0].Password;
    delete usrs[0].RoleID;
    delete usrs[0].History;
    res.json(usrs[0]);
    
})
router.get('/users/:id/banned/:status', async (req, res) => {
    const bt = await mAccount.update({ ID: req.params.id, IsBanned: req.params.status });
    res.json(bt);
})
router.get('/users/:id/recentfive', async (req, res) => {
    const fives = await mBattle.findByUserID(req.params.id);
    res.json(fives.slice(0, 5));
})
router.get('/users/:id/battles', async (req, res) => {
    const bt = await mBattle.findByUserID(req.params.id);
    res.json(bt);
})

router.get('/allbattles', async (req, res) => {
    const bt = await mBattle.getAll();
    res.json(bt);
})
router.get('/battles/:id', async (req, res) => {
    const bt = await mBattle.findByID(req.params.id);
    res.json(bt[0]);
})
router.get('/battles/:id/moves', async (req, res) => {
    const mv = await mMoving.findByID(req.params.id);
    res.json(mv[0]);
})
router.get('/battles/:id/chat', async (req, res) => {
    const chat = await mChat.findByID(req.params.id);
    res.json(chat[0]);
})
module.exports = router;
