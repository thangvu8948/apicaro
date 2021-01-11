const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
// L?y thông tin nh?ng giá tr? auth
const configAuth = require('../../configs/auth-config');

// load  user model
const mAccount = require('../models/account');

module.exports = function (passport) {
    //// used to serialize the user for the session
    //passport.serializeUser(function (user, done) {
    //    done(null, user.id);
    //});

    //// used to deserialize the user
    //passport.deserializeUser(function (id, done) {
    //    mAccount.findByID(id, function (err, user) {
    //        delete user[0].Password;
    //        done(err, user[0]);
    //    });
    //});

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
                const user = await mAccount.where(`SocialID=${profile.id}`);
                if (user[0]) {
                    return done(null, user[0]);
                }
                else {
                    const entity = {
                        SocialID: profile.id,
                        Email: profile.emails[0].value,
                        IsVerified: 1,
                        Username: profile.name.givenName + (profile.id+ '').slice(-3),
                        Password: ''
                    }
                    const inserted = await mAccount.insert(entity);
                    console.log(inserted)
                    const newUser = await mAccount.getByID(inserted);
                    console.log("passport f",newUser);
                    return done(null, newUser[0]);
                }
            } catch (e) {
                return done(e);
            }
           

        }));
    // =========================================================================
    // GOOGLE ==================================================================
    // =========================================================================
    passport.use(new GoogleStrategy({

        clientID: configAuth.googleAuth.clientID,
        clientSecret: configAuth.googleAuth.clientSecret,
        callbackURL: configAuth.googleAuth.callbackURL,

    },
        async (token, refreshToken, profile, done)=> {
            try {
                const user = await mAccount.where(`SocialID=${profile.id}`);
                if (user[0]) {
                    return done(null, user[0]);
                }
                else {
                    const entity = {
                        SocialID: profile.id,
                        Email: profile.emails[0].value,
                        IsVerified: 1,
                        Username: profile.emails[0].value.split('@')[0] + (profile.id + '').slice(-3),
                        Password: ''
                    }
                    const inserted = await mAccount.insert(entity);
                    console.log(inserted);
                    const newUser = await mAccount.getByID(inserted);
                    return done(null, newUser[0]);
                }
            } catch (e) {
                return done(e);
            }

        }));
};