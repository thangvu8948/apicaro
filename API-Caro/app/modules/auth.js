const mAccount = require('../models/account');
const jwt = require('../utils/jwt');
const { delete } = require('../../routes');
exports.login = async (user_email, password) => {
    const res = await mAccount.login(user_email, password);
    if (Boolean(res)) {
        delete res.Password;
        const token = await jwt.generateToken(res);
        return token;
    }
    else {
        return '';
    }
};
exports.logout = () => {
   
};
exports.register = (user, password) => {
    const entity = {
        Username: user,
        Password: password}
    const res = await mAccount.insert(entity);
    if (Boolean(res)) {
        return true;
    }
    else {
        return false;
    }
}