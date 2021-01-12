const mAccount = require('../models/account');
const jwt = require('../utils/jwt');
exports.login = async (user_email, password) => {
    const res = await mAccount.login(user_email, password);
    if (res[0]) {
        delete res[0].Password;
        if (res[0].IsVerified == 1) {
            const token = await jwt.generateToken(res[0]);
            return { "token": token };
        }
        else {
            return { "IsVeryfied": "x"+btoa(Date.now() + "|" + res[0].ID + "|" + res[0].Email) };
        }
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
exports.verifyEmail = async (id) => {
    const bt = await mAccount.update({ ID: id, IsVerified: 1 });
    return bt;
};
exports.register =async (user, password, email) => {
    const entity = {
        Username: user,
        Password: password,
        Email: email
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
function btoa(str) {
    return Buffer.from(str).toString('base64');
}
function atob(b64Encoded) {
    return Buffer.from(b64Encoded, 'base64').toString();
}