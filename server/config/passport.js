const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');

// Google OAuth Strategy (only if credentials exist)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ email: profile.emails[0].value });
      
      if (!user) {
        user = new User({
          username: profile.displayName || profile.emails[0].value.split('@')[0],
          email: profile.emails[0].value,
          password: Math.random().toString(36).slice(-8),
          avatar: profile.photos[0]?.value || null,
          oauthProvider: 'google',
          oauthId: profile.id
        });
        await user.save();
      } else if (!user.oauthId) {
        user.oauthProvider = 'google';
        user.oauthId = profile.id;
        if (!user.avatar && profile.photos[0]) {
          user.avatar = profile.photos[0].value;
        }
        await user.save();
      }
      
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }));
}

// GitHub OAuth Strategy (only if credentials exist)
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URL
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ email: profile.emails?.[0]?.value });
      
      if (!user) {
        user = new User({
          username: profile.username || profile.displayName,
          email: profile.emails?.[0]?.value || `${profile.username}@github.com`,
          password: Math.random().toString(36).slice(-8),
          avatar: profile.photos[0]?.value || null,
          oauthProvider: 'github',
          oauthId: profile.id
        });
        await user.save();
      } else if (!user.oauthId) {
        user.oauthProvider = 'github';
        user.oauthId = profile.id;
        if (!user.avatar && profile.photos[0]) {
          user.avatar = profile.photos[0].value;
        }
        await user.save();
      }
      
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }));
}

// Serialize user
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
