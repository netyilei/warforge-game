# -*- coding: utf-8 -*-
"""
国际化文本提取脚本
扫描服务端和客户端工程中的所有中文文本，并生成CSV翻译对照表
Python 3 版本
"""

import os
import re
import json
import sys
import hashlib
import random
import time
from urllib import request, parse
from urllib.error import URLError
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading

# ==============================
# 配置区域
# ==============================

# 服务端工程路径
SERVER_PROJECT_PATH = r"E:\UNSpace\cpp-servers"

# 客户端工程路径
CLIENT_PROJECT_PATH = r"E:\UNSpace\ccc-cpp-game"

# 客户端assets路径
CLIENT_ASSETS_PATH = os.path.join(CLIENT_PROJECT_PATH, "assets")

# 输出CSV文件路径
OUTPUT_CSV_PATH = os.path.join(CLIENT_PROJECT_PATH, "assets", "i18n_texts.csv")

# ==============================
# 百度翻译API配置
# ==============================
# 获取方法: https://fanyi-api.baidu.com/manage/developer
# 注册后在"开发者信息"页面可以看到APPID和密钥

BAIDU_APPID = "20260206002553497"  # 请填写你的百度翻译APPID
BAIDU_SECRET_KEY = "gFIDtVJvz0PYlFwLCUjk"  # 百度翻译密钥
BAIDU_API_URL = "https://fanyi-api.baidu.com/api/trans/vip/translate"

# 是否启用自动翻译
# True: 使用百度翻译API自动翻译
# False: 使用占位符[TO_TRANSLATE]
ENABLE_AUTO_TRANSLATE = True if BAIDU_APPID else False

# 翻译线程池大小（注意：百度翻译API有QPS限制，免费版通常为1-10 QPS）
MAX_WORKERS = 5  # 改为1，避免触发频率限制。如果是高级版可以适当增加

# 请求间隔时间（秒）- 用于控制请求频率
REQUEST_INTERVAL = 0.2  # 每次请求间隔0.5秒，确保不超过QPS限制

# 重试配置
MAX_RETRIES = 3  # 失败后最多重试次数
RETRY_DELAY = 2  # 重试延迟（秒）

# 中文字符匹配正则
CHINESE_PATTERN = re.compile(r'[\u4e00-\u9fff]+')

# ==============================
# 工具函数
# ==============================

def has_chinese(text):
    """检查文本是否包含中文字符"""
    return bool(CHINESE_PATTERN.search(text))

def extract_chinese_segments(text):
    """从文本中提取所有中文片段（独立的中文部分）"""
    # 对于模板字符串，只提取纯中文部分，不包括变量和标点周围的内容
    segments = []
    for match in CHINESE_PATTERN.finditer(text):
        segment = match.group()
        # 去除首尾空白
        segment = segment.strip()
        if segment:
            segments.append(segment)
    return segments

def is_excluded_path(path):
    """检查路径是否应该被排除"""
    exclude_dirs = ['node_modules', 'build', 'library', 'temp', 'local', 'packages']
    for exclude_dir in exclude_dirs:
        if exclude_dir in path.split(os.sep):
            return True
    return False

# ==============================
# 扫描服务端errJson
# ==============================

def scan_server_err_json():
    """
    扫描服务端所有TS文件中的errJson调用
    匹配模式: errJson(数字, "错误信息")
    """
    print("[1/4] 正在扫描服务端errJson...")
    
    err_texts = set()
    
    # errJson匹配正则
    # 匹配 errJson(1, "错误信息") 或 errJson(1,"错误信息")
    err_json_pattern = re.compile(r'errJson\s*\(\s*\d+\s*,\s*["\']([^"\']+)["\']\s*\)')
    
    scanned_files = 0
    found_count = 0
    
    for root, dirs, files in os.walk(SERVER_PROJECT_PATH):
        # 排除不需要扫描的目录
        if is_excluded_path(root):
            continue
            
        for file in files:
            if not file.endswith('.ts'):
                continue
                
            file_path = os.path.join(root, file)
            scanned_files += 1
            
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    
                # 查找所有errJson调用
                matches = err_json_pattern.findall(content)
                for match in matches:
                    if has_chinese(match):
                        err_texts.add(match.strip())
                        found_count += 1
                        
            except Exception as e:
                print(f"  [警告] 读取文件失败: {file_path} ({str(e)})")
    
    print(f"  扫描了 {scanned_files} 个TS文件，找到 {found_count} 条包含中文的errJson")
    print(f"  去重后共 {len(err_texts)} 条唯一文本")
    
    return err_texts

# ==============================
# 扫描客户端prefab
# ==============================

