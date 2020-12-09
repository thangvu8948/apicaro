const mAccount = require('../models/account');
const jwt = require('../utils/jwt');
exports.login = async (user_email, password) => {
    const res = await mAccount.login(user_email, password);
    if (res[0]) {
        delete res[0].Password;
        const token = await jwt.generateToken(res[0]);
        return { "token": token };
    }
    else {
        return { "token": "" };
    }
};
exports.auth = async (token) => {
    const payload = await jwt.verifyToken(token);
    const res = await mAccount.findByID(payload.ID);
    if (res) {
        return payload;
    }
    else {
        return {};
    }
};
exports.logout = () => {
   
};
exports.register =async (user, password) => {
    const entity = {
        Username: user,
        Password: password
    }
    const flag = await mAccount.where(`Username='${user}'`);
    if (flag[0]) {
        return 0;
    }
    else {
        const res = await mAccount.insert(entity);
        return res;
    }
   
}