const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;

// L?y thông tin nh?ng giá tr? auth
const configAuth = require('../../configs/auth-config');

// load  user model
const mAccount = require('../models/account');

module.exports = function (passport) {

    // =========================================================================
    // FACEBOOK ================================================================
    // =========================================================================
    passport.use(new FacebookStrategy({
        // ?i?n thông tin ?? xác th?c v?i Facebook.
        // nh?ng thông tin này ?ã ???c ?i?n ? file config-auth.js
        clientID: configAuth.facebookAuth.clientID,
        clientSecret: configAuth.facebookAuth.clientSecret,
        callbackURL: configAuth.facebookAuth.callbackURL,
        profileFields: ['id', 'displayName', 'email', 'first_name', 'last_name', 'middle_name']
    },

        // Facebook s? g?i l?i chu?i token và thông tin profile c?a user
        async (token, refreshToken, profile, done) => {
            try {
                const user = await mAccount.where(`SocialID=${profile.ID}`);
                if (user[0]) {
                    return done(null, user[0]);
                }
                else {
                    const entity = {
                        SocialID: profile.ID,
                        Email: profile.emails[0].value,
                        IsVerify: 1,
                        Username: profile.name.givenName + (profile.ID+ '').slice(-3),
                        Password: refreshToken
                    }
                    const res = await mAccount.insert(entity);
                    const newUser = await mAccount.findByID(res);
                    return done(null, newUser);
                }
            } catch (e) {
                return done(e);
            }
           

        }));

};