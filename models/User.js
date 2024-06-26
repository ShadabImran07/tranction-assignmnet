const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const userSchema = new mongoose.Schema({
	name: {
		type: String,
		required: [true, "Your name is required"],
		unique: false,
	},
	email: {
		type: String,
		required: [true, "Your email address is required"],
		unique: true,
	},
	isVerified: {
		type: Boolean,
		default: false,
	},

	password: {
		type: String,
		required: [true, "Your password is required"],
	},
	createdAt: {
		type: Date,
		default: new Date(),
	},
});
userSchema.pre("save", async function () {
	this.password = await bcrypt.hash(this.password, 5);
});
module.exports = mongoose.model("User", userSchema);
