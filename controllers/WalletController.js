const User = require("../models/User");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const mongoose = require("mongoose");

const getWallet = async (req, res) => {
	try {
		const userId = req.params.userId;

		const wallet = await Wallet.findOne({ user: userId });
		if (!wallet) {
			return res
				.status(404)
				.send({ message: "Wallet not found!", success: false });
		}

		const balance = wallet.balance;

		res.status(200).json({ balance });
	} catch (error) {
		console.log(error);
		res.status(500).send({ message: "Internal server error!", success: false });
	}
};

const fundWallet = async (req, res) => {
	const session = await mongoose.startSession();
	session.startTransaction();
	try {
		const opts = { session };
		const userId = req.params.userId;

		const amountToAdd = req.body.amount;
		// return res.status(200).json({ amountToAdd });

		// Find the user's wallet
		const userWallet = await Wallet.findOne({ user: userId }).session(session);

		if (!userWallet) {
			throw new Error("Wallet not found!");
		}
		// Update the wallet balance
		const updatedWallet = await Wallet.findByIdAndUpdate(
			userWallet._id,
			{ $inc: { balance: amountToAdd } },
			{ new: true }
		).session(session);

		const transfer = await Transaction({
			from: userId,
			to: userId,
			amount: amountToAdd,
			transactionType: "deposit",
		}).save(opts);

		await session.commitTransaction();

		res.status(200).json({
			message: "Funded account successfully",
			success: true,
		});
	} catch (error) {
		await session.abortTransaction();
		console.log(error);
		res.status(500).send({ message: error.message, success: false });
	} finally {
		session.endSession();
	}
};

module.exports = {
	getWallet,
	fundWallet,
};
