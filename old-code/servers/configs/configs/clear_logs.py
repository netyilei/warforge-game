
import os 
import sys 
import shutil
import time

today_log_suffix = time.strftime("%m-%d") + ".log"

CUR_PATH = os.path.realpath(os.path.dirname(__file__))

def processSubDir(dir):
	for d in os.listdir(dir):
		log_path = os.path.join(dir,d)
		if os.path.isfile(log_path):
			ignore = log_path.endswith(today_log_suffix)
			print("> log file = " + log_path + " | ignore = " + str(ignore))
			os.remove(log_path)

			#if not ignore:
			#	os.remove(log_path)
			#	pass 


def processLogDir(dir):
	for d in os.listdir(dir):
		sub_dir = os.path.join(dir,d)
		if d == "pm2":
			print("> ignore pm2 log dir = " + sub_dir)
			continue 
		if os.path.isdir(sub_dir):
			print("> sub_dir = " + sub_dir)
			processSubDir(sub_dir)


print(today_log_suffix)
for d in os.listdir(CUR_PATH):
	project_dir = os.path.join(CUR_PATH,d)
	if os.path.isdir(project_dir):
		for sub in os.listdir(project_dir):
			if "logs" in sub:
				log_dir = os.path.join(project_dir,sub)
				if os.path.isdir(log_dir):
					print("> remove dir name = " + log_dir)
					processLogDir(log_dir)