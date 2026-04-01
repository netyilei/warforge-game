# -*- coding: utf-8 -*-
import os
import json
import platform
import subprocess
import sys
import tkinter as tk
from tkinter import messagebox
from tkinter import simpledialog




def checkSystemType():
    platform_info = platform.platform()
    print(f"system:{platform_info}")
    if platform.system() != 'Darwin':
        response = messagebox.askquestion("确认", "当前系统不是 [macOS],运行脚本可能导致未知问题,是否继续运行?")
        if response == 'yes':
            '''
            继续运行
            '''
        else:
             sys.exit(1)

def checkGitWorkspace():
    process = subprocess.Popen(['git', 'status'], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    stdout, stderr = process.communicate()
    if "nothing to commit, working tree clean" in stdout:
        '''
        继续运行
        '''
    else:
        messagebox.showerror("错误", "请确保 git 工作区无任务需要提交的内容时使用(方便运行错误可以进行回滚)")
        sys.exit(1)



def find_files(directory, extensions):
    meta_files = [];
    for root, dirs, files in os.walk(directory):
        for file in files:
            if any(file.endswith(ext) for ext in extensions):
                meta_files.append(os.path.join(root, file));
    return meta_files;

def get_json(file_path):
    """
    从指定路径的文件中读取 JSON 数据。

    参数:
    file_path (str): 文件路径。

    返回:
    dict 或 False: 如果成功解析 JSON，则返回字典；如果失败，则返回 False。
    """
    try:
        with open(file_path, 'r') as file:
            content = file.read()
            json_data = json.loads(content)
            return json_data
    except (IOError, ValueError) as e:
        return False

def get_filename_by_path(file_path):
    """
    从文件路径中获取文件名（不包括扩展名）。

    参数:
    file_path (str): 文件路径。

    返回:
    str: 文件名（不包括扩展名）。
    """
    file_name, file_extension = os.path.splitext(os.path.basename(file_path))
    return file_name

def remove_meta_extension(file_path):
    """
    如果文件路径以 '.meta' 结尾，移除该扩展名。

    参数:
    file_path (str): 文件路径。
    """
    try:
        base_path, extension = os.path.splitext(file_path)
        if extension.lower() == '.meta':
            new_file_path = base_path
            os.rename(file_path, new_file_path)
            print("Removed '.meta' extension from {}".format(file_path))
        else:
            print("File {} does not have '.meta' extension.".format(file_path))
    except OSError as e:
        print("Error removing '.meta' extension from {}: {}".format(file_path, e))

def delete_file(file_path):
    """
    删除指定路径的文件。

    参数:
    file_path (str): 文件路径。
    """
    try:
        os.remove(file_path)
        print("File {} deleted successfully.".format(file_path))
    except OSError as e:
        print("Error deleting file {}: {}".format(file_path, e))


def find_textures_dirs(root_dir):
    textures_dirs = []

    # Walk through the directory
    for dirpath, dirnames, filenames in os.walk(root_dir):
        # Check if "textures" is in the directory names
        if "textures" in dirnames:
            # Append the full path of the "textures" directory
            textures_dirs.append(os.path.join(dirpath, "textures"))

    return textures_dirs



'''
开始运行
'''
checkSystemType()
checkGitWorkspace()




# 初始化列表，用于存储 textures 的 meta 文件及其 UUID 信息
textures_meta_uuid_list = [];
root_dir = "../assets";
textures_dirs = find_textures_dirs(root_dir);
textures_meta_files = [];
for textures_dir in textures_dirs:
    textures_meta_files += find_files(textures_dir,['.meta']);

# 遍历每个 meta 文件，提取并存储相关信息
for textures_meta_file in textures_meta_files:
    json_data = get_json(textures_meta_file);
    assets_name = get_filename_by_path(textures_meta_file);
    name = get_filename_by_path(assets_name);
    uuid1 = json_data['uuid'];
    if uuid1:
        data = {
            "path":textures_meta_file,
            "uuid1":uuid1,
            "uuid2":""
        };
        textures_meta_uuid_list.append(data);
    subMetas = json_data['subMetas'];
    if subMetas == {}:
        pass;
    else:

        if name in subMetas:
            assets_data = subMetas[name];
            if assets_data:
                uuid2 = assets_data['uuid'];
                if uuid2:
                    data['uuid2'] = uuid2;
                    textures_meta_uuid_list.append(data);
        else:
            print(f"在 subMetas 中未找到键 '{name}'。")
            # 适当处理缺少的键


# 搜索 resources 目录下的所有特定扩展名的文件
resources_dir = '../assets';
resources_files = find_files(resources_dir,['.prefab','.scene','.fire']);
for resources_file in resources_files:
    json_data = get_json(resources_file);
    json_content = json.dumps(json_data);
    for textures_meta_uuid_obj in textures_meta_uuid_list:
        if textures_meta_uuid_obj['uuid2'] in json_content:
            textures_meta_uuid_obj["uuid2"] = "find";
            pass;
# 列出没有匹配的 meta 文件的 UUID 信息，准备删除
no_find_list = [];
for textures_meta_uuid_obj in textures_meta_uuid_list:
    if textures_meta_uuid_obj['uuid2'] == "find":
        pass;
    else:
        no_find_list.append(textures_meta_uuid_obj);
# 打印未使用的文件数量
response = messagebox.askquestion("确认", f"发现[{str(len(no_find_list))}]个没有使用的图片(包括.meta)文件/n是否删除这些文件?")
if response == 'yes':
    for no_find in no_find_list:
        delete_file(no_find['path'])
        file  = no_find['path'].replace(".meta", "")
        delete_file(file)
else:
    print("用户拒绝执行删除")
    sys.exit(1)
