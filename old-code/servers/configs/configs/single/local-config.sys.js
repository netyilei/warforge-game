
module.exports = {

	email: {
		from: "admin@wforge.net",
		password: "IEAWhsV1",
		host: "smtp.wforge.net",
		port: 587,
		ssl: false,
	},

	sendCode: {
		templates: [
			{
				name: "register",
				subject: "WarForge: Account Registration Verification Code",
				file: "registration-verification.html",
				pattern: "{$code}",
			},
			{
				name: "changePassword",
				subject: "WarForge: Password Reset Verification Code",
				file: "password-recovery.html",
				pattern: "{$code}",
			},
			{
				name: "tradePassword",
				subject: "WarForge: Payment Password Reset Verification Code",
				file: "payment-password-recovery.html",
				pattern: "{$code}",
			},
		],
		defaultTemplateName: "register",
	}
}