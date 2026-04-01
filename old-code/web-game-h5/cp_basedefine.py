

import os 
import sys 
import shutil

CUR_PATH = os.path.realpath(os.path.dirname(__file__))
include_list = [
	"PokerDefine.ts",
	"CardDefine.ts",
	"RoomDefine.ts",
	"GroupDefine.ts",
	"ClubDefine.ts",
	"UserDefine.ts",
	"GameSet.ts",
	"SrsUserMsg.ts",
	"GSUserMsg.ts",
	"GSCommonMsg.ts",
	"GSMatchUserMsg.ts",
	"ItemDefine.ts",
	"MatchDefine.ts",
	"CustomerDefine.ts",
	"NewsDefine.ts",
	"GlobalConfig.ts",
	"MailDefine.ts",
	"RewardDefine.ts",
	"ChargeDefine.ts",
]
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
		if not item in include_list:
			continue
		item_dir = os.path.join(src_dir,item)
		target_dir = os.path.join(dst_dir,item)
		if os.path.isdir(item_dir):
			if log:
				print("dir: " + item_dir + " > " + target_dir)
			copy_deep(item_dir,target_dir)
		else:
			if log:
				print("item: " + item_dir + " > " + target_dir)
			shutil.copy(item_dir,target_dir)

def main():
	target_dir = os.path.join(CUR_PATH,"assets","scripts","ServerDefines")
	if os.path.isdir(target_dir):
		shutil.rmtree(target_dir)

	from_dir = os.path.join(CUR_PATH,"..","cpp-servers","pp-base-define")
	copy_deep(from_dir,target_dir)

	gamebase_files = [
		"GSCommonMsg.ts"
	]
	for file in gamebase_files:
		file_path = os.path.join(from_dir,"..","pp-game-base",file)
		target_path = os.path.join(target_dir,file)
		shutil.copy(file_path,target_path)
	pass 


main()