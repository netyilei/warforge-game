# -*- coding: utf-8 -*-

import os
import sys 
import shutil
import io

CUR_PATH = os.path.realpath(os.path.dirname(__file__))
TARGET_PATH = os.path.join(CUR_PATH,"..","assets","_targets")


class GameConfig:
	def __init__(self):
		self._amap_key = ""
		self._amap_key_ios = ""
		self._wx_appid = ""
		self._package_name_android = ""
		self._package_name_ios = ""
		self._display_name = ""
		self._cdn_path = ""
		self._cdn_mid_path = ""
		self._prev_link = ""
		self._android_keystore_filename = ""
		self._android_keystore_pwd = ""
		self._android_keystore_alias = ""
		self._android_keystore_aliaspwd = ""
		self._bundles = []
		self._disable_bundles = []

	def __readJson(self,json,name,defValue = ""):
		if json.has_key(name):
			return json[name]
		return defValue

	def loadFromDict(self,json):
		self._amap_key 					= self.__readJson(json,"amap_key")
		self._amap_key_ios				= self.__readJson(json,"amap_key_ios")
		self._wx_appid					= self.__readJson(json,"wx_appid")
		self._package_name_android 		= self.__readJson(json,"package_name_android")
		self._package_name_ios	 		= self.__readJson(json,"package_name_ios")
		self._display_name	 			= self.__readJson(json,"display_name")
		self._cdn_path					= self.__readJson(json,"cdn_path")
		self._cdn_mid_path				= self.__readJson(json,"cdn_mid_path")
		self._prev_link					= self.__readJson(json,"prev_link")
		self._bundles		 			= self.__readJson(json,"bundles",defValue=[])
		self._disable_bundles		 	= self.__readJson(json,"disable_bundles",defValue=[])

		self._android_keystore_filename 	= self.__readJson(json,"android_keystore_filename")
		self._android_keystore_pwd 			= self.__readJson(json,"android_keystore_pwd")
		self._android_keystore_alias 		= self.__readJson(json,"android_keystore_alias")
		self._android_keystore_aliaspwd 	= self.__readJson(json,"android_keystore_aliaspwd")

	def getBuildConfig(self):
		ret = {}
		ret["amap_key"] 				= self._amap_key
		ret["amap_key_ios"]				= self._amap_key_ios
		ret["wx_appid"]					= self._wx_appid
		ret["package_name_android"] 	= self._package_name_android
		ret["package_name_ios"]			= self._package_name_ios
		ret["display_name"]				= self._display_name
		ret["cdn_path"]					= self._cdn_path
		ret["cdn_mid_path"]				= self._cdn_mid_path
		ret["prev_link"]				= self._prev_link
		ret["bundles"]					= self._bundles
		ret["disable_bundles"]			= self._disable_bundles

		ret["android_keystore_filename"]	= self._android_keystore_filename
		ret["android_keystore_pwd"]			= self._android_keystore_pwd
		ret["android_keystore_alias"]		= self._android_keystore_alias
		ret["android_keystore_aliaspwd"]	= self._android_keystore_aliaspwd
		return ret 

	def autoSave(self):
		if len(self._cache_path) > 0: 
			self.saveFile(self._cache_path)

	def getBuffer(self,compress=False):
		head = self._game_config.saveToDict()
		head["build"] = self.getBuildConfig()
		head["p_android"] = self._android 
		head["p_ios"] = self._ios 

		buffer = io.jsonDump(head,compress)
		return buffer 

	def saveFile(self,file_path = None):
		if file_path == None:
			file_path = self._cache_path
		else:
			self._cache_path = file_path
		out_dir = os.path.split(file_path)[0]
		if os.path.isdir(out_dir) == False:
			os.makedirs(out_dir)

		with open(file_path,"w") as file:
			buffer = self.getBuffer()
			#print("buildconfig] save product config to path = " + file_path)
			file.write(buffer)

		return True 
		
	def loadFile(self,file_path = None):
		if file_path == None:
			file_path = self._cache_path
		if os.path.isfile(file_path) == False:
			print("buildconfig] cannot find product config in path = " + file_path)
			return False 
		self._cache_path = file_path
		#print("buildconfig] load product config from path = " + file_path)
		json = io.loadJson(file_path)

		self.loadFromDict(json)
		return True 

def loadGameConfig(game_name):
	config_path = os.path.join(TARGET_PATH,game_name,"game_config.json")
	if not os.path.isfile(config_path):
		print("> load config failed path = " + config_path)
		return None 
	ret = GameConfig()
	ret.loadFile(config_path)
	return ret 
	
