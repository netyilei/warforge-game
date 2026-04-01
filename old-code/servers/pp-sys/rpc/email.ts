import { Config } from "../config"
import { EmailService } from "../entity/EmailService"

import path = require("path")
import fs = require("fs")

function replaceAllLiteral(source:string, pattern:string, value:string) {
	if(!pattern) {
		return source
	}
	return source.split(pattern).join(value)
}

async function sendEmail(h:string,to:string,subject:string,content:string) {
	if(!Config.localConfig.email) {
		return false 
	}
	return await EmailService.sendEmail(to,subject,{ content })
}

async function sendEmailCode(h:string,to:string,code:string,templateName?:string) {
	if(!Config.localConfig.sendCode || !Config.localConfig.sendCode.templates) {
		return false
	}
	let template = Config.localConfig.sendCode.templates.find(v=>v.name == templateName) ||
		Config.localConfig.sendCode.templates.find(v=>v.name == Config.localConfig.sendCode.defaultTemplateName)
	if(!template) {
		return false 
	}
	if(template.file) {
		let filePath = path.join(path.resolve(), template.file)
		if(fs.existsSync(filePath)) {
			let html = fs.readFileSync(filePath, "utf-8")
			html = replaceAllLiteral(html, template.pattern, code)
			return await EmailService.sendEmail(to,template.subject,{ html })
		}
	} else if(template.content) {
		let content = replaceAllLiteral(template.content, template.pattern, code)
		return await EmailService.sendEmail(to,template.subject,{ content })
	}
	return false 
}

export let RpcEmail = {
	sendEmail,
	sendEmailCode,
}