

import os
import sys 
import json
import console

CUR_PATH = os.path.realpath(os.path.dirname(__file__))
CONFIG_NAME = "android"
res_exts = [".prefab",".png",".jpg",".wav",".mp3"]
def processBundleDir(rootDir,dir,arr):
	print("process bundle inside dir = " + dir)
	for d in os.listdir(dir):
		path = os.path.join(dir,d)
		if os.path.isdir(path):
			processBundleDir(rootDir,path,arr)
		else:
			t = os.path.splitext(path)
			lpath = path.lower()
			ext = os.path.splitext(lpath)[1]
			if ext in res_exts:
				name = t[0].replace(os.path.join(rootDir,""),"")
				arr.append(name.replace("\\","/"))
	pass 

ignoreDirs = ["resources"]
def processDir(rootDir,dir,valid_names,ret):
	print("proces dir = " + dir)
	meta_file_path = dir + ".meta"
	isBundle = False
	if os.path.isfile(meta_file_path):
		buffer = None 
		with open(meta_file_path,"rb") as file:
			buffer = file.read()

		t = json.loads(buffer)
		if t["isBundle"]:
			isBundle = True
			arr = []
			processBundleDir(dir,dir,arr)
			isRemote = False
			if t["isRemoteBundle"] != None:
				if t["isRemoteBundle"].has_key(CONFIG_NAME) and t["isRemoteBundle"][CONFIG_NAME]:
					isRemote = True

			name = t["bundleName"]
			if len(name) == 0:
				name = os.path.split(dir)[1]

			if name in valid_names:
				ret.append({
					"name" : name,
					"assetNames" : arr,
					#"root" : dir.replace(rootDir + "/","").replace("\\","/"),
					"remote" : isRemote,
				})
			
	if not isBundle:
		for d in os.listdir(dir):
			if d in ignoreDirs:
				continue 
			sub = os.path.join(dir,d)
			if os.path.isdir(sub):
				processDir(rootDir,sub,valid_names,ret)

def loadJson(file_path):
	if os.path.isfile(file_path) == False:
		return None 
	file = open(file_path,"r")
	ret = json.load(file)
	file.close()

	return dict(ret)

def process(game_name):
	root_path = os.path.join(CUR_PATH,"assets","_targets",game_name)
	config = None
	config = console.game_config.loadGameConfig(game_name)
	if config == None:
		print("> cannot load config failed ")
		return False 
	valid_names = config._bundles
	dep_path = os.path.join(root_path,"bundle_dep.json")
	bundle_dep = {}
	if os.path.isfile(dep_path):
		bundle_dep = loadJson(dep_path)

	map_names = {}
	for name in valid_names:
		name = str(name)
		if name.find("-") >= 0:
			map_name = name.split("-")[0]
			map_names[map_name] = name

	ret = []
	startDir = os.path.join(CUR_PATH,"assets")
	processDir(startDir,startDir,valid_names,ret)
	for info in ret:
		if config._disable_bundles.count(info["name"]) > 0:
			info["assetNames"] = []
		if bundle_dep.has_key(info["name"]):
			deps = bundle_dep[info["name"]]
			new_deps = []
			for dep in deps:
				dep = str(dep)
				if dep.find("$") == 0:
					new_deps.append(dep[1:])
				elif map_names.has_key(dep):
					new_deps.append(map_names[dep])
				else:
					new_deps.append(dep)

			info["deps"] = new_deps
		else:
			info["deps"] = []

	print(json.dumps(ret,indent=4))
	buffer = console.io.jsonDump(ret)
	with open(os.path.join(root_path,"bundle_map.json"),"wb") as file:
		file.write(buffer)
	pass 

	return True
# def main():
# 	if len(sys.argv) > 1:
# 		CONFIG_NAME = sys.argv[1]
# 	process()
# 	pass 

def main():
	target_dir = os.path.join(CUR_PATH,"assets","_targets")
	process(target_dir)

main()