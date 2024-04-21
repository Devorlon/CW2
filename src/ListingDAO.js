const Datastore = require("gray-nedb");
const UserDAO = require('../src/UserDAO');

class ListingDAO { 
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

	create(pictures, title, location, expireDate, amount, description, email) {
		return new Promise((resolve, reject) => {
			const entry = { 
				picture0: pictures[0],
				picture1: pictures[1],
				picture2: pictures[2],
				title: title,
				location: location,
				expireDate: expireDate,
				amount: amount,
				description: description,
				posterEmail: email
			};
	
			this.db.insert(entry, (err, newDoc) => {
				if (err) {
					console.error("Can't insert listing:", title);
					reject(err);
					return;
				}
	
				UserDAO.updateListing(newDoc._id, email).then(() => {
					resolve(newDoc);
				})
				.catch((err) => {
					reject(err);
				});
			});
		});
	}

	delete(listingID) {
		return new Promise((resolve, reject) => {
			this.db.remove({ '_id': listingID }, {}, (err, numRemoved) => {
				if (err) {
					console.error("Error deleting listing:", err);
					reject(err);
				} 
				else {
					resolve(numRemoved);
				}
			});
		});
	}

	lookupTitle(title, posterEmail) {
		return new Promise((resolve, reject) => {
			this.db.find({ 'title': title, 'posterEmail': posterEmail }, (err, entries) => {
				if (err) { 
					reject(err);
					return;
				} 
				if (entries.length === 0) { 
					resolve(null);
				} 
				else {
					resolve(entries);
				}
			});
		});
	}

	lookupId(listingID) {
		return new Promise((resolve, reject) => {
			this.db.find({ '_id': listingID }, (err, entries) => {
				if (err) { 
					reject(err);
					return;
				} 
				if (entries.length === 0) { 
					resolve(null);
				} 
				else {
					resolve(entries);
				}
			});
		});
	}

	getAllListings() {
		return new Promise((resolve, reject) => {
			this.db.find({}, (err, listings) => {
				if (err) {
					console.error("Error fetching listings:", err);
					reject(err);
				} 
				else {
					resolve(listings);
				}
			});
		});
	}	
} 

const dao = new ListingDAO();
module.exports = dao;