def scan_client_prefabs():
    """
    扫描客户端assets下所有prefab文件
    提取 _string 和 _N$string 字段中的中文
    """
    print("[2/4] 正在扫描客户端prefab文件...")
    
    prefab_texts = set()
    
    scanned_files = 0
    found_count = 0
    
    for root, dirs, files in os.walk(CLIENT_ASSETS_PATH):
        for file in files:
            if not file.endswith('.prefab'):
                continue
                
            file_path = os.path.join(root, file)
            scanned_files += 1
            
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    
                try:
                    # 尝试解析JSON
                    data = json.loads(content)
                    
                    # 递归查找所有_string和_N$string字段
                    def find_string_fields(obj):
                        if isinstance(obj, dict):
                            for key, value in obj.items():
                                if key in ['_string', '_N$string']:
                                    if isinstance(value, str) and has_chinese(value):
                                        prefab_texts.add(value.strip())
                                else:
                                    find_string_fields(value)
                        elif isinstance(obj, list):
                            for item in obj:
                                find_string_fields(item)
                    
                    find_string_fields(data)
                    
                except ValueError:
                    # JSON解析失败，使用正则匹配
                    string_pattern = re.compile(r'"(?:_string|_N\$string)"\s*:\s*"([^"]+)"')
                    matches = string_pattern.findall(content)
                    for match in matches:
                        if has_chinese(match):
                            prefab_texts.add(match.strip())
                            found_count += 1
                            
            except Exception as e:
                print(f"  [警告] 读取文件失败: {file_path} ({str(e)})")
    
    print(f"  扫描了 {scanned_files} 个prefab文件")
    print(f"  去重后共 {len(prefab_texts)} 条唯一文本")
    
    return prefab_texts

# ==============================
# 扫描客户端TS脚本
# ==============================

def scan_client_ts_scripts():
    """
    扫描客户端assets下所有TS脚本
    提取双引号字符串中的中文
    """
    print("[3/4] 正在扫描客户端TS脚本...")
    
    ts_texts = set()
    
    scanned_files = 0
    found_count = 0
    
    # 匹配双引号字符串的正则
    # 支持转义字符
    double_quote_pattern = re.compile(r'"([^"\\]*(?:\\.[^"\\]*)*)"')
    
    # 匹配单引号字符串的正则
    single_quote_pattern = re.compile(r"'([^'\\]*(?:\\.[^'\\]*)*)'")
    
    # 匹配反引号字符串的正则（模板字符串）
    backtick_pattern = re.compile(r'`([^`\\]*(?:\\.[^`\\]*)*)`')
    
    scripts_path = os.path.join(CLIENT_ASSETS_PATH, 'scripts')
    
    for root, dirs, files in os.walk(scripts_path):
        for file in files:
            if not file.endswith('.ts'):
                continue
                
            file_path = os.path.join(root, file)
            scanned_files += 1
            
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                
                # 按行处理，排除包含@property的行
                lines = content.split('\n')
                filtered_lines = []
                for line in lines:
                    if '@property' not in line:
                        filtered_lines.append(line)
                content = '\n'.join(filtered_lines)
                    
                # 移除注释（简单处理）
                # 移除单行注释
                content = re.sub(r'//.*?$', '', content, flags=re.MULTILINE)
                # 移除多行注释
                content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
                    
                # 查找所有双引号字符串
                double_matches = double_quote_pattern.findall(content)
                for match in double_matches:
                    if has_chinese(match):
                        ts_texts.add(match.strip())
                        found_count += 1
                
                # 查找所有单引号字符串
                single_matches = single_quote_pattern.findall(content)
                for match in single_matches:
                    if has_chinese(match):
                        ts_texts.add(match.strip())
                        found_count += 1
                
                # 查找所有反引号字符串（模板字符串）
                # 对于模板字符串，提取其中的中文片段
                backtick_matches = backtick_pattern.findall(content)
                for match in backtick_matches:
                    if has_chinese(match):
                        # 如果包含${}变量，则提取独立的中文片段
                        if '${' in match:
                            segments = extract_chinese_segments(match)
                            for seg in segments:
                                ts_texts.add(seg)
                                found_count += 1
                        else:
                            # 如果不包含变量，则作为整体添加
                            ts_texts.add(match.strip())
                            found_count += 1
                        
            except Exception as e:
                print(f"  [警告] 读取文件失败: {file_path} ({str(e)})")
    
    print(f"  扫描了 {scanned_files} 个TS文件")
    print(f"  去重后共 {len(ts_texts)} 条唯一文本")
    
    return ts_texts

# ==============================
# 百度翻译API
# ==============================

