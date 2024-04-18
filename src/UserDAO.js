const Datastore = require("gray-nedb");
const bcrypt = require('bcrypt'); 
const saltRounds = 10;

class UserDAO { 
    constructor(dbFilePath) {
		// Embedded 
        if (dbFilePath) {
			this.db = new Datastore({ filename: dbFilePath, autoload: true });
		}
		// In Memory
		else {
			this.db = new Datastore();
		}
	}

	create(email, password) {
		const that = this;

		bcrypt.hash(password, saltRounds).then(function(hash) { 
			var entry = { 
				email: email, 
				password: hash, 
			};

			that.db.insert(entry, function (err) {
				if (err) {
					console.log("Can't insert email:", email); 
				}
			});
		}); 
	}

	lookup(email, cb) {
		this.db.find({'email': email}, function (err, entries) { 
			if (err) { 
				return cb(null, null);
			} 
			else { 
				if (entries.length == 0) { 
					return cb(null, null);
				}

				return cb(null, entries[0]);
			}
		});
	}
} 

const dao = new UserDAO();
module.exports = dao;