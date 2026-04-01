# -*- coding: utf-8 -*-

import os
import sys 
import shutil
import time 
import json

OSS_PATH = "/hotupdate/"
CDN_PATH = "http://" + OSS_PATH

CUR_PATH = os.path.realpath(os.path.dirname(__file__))
TEMP_PATH = os.path.join(CUR_PATH,"..","build-update-local")

def setup(midUrl):
	global OSS_PATH
	OSS_PATH = OSS_PATH + midUrl + "/"

def listAllFiles(d,ret=[]):
	if ret == None:
		ret = []
	for f in os.listdir(d):
		file_dir = os.path.join(d,f)
		if os.path.isfile(file_dir):
			ret.append(file_dir)
		else:
			listAllFiles(file_dir,ret)
	return ret 


def upload(fromDir,ossPath):
	print("> begin to output from " + fromDir + " to = " + ossPath)
	oss_head_path = OSS_PATH + ossPath
	
	files = listAllFiles(fromDir,[])
	index = 0
	successCount = 0
	count = len(files)
	failed = False

	#bucket.delete_object(oss_head_path + "/")
	print("> file count = " + str(count))
	for f in files:
		index = index + 1
		f_oss_path = f.replace(fromDir,"").replace("\\","/")
		
		with open(f,"rb") as file:
			target_path = os.path.join(TEMP_PATH,(oss_head_path + f_oss_path)[1:])
			d = os.path.split(target_path)[0]
			if os.path.isdir(d) == False:
				os.makedirs(d)
			with open(target_path,"wb") as file_output:
				file_output.write(file.read())

			print("> [{0}/{1}]".format(str(index),str(count)) + " output file = " + f_oss_path)
			#print(result)
			
			# if result.status != 200:
			# 	failed = True
			# 	break
			# else:
			# 	successCount = successCount + 1

	print("> output complete file count: {0}/{1}".format(successCount,count))
	if failed:
		print("> output failed")
		return False
	return True 

def uploadFile(file,ossPath):
	oss_head_path = OSS_PATH + ossPath
	#result = bucket.put_object(oss_head_path[1:],file)
	target_path = os.path.join(TEMP_PATH,(oss_head_path)[1:])
	d = os.path.split(target_path)[0]
	if os.path.isdir(d) == False:
		os.makedirs(d)
	with open(target_path,"wb") as file_output:
		buffer = file 
		if type(buffer) != str:
			file_output.write(file.read())
		else:
			file_output.write(file)

	print("> output file = " + oss_head_path)
	#print(result)
	# if result.status != 200:
	# 	print("> upload file failed")
	# 	return False 
	# return True