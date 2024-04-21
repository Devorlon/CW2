const Datastore = require("gray-nedb");

class ContactDAO { 
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

	create(title, email, message) {
		return new Promise((resolve, reject) => {
			const entry = { 
				title: title,
				email: email,
				message: message,
				dateTime: Date.now()
			};
	
			this.db.insert(entry, (err, newDoc) => {
				if (err) {
					console.error("Can't insert contact form:", title);
					reject(err);
					return;
				}
			});
		});
	}

	delete(contactID) {
		return new Promise((resolve, reject) => {
			this.db.remove({ '_id': contactID }, (err, numRemoved) => {
				if (err) {
					console.error("Error deleting contact:", err);
					reject(err);
				} 
				else {
					resolve(numRemoved);
				}
			});
		});
	}

	lookup(contactID) {
		return new Promise((resolve, reject) => {
			this.db.find({'_id': contactID}, (err, entries) => {
				if (err) { 
					reject(err);
				} 
				else { 
					resolve(entries.length === 0 ? null : entries[0]);
				}
			});
		});
	}

	getAllContacts() {
		return new Promise((resolve, reject) => {
			this.db.find({}, (err, contacts) => {
				if (err) {
					console.error("Error fetching contacts:", err);
					reject(err);
				} 
				else {
					resolve(contacts);
				}
			});
		});
	}	
} 

const dao = new ContactDAO();
module.exports = dao;