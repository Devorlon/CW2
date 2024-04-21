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

	create(fname, lname, email, password) {
		return bcrypt.hash(password, saltRounds).then((hash) => {
			const entry = {
				fname: fname,
				lname: lname,
				email: email, 
				password: hash,
			};

			return new Promise((resolve, reject) => {
				this.db.insert(entry, (err) => {
					if (err) {
						console.error("Can't insert email:", email); 
						reject(err);
					} 
					else {
						console.log("Added", email, "to db.");
						resolve();
					}
				});
			});
		})
		.catch((err) => {
			console.error("Error hashing password:", err);
			throw err;
		});
	}

	delete(userID) {
		return new Promise((resolve, reject) => {
			this.db.remove({ '_id': userID }, (err, numRemoved) => {
				if (err) {
					console.error("Error deleting user:", err);
					reject(err);
				} 
				else {
					resolve(numRemoved);
				}
			});
		});
	}

	lookup(email) {
		return new Promise((resolve, reject) => {
			this.db.find({'email': email}, (err, entries) => {
				if (err) { 
					reject(err);
				} 
				else { 
					resolve(entries.length === 0 ? null : entries[0]);
				}
			});
		});
	}

	lookupChat(chatID) {
		return new Promise((resolve, reject) => {
			this.db.find({'chats': chatID}, (err, entries) => { 
				if (err) { 
					reject(err);
				} 
				else { 
					resolve(entries.length === 0 ? null : entries);
				}
			});
		});
	}

	updateListing(listingID, email) {
		return this.lookup(email).then((user) => {
			if (!user) {
				console.log("User not found:", email);
				return;
			}

			// Initialise user.listings if it doesn't exist
			user.listings = user.listings || [];

			// Check if listingID already exists in user's chats
			if (!user.listings.includes(listingID)) {
				user.listings.push([listingID]);
			}

			// Update the user document in the database
			return new Promise((resolve, reject) => {
				this.db.update({ email: email }, user, {}, (err, numReplaced) => {
					if (err || numReplaced === 0) {
						console.log("Error updating listings for user:", email);
						reject(err);
					} 
					else {
						console.log("Listings updated successfully for user:", email);
						resolve();
					}
				});
			});
		})
		.catch((err) => {
			console.error("Error:", err);
			throw err;
		});
	}

	updateChat(chatID, email, lastViewedMsg) {
		return this.lookup(email).then((user) => {
			if (!user) {
				console.log("User not found:", email);
				return;
			}

			// Initialise user.chats if it doesn't exist
			user.chats = user.chats || [];

			// Check if chatID already exists in user's chats
			let found = false;
			for (let i = 0; i < user.chats.length; i++) {
				if (user.chats[i][0] === chatID) {
					user.chats[i][1] = lastViewedMsg;
					found = true;
					break;
				}
			}

			if (!found) {
				user.chats.push([chatID, lastViewedMsg]);
			}

			// Update the user document in the database
			return new Promise((resolve, reject) => {
				this.db.update({ email: email }, user, {}, (err, numReplaced) => {
					if (err || numReplaced === 0) {
						console.log("Error updating chat for user:", email);
						reject(err);
					} 
					else {
						console.log("Chat updated successfully for user:", email);
						resolve();
					}
				});
			});
		})
		.catch((err) => {
			console.error("Error:", err);
			throw err;
		});
	}

	removeChat(chatID, email) {
		return this.lookup(email).then((user) => {
			if (!user) {
				console.log("User not found:", email);
				return;
			}

			if (!user.chats || !user.chats[chatID]) {
				console.log("Chat not found for user:", email);
				return;
			}

			// Remove the chat from the user's chats
			delete user.chats[chatID];

			// Update the user document in the database
			return new Promise((resolve, reject) => {
				this.db.update({ email: email }, user, {}, (err, numReplaced) => {
					if (err || numReplaced === 0) {
						console.log("Error removing chat for user:", email);
						reject(err);
					} 
					else {
						console.log("Chat removed successfully for user:", email);
						resolve();
					}
				});
			});
		})
		.catch((err) => {
			console.error("Error:", err);
			throw err;
		});
	}

	getAllUsers() {
		return new Promise((resolve, reject) => {
			this.db.find({}, (err, users) => {
				if (err) {
					console.error("Error fetching users:", err);
					reject(err);
				} 
				else {
					resolve(users);
				}
			});
		});
	}	
} 

const dao = new UserDAO();
module.exports = dao;