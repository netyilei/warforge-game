

import os 
import sys 
import shutil
import io
import game_config
CUR_PATH = os.path.realpath(os.path.dirname(__file__))
ASSETS_PATH = os.path.join(CUR_PATH,"..","build","jsb-link","assets")

SYS_BUNDLES = [
	"main",
	"resources",
	"internal"
]

def process(game_name):
	config = game_config.loadGameConfig(game_name)
	for d in os.listdir(ASSETS_PATH):
		if d in SYS_BUNDLES or d in config._bundles:
			continue
		shutil.rmtree(os.path.join(ASSETS_PATH,d))