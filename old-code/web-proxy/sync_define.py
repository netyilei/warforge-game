#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os
import shutil

def copy_files(src_dir, dst_dir, exclude_files=None):
    """
    将源目录中的所有文件（包括子目录）复制到目标目录

    :param src_dir: 源目录路径
    :param dst_dir: 目标目录路径
    :param exclude_files: 要排除的文件名列表（仅文件名，不包括路径）
    """
    if exclude_files is None:
        exclude_files = []
    
    # 检查源目录是否存在
    if not os.path.isdir(src_dir):
        print(f"错误：源目录 '{src_dir}' 不存在或不是一个目录")
        return

    # 创建目标目录（如果不存在）
    os.makedirs(dst_dir, exist_ok=True)

    # 遍历源目录中的所有内容
    for item in os.listdir(src_dir):
        src_item = os.path.join(src_dir, item)
        dst_item = os.path.join(dst_dir, item)

        try:
            # 如果是文件，检查是否在排除列表中
            if os.path.isfile(src_item):
                # 检查文件名是否在排除列表中
                if item in exclude_files:
                    print(f"跳过文件: {src_item} (在排除列表中)")
                    continue
                
                # 如果目标文件已存在，先删除
                if os.path.exists(dst_item):
                    os.remove(dst_item)
                shutil.copy2(src_item, dst_item)
                print(f"复制文件: {src_item} -> {dst_item}")

            # 如果是目录，递归复制
            elif os.path.isdir(src_item):
                # 确保目标子目录存在
                os.makedirs(dst_item, exist_ok=True)
                # 递归处理子目录，传递排除列表
                copy_files(src_item, dst_item, exclude_files)

        except Exception as e:
            print(f"处理 {src_item} 时出错: {str(e)}")

    print(f"\n所有文件已复制到 {dst_dir}")

if __name__ == "__main__":
    # 源目录和目标目录路径（可根据需要修改）
    source_directory = "../cpp-servers/pp-base-define"
    target_directory = "./pp-base-define"

    # 要排除的文件列表
    exclude_files = [
        "ServerConfig.ts",
        "LocalConfig.ts",
        "DM_UserDefine.ts",
        "DM_Task.ts",
        "DM_Product.ts",
        "DM_MapRealtime.ts",
        "DM_Config.ts",
        "CSVDefine.ts",
        "CardDefine.ts",
    ]

    # 执行复制操作
    copy_files(source_directory, target_directory, exclude_files)