def baidu_translate(text, from_lang='zh', to_lang='en', retry_count=0):
    """
    使用百度翻译API翻译文本（带重试机制）
    
    参数:
        text: 要翻译的文本
        from_lang: 源语言 (zh=简体中文, en=英文, cht=繁体中文)
        to_lang: 目标语言
        retry_count: 当前重试次数
    
    返回:
        翻译后的文本，失败返回None
    """
    if not text or not text.strip():
        return text
    
    # 生成随机数
    salt = random.randint(32768, 65536)
    
    # 生成签名
    # 签名格式: appid+q+salt+密钥 的MD5值
    sign_str = f"{BAIDU_APPID}{text}{salt}{BAIDU_SECRET_KEY}"
    sign = hashlib.md5(sign_str.encode('utf-8')).hexdigest()
    
    # 构建请求参数
    params = {
        'q': text,
        'from': from_lang,
        'to': to_lang,
        'appid': BAIDU_APPID,
        'salt': salt,
        'sign': sign
    }
    
    try:
        # 使用urllib发送GET请求
        url = f"{BAIDU_API_URL}?{parse.urlencode(params)}"
        req = request.Request(url)
        
        with request.urlopen(req, timeout=10) as response:
            result = json.loads(response.read().decode('utf-8'))
        
        # 检查是否翻译成功
        if 'trans_result' in result:
            # 返回第一条翻译结果
            return result['trans_result'][0]['dst']
        else:
            # 翻译失败，检查错误码
            error_code = result.get('error_code', 'unknown')
            error_msg = result.get('error_msg', '未知错误')
            
            # 54003是频率限制错误，可以重试
            if error_code == '54003' and retry_count < MAX_RETRIES:
                time.sleep(RETRY_DELAY)
                return baidu_translate(text, from_lang, to_lang, retry_count + 1)
            else:
                if retry_count == 0:  # 只在第一次失败时打印
                    print(f"    [翻译错误] 错误码: {error_code}, 信息: {error_msg}")
                return None
            
    except URLError as e:
        if retry_count < MAX_RETRIES:
            time.sleep(RETRY_DELAY)
            return baidu_translate(text, from_lang, to_lang, retry_count + 1)
        else:
            print(f"    [网络错误] {str(e)}")
            return None
    except Exception as e:
        print(f"    [翻译异常] {str(e)}")
        return None

def translate_text_to_all_languages(text):
    """
    将文本翻译为英文和繁体中文（带频率控制）
    
    参数:
        text: 简体中文文本
    
    返回:
        dict: {'zh_CN': 简体, 'en_US': 英文, 'zh_TW': 繁体}
    """
    result = {
        'zh_CN': text,
        'en_US': '[TO_TRANSLATE]',
        'zh_TW': '[TO_TRANSLATE]'
    }
    
    if not ENABLE_AUTO_TRANSLATE:
        return result
    
    # 翻译为英文
    en_text = baidu_translate(text, from_lang='zh', to_lang='en')
    if en_text:
        result['en_US'] = en_text
    
    # 控制请求频率
    time.sleep(REQUEST_INTERVAL)
    
    # 翻译为繁体中文
    tw_text = baidu_translate(text, from_lang='zh', to_lang='cht')
    if tw_text:
        result['zh_TW'] = tw_text
    
    # 控制请求频率
    time.sleep(REQUEST_INTERVAL)
    
    return result

# ==============================
# 翻译功能
# ==============================

def translate_texts(texts):
    """
    翻译文本到英文和繁体中文
    使用百度翻译API自动翻译（多线程并发）
    """
    print("[4/4] 正在翻译文本...")
    
    if not ENABLE_AUTO_TRANSLATE:
        print("  自动翻译已禁用，使用占位符")
        translations = []
        for text in texts:
            translations.append({
                'zh_CN': text,
                'en_US': '[TO_TRANSLATE]',
                'zh_TW': '[TO_TRANSLATE]'
            })
        return translations
    
    print(f"  使用百度翻译API")
    print(f"  翻译目标: 简体中文 -> 英文 + 繁体中文")
    print(f"  并发线程: {MAX_WORKERS} 个")
    
    translations = {}
    total = len(texts)
    completed = 0
    lock = threading.Lock()
    
    def translate_with_index(index, text):
        """带索引的翻译函数"""
        result = translate_text_to_all_languages(text)
        
        nonlocal completed
        with lock:
            completed += 1
            if completed % 10 == 0 or completed == total:
                print(f"  进度: {completed}/{total} ({completed*100//total}%)")
        
        return index, result
    
    print(f"  开始翻译 {total} 条文本...")
    
    # 使用线程池并发翻译
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        # 提交所有翻译任务
        futures = {
            executor.submit(translate_with_index, idx, text): idx 
            for idx, text in enumerate(texts)
        }
        
        # 收集结果
        for future in as_completed(futures):
            try:
                index, result = future.result()
                translations[index] = result
            except Exception as e:
                index = futures[future]
                print(f"  [错误] 翻译失败 (索引 {index}): {str(e)}")
                # 失败时使用占位符
                translations[index] = {
                    'zh_CN': texts[index],
                    'en_US': '[TRANSLATION_FAILED]',
                    'zh_TW': '[TRANSLATION_FAILED]'
                }
    
    # 按索引顺序返回结果
    result_list = [translations[i] for i in range(len(texts))]
    
    print(f"\n  完成翻译 {len(result_list)} 条文本")
    
    return result_list

