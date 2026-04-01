from ast import Num
from genericpath import isfile
import json
import os
import sys 
import shutil
from copy import deepcopy

template_root = '''
module.exports = {
	apps : [
		$contents
	],
};
'''

template_item = '''
		{
			name: '$process_name',
			script: '../../build/$dir_name/start.js',
		
			// Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
			args: '$local_config $logname',
			instances: 1,
			exec_mode: '$exec_mode',
			autorestart: true,
			watch: false,
			max_memory_restart: '1G',
			
			log_date_format: "YYYY-MM-DD HH:mm",
			error_file:"logs-$logname/pm2/app_error.txt",
			out_file:"logs-$logname/pm2/app_out.txt",

			env:{
				sname:"$sname",
			},
		},
'''

nginx_http = '''

		location ^~ /$path/ {
			proxy_set_header X-Forwarded-For $remote_addr;
			proxy_set_header Host $http_host;
			proxy_pass http://127.0.0.1:$port/;
		}
'''
nginx_ws = '''
	  	location ^~ /$path {
			proxy_pass http://127.0.0.1:$port;
		   
			proxy_http_version 1.1;
			proxy_set_header Host $host;
			proxy_set_header X-Real-IP $remote_addr;
			proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
			proxy_read_timeout 120s;

			proxy_set_header Upgrade $http_upgrade;
			proxy_set_header Connection $connection_upgrade;
		}
'''

game_local_template = '''
{
    "name" : "$name", 
    "tag" : "$name", 
    "centerHost" : "$centerHost", 
    "centerPort" : $centerPort, 
    "company" : false, 
    "gameID" : $gameID, 
    "gsVersion" : "1.0", 
    "host" : "$host", 
    "peek" : [
    ], 
    "port" : $port, 
    "rpcNames" : [
$rpcNames
    ], 
    "srsNodeHost" : "$srsNodeHost", 
    "srsNodeName" : "$srsNodeName"
}
'''

CUR_PATH = os.path.realpath(os.path.dirname(__file__))
profiles = {}
server_ports = {}
use_ports = []
nginx_contents = ""
def parseTSValue(value,profile,idx=None):
	if isinstance(value,dict):
		new_value = {}
		for key in value.keys():
			key = str(key)
			v = value[key]
			if key.startswith("def-"):
				prefix = key.replace("def-","")
				v = parseTSValue(v,profile,idx)
				new_value[prefix + "Port"] = v
				new_value[prefix + "Host"] = "http://" + profile["local-ip"] + ":" + str(v)
			elif key.startswith("wdef-"):
				prefix = key.replace("wdef-","")
				v = parseTSValue(v,profile,idx)
				new_value[prefix + "Port"] = v
				new_value[prefix + "Host"] = "ws://" + profile["local-ip"] + ":" + str(v)
			else:
				v = parseTSValue(v,profile,idx)
				new_value[key] = v 
		return new_value
	elif isinstance(value,int):
		use_ports.append(value)
		return value 
	else:
		value = str(value)
		if value.find("{0}") >= 0:
			s = str(idx)
			needLen = 5 - (len(value) - 3) - len(s)
			if needLen > 0:
				s = "0" * needLen + s
			value = value.format(s)
			try:
				value = int(value)
				use_ports.append(value)
				return value 
			except ValueError:
				pass
		value = value.replace("$local-ip",profile["local-ip"])
		value = value.replace("$remote-ip",profile["remote-ip"])
		return value 

	
def parseTSConfig(t,idx=None):
	output = deepcopy(t)
	server = t["server"]
	profile = profiles[server]
	ret = parseTSValue(output,profile,idx)
	if "other" in ret:
		parseNginx(profile,ret["other"])
	return ret 

def parseNginx(profile,other):
	global nginx_contents
	remote_ip = profile["remote-ip"]
	other = dict(other)
	for key in other.keys():
		value = str(other[key])

		if value.find(remote_ip) >= 0:
			port = other[key.replace("Host","Port")]
			arr = value.split("/")
			path = arr[len(arr)-1]
			contents = ""
			if value.startswith("ws"):
				contents = nginx_ws
			else:
				contents = nginx_http
			contents = contents.replace("$path",path)
			contents = contents.replace("$port",str(port))
			nginx_contents = nginx_contents + contents

