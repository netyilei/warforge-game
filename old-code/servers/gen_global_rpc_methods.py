

import sys 
import os 
import shutil


CUR_PATH = os.path.realpath(os.path.dirname(__file__))
target_path = os.path.join(CUR_PATH,"pp-base-define","GlobalMethods.ts")

ignore_files = [

]

ts_keyword = [
	"delete"
]
def process_ns(dirpath,nsName,curLine,lines,output,comments):
	idx1 = str(curLine).find(",")
	idx2 = str(curLine).find(")",idx1+1)
	rpcName = curLine[idx1+1:idx2]
	content = rpcName
	for line in lines:
		if content in line:
			print("> find content = " + content)
			startIdx = line.find("\"")
			if startIdx >= 0:
				endIdx = line.find("\"",startIdx+1)
				filename = line[startIdx+1:endIdx]
				rpc_filepath = os.path.join(dirpath,filename + ".ts")
				rpc_lines = None 
				with open(rpc_filepath,"r") as file:
					rpc_lines = file.readlines()
				
				start = False
				for rpc_line in rpc_lines:
					if not start:
						if  " " + rpcName + " " in rpc_line:
							start = True 
						continue 
					if "}" in rpc_line:
						break 
					rpc_line = rpc_line.replace("\t","")
					rpc_line = rpc_line.replace("\n","")
					rpc_line = rpc_line.replace("\r","")
					rpc_line = rpc_line.replace(" ","")
					method_name = ""
					real_func_name = ""
					if ":" in rpc_line:
						method_name = rpc_line[0:rpc_line.find(":")]
						if "," in rpc_line:
							real_func_name = rpc_line[rpc_line.find(":")+1:rpc_line.find(",")].strip()
						else:
							real_func_name = rpc_line[rpc_line.find(":")+1:].strip()
					elif "," in rpc_line:
						method_name = rpc_line[0:rpc_line.find(",")]
						real_func_name = method_name
					else:
						method_name = rpc_line.strip()
						real_func_name = method_name
					method_name = method_name.strip()
					if len(method_name) > 0 and not method_name.startswith("//"):
						output.append(nsName + "." + method_name)

						func_def = "async function " + real_func_name + "("
						for comment_line in rpc_lines:
							if func_def in comment_line:
								comment = comment_line.replace("\r","").replace("\n","").strip()
								lidx = comment.find("(")
								ridx = comment.find(")",lidx+1)
								comment = comment[lidx+1:ridx]

								starths = [
									"h:string,",
									"h:string"
								]
								for s in starths:
									if comment.startswith(s):
										comment = comment[comment.find(s) + len(s):]
										break 
								if len(comment) == 0:
									comment = "no params"
								comments[nsName + "." + method_name] = comment
								break 
			return
	print("> not find content = " + content)
	pass

def process_content(t,tabCount,comments):
	content = ""
	tabContent = ("\t" * tabCount)
	for key,value in dict(t).items():
		if key.find("-") >= 0:
			continue 
		if isinstance(value,dict):
			content = content + tabContent + "export namespace " + key + " {\n"
			content = content + process_content(value,tabCount+1,comments)
			content = content + tabContent + "}\n"
		else:
			if key in ts_keyword:
				key = key + "_"
			if value in comments:
				content = content + tabContent + "/**\n" + tabContent + " * " + comments[value] + "\n" + tabContent + " */\n"
			content = content + tabContent + "export const " + key + " = \"" + value + "\"\n"
	return content 
def main():
	output = []
	comments = {}
	for dirpath, dirnames, filenames in os.walk(CUR_PATH):  
		for filename in filenames:  
			if filename in ignore_files:
				continue 
			if not filename.endswith(".ts"):
				continue 
			if dirpath.find("node_modules") >= 0:
				continue
			srcfile = os.path.join(dirpath,filename)
			lines = None 
			# print(srcfile)
			with open(srcfile,"r") as file:
				lines = file.readlines()
			for line in lines:
				if "center.methodGroup.addGroup" in line and not line.strip().startswith("//"):
					startIdx = line.find("\"")
					if startIdx >= 0:
						endIdx = line.find("\"",startIdx+1)
						nsName = line[startIdx+1:endIdx]
						print("> " + srcfile + ":" + nsName)
						process_ns(dirpath,nsName,line,lines,output,comments)
	

	t = {}
	for method in output:
		arr = str(method).split(".")
		cur_t = t 
		# print("> method = " + method)
		for i in range(0,len(arr)):
			ele = arr[i]
			if i == len(arr) - 1:
				# print("",cur_t,ele,method)
				cur_t[ele] = method
				continue 
			if ele not in cur_t:
				cur_t[ele] = {}
			cur_t = cur_t[ele]

	content = process_content(t,0,comments)
	with open(target_path,"w") as file:
		file.write(content)
	pass 


if __name__ == "__main__":
	main()
