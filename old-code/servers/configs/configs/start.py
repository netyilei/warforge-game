import os 
import sys 
import json 
CUR_PATH = os.path.realpath(os.path.dirname(__file__))

tag = ""
server = None
with open(os.path.join(CUR_PATH,"env.json"),"r") as file:
	t = json.loads(file.read())
	tag = t["tag"]
	if "server" in t:
		server = t["server"]

server_list = []
rpc_names = [
	"pm2.rpc-center.config.js"
]
def main():
	cmd = None
	if len(sys.argv) > 1:
		cmd = sys.argv[1]
	w_dir = os.path.join(CUR_PATH,tag)
	with open(os.path.join(w_dir,"server_list_sh.json"),"r") as file:
		server_list = json.loads(file.read())

	os.chdir(w_dir)
	pm2_files = []
	for config in server_list:
		if server == None or config["server"] == server:
			pm2_file = str(config["pm2"])
			if cmd != "all":
				if cmd == "rpc":
					if pm2_file not in rpc_names:
						continue 
				elif cmd == "game":
					if not pm2_file.startswith("pm2.game-"):
						continue
				else:
					if pm2_file in rpc_names:
						continue 
			if pm2_file not in pm2_files:
				pm2_files.append(pm2_file)
	for file in pm2_files:
		os.system("pm2 restart " + file)
	pass 
main()
