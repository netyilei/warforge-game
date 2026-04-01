#!/bin/bash

DOMAINS=("api.wforge.net" "s1.wforge.net" "up.wforge.net")
EMAIL="vumaithuy40@gmail.com"
SSL_DIR="/data/nginx/ssl"

mkdir -p $SSL_DIR

echo "=========================================="
echo "SSL 证书生成脚本"
echo "域名: ${DOMAINS[@]}"
echo "=========================================="

if [ "$1" = "self-signed" ]; then
    echo "生成自签名证书（仅用于测试）..."
    for DOMAIN in "${DOMAINS[@]}"; do
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout $SSL_DIR/$DOMAIN.key \
            -out $SSL_DIR/$DOMAIN.crt \
            -subj "/C=CN/ST=Shanghai/L=Shanghai/O=Game/OU=IT/CN=$DOMAIN"
        echo "自签名证书已生成:"
        echo "  证书: $SSL_DIR/$DOMAIN.crt"
        echo "  密钥: $SSL_DIR/$DOMAIN.key"
    done
    echo ""
    echo "警告: 自签名证书浏览器会显示不安全警告！"
else
    echo "使用 Let's Encrypt 申请免费证书..."
    
    if ! command -v certbot &> /dev/null; then
        echo "安装 certbot..."
        if command -v yum &> /dev/null; then
            yum install -y certbot
        elif command -v apt-get &> /dev/null; then
            apt-get update && apt-get install -y certbot
        else
            echo "错误: 无法安装 certbot，请手动安装"
            exit 1
        fi
    fi
    
    for DOMAIN in "${DOMAINS[@]}"; do
        echo "申请证书: $DOMAIN ..."
        certbot certonly --standalone \
            -d $DOMAIN \
            --email $EMAIL \
            --agree-tos \
            --no-eff-email
        
        if [ $? -eq 0 ]; then
            echo "复制证书到 Nginx 目录..."
            cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem $SSL_DIR/$DOMAIN.crt
            cp /etc/letsencrypt/live/$DOMAIN/privkey.pem $SSL_DIR/$DOMAIN.key
            chmod 644 $SSL_DIR/$DOMAIN.crt
            chmod 600 $SSL_DIR/$DOMAIN.key
            echo "证书已生成:"
            echo "  证书: $SSL_DIR/$DOMAIN.crt"
            echo "  密钥: $SSL_DIR/$DOMAIN.key"
        else
            echo "证书申请失败: $DOMAIN"
            echo "请确保:"
            echo "  1. 域名 $DOMAIN 已解析到本服务器"
            echo "  2. 80 端口可从外网访问（申请时需要验证）"
        fi
    done
    
    echo ""
    echo "设置自动续期..."
    RENEW_SCRIPT="/usr/local/bin/ssl_renew.sh"
    cat > $RENEW_SCRIPT << 'EOF'
#!/bin/bash
DOMAINS=("api.wforge.net" "s1.wforge.net" "up.wforge.net")
SSL_DIR="/data/nginx/ssl"

certbot renew --quiet
if [ $? -eq 0 ]; then
    for DOMAIN in "${DOMAINS[@]}"; do
        if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
            cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem $SSL_DIR/$DOMAIN.crt
            cp /etc/letsencrypt/live/$DOMAIN/privkey.pem $SSL_DIR/$DOMAIN.key
        fi
    done
    docker restart nginx
fi
EOF
    chmod +x $RENEW_SCRIPT
    
    (crontab -l 2>/dev/null | grep -v "ssl_renew.sh"; echo "0 3 1 * * $RENEW_SCRIPT") | crontab -
    
    echo "自动续期已配置:"
    echo "  每月 1 日凌晨 3 点自动续期"
    echo "  续期脚本: $RENEW_SCRIPT"
fi

echo ""
echo "=========================================="
echo "完成！请重启 Nginx 加载证书:"
echo "  docker restart nginx"
echo "=========================================="
