const auth = require('../modules/auth');

module.exports = {
    isAdmin: async (req, res, next) => {
        try {
            const token = req.header('Authorization').replace('Bearer ', '');
            const ok = await auth.auth(token);
            if (ok.RoleID == 1) {
                next();
            }
            else {
                res.status(401).send({ msg: 'Not permission' });
            }
        } catch (e) {
            res.status(401).send({ error: 'Not authorized to access this resource' });
        }
        
    },
    isUser: async (req, res, next) => {
        try {
            const token = req.header('Authorization').replace('Bearer ', '');
            const ok = await auth.auth(token);
            if (ok.RoleID == 2 && ok.Verified==1) {
                next();
            }
            else {
                res.status(401).send({ msg: 'Not permission' });
            }
        } catch (e) {
            res.status(401).send({ error: 'Not authorized to access this resource' });
        }
    }
};