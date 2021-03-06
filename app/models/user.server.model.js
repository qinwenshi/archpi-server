
// This file is the Schema definition for the User model.

// Define the UserSchema object using the Schema constructor
var mongoose = require('mongoose'),
	crypto = require('crypto'),
	Schema = mongoose.Schema;

// Use the schema instance to define the User model
var UserSchema = new Schema({
	firstName: String,
	lastName: String,
	email: {
		type: String,
		index: true,
		match: /.+\@.+\..+/ // force match to regexp
	},
	username: {
		type: String,
		trim: true,	// predefined schema modifier
		unique: true, // validate username uniqueness
		required: true // data existence validator
	},
	password: {
		type: String,
		validate: [	// custom validator
			function(password) {
				return password.length >= 8;
			},
			'Password must be at least 8 characters long!'
		]
	},
	salt: {	// Password salt token
		type: String
	},
	provider: { // authentication strategy used to register the user
		type: String,
		required: "Provider is required."
	},
	providerId: String, // user identifier for the authentication strategy
	providerData: {}, // stores user object	retrieved from OAuth providers
	created: {	// Default value
		type: Date,
		default: Date.now
	},
	role: {
		type: String,
		enum: ['Admin', 'Owner', 'User'] // enumerate the user's role
	}/*,
	website: { // User website with custom setter modifier
		type: String,
		get: function(url) {
			// Prepend http:// to string when getting website
			if(!url) {
				return url;
			} else {
				if(url.indexOf('http://') !== 0 && url.indexOf('https://') !==0) {
					url = 'http://' + url;
				}
				return url;
			}
		}
	}*/
});

// Create a virtual attribute called 'fullName' 
UserSchema.virtual('fullName').get(function() {	// Virtual attribute getter
	return this.firstName + ' ' + this.lastName;
}).set(function(fullName) {						// Virtual attribute setter
	var splitName = fullName.split(' ');
	this.firstName = splitName[0] || '';
	this.lastName = splitName[1] || '';
});


// Create a static model method that finds a user by their username.
UserSchema.statics.findOneByUsername = function(username, callback) {
	// Use the model's findOne method to retrieve a user's doc with a certain username
	this.findOne({username: new RegExp(username, 'i') }, callback);
}

// Create an instance method that validate a user's password.
UserSchema.methods.authenticate = function(password) {
	return this.password === password;
}

// Pre-save middleware to handle hashing of passwords
UserSchema.pre('save', function(next) {
	if(this.password) {
		// Create an autogenerated pseudo-random hashing salt
		this.salt = new Buffer(crypto.randomBytes(16).toString('base64'), 'base64');
		// Replace current password with hashed password
		this.password = this.hashPassword(this.password);
	}
	next();
});
// Instance method to hash passwords using Crypto
UserSchema.methods.hashPassword = function(password) {
	return crypto.pbkdf2Sync(password, this.salt, 10000, 64).toString('base64');
}
// Instance method to receive string, hash it, and compare it to the user's current hashed password
UserSchema.methods.authenticate = function(password) {
	return this.password === this.hashPassword(password);
}

// Static method to find an available unique userame for new users, deals with OAuth authentication
UserSchema.statics.findUniqueUsername = function(username, suffix, callback) {
	var _this = this;
	var possibleUsername = username + (suffix || '');

	_this.findOne({
		username: possibleUsername
	}, function(err, user) {
		if(!err) {
			if(!user) {
				callback(possibleUsername);
			} else {
				return _this.findUniqueUsername(username, (suffix || 0) + 1, callback);
			}
		} else {
			callback(null);
		}
	});
};



// Force Mongoose to include getters when converting MongoDB documents to JSON!
// This also allows the output of documents using res.json() to cinlude the getter's behavior.
UserSchema.set('toJSON', {
	getters: true, 
	virtuals: true
});


mongoose.model('User', UserSchema);


