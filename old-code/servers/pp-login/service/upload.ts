import { baseService } from "kdweb-core/lib/service/base"
import { kds } from "../../pp-base-define/GlobalMethods"
import { Rpc } from "../rpc"
import { kdutils } from "kdweb-core/lib/utils"
import * as express from "express"
import * as core from "express-serve-static-core";
import multer = require('multer');
import crypto = require('crypto');
import path = require('path');
import fs = require('fs');
import { Log } from "../log"
import { Module_RegisterUpload } from "../../pp-base-define/DM_UserDefine"
import md5 = require('md5');
import { TimeDate } from "../../src/TimeDate"

const rootPath = "/data/uploads/register/"
export namespace LoginUploadService {
	export function initUpload(app: core.Express) {
		if(!fs.existsSync(rootPath)) {
			fs.mkdirSync(rootPath, { recursive: true });
		}
		// 1. 限制文件类型和大小
		const fileFilter = (req, file, cb) => {
			if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
				// return cb(new Error('only support JPG/PNG format'), false);
				Log.oth.error("Register upload invalid file type ",file);
			}
			cb(null, true);
		};

		// 2. 安全命名（避免路径遍历）
		const storage = multer.diskStorage({
			destination: rootPath,
			filename: (req, file, cb) => {
				const ext = path.extname(file.originalname).toLowerCase();
				const randomName = crypto.randomBytes(16).toString('hex');
				cb(null, `register_${randomName}${ext}`); // 如 idcard_a1b2c3...jpg
			}
		});

		const upload = multer({
			storage,
			limits: { fileSize: 10 * 1024 * 1024 }, // ≤2MB
			fileFilter
		});
		app.post('/upload/register',
			upload.fields([
				{ name: 'idcard', maxCount: 1 },
			]),
			async (req, res) => {
				try {
					// 1. 验证必传字段
					if (!req.files || Array.isArray(req.files) || !req.files.idcard) {
						return res.status(400).json(baseService.errJson(1,"文件错误"));
					}

					// 2. 【可选但强烈建议】调用第三方实名认证 API
					//    如阿里云实人认证、腾讯云慧眼、百度 AI 身份证 OCR
					//    验证：姓名+身份证号+人脸是否一致
					// const verifyResult = await verifyIdCardWithFace(
					//   req.body.name,
					//   req.body.idNumber,
					//   req.files.idCardFront[0].path,
					//   req.files.selfie[0].path
					// );
					// if (!verifyResult.success) return res.status(400).json({ error: '身份验证失败' });

					// 3. 保存用户信息（只存路径，不存图片二进制！）

					let token = md5(req.files.idcard[0].path)
					await Module_RegisterUpload.insert({
						account:null,
						fullPath:req.files.idcard[0].path,
						token:token,
						timestamp:kdutils.getMillionSecond(),
						date:TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss"),
					})
					// 4. 返回成功（不返回文件路径给前端！）
					res.status(201).json({ token });
				} catch (err) {
				// 清理已上传的文件（避免垃圾文件）
					Log.oth.error("Register upload error ",err);
					cleanupUploadedFiles(req.files);
					res.status(500).json({ });
				}
			}
		);
	}

	async function cleanupUploadedFiles(files) {
		if (!files) return;

		// 支持 single, array, fields 等所有 Multer 格式
		const allFiles = [];

		// 遍历所有字段（如 idCardFront, idCardBack）
		for (const field of Object.values(files)) {
			if (Array.isArray(field)) {
				allFiles.push(...field); // upload.array() 或 upload.fields()
			} else {
				allFiles.push(field);    // upload.single()
			}
		}

		// 删除每个文件
		for (const file of allFiles) {
			if (file?.path) {
				try {
					fs.unlinkSync(file.path);
					Log.oth.info(`✅ Cleaned up: ${file.path}`);
				} catch (err) {
					// 文件可能已被删除或不存在，静默忽略（或记录日志）
					if (err.code !== 'ENOENT') {
						Log.oth.error(`❌ Failed to delete ${file.path}:`, err.message);
					}
				}
			}
		}
	}
}