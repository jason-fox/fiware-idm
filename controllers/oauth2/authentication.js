const models = require('../../models/models.js');
const config_service = require('../../lib/configService.js');
const config = config_service.get_config();
const external_auth = config.external_auth;
const external_auth_ldap = config.external_auth_ldap;
const debug = require('debug')('idm:authentication');


// MW to see if user is registered
let authentication_driver;

if (external_auth.enabled) {
  authentication_driver = require('../../external_auth/authentication_driver').authenticate;
} else if (external_auth_ldap.enabled) {
  authentication_driver = require('../../external_auth/authentication_driver_ldap').authenticate;
} else {
  authentication_driver = function (username, password, callback) {
    debug('--> authenticate');

    // Search the user
    models.user
      .find({
        attributes: [
          'id',
          'username',
          'salt',
          'password',
          'enabled',
          'email',
          'gravatar',
          'image',
          'admin',
          'date_password',
          'starters_tour_ended',
          'extra'
        ],
        where: {
          email: username
        }
      })
      .then(function (user) {
        if (user) {
          // Verify password and if user is enabled to use the web
          if (user.verifyPassword(password) && user.enabled) {
            callback(null, user);
          } else {
            callback(new Error('invalid'));
          }
        } else {
          callback(new Error('user_not_found'));
        }
      })
      .catch(function (error) {
        callback(error);
      });
  };
}


exports = {
	driver: authentication_driver
}