const mAccount = require('../models/account');
exports.recordResult = async (winID, lossID,isDraw) => {
    const winItem = await mAccount.findByID(winID);
    const lossItem = await mAccount.findByID(lossID);
    //win
    const objwin = {
        Score: winItem.Score + 1,
        WinBattle: winItem.WinBattle + 1,
        History: (winItem.History + 'W').slice(-10)
    };
  
    //loss
    const objloss = {
        Score: lossItem.Score - 1,
        DefeatBattle: lossItem.DefeatBattle + 1,
        History: (winItem.History + 'L').slice(-10)
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
    var winEntity = Object.assign({}, winItem, objwin);
    var lossEntity = Object.assign({}, lossItem, objloss);
    try {
        const res1 = await mAccount.update(winEntity);
        const res2 = await mAccount.update(lossEntity);
        return true;
    } catch (e) {
        return false;
    }
   
};