def main():
	buffer = None 
	config_filename = "./gen_pm2_config.json"
	if len(sys.argv) >= 3:
		config_filename = sys.argv[2]
	with open(config_filename,"r",encoding="utf-8") as file:
		buffer = file.read()
	info = json.loads(buffer)
	global profiles

	env = sys.argv[1]
	print("< gen env = " + env)

	servers = info[env]["servers"]
	profiles = info[env]["profiles"]
	if "appends" in info[env]:
		appends = info[env]["appends"]
		for key in appends:
			print("< append file " + key)
			ex_file = "./" + key
			ex_buffer = None
			with open(ex_file,"r") as file:
				ex_buffer = file.read()
			ex_info = json.loads(ex_buffer)
			ex_servers = ex_info[env]["servers"]
			for ex_server in ex_servers:
				servers.append(ex_server)

	config_dir = os.path.join(CUR_PATH,env)
	for d in os.listdir(config_dir):
		if not d.startswith("pm2."):
			continue 
		p = os.path.join(config_dir,d)
		if os.path.isfile(p):
			os.remove(p)
	tsconfigs = []
	pm2_tsconfigs = []
	game_servers = []
	ex_list_map = {}
	for t in servers:
		t = dict(t)
		print("> server dir = " + t["dir"])
		if "game" in t:
			game_servers.append(t)
			continue
		use_configs = [] 
		ignore = False 
		if "ignore" in t:
			ignore = t["ignore"]
		src_dir = t["dir"]
		ex_list = None 
		if "ex_list" in t:
			ex_list = t["ex_list"]
		if "processes" not in t or len(t["processes"]) == 0:
			process = t["ts-config"]
			local_config = None 
			if "config" in t:
				local_config = t["config"]
			use_configs.append({
				"name":t["dir"],
				"config":local_config,
				"server":t["ts-config"]["server"],
				"tsconfig":parseTSConfig(t["ts-config"]),
				"ex_list":ex_list,
			})
		else: 
			processes = t["processes"]
			process_count = 0
			if "process_count" in t:
				process_count = t["process_count"]
			for process in processes:
				tag = str(process["name"])
				local_config = None 
				if "config" in process:
					local_config = process["config"]
				if tag.find("{0}") >= 0:
					idx = 1
					while(True):
						new_name = tag.format(idx)
						new_local_config = None
						if local_config != None:
							new_local_config = local_config.format(idx)
						if new_local_config != None and os.path.isfile(os.path.join(config_dir,new_local_config)):
							use_configs.append({
								"name":new_name,
								"config":new_local_config,
								"server":process["ts-config"]["server"],
								"tsconfig":parseTSConfig(process["ts-config"],idx),
								"ex_list":ex_list,
							})
						elif process_count > 0 and idx <= process_count:
							use_configs.append({
								"name":new_name,
								"config":None,
								"server":process["ts-config"]["server"],
								"tsconfig":parseTSConfig(process["ts-config"],idx),
								"ex_list":ex_list,
							})
						else:
							break 
						idx = idx + 1
				else:
					use_configs.append({
						"name":tag,
						"config":local_config,
						"server":process["ts-config"]["server"],
						"tsconfig":parseTSConfig(process["ts-config"]),
						"ex_list":ex_list,
					})

		print(json.dumps(use_configs,indent = 4))
		pm2_name = src_dir.replace("pp-","")
		pm2_server_tsconfigs = {}
		txt_contents = {}
		if "rename" in t:
			pm2_name = t["rename"]
		for config in use_configs:
			config = dict(config)
			
			tag = config["name"]
			local_config = config["config"]
			tsconfig = config["tsconfig"]

			server = config["server"]
			if server not in pm2_server_tsconfigs:
				pm2_server_tsconfigs[server] = []
				txt_contents[server] = ""

			print("> .. name = " + tag + " | config = " + str(local_config))
			contents = template_item
			contents = contents.replace("$process_name",tag.replace("pp-","pp-"))
			contents = contents.replace("$dir_name",src_dir)
			if local_config == None:
				contents = contents.replace("$local_config","noconfig")
			else:
				contents = contents.replace("$local_config",local_config)
			contents = contents.replace("$logname",tag.replace("pp-",""))
			contents = contents.replace("$sname",tag)
			if "chat-service" in tag:
				contents = contents.replace("$exec_mode","fork")
			else:
				contents = contents.replace("$exec_mode","cluster")

			txt_contents[server] += contents
			tsconfig["name"] = tag
			tsconfigs.append(tsconfig)

			pm2_server_tsconfigs[server].append(deepcopy(tsconfig))

		config_count = len(pm2_server_tsconfigs.keys())
		if config_count == 1:
			txt_root = template_root
			key = list(pm2_server_tsconfigs.keys())[0]
			output_content = txt_root.replace("$contents",txt_contents[key])
			pm2_filename = "pm2." + pm2_name + ".config.js"
			if not ignore:
				with open(os.path.join(config_dir,pm2_filename),"w") as file:
					file.write(output_content)

			configs = pm2_server_tsconfigs[key]
			for tsconfig in configs:
				tsconfig["pm2"] = pm2_filename
				pm2_tsconfigs.append(tsconfig)
		else:
			for key in pm2_server_tsconfigs.keys():
				txt_root = template_root
				output_content = txt_root.replace("$contents",txt_contents[key])
				pm2_filename = "pm2." + key + "." + pm2_name + ".config.js"
				if not ignore:
					with open(os.path.join(config_dir,pm2_filename),"w") as file:
						file.write(output_content)

				configs = pm2_server_tsconfigs[key]
				for tsconfig in configs:
					tsconfig["pm2"] = pm2_filename
					pm2_tsconfigs.append(tsconfig)
				

	for key in ex_list_map.keys():
		with open(os.path.join(config_dir,"server_ex_list_" + key + ".json"),"w") as file:
			file.write(json.dumps(ex_list_map[key],indent=4))

	with open(os.path.join(config_dir,"server_list.json"),"w") as file:
		file.write(json.dumps(tsconfigs,indent=4))
	with open(os.path.join(config_dir,"server_list_sh.json"),"w") as file:
		file.write(json.dumps(pm2_tsconfigs,indent=4))
	with open(os.path.join(config_dir,"nginx_ext.txt"),"w") as file:
		file.write(nginx_contents)
	use_ports.sort()
	print(use_ports)
	new_ports = []
	for port in use_ports:
		if port in new_ports:
			print(">repeat port = " + str(port))
		else:
			new_ports.append(port)
	pass 

main()
