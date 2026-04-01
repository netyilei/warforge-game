
import os
import sys 
import console 
import icon_image

CUR_PATH = os.path.realpath(os.path.dirname(__file__))
PROJECT_ROOT = os.path.join(CUR_PATH,"build","jsb-link","frameworks","runtime-src")

ICON_PATH = os.path.join(CUR_PATH,"build-res","icon-2048.png")
project_config = [
	{
		# "path" : os.path.join(PROJECT_ROOT,"proj.ios_mac","ios","Images.xcassets","AppIcon.appiconset"),
		"path" : os.path.join(CUR_PATH,"build-res","ios"),
		"size" : [
			("Icon-57.png",		57),
			("Icon-512.png",	512),
			("Icon-20.png",		20),
			("Icon-20@2x.png",	40),
			("Icon-20@3x.png",	60),

			("Icon-29.png",		29),
			("Icon-29@2x.png",	58),
			("Icon-29@3x.png",	87),

			("Icon-40.png",		40),
			("Icon-40@2x.png",	80),
			("Icon-40@3x.png",	120),

			("Icon-50.png",		50),
			("Icon-50@2x.png",	100),

			("Icon-57.png",		57),
			("Icon-57@2x.png",	114),

			("Icon-60@2x.png",	120),
			("Icon-60@3x.png",	180),

			("Icon-72.png",		72),
			("Icon-72@2x.png",	144),

			("Icon-76.png",		76),
			("Icon-76@2x.png",	152),

			("Icon-83.5@2x.png",167),
		],
	},
	# {
	# 	"path" : os.path.join(PROJECT_ROOT,"proj.android-studio","res","mipmap-hdpi"),
	# 	"size" : [
	# 		("ic_launcher.png",	72)
	# 	],
	# },
	# {
	# 	"path" : os.path.join(PROJECT_ROOT,"proj.android-studio","res","mipmap-mdpi"),
	# 	"size" : [
	# 		("ic_launcher.png",	48)
	# 	],
	# },
	# {
	# 	"path" : os.path.join(PROJECT_ROOT,"proj.android-studio","res","mipmap-xhdpi"),
	# 	"size" : [
	# 		("ic_launcher.png",	96)
	# 	],
	# },
	# {
	# 	"path" : os.path.join(PROJECT_ROOT,"proj.android-studio","res","mipmap-xxhdpi"),
	# 	"size" : [
	# 		("ic_launcher.png",	144)
	# 	],
	# },
]


def procss():
	for config in project_config:
		target_dir = config["path"]
		size = config["size"]
		for info in size:
			target_file_path = os.path.join(target_dir,info[0])
			wh = info[1]
			print("> size = " + str(wh) + " target = " + target_file_path)
			icon_image.process_file(ICON_PATH,wh,wh,target_file_path)
	pass 


def process_game(game_name):
	icon_path = os.path.join(CUR_PATH,"build-res","icon",game_name + ".png")
	if not os.path.isfile(icon_path):
		print("> icon file not exist path = " + icon_path)
		return False 

	for config in project_config:
		target_dir = config["path"]
		size = config["size"]
		for info in size:
			target_file_path = os.path.join(target_dir,info[0])
			wh = info[1]
			print("> size = " + str(wh) + " target = " + target_file_path)
			icon_image.process_file(icon_path,wh,wh,target_file_path)

if __name__ == "__main__":

	procss()
	pass