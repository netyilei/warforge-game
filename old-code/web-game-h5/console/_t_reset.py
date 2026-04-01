# -*- coding: utf-8 -*-

import os
import sys 
import shutil
import io 
import game_config

CUR_PATH = os.path.realpath(os.path.dirname(__file__))

def main():
	for d in os.listdir(CUR_PATH):
		sub_dir = os.path.join(CUR_PATH,d)
		if not os.path.isdir(d):
			continue 
		old_wdir = os.curdir
		os.chdir(sub_dir)
		p_path = os.path.join(".","node_modules","kdweb-core","package.json")
		os.system("git checkout " + p_path)
		os.chdir(old_wdir)
		
main()