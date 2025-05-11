const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/userModel');

/**
 * Configure toutes les stratégies Passport pour l'authentification
 * @param {Object} passport - L'instance Passport.js
 */
const setupPassport = (passport) => {
    const jwtOptions = {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: process.env.JWT_SECRET
    };

    passport.use(
        new JwtStrategy(jwtOptions, async (jwtPayload, done) => {
            try {
                // Vérifier si l'utilisateur existe dans la base de données
                const user = await User.findById(jwtPayload.id);

                if (!user || !user.active) {
                    return done(null, false);
                }

                return done(null, user);
            } catch (error) {
                return done(error, false);
            }
        })
    );

    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
        passport.use(
            new GoogleStrategy(
                {
                    clientID: process.env.GOOGLE_CLIENT_ID,
                    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                    callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
                    scope: ['profile', 'email']
                },
                async (accessToken, refreshToken, profile, done) => {
                    try {
                        let user = await User.findOne({
                            $or: [
                                { oauthId: profile.id, oauthProvider: 'google' },
                                { email: profile.emails[0].value }
                            ]
                        });

                        if (user) {
                            if (!user.oauthId) {
                                user.oauthId = profile.id;
                                user.oauthProvider = 'google';
                                await user.save();
                            }
                        } else {
                            user = await User.create({
                                email: profile.emails[0].value,
                                username: `google_${profile.id}`,
                                oauthProvider: 'google',
                                oauthId: profile.id,
                                profilePicture: profile.photos[0].value,
                                emailVerified: true // Les emails Google sont déjà vérifiés
                            });
                        }

                        return done(null, user);
                    } catch (error) {
                        return done(error, false);
                    }
                }
            )
        );
    }
};

module.exports = { setupPassport };