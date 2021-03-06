var config = require('./modeset'),
	cookieParser = require('cookie-parser');

module.exports = function(server, io, mongoStore) {
	io.use(function(socket, next) {
		cookieParser(config.sessionSecret) (socket.request, {}, function(err) {
			var sessionId = socket.request.signedCookies['connect.sid'];

			mongoStore.get(sessionId, function(err, session) {
				socket.request.session = session;

				next(null, true);

			})

		});


	});

	io.on('connection', function(socket) {
		// Socket MVC Controllers
		console.log("io.connection socket: ", socket);

	});
};