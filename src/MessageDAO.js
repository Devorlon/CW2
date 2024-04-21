const Datastore = require("gray-nedb");
const UserDAO = require('../src/UserDAO');

class MessageDAO { 
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

	create(message, posterEmail, recipientEmail, dateTime, listingID) {
		return new Promise((resolve, reject) => {
			const entry = {
				chatID: 0,
				message: message,
				poster: posterEmail,
				dateTime: dateTime,
				listingID: listingID
			};
	
			this.db.insert(entry, (err, newDoc) => {
				if (err) {
					console.error("Can't insert message:", message);
					reject(err);
					return;
				}
	
				const savedID = newDoc._id;
	
				// Set chatID to the _id of the inserted document
				this.db.update({ _id: savedID }, { $set: { chatID: savedID } }, {}, (err, numReplaced) => {
					if (err || numReplaced === 0) {
						console.error("Error setting chatID for message:", message);
						reject(err);
						return;
					}
	
					// Update user chats and resolve with savedID
					Promise.all([
						UserDAO.updateChat(savedID, posterEmail, dateTime),
						UserDAO.updateChat(savedID, recipientEmail, 1)
					]).then(() => {
						resolve(savedID);
					}).catch((err) => {
						reject(err);
					});
				});
			});
		});
	}

	delete(chatID) {
		return new Promise((resolve, reject) => {
			this.db.remove({ 'chatID': chatID }, { multi: true }, (err, numRemoved) => {
				if (err) {
					console.error("Error deleting chats:", err);
					reject(err);
				} 
				else {
					resolve(numRemoved);
				}
			});
		});
	}

	deleteMessage(messageID) {
		return new Promise((resolve, reject) => {
			this.db.remove({ '_id': messageID }, (err, numRemoved) => {
				if (err) {
					console.error("Error deleting message:", err);
					reject(err);
				} 
				else {
					resolve(numRemoved);
				}
			});
		});
	}

	lookup(chatID) {
		return new Promise((resolve, reject) => {
			this.db.find({ 'chatID': chatID }, (err, entries) => { 
				if (err) { 
					reject(err);
					return;
				}
				resolve(entries);
			});
		});
	}

	lookupListing(listingID) {
		return new Promise((resolve, reject) => {
			this.db.find({ 'listingID': listingID }, (err, entries) => { 
				if (err) { 
					reject(err);
					return;
				}
				resolve(entries);
			});
		});
	}

	addMsg(chatID, message, posterEmail, dateTime, listingID) {
		const entry = {
			chatID: chatID,
			message: message,
			poster: posterEmail,
			dateTime: dateTime,
			listingID: listingID
		};
		
		return new Promise((resolve, reject) => {
			this.db.insert(entry, (err, newDoc) => {
				if (err) {
					console.error("Can't insert message:", message);
					reject(err);
					return;
				}

				UserDAO.updateChat(chatID, posterEmail, dateTime).then(() => {
					resolve(newDoc);
				})
				.catch((err) => {
					reject(err);
				});
			});
		});
	}

	getAllMessages() {
		return new Promise((resolve, reject) => {
			this.db.find({}, (err, messages) => {
				if (err) {
					console.error("Error fetching messages:", err);
					reject(err);
				} 
				else {
					resolve(messages);
				}
			});
		});
	}	
}

const dao = new MessageDAO();
module.exports = dao;