# ==============================
# CSV文件处理
# ==============================

def normalize_text_for_csv(text):
    """
    标准化文本用于CSV
    - 将逗号替换为 |
    - 将换行符替换为 #
    - 去除首尾空白
    """
    text = text.strip()
    # 先替换实际的换行符
    text = text.replace('\n', '#')
    text = text.replace('\r', '')
    # 再替换转义序列形式的\n（某些文本中可能包含字面上的\n）
    text = text.replace('\\n', '#')
    # 最后替换逗号
    text = text.replace(',', '|')
    return text

def load_existing_csv():
    """
    加载已存在的CSV文件
    
    返回:
        dict: {zh_CN文本: {key, zh_CN, en_US, zh_TW}}
        int: 当前最大的key编号
    """
    existing_data = {}
    max_key_number = 0
    
    if not os.path.exists(OUTPUT_CSV_PATH):
        print("  未找到已存在的CSV文件，将创建新文件")
        return existing_data, max_key_number
    
    try:
        with open(OUTPUT_CSV_PATH, 'r', encoding='utf-8-sig') as f:
            lines = f.readlines()
            
        if len(lines) <= 1:
            print("  CSV文件为空，将创建新文件")
            return existing_data, max_key_number
        
        # 跳过标题行
        for line in lines[1:]:
            line = line.strip()
            if not line:
                continue
                
            parts = line.split(',', 3)  # 最多分割3次，得到4个部分
            if len(parts) >= 4:
                key = parts[0].strip()
                zh_cn = parts[1].strip()
                en_us = parts[2].strip()
                zh_tw = parts[3].strip()
                
                # 提取key编号
                try:
                    key_number = int(key.replace('i18n_', ''))
                    max_key_number = max(max_key_number, key_number)
                except:
                    pass
                
                existing_data[zh_cn] = {
                    'key': key,
                    'zh_CN': zh_cn,
                    'en_US': en_us,
                    'zh_TW': zh_tw
                }
        
        print(f"  加载了 {len(existing_data)} 条已存在的翻译")
        print(f"  当前最大key编号: i18n_{max_key_number:04d}")
        
    except Exception as e:
        print(f"  [警告] 读取CSV文件失败: {str(e)}")
        return {}, 0
    
    return existing_data, max_key_number

def generate_csv(translations):
    """
    生成CSV文件（支持增量更新）
    格式: key,zh_CN,en_US,zh_TW
    不使用双引号包裹，将逗号和换行符转换为特殊字符
    """
    print("\n正在生成CSV文件...")
    
    # 按简体中文排序
    translations.sort(key=lambda x: x['zh_CN'])
    
    try:
        with open(OUTPUT_CSV_PATH, 'w', encoding='utf-8-sig') as f:
            # 写入CSV头部
            f.write('key,zh_CN,en_US,zh_TW\n')
            
            # 写入每一行数据
            for trans in translations:
                # 使用已有的key
                key = trans.get('key', 'i18n_0000')
                
                # 标准化文本（替换逗号和换行符）
                zh_cn = normalize_text_for_csv(trans['zh_CN'])
                en_us = normalize_text_for_csv(trans['en_US'])
                zh_tw = normalize_text_for_csv(trans['zh_TW'])
                
                # 直接写入，不使用双引号
                f.write('%s,%s,%s,%s\n' % (key, zh_cn, en_us, zh_tw))
        
        print(f"CSV文件已生成: {OUTPUT_CSV_PATH}")
        print(f"共 {len(translations)} 条文本记录")
        print("")
        print("注意: CSV中的特殊字符已转换:")
        print("  逗号(,) -> 竖线(|)")
        print("  换行符(\\n) -> 井号(#)")
        
    except Exception as e:
        print(f"[错误] 生成CSV文件失败: {str(e)}")
        return False
    
    return True

# ==============================
# 主函数
# ==============================

def main():
    """主函数"""
    print("==========================================")
    print("  国际化文本提取工具")
    print("==========================================")
    print("")
    print(f"服务端路径: {SERVER_PROJECT_PATH}")
    print(f"客户端路径: {CLIENT_PROJECT_PATH}")
    print(f"输出文件: {OUTPUT_CSV_PATH}")
    
    # 检查百度翻译配置
    if ENABLE_AUTO_TRANSLATE:
        print(f"翻译模式: 百度翻译API (APPID: {BAIDU_APPID})")
    else:
        if not BAIDU_APPID:
            print("翻译模式: 占位符模式 (未配置APPID)")
            print("提示: 在脚本中设置BAIDU_APPID以启用自动翻译")
        else:
            print("翻译模式: 占位符模式 (已禁用自动翻译)")
    print("")
    
    # 检查路径是否存在
    if not os.path.exists(SERVER_PROJECT_PATH):
        print(f"[错误] 服务端路径不存在: {SERVER_PROJECT_PATH}")
        return
    
    if not os.path.exists(CLIENT_PROJECT_PATH):
        print(f"[错误] 客户端路径不存在: {CLIENT_PROJECT_PATH}")
        return
    
    # 1. 扫描服务端errJson
    err_texts = scan_server_err_json()
    print("")
    
    # 2. 扫描客户端prefab
    prefab_texts = scan_client_prefabs()
    print("")
    
    # 3. 扫描客户端TS脚本
    ts_texts = scan_client_ts_scripts()
    print("")
    
    # 合并所有文本并去重
    all_texts = set()
    all_texts.update(err_texts)
    all_texts.update(prefab_texts)
    all_texts.update(ts_texts)
    
    print("==========================================")
    print("扫描统计:")
    print(f"  服务端errJson: {len(err_texts)} 条")
    print(f"  客户端prefab: {len(prefab_texts)} 条")
    print(f"  客户端TS脚本: {len(ts_texts)} 条")
    print(f"  合并去重后: {len(all_texts)} 条")
    print("==========================================")
    print("")
    
    if len(all_texts) == 0:
        print("[提示] 没有找到任何中文文本")
        return
    
    # 4. 加载已存在的CSV文件
    print("========================================")
    print("正在检查已存在的翻译...")
    print("========================================")
    existing_data, max_key_number = load_existing_csv()
    print("")
    
    # 5. 对比并分类文本
    texts_to_keep = []  # 保留的旧翻译
    texts_to_translate = []  # 需要新翻译的文本
    
    for text in all_texts:
        normalized_text = normalize_text_for_csv(text)
        if normalized_text in existing_data:
            # 已存在，保留原翻译
            texts_to_keep.append(existing_data[normalized_text])
        else:
            # 新文本，需要翻译
            texts_to_translate.append(text)
    
    print("========================================")
    print("文本分类:")
    print(f"  已存在（保留）: {len(texts_to_keep)} 条")
    print(f"  新增（需翻译）: {len(texts_to_translate)} 条")
    print("========================================")
    print("")
    
    # 6. 翻译新增文本
    new_translations = []
    if len(texts_to_translate) > 0:
        new_translations = translate_texts(texts_to_translate)
        
        # 为新翻译分配key
        for idx, trans in enumerate(new_translations):
            key_number = max_key_number + idx + 1
            trans['key'] = f'i18n_{key_number:04d}'
    else:
        print("[提示] 没有新增文本需要翻译")
    
    print("")
    
    # 7. 合并翻译结果
    all_translations = texts_to_keep + new_translations
    
    # 8. 生成CSV文件
    if generate_csv(all_translations):
        print("")
        print("==========================================")
        print("  完成！")
        print("==========================================")
        print("")
        print("提示：")
        print("1. CSV文件已生成，请使用Excel或其他工具打开")
        print("2. 已保留原有条目的key和翻译，只翻译了新增文本")
        print("3. CSV中的逗号(,)已替换为竖线(|)，换行符(\\n)已替换为井号(#)")
        print("4. 下次运行脚本时，会继续保留已翻译的内容")
        print("")
        print("统计信息：")
        print(f"  保留条目: {len(texts_to_keep)} 条")
        print(f"  新增条目: {len(new_translations)} 条")
        print(f"  总计条目: {len(all_translations)} 条")
        print("")
    else:
        print("[错误] 生成CSV文件失败")

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n[中断] 用户取消操作")
    except Exception as e:
        print(f"\n[错误] 执行失败: {str(e)}")
        import traceback
        traceback.print_exc()

