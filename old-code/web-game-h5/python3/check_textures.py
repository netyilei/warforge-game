# -*- coding: utf-8 -*-
import os
import json
import shutil
from collections import defaultdict



root = "../assets";


# 在一个指定目录查找所有目录名称为"textures"的目录
def find_textures_dirs(dir):
    textures_dirs = []
    for dirpath, dirnames, filenames in os.walk(dir):
        if "textures" in dirnames:
            textures_dirs.append(os.path.join(dirpath, "textures"))
    return textures_dirs


# 在一个目录中查找所有的指定扩展名的文件
def find_files(directory, extensions):
    meta_files = []
    for root, dirs, files in os.walk(directory):
        for file in files:
            if any(file.endswith(ext) for ext in extensions):
                meta_files.append(os.path.join(root, file))
    return meta_files

# 获取 bundle
def get_parent_directory_until_not_bundle(file_path):
    current_dir = os.path.dirname(file_path)  # 获取文件所在目录
    arr = current_dir.split("/")
    name = "unknown"
    for item in reversed(arr):
        if item == "bundle" or item == "bundles":
            a = 1
        else:
            if name == "unknown":
                name = item

    print(file_path,name)
    return name

def get_json(file_path):
    try:
        with open(file_path, 'r') as file:
            content = file.read()
            json_data = json.loads(content)
            return json_data
    except (IOError, ValueError) as e:
        return False

textures_dirs = find_textures_dirs(root)
textures_meta_files = []
for textures_dir in textures_dirs:
    textures_meta_files += find_files(textures_dir, ['.meta'])

# textures_meta_files 是所有meta文件路径列表

prefabs = find_files(root, ['.prefab', '.fire'])
# prefabs 是所有预支资源和场景的文件列表

bundles = []

datas = []




class Data:
    def __init__(self, bundle):
        self.bundle = bundle
        self.prefabs = []
        self.textures = []

    def add_prefab(self,prefab):
        if prefab not in self.prefabs:
            self.prefabs.append(prefab)

    def add_texture(self,texture):
        if texture not in self.textures:
            self.textures.append(texture)

    def get_bundle(self):
        return self.bundle

    def get_prefabs(self):
        return self.prefabs

    def get_texturs(self):
        return self.textures


for prefab in prefabs:
    bundle = get_parent_directory_until_not_bundle(prefab)
    # 判断列表中是否包含 "bundle"
    if bundle not in bundles:
        bundles.append(bundle)
        data = Data(bundle)
        datas.append(data)
    data.add_prefab(prefab)

def get_filename_by_path(file_path):
    file_name, _ = os.path.splitext(os.path.basename(file_path))
    return file_name

data_list = []

for data in datas:
    for textures_meta_file in textures_meta_files:
        json1 = get_json(textures_meta_file)
        subMetas = json1['subMetas']
        name =get_filename_by_path(textures_meta_file.replace('.meta',''))
        if subMetas == {}:
            pass;
        else:
            if name in subMetas:
                assets_data = subMetas[name]


                if assets_data:
                    uuid2 = assets_data['uuid']
                    prefabs = data.get_prefabs()
                    for prefab in prefabs:
                        json_data = get_json(prefab)
                        json_content = json.dumps(json_data)
                        if uuid2 in json_content:
                            data.add_texture(textures_meta_file)







    bundle = data.get_bundle()
    prefabs = data.get_prefabs()
    texturs = data.get_texturs()
    resources = {
        "bundle": bundle,
        "prefabs": prefabs,
        "textures": texturs
    }
    data_list.append(resources)



def move_file(file,target):

    return ""



# 创建一个字典来记录每个 .meta 文件在哪些 bundle 中使用
meta_usage = defaultdict(list)

# 遍历每个 bundle 并记录 .meta 文件的使用情况
for item in data_list:
    bundle = item["bundle"]
    for texture in item["textures"]:
        if texture.endswith(".meta"):
            meta_usage[texture].append(bundle)

# 找出重复使用的 .meta 文件
duplicates = {meta: bundles for meta, bundles in meta_usage.items() if len(bundles) > 1}
non_duplicates = {meta: bundles for meta, bundles in meta_usage.items() if len(bundles) == 1}


# 定义目标目录
public_dir = "../assets/textures/public"

# 创建公共目录（如果不存在）
os.makedirs(public_dir, exist_ok=True)

# 移动重复使用的 .meta 文件及其对应的文件到公共目录
for meta, bundles in duplicates.items():
    src_meta = meta
    src_file = os.path.splitext(src_meta)[0]
    dst_meta = os.path.join(public_dir, os.path.basename(src_meta))
    dst_file = os.path.join(public_dir, os.path.basename(src_file))

    if os.path.exists(src_meta):
        shutil.move(src_meta, dst_meta)
        print(f"Moved {src_meta} to {dst_meta}")
    if os.path.exists(src_file):
        shutil.move(src_file, dst_file)
        print(f"Moved {src_file} to {dst_file}")

# 移动不重复使用的 .meta 文件及其对应的文件到指定目录
for meta, bundles in non_duplicates.items():
    bundle_name = bundles[0]
    src_meta = meta
    src_file = os.path.splitext(src_meta)[0]

    # 获取 textures 目录的父目录
    textures_dir = os.path.dirname(src_meta).rsplit('/textures/', 1)[0]
    # 获取上级目录
    parent_dir = os.path.dirname(src_meta)
    # 获取上级目录的最后一个部分（即目录名）
    parent_dir_name = os.path.basename(parent_dir)
    if parent_dir_name == bundle_name:
        print("skip")
        continue


    print(textures_dir,bundle_name)
    if textures_dir.endswith("textures"):
        if bundle_name == "bundles":
            target_dir =textures_dir
        else:
            target_dir = os.path.join(textures_dir,  bundle_name)
    else:
        target_dir = os.path.join(textures_dir,  "textures")


    os.makedirs(target_dir, exist_ok=True)
    dst_meta = os.path.join(target_dir, os.path.basename(src_meta))
    dst_file = os.path.join(target_dir, os.path.basename(src_file))

    if os.path.exists(src_meta):
        shutil.move(src_meta, dst_meta)
        print(f"Moved {src_meta} to {dst_meta}")
    if os.path.exists(src_file):
        shutil.move(src_file, dst_file)
        print(f"Moved {src_file} to {dst_file}")


def remove_empty_folders(path):
    # 遍历目录下的所有文件和文件夹
    for root, dirs, files in os.walk(path, topdown=False):  # 使用 topdown=False 确保从下往上删除
        for dir_name in dirs:
            dir_path = os.path.join(root, dir_name)
            # 如果是空文件夹，则删除
            if not os.listdir(dir_path):  # os.listdir() 返回指定路径下的文件和文件夹列表
                os.rmdir(dir_path)  # 删除空文件夹
                print(f"已删除空文件夹: {dir_path}")

# 调用函数并传入需要清理的目录路径
remove_empty_folders(root)