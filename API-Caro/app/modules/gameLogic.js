const mAccount = require('../models/account');
function convertToAccountObj(payload) {
    let row = {
        ID: 0,
        Username: "",
        RoleID: 2,
        Score: 0,
        WinBattle: 0,
        DefeatBattle: 0,
        DrawBattle: 0,
        Ranking: 0,
        History: ''
    };
    Object.keys(row).forEach(function (prop) { row[prop] = payload[prop] })
    return row;
}
exports.recordResult = async (winID, lossID,isDraw) => {
    const winItem = await mAccount.findByID(winID);
    const lossItem = await mAccount.findByID(lossID);
    //win
    const objwin = {
        Score: winItem[0].Score + 1,
        WinBattle: winItem[0].WinBattle + 1,
        History: (winItem[0].History + 'W').slice(-10)
    };
  
    //loss
    const objloss = {
        Score: lossItem[0].Score - 1,
        DefeatBattle: lossItem[0].DefeatBattle + 1,
        History: (lossItem[0].History + 'L').slice(-10)
    };
   
    if (isDraw) {
        objwin = {
            DrawBattle: winItem.DrawBattle + 1,
            History: (winItem.History + 'D').slice(-10)
        };
        objloss = {
            DrawBattle: lossItem.DrawBattle + 1,
            History: (winItem.History + 'D').slice(-10)
        };
    }
    var winEntity = Object.assign({}, convertToAccountObj(winItem[0]), objwin);
    var lossEntity = Object.assign({}, convertToAccountObj(lossItem[0]), objloss);
    try {
        const res1 = await mAccount.update(winEntity);
        const res2 = await mAccount.update(lossEntity);
        return true;
    } catch (e) {
        return false;
    }
   
};
