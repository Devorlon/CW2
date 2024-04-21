const UserDAO = require('../src/UserDAO');
const ListingDAO = require('../src/ListingDAO');
const MessageDAO = require('../src/MessageDAO');

exports.landingPage = function (req, res) {
	res.render("index");
}

exports.welcome = function (req, res) {
	res.render("welcome");
}

exports.showLogin = function (req, res) {
	res.render("user/login");
}

exports.postLogin = function (req, res) {
	res.redirect("/");
}

exports.showReg = function (req, res) {
	res.render('user/register', { email: req.query.email });
}

exports.postNewUser = function (req, res) {
	const fname = req.body.fname;
	const lname = req.body.lname;
	const email = req.body.email;
	const password = req.body.password;

	if (!email || !password) {
		res.status(401).send('no user or password')
		return;
	}

	UserDAO.lookup(email).then((u) => {
		if (u) {
			res.send(401, "User exists:", email);
			return;
		}

		return UserDAO.create(lname, fname, email, password).then(() => {
			console.log("Register user", email, "password", password);
			res.redirect('/login');
		});
	})
	.catch((err) => {
		console.error("Error:", err);
		res.status(500).send("Error creating user");
	});
}

exports.removeUser = function (req,res) {
	const userID = req.body.userID

	UserDAO.delete(userID).then(numRemoved => {
		console.log("User deleted. Number of users removed:", numRemoved);
	})
	.catch(err => {
		console.error("Error deleting user:", err);
	});

	res.redirect('/admin/accounts');
}

exports.logout = function (req, res) {
	res.clearCookie("jwt")
		.status(200)
		.redirect("/");
}

exports.search = function (req, res) {
	const searchQuery = req.query.q;

	// todo
}

exports.about = function (req, res) {
	res.render('about');
}

exports.startChat = function (req, res) {
	const message = "Is this still avalible?";
	const posterEmail = req.headers.email;
	const recipientEmail = req.body.email;
	const dateTime = Date.now();
	const listingID = req.body.listingID;

	if (!message || !posterEmail || !recipientEmail) {
		res.status(401).send('no message, poster or recipient.')
		return;
	}

	MessageDAO.create(message, posterEmail, recipientEmail, dateTime, listingID).then(() => {
		console.log("Sent message to", recipientEmail);
		res.redirect('/messages');
	})
	.catch((err) => {
		console.error("Error:", err);
		res.status(500).send("Error sending message");
	});
}

exports.showMessages = function (req, res) {
	let currentUser = req.headers.email;
	let contacts = [];
	let messages = [];

	UserDAO.lookup(currentUser).then((user) => {
		let chatPromises;

		if(user.chats == undefined) {
			return;
		}
		else {
			chatPromises = user.chats.map(chatId => {
				return MessageDAO.lookup(chatId[0]).then((chats) => {
					chats.sort((a, b) => b.dateTime - a.dateTime);
	
					return Promise.all(chats.map(chat => {
						let isOwnMsg = null;
						if (chat.poster === currentUser) {
							isOwnMsg = "You"
						}
						if (chats.length != 1) {
							if (!contacts.includes(chat.poster) && chat.poster !== currentUser) {
								contacts.push(chat.poster);
								return UserDAO.lookup(chat.poster).then((user) => {
									let index = contacts.indexOf(user.email);
									let lastMsgUser = isOwnMsg || user.fname;
		
									if (index !== -1) {
										return ListingDAO.lookupId(chat.listingID).then((listings) => {
											messages[index] = {
												thumbnail: listings[0].picture0,
												listingTitle: listings[0].title,
												contact: user.email,
												fname: user.fname,
												lastMsgText: lastMsgUser + ": " + chat.message,
												lastMsgDate: new Date(chat.dateTime),
												chatID: user.chats[0][0],
												noImg: false
											};
										});
									}
								});
							}
						}
						else {
							return UserDAO.lookupChat(chats[0].chatID).then((users) => {
								let contactPromises = users.map(user => {
									if (user.email != currentUser) {
										let lastMsgUser = isOwnMsg || user.fname;
										return ListingDAO.lookupId(chats[0].listingID).then((listings) => {
											messages.push({
												listingTitle: listings[0].title,
												thumbnail: listings[0].picture0,
												contact: user.email,
												fname: user.fname,
												lastMsgText: lastMsgUser + ": " + chats[0].message,
												lastMsgDate: new Date(chats[0].dateTime),
												chatID: chats[0].chatID,
												noImg: false
											});
										});
									}
								});
		
								return Promise.all(contactPromises);
							});
						}
					}));
				});
			});
		}

		return Promise.all(chatPromises);
	})
	.then(() => {
		if (messages.length == 0) {
			messages.push({
				noImg: true,
				lastMsgText: "View listings to start a chat."
			});
		}

		res.render('message', { messages: messages });
	})
	.catch((error) => {
		console.error("Error:", error);
		res.status(500).send("Error processing messages");
	});
};


exports.postMessage = function (req,res) {
	const chatID = req.params.chatID;
	const messageText = req.body.userMessage;
	const posterEmail = req.headers.email;

	if (!messageText || !posterEmail) {
		throw new Error('no message or poster.');
	}

	UserDAO.lookup(posterEmail).then((user) => {
		if (!user) {
			throw new Error('User not found.');
		}

		MessageDAO.lookup(chatID).then((chats) => {
			MessageDAO.addMsg(chatID, messageText, posterEmail, Date.now(), chats[0].listingID);
		});

		res.redirect(req.get('referer'));
	});
}

exports.removeChat = function (req,res) {
	const posterEmail = req.body.posterEmail
	const chatID = req.body.chatID

	MessageDAO.delete(chatID).then(numRemoved => {
		console.log("Chat deleted. Number of chats removed:", numRemoved);
	})
	.catch(err => {
		console.error("Error deleting chats:", err);
	});

	res.redirect('/messages');
}

exports.removeMessage = function (req,res) {
	const messageID = req.body.messageID

	MessageDAO.deleteMessage(messageID).then(numRemoved => {
		console.log("Message deleted. Number of messages removed:", numRemoved);
	})
	.catch(err => {
		console.error("Error deleting messages:", err);
	});

	res.redirect('/admin/messages');
}

exports.showChat = function (req, res) {
	const chatID = req.params.chatID;
	let posterEmail = req.headers.email;
	let listingID = null;
	let currentUser = false;
	let userName;

	UserDAO.lookup(posterEmail).then((user) => {
		userName = user.fname + " " + user.lname;
		MessageDAO.lookup(chatID).then((foundChats) => {
			foundChats.sort((a, b) => a.dateTime - b.dateTime);

			try {
				if (currentUser == false && foundChats[0].poster !== posterEmail) {
					currentUser = true;
					listingID = foundChats[0].listingID;
				}
	
			} catch (error) {
				console.log(error);
			}

			const promises = foundChats.map(foundChat => {
				if (foundChat.poster !== posterEmail) {
					return UserDAO.lookup(foundChat.poster).then((user) => {
						foundChat.poster = user.fname + " " + user.lname;
					});
				} 
				else {
					foundChat.poster = userName;
					return Promise.resolve();
				}
			});

			Promise.all(promises).then(() => {
				foundChats.forEach(foundChat => {
					foundChat.dateTime = new Date(foundChat.dateTime);
				});

				res.render('chat', { chat: foundChats, chatID: foundChats[0].chatID, listingID: listingID, posterEmail: posterEmail, currentUser: currentUser });
			})
		})
	})
}

exports.createListing = function (req, res) {
	res.render('createListing');
}

exports.postListing = function (req, res) {
	const pictures = req.files.map(file => file.path.replace(/^public\//, ''));
	const title = req.body.title;
	const location = req.body.location;
	const expireDate = req.body.expireDate;
	const amount = req.body.amount;
	const description = req.body.description;
	const email = req.headers.email;

	if (!title || !location) {
		res.status(401).send('no title or location')
		return;
	}

	ListingDAO.create(pictures, title, location, expireDate, amount, description, email).then(() => {
		console.log("Created listing", title);
		res.redirect('/');
	})
	.catch((err) => {
		console.error("Error:", err);
		res.status(500).send("Error creating listing");
	});
}

exports.removeListing = function (req,res) {
	const posterEmail = req.body.posterEmail
	const listingID = req.body.listingID

	ListingDAO.delete(listingID).then(numRemoved => {
		console.log("Listing deleted. Number of listings removed:", numRemoved);
	})
	.catch(err => {
		console.error("Error deleting listing:", err);
	});

	if (res.locals.admin == true) {
		res.redirect('/admin/listings');
	}
}

exports.showListings = function (req, res) {
	ListingDAO.getAllListings().then((filteredListings) => {
		const promises = filteredListings.map((listing) => {
			return MessageDAO.lookupListing(listing._id).then((listings) => {
				if (listings.length > 0) {
					listing.messageInProgress = true;

					filteredListings.forEach((listing) => {
						if (listing.posterEmail == req.headers.email) {
							listing.currentUser = true;
						} 
						else {
							listing.currentUser = false;
						}
		
						if (new Date(listing.expireDate) < Date.now()) {
							ListingDAO.delete(listing._id).then(numRemoved => {
								console.log("Listing deleted. Number of listings removed:", numRemoved);
							})
							.catch(err => {
								console.error("Error deleting listing:", err);
							});
							filteredListings = filteredListings.filter((item) => item !== listing);
						}
					});
				}
			});
		});
		
		Promise.all(promises).then(() => {
			let noActiveListings = false;

			filteredListings.forEach((listing) => {
				if (listing.messageInProgress != true) {
					noActiveListings = true;
				}
			});

			res.render('listing', { listings: filteredListings, noActiveListings: noActiveListings });
		})
	})
};

exports.admin = function (req, res) {
	try {
		if (res.locals.admin == true) {
			res.render('admin');
		}
		else {
			res.redirect('/');
		}
	}
	catch {
			res.redirect('/');
	}
}

exports.adminPage = function (req, res) {
	try {
		if (res.locals.admin == true) {
			const adminPage = req.params.adminPage; // Can be: messages, listings, accounts
			let noActiveEntries = true;

			switch (adminPage) {
				case "messages":
					let structuredMessages = [];

					MessageDAO.getAllMessages().then((messages) => {
						if (messages.length > 0) {
							noActiveEntries = false;

							messages.forEach((message) => {
								structuredMessages.push({
									noImg: true,
									title: message._id,
									content: message.message,
									posterEmail: message.poster,
									time: new Date(message.dateTime),
									entryType: "message",
									entryID: message._id								
								});
							});
						}

						res.render('adminPage', { entries: structuredMessages, noActiveEntries: noActiveEntries });
					});
					break;
				case "listings":
					let structuredListings = [];

					ListingDAO.getAllListings().then((listings) => {
						if (listings.length > 0) {
							noActiveEntries = false;

							listings.forEach((listing) => {
								structuredListings.push({
									noImg: false,
									picture0: listing.picture0,
									title: listing.title,
									content: listing.location + ", " + listing.description,
									posterEmail: listing.posterEmail,
									time: new Date(listing.expireDate),
									entryType: "listing",
									entryID: listing._id
								});
							});
						}

						res.render('adminPage', { entries: structuredListings, noActiveEntries: noActiveEntries });
					});
					break;
				case "accounts":
					let structuredAccounts = [];

					UserDAO.getAllUsers().then((users) => {
						if(users.length > 0) {
							noActiveEntries = false;

							users.forEach((user) => {
								structuredAccounts.push({
									noImg: true,
									title: user.fname + " " + user.lname,
									content: user.email,
									posterEmail: user.email,
									entryType: "user",
									entryID: user._id
								});
							});
						}

						res.render('adminPage', { entries: structuredAccounts, noActiveEntries: noActiveEntries });
					});
					break;
				default:
					throw "Either something went wrong, or you're not meant to be here."
			}
		}
		else {
			res.redirect('/');
		}
	}
	catch (err) {
		console.log("Error:", err);
		res.redirect('/admin');
	}
}

setTimeout(initAccounts, 10);
setTimeout(createChain, 500, "c.fairbairn@gmail.com", "abby.thom@gmail.com", "Sweets");
setTimeout(createChain, 500, "c.fairbairn@gmail.com", "jack.eadie@gmail.com", "Potateos");
setTimeout(sendMsg, 1500, "Why yes, it is", "abby.thom@gmail.com");
setTimeout(sendMsg, 1750, "Ideal, when can I collect?", "c.fairbairn@gmail.com");
setTimeout(sendMsg, 2000, "Whenever's best for you.", "abby.thom@gmail.com");

function initAccounts() {
	UserDAO.create("Calum", "Fairbairn", "c.fairbairn@gmail.com", "asdf");
	UserDAO.create("Abigail", "Thom", "abby.thom@gmail.com", "fdsa");
	UserDAO.create("Jack", "Eadie", "jack.eadie@gmail.com", "qwerty");
	UserDAO.create("Admin", "Account", "admin@example.com", "admin");

	setTimeout(() => {
		ListingDAO.create(["listings/images/6d961343b603d368504c5498a77fa682"], "Potateos", "Falkirk", "2024-05-12", 34, "Some potatoes I've grown in my lot.", "jack.eadie@gmail.com");
		ListingDAO.create(["listings/images/370b037769c6495a042b446dd9fb70db"], "Sweets", "Glasgow", "2024-04-29", 12, "Spare sweets from todays cookoff.", "abby.thom@gmail.com");	
	}, 250);
}

function createChain(poster, recipient, title) {
	const message = "Is this still avalible?";
	const posterEmail = poster;
	const recipientEmail = recipient;
	const dateTime = Date.now();

	if (!message || !posterEmail || !recipientEmail) {
		res.status(401).send('no message, poster or recipient.')
		return;
	}

	ListingDAO.lookupTitle(title, recipientEmail).then((listings) => {
		MessageDAO.create(message, posterEmail, recipientEmail, dateTime, listings[0]._id);	  
	});
}

async function sendMsg(messageText, posterEmail) {
	try {
		if (!messageText || !posterEmail) {
			throw new Error('no message or poster.');
		}

		await UserDAO.lookup(posterEmail).then((user) => {
			if (!user) {
				throw new Error('User not found.');
			}

			MessageDAO.lookup(user.chats[0][0]).then((chats) => {
				//console.log(posterEmail, " Listing chats: ", chats[0]);
				MessageDAO.addMsg(user.chats[0][0], messageText, posterEmail, Date.now(), chats[0].listingID);
			});
		});
	} 
	catch (error) {
		console.error("Error:", error);
		throw error;
	}
}
