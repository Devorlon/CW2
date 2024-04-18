const Datastore = require("gray-nedb");

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

	create(pictures, title, location, expireDate, amount, description) {
		const that = this;

		var entry = { 
			picture0: pictures[0],
			picture1: pictures[1],
			picture2: pictures[2],
			title: title,
			location: location,
			expireDate: expireDate,
			amount: amount,
			description: description 
		};

		that.db.insert(entry, function (err) {
			if (err) {
				console.log("Can't insert listing:", title); 
			}
		});
	}

	lookup(title, cb) {
		this.db.find({'title': title}, function (err, entries) { 
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

	getAllListings() {
		return new Promise((resolve, reject) => {
			this.db.find({}, (err, listings) => {
				if (err) {
					console.error("Error fetching listings:", err);
					reject(err);
				} 
				else {
					console.log("Listings retrieved from database:", listings);
					resolve(listings);
				}
			});
		})
		.then(listings => {
			return listings;
		})
		.catch(error => {
			console.error("Error:", error);
			throw error;
		});
	}	
} 

const dao = new ListingDAO();
module.exports = dao;