// Invoke 'strict' JavaScript mode
'use strict';

// Load the module dependencies
var User = require('mongoose').model('User'),
	passport = require('passport');

// Create a new error handling controller method
var getErrorMessage = function(err) {
	// Define the error message variable
	var message = '';

	// If an internal MongoDB error occurs get the error message
	if (err.code) {
		switch (err.code) {
			// If a unique index error occurs set the message error
			case 11000:
			case 11001:
				message = 'Username already exists';
				break;
			// If a general error occurs set the message error
			default:
				message = 'Something went wrong';
		}
	} else {
		// Grab the first error message from a list of possible errors
		for (var errName in err.errors) {
			if (err.errors[errName].message) message = err.errors[errName].message;
		}
	}

	// Return the message error
	return message;
};

// Create a new controller method that renders the signin page
exports.renderSignin = function(req, res, next) {
	console.log("users controller.renderSignin");
	console.log(req.headers);
	console.log(req.headers.host);
	// If user is not connected render the signin page, otherwise redirect the user back to the main application page
	if (!req.user) {
		// Use the 'response' object to render the signin page
		res.render('signin', {
			// Set the page title variable
			title: 'Sign-in Form',
			// Set the flash message variable
			messages: req.flash('error') || req.flash('info')
		});
	} else {
		return res.redirect('/');
	}
};


// Create a new controller method that creates new 'OAuth' users
exports.saveOAuthUserProfile = function(req, profile, done) {
	// Try finding a user document that was registered using the current OAuth provider
	User.findOne({
		provider: profile.provider,
		providerId: profile.providerId
	}, function(err, user) {
		// If an error occurs continue to the next middleware
		if (err) {
			return done(err);
		} else {
			// If a user could not be found, create a new user, otherwise, continue to the next middleware
			if (!user) {
				// Set a possible base username
				var possibleUsername = profile.username || ((profile.email) ? profile.email.split('@')[0] : '');

				// Find a unique available username
				User.findUniqueUsername(possibleUsername, null, function(availableUsername) {
					// Set the available user name 
					profile.username = availableUsername;
					
					// Create the user
					user = new User(profile);

					// Try saving the new user document
					user.save(function(err) {
						// Continue to the next middleware
						return done(err, user);
					});
				});
			} else {
				// Continue to the next middleware
				return done(err, user);
			}
		}
	});
};

// Create a new controller method for signing out
exports.signout = function(req, res) {
	// Use the Passport 'logout' method to logout
	req.logout();

	// Redirect the user back to the main application page
	res.redirect('/');
};

// Create a new controller middleware that is used to authorize authenticated operations 
exports.requiresLogin = function(req, res, next) {
	// If a user is not authenticated send the appropriate error message
	if (!req.isAuthenticated()) {
		return res.status(401).send({
			message: 'User is not logged in'
		});
	}

	// Call the next middleware
	next();
};