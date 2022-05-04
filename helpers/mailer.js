const nodemailer = require("nodemailer");
var inlineBase64 = require("nodemailer-plugin-inline-base64");
// create reusable transporter object using the default SMTP transport
let transporter = nodemailer.createTransport({
	service: "Gmail",
	//secure: process.env.EMAIL_SMTP_SECURE, // lack of ssl commented this. You can uncomment it.
	auth: {
		user: process.env.EMAIL_SMTP_USERNAME,
		pass: process.env.EMAIL_SMTP_PASSWORD
	}
});

exports.send = function (from, to, subject, html)
{
	// send mail with defined transport object
	// visit https://nodemailer.com/ for more options
	transporter.use("compile", inlineBase64({cidPrefix: "somePrefix_"}));
	return transporter.sendMail({
		from: from, // sender address e.g. no-reply@xyz.com or "Fred Foo 👻" <foo@example.com>
		to: to, // list of receivers e.g. bar@example.com, baz@example.com
		subject: subject, // Subject line e.g. 'Hello ✔'
		//text: text, // plain text body e.g. Hello world?
		html: html // html body e.g. '<b>Hello world?</b>'
	});
};