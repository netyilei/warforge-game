# -*- coding: utf-8 -*-
import os
import re
import platform
import sys

def check_platform():
    if platform.system() != 'Darwin':
        print("此脚本仅适用于 macOS 系统。退出。")
        sys.exit(1)

def process_ts_file(file_path):
    with open(file_path, 'r') as file:
        content = file.read()

    file_dir = os.path.dirname(file_path)
    dir_name = os.path.basename(file_dir)

    # 如果 dir_name 等于 "scripts"，则使用上级目录的名称
    if dir_name == "scripts":
        dir_name = os.path.basename(os.path.dirname(file_dir))

    file_name = os.path.splitext(os.path.basename(file_path))[0]

    # 使用 re.escape 来转义特殊字符
    menu_pattern = re.escape('@menu(\'{}\')'.format(os.path.join(dir_name, file_name)))
    if re.search(menu_pattern, content):
        print('Skipped (Already contains @menu): {}'.format(file_path))
        return

    # 检查并添加 menu
    if re.search(r'const\s*{\s*ccclass,\s*property,\s*menu\s*}', content) is None and re.search(r'const\s*{\s*ccclass,\s*property\s*}', content):
        updated_content = re.sub(r'const\s*{\s*ccclass,\s*property\s*}', r'const { ccclass, property, menu }', content)

        with open(file_path, 'w') as file:
            file.write(updated_content)
            print('Updated: {}'.format(file_path))

        updated_content = re.sub(r'(@ccclass[^\n]*\n)', r'\1@menu("{}")\n'.format(os.path.join(dir_name, file_name)), updated_content)

        with open(file_path, 'w') as file:
            file.write(updated_content)
            print('Updated: {}'.format(file_path))

def process_directory(directory):
    for root, dirs, files in os.walk(directory):
        # 排除 'node_modules' 和 'core' 目录
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        if 'core' in dirs:
            dirs.remove('core')

        for filename in files:
            # 跳过 'creator.d.ts' 文件
            if filename == 'creator.d.ts':
                print('Skipped (Ignoring file): {}'.format(os.path.join(root, filename)))
                continue

            if filename.endswith('.ts'):
                file_path = os.path.join(root, filename)
                process_ts_file(file_path)

check_platform()  # 在执行其他代码之前检查平台

# 获取当前工作目录
current_directory = os.getcwd()

# 获取上一级目录
parent_directory = os.path.dirname(current_directory)

process_directory(parent_directory)
