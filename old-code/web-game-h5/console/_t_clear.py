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
		p_path  os.path.join(sub_dir,"node_modules","kdweb-core","package.json")
		if not os.path.isfile(p_path):
			continue 
		print("> path = " + p_path)
		buffer = None 
		with open(p_path,"r") as file:
			buffer = file.read()
		buffer = buffer.replace("http://dx.pkgame.com:7990/scm/kdweb/kdweb-core.git","https://")
		with open(p_path,"w") as file:
			file.write(buffer)
		
main()