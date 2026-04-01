# -*- coding: utf-8 -*-

import os
import sys 
import shutil
import io 
import game_config

reload(sys)
sys.setdefaultencoding('utf8')

CUR_PATH = os.path.realpath(os.path.dirname(__file__))
CPP_PROJECT_ROOT = os.path.join(CUR_PATH,"..","build","jsb-link","frameworks","runtime-src")
ANDROID_ROOT = os.path.join(CPP_PROJECT_ROOT,"proj.android-studio")
IOS_ROOT = os.path.join(CPP_PROJECT_ROOT,"proj.ios_mac")
ANDROID_FILES = [
	["AndroidManifest.xml",	os.path.join(ANDROID_ROOT,"app","AndroidManifest.xml")],
	["build.gradle",		os.path.join(ANDROID_ROOT,"app","build.gradle")],
	["strings.xml",			os.path.join(ANDROID_ROOT,"res","values","strings.xml")],
	["gradle.properties",	os.path.join(ANDROID_ROOT,"gradle.properties")],
	["GameConfig.java",		os.path.join(ANDROID_ROOT,"app","src","org","tools","GameConfig.java")]
]
IOS_FILES = [
	["project.pbxproj",		os.path.join(IOS_ROOT,"xdcygame.xcodeproj","project.pbxproj")],
	["xdPlatform.mm",		os.path.join(IOS_ROOT,"ios","xdPlatform.mm")],
	["Info.plist",		os.path.join(IOS_ROOT,"ios","Info.plist")],
]
def _process_android(game_name):
	res_dir = os.path.join(CUR_PATH,"..","build-res","templates","android")
	config = game_config.loadGameConfig(game_name)
	if config == None:
		return False 

	buffer = "" 
	# AndroidManifest
	file_path = os.path.join(res_dir,ANDROID_FILES[0][0])
	target_path = ANDROID_FILES[0][1]
	with open(file_path,"r") as file:
		buffer = file.read()
	buffer = buffer.replace("{$PACKAGE_NAME}",config._package_name_android)
	buffer = buffer.replace("{$AMAP_KEY}",config._amap_key)
	if len(config._wx_appid) > 0:
		buffer = buffer.replace("{$WX_APPID}",config._wx_appid)
	with open(target_path,"w") as file:
		file.write(buffer)

	# build.gradle
	file_path = os.path.join(res_dir,ANDROID_FILES[1][0])
	target_path = ANDROID_FILES[1][1]
	with open(file_path,"r") as file:
		buffer = file.read()
	buffer = buffer.replace("{$PACKAGE_NAME}",config._package_name_android)
	with open(target_path,"w") as file:
		file.write(buffer)

	# strings.xml
	file_path = os.path.join(res_dir,ANDROID_FILES[2][0])
	target_path = ANDROID_FILES[2][1]
	with open(file_path,"r") as file:
		buffer = file.read()
	buffer = buffer.replace("{$DISPLAY_NAME}",config._display_name.encode("utf-8"))
	with open(target_path,"w") as file:
		file.write(buffer)

	# gradle.properties
	file_path = os.path.join(res_dir,ANDROID_FILES[3][0])
	target_path = ANDROID_FILES[3][1]
	with open(file_path,"r") as file:
		buffer = file.read()
	buffer = buffer.replace("{$KEYSTORE_FILENAME}",config._android_keystore_filename)
	buffer = buffer.replace("{$KEYSTORE_PWD}",config._android_keystore_pwd)
	buffer = buffer.replace("{$KEYSTORE_ALIAS}",config._android_keystore_alias)
	buffer = buffer.replace("{$KEYSTORE_ALIASPWD}",config._android_keystore_aliaspwd)
	with open(target_path,"w") as file:
		file.write(buffer)

	# GameConfig.java
	file_path = os.path.join(res_dir,ANDROID_FILES[4][0])
	target_path = ANDROID_FILES[4][1]
	with open(file_path,"r") as file:
		buffer = file.read()
	buffer = buffer.replace("{$WX_APPID}",config._wx_appid)
	with open(target_path,"w") as file:
		file.write(buffer)

	# wxapi.activity
	wxdirs = ["com","cn"]
	for d in wxdirs:
		dir = os.path.join(ANDROID_ROOT,"app","src",d)
		if os.path.isdir(dir):
			shutil.rmtree(dir)
	sdirs = str(config._package_name_android).split(".")
	sdirs.append("wxapi")
	wx_src_subdir = os.path.join(ANDROID_ROOT,"app","src")
	for d in sdirs:
		wx_src_subdir = os.path.join(wx_src_subdir,d)
	os.makedirs(wx_src_subdir)

	filename = "WXEntryActivity.java"
	target_path = os.path.join(wx_src_subdir,filename)
	shutil.copyfile(
		os.path.join(res_dir,filename),
		target_path
	)
	
	with open(target_path,"r") as file:
		buffer = file.read()
	buffer = buffer.replace("cn.game.test.wxapi",config._package_name_android + ".wxapi")
	with open(target_path,"w") as file:
		file.write(buffer)
	return True 

def _process_ios(game_name):
	res_dir = os.path.join(CUR_PATH,"..","build-res","templates","ios")
	config = game_config.loadGameConfig(game_name)
	if config == None:
		return False 

	# xcode
	file_path = os.path.join(res_dir,IOS_FILES[0][0])
	target_path = IOS_FILES[0][1]
	with open(file_path,"r") as file:
		buffer = file.read()
	buffer = buffer.replace("{$PACKAGE_NAME}",config._package_name_ios)
	with open(target_path,"w") as file:
		file.write(buffer)

	# xdPlatform.mm
	file_path = os.path.join(res_dir,IOS_FILES[1][0])
	target_path = IOS_FILES[1][1]
	with open(file_path,"r") as file:
		buffer = file.read()
	buffer = buffer.replace("{$WX_APPID}",config._wx_appid)
	buffer = buffer.replace("{$AMAP_KEY}",config._amap_key_ios)
	with open(target_path,"w") as file:
		file.write(buffer)

	# Info.plist
	file_path = os.path.join(res_dir,IOS_FILES[2][0])
	target_path = IOS_FILES[2][1]
	with open(file_path,"r") as file:
		buffer = file.read()
	buffer = buffer.replace("{$DISPLAY_NAME}",config._display_name)
	buffer = buffer.replace("{$WX_APPID}",config._wx_appid)
	with open(target_path,"w") as file:
		file.write(buffer)
	return True 

def process(game_name,platform):
	print("> process platform " + platform)
	if platform == "android":
		return _process_android(game_name)
	elif platform == "ios":
		return _process_ios(game_name)
	else:
		print("> unhandled platform = " + platform)

	return False 