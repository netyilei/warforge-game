import COS = require("cos-nodejs-sdk-v5")
import { AdapterBase } from "./adapterr";
import * as path from "path"
import { Log } from "../log";
export class COSAdapter extends AdapterBase {
	private entity_:COS
	initOSS() {
		this.entity_ = new COS({
			// 必选参数
			SecretId: this.config.key,
			SecretKey: this.config.secret,
			// 可选参数
			FileParallelLimit: 5,    // 控制文件上传并发数
			ChunkParallelLimit: 8,   // 控制单个文件下分片上传并发数，在同园区上传可以设置较大的并发数
			ChunkSize: 1024 * 1024 * 4,  // 控制分片大小，单位 B，在同园区上传可以设置较大的分片大小
			Proxy: '',
			Protocol: 'https:',
		})
	}

	getUrl(key:string) {
		return this.config.cdnPrefix + key
	}

	async getAllKeys(dirPath?:string) {
		let self = this 
		return new Promise<string[]>(function(resolve,reject) {
			let ret:string[] = []
			let marker = null
			let _listLoop = function(callback:Function) {
				let next = function() {
					self.entity_.getBucket({
						Bucket:self.config.bucketName,
						Region:self.config.region,
						Marker:marker,
						Prefix:dirPath,
					},function(err,data) {
						if (err) return callback(err);
						if(data && data.Contents) {
							for(let obj of data.Contents) {
								ret.push(obj.Key)
							}
						}
						if (data.IsTruncated === 'true') {
							marker = data.NextMarker;
							next();
						} else {
							callback(null);
						}
					})
				}
				next()
			}
			_listLoop(function(err) {
				if(err) {
					Log.oth.error("[cos] error in list dirPath = " + dirPath,err)
					resolve([])
				} else {
					resolve(ret)
				}
			})
		})
	}

	async upload(key:string,buffer:Buffer) {
		let self = this 
		return new Promise<string>(function(resolve,reject) {
			self.entity_.putObject({
				Bucket:self.config.bucketName,
				Region:self.config.region,
				Key:key,
				Body:buffer,
				ContentLength:buffer.byteLength,
			},function(err,data) {
				if(err) {
					Log.oth.error("[cos] upload failed key = " + key,err)
					resolve(null)
				} else {
					resolve(self.getUrl(key))
				}
			})
		})
	}

	async delete(key:string) {
		let self = this 
		return new Promise<boolean>(function(resolve,reject) {
			self.entity_.deleteObject({
				Bucket:self.config.bucketName,
				Region:self.config.region,
				Key:key,
			},function(err,data) {
				if(err) {
					resolve(false)
				} else {
					resolve(true)
				}
			})
		})
	}

	async deleteMulti(keys:string[]) {
		let self = this 
		return new Promise<boolean>(function(resolve,reject) {
			let objs = []
			for(let k of keys) {
				objs.push({
					Key:k
				})
			}
			self.entity_.deleteMultipleObject({
				Bucket:self.config.bucketName,
				Region:self.config.region,
				Objects:objs,
			},function(err,data) {
				if(err) {
					resolve(false)
				} else {
					resolve(true)
				}
			})
		})
	}
}