const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");
const Wallet = require("../models/Wallet");
const User = require("../models/User");

const transferMoney = async (req, res) => {
	const session = await mongoose.startSession();
	session.startTransaction();
	try {
		const opts = { session };
		const senderWallet = await Wallet.findOne({
			user: req.params.userId,
		}).session(session);
		const recipientWallet = await Wallet.findOne({
			user: req.body.toAccount,
		}).session(session);

		if (!senderWallet || !recipientWallet) {
			throw new Error("Sender or recipient wallet not found");
		}

		if (senderWallet.user.toString() === recipientWallet.user.toString()) {
			throw new Error("You can't transfer to yourself!");
		}

		if (senderWallet.balance < req.body.amountToSend) {
			throw new Error("Insufficient balance!");
		}

		senderWallet.balance -= req.body.amountToSend;
		recipientWallet.balance += req.body.amountToSend;

		await senderWallet.save();
		await recipientWallet.save();

		const transaction = await Transaction({
			from: req.params.userId,
			to: req.body.toAccount,
			amount: req.body.amountToSend,
			transactionType: "transfer",
		}).save(opts);
		await session.commitTransaction();

		res
			.status(200)
			.json({ message: "Transaction completed successfully!", success: true });
	} catch (error) {
		console.log(error);
		await session.abortTransaction();

		res.status(500).send({ message: error.message, success: false });
	} finally {
		session.endSession();
	}
};

const getTransactions = async (req, res) => {
	try {
		const userId = req.params.userId;
		// Find the user's wallet
		const user = await User.findById(userId);
		if (!user) {
			return res
				.status(404)
				.send({ message: "User not found!", success: false });
		}
		// Find transactions involving the user
		const transactions = await Transaction.find({
			$or: [{ from: userId }, { to: userId }],
		});
		res.status(200).send(transactions);
	} catch (error) {
		console.log(error);
		res.status(500).send({ message: error.message, success: false });
	}
};

module.exports = {
	transferMoney,
	getTransactions,
};
