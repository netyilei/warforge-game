import asyncio
import websockets
import json
import requests
import sys

async def test_ws_connection(host, port, use_ssl=True):
    protocol = "wss" if use_ssl else "ws"
    url = f"{protocol}://{host}:{port}"
    print(f"\n尝试连接: {url}")
    try:
        async with websockets.connect(url, ping_timeout=5, close_timeout=5) as ws:
            print(f"  ✓ 连接成功!")
            return True
    except Exception as e:
        print(f"  ✗ 连接失败: {e}")
        return False

def test_http_connection(host, port, use_ssl=True):
    protocol = "https" if use_ssl else "http"
    url = f"{protocol}://{host}:{port}"
    print(f"\n尝试HTTP连接: {url}")
    try:
        resp = requests.get(url, timeout=5, verify=False)
        print(f"  ✓ HTTP响应: {resp.status_code}")
        return True
    except Exception as e:
        print(f"  ✗ HTTP连接失败: {e}")
        return False

def test_rpc_center(host, port):
    url = f"ws://{host}:{port}"
    print(f"\n测试 RPC Center: {url}")
    try:
        import socket
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(5)
        result = sock.connect_ex((host, port))
        sock.close()
        if result == 0:
            print(f"  ✓ 端口 {port} 开放")
            return True
        else:
            print(f"  ✗ 端口 {port} 关闭")
            return False
    except Exception as e:
        print(f"  ✗ 测试失败: {e}")
        return False

def main():
    print("=" * 60)
    print("服务连接诊断工具")
    print("=" * 60)
    
    server = sys.argv[1] if len(sys.argv) > 1 else "127.0.0.1"
    print(f"\n目标服务器: {server}")
    
    print("\n" + "-" * 40)
    print("1. 测试 RPC Center (端口 30001)")
    print("-" * 40)
    test_rpc_center(server, 30001)
    
    print("\n" + "-" * 40)
    print("2. 测试 pp-srs-layer HTTP (端口 36013)")
    print("-" * 40)
    test_http_connection(server, 36013, use_ssl=False)
    
    print("\n" + "-" * 40)
    print("3. 测试 pp-srs-layer RPC (端口 36014)")
    print("-" * 40)
    test_rpc_center(server, 36014)
    
    print("\n" + "-" * 40)
    print("4. 测试 pp-srs-node-user-1 (端口 36111)")
    print("-" * 40)
    test_rpc_center(server, 36111)
    
    print("\n" + "-" * 40)
    print("5. 测试 pp-srs-node-user-1 WS (端口 36113)")
    print("-" * 40)
    test_rpc_center(server, 36113)
    
    print("\n" + "-" * 40)
    print("6. 测试 pp-login (端口 31012)")
    print("-" * 40)
    test_http_connection(server, 31012, use_ssl=False)
    
    print("\n" + "=" * 60)
    print("诊断完成")
    print("=" * 60)

if __name__ == "__main__":
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    main()
