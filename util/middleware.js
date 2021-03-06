const config = require('../config');
const db = require('./db');
const objects = require('./objects');

const cp = require('child_process');

/**
 * Injects global constants into the local scope of the Pug templating engine.
 * @param {express.Request} req the request sent from the client
 * @param {express.Response} res the response sent back to the client
 * @param {Function} next callback function used to advance to the next
 *     middleware
 */
exports.injectLocals = async function(req, res, next) {
  // Inject the URLs for libraries
  res.locals.assets = {
    // The URL for Vue.js changes based on the environment
    vue: process.env.NODE_ENV === 'development' ?
        'https://cdn.jsdelivr.net/npm/vue/dist/vue.js' :
        'https://cdn.jsdelivr.net/npm/vue@2.6.11',
  };

  // Inject the hash string for the latest commit
  try {
    res.locals.commit = cp.execSync('git rev-parse HEAD').toString().trim();
  } catch (e) {
    // The above command will fail in Heroku
    // In theory Heroku provides a `SOURCE_VERSION` but I cannot get it working
    res.locals.commit = "Production";
  }

  // Inject the session information
  const email = objects.nestedProperty(req, 'session.email');
  res.locals.session = {
    administrator: (config.administrators || []).includes(email),
    email: email,
    instructor: (await db.pool.query(`
SELECT COALESCE(
  (SELECT instructor FROM users WHERE email = $1),
  FALSE
) AS instructor`, [email])).rows[0].instructor,
  };

  next();
};
