

import os 
import sys 
import shutil
import json 

def findFileInDir(target_dir,features):
	for file in os.listdir(target_dir):
		file_path = os.path.join(target_dir,file)
		if os.path.isfile(file_path) == False:
			continue 
		ok = True
		for fr in features:
			if fr in file:
				continue 
			else:
				ok = False 
				break
		if ok:
			return file 
	return None

	
def loadJson(file_path):
	if os.path.isfile(file_path) == False:
		return None 
	file = open(file_path,"r")
	ret = json.load(file)
	file.close()
	return ret 

def jsonDump(t,compress=False):
	if compress:
		return json.dumps(t,sort_keys=True,separators=(',', ':'))
	else:
		return json.dumps(t,indent=4,sort_keys=True)

def copy_deep(src_dir,dst_dir,log = False,replace = False):
	if log:
		print("kd] copy deep from {0} to {1}".format(src_dir,dst_dir))
	if os.path.isdir(src_dir) == False:
		return False
	if replace:
		if os.path.isdir(dst_dir):
			shutil.rmtree(dst_dir)
	if os.path.isdir(dst_dir) == False:
		os.makedirs(dst_dir)

	for item in [x for x in os.listdir(src_dir)]:
		if item == "ServerConfig.ts":
			continue
		item_dir = os.path.join(src_dir,item)
		target_dir = os.path.join(dst_dir,item)
		if os.path.isdir(item_dir):
			if log:
				print "dir: " + item_dir + " > " + target_dir
			copy_deep(item_dir,target_dir)
		else:
			if log:
				print "item: " + item_dir + " > " + target_dir
			shutil.copy(item_dir,target_dir)