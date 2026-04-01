import { Config } from "../config";
import emailer = require("nodemailer")
import { Log } from "../log";

export namespace EmailService {
	export async function sendEmail(to:string,subject:string,opt:{
		content?:string,
		html?:string,
	}) {
		if(!Config.localConfig.email) {
			return false 
		}
		let transporter = emailer.createTransport({
			host: Config.localConfig.email.host,
			port: Config.localConfig.email.port,
			secure: Config.localConfig.email.ssl, // true for 465, false for other ports
			auth: {
				user: Config.localConfig.email.from, // generated ethereal user
				pass: Config.localConfig.email.password, // generated ethereal password
			},
			tls: !Config.localConfig.email.ssl ? {
				// 服务器证书域名不匹配 (us2.smtp.mailhostbox.com)，需跳过验证
				rejectUnauthorized: false,
			} : undefined,
		});
		let info = await transporter.sendMail({
			from: Config.localConfig.email.from, // sender address
			to: to, // list of receivers
			subject: subject, // Subject line
			text: opt.content, // plain text body
			html: opt.html, // html body
		});
		Log.oth.info("send email to " + to + " subject = " + subject + " content = " + opt.content + " result = ",info)
		return true 
	}
}