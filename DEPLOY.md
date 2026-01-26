# PM2 部署指南

## 一、服务器环境准备

### 1. 安装 Node.js
```bash
# 使用 nvm 安装（推荐）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18

# 或者直接安装
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. 安装 PM2
```bash
npm install -g pm2
```

### 3. 安装 MySQL（如果服务器上没有）
```bash
sudo apt-get install mysql-server
sudo mysql_secure_installation
```

## 二、部署步骤

### 1. 拉取代码（已完成）
```bash
git clone <your-repo-url>
cd vue3-project-backend
```

### 2. 安装依赖
```bash
npm install --production
# 如果需要开发依赖，去掉 --production
```

### 3. 配置环境变量
```bash
# 复制环境变量示例文件
cp .env.example .env

# 编辑环境变量
vim .env
# 或
nano .env
```

修改 `.env` 文件中的数据库配置：
```
PORT=3000
NODE_ENV=production

DB_HOST=localhost
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_database_name
```

### 4. 创建数据库
```bash
# 登录 MySQL
mysql -u root -p

# 在 MySQL 中执行
CREATE DATABASE your_database_name CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 导入数据库结构
USE your_database_name;
SOURCE database.sql;

# 退出 MySQL
exit;
```

### 5. 创建日志目录
```bash
mkdir -p logs
```

## 三、使用 PM2 启动应用

### 启动应用
```bash
# 方式1：使用 npm 脚本
npm run pm2:start

# 方式2：直接使用 PM2 命令
pm2 start ecosystem.config.js --env production
```

### 常用 PM2 命令
```bash
# 查看应用列表
pm2 list
pm2 ls

# 查看应用详情
pm2 show vue3-backend

# 查看日志
npm run pm2:logs
# 或
pm2 logs vue3-backend

# 实时监控
npm run pm2:monit
# 或
pm2 monit

# 重启应用
npm run pm2:restart
# 或
pm2 restart vue3-backend

# 停止应用
npm run pm2:stop
# 或
pm2 stop vue3-backend

# 删除应用
npm run pm2:delete
# 或
pm2 delete vue3-backend

# 重载应用（0秒停机）
pm2 reload vue3-backend

# 清空日志
pm2 flush

# 查看特定应用的日志
pm2 logs vue3-backend --lines 100
```

## 四、设置 PM2 开机自启

```bash
# 保存当前 PM2 进程列表
pm2 save

# 生成开机启动脚本
pm2 startup

# 执行上一步命令输出的命令（通常是类似这样的）
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u your_username --hp /home/your_username

# 再次保存
pm2 save
```

## 五、更新部署

当代码更新后，在服务器上执行：

```bash
# 拉取最新代码
git pull

# 安装新依赖（如果有）
npm install --production

# 重启应用
npm run pm2:restart
# 或使用 reload 实现 0 秒停机
pm2 reload vue3-backend
```

## 六、配置 Nginx 反向代理（可选）

如果需要通过域名访问或使用 80/443 端口：

```bash
sudo apt-get install nginx
```

创建 Nginx 配置：
```bash
sudo vim /etc/nginx/sites-available/vue3-backend
```

配置内容：
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

启用配置：
```bash
sudo ln -s /etc/nginx/sites-available/vue3-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 七、监控和维护

### 查看应用状态
```bash
pm2 status
```

### 查看资源使用情况
```bash
pm2 monit
```

### 查看实时日志
```bash
pm2 logs vue3-backend --lines 50
```

### 日志管理
PM2 会自动管理日志，日志文件位于 `./logs/` 目录：
- `err.log` - 错误日志
- `out.log` - 输出日志

可以配置日志轮转：
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

## 八、性能优化建议

### 使用 Cluster 模式（多核 CPU）
如果服务器有多个 CPU 核心，可以修改 `ecosystem.config.js`：
```javascript
instances: 'max',  // 或指定数字，如 4
exec_mode: 'cluster'
```

### 配置内存限制
已在配置文件中设置：
```javascript
max_memory_restart: '500M'
```

## 九、故障排查

### 应用无法启动
```bash
# 查看错误日志
pm2 logs vue3-backend --err

# 查看应用详情
pm2 show vue3-backend

# 尝试直接运行查看详细错误
node src/server.js
```

### 数据库连接失败
- 检查 `.env` 文件配置是否正确
- 确认 MySQL 服务是否运行：`sudo systemctl status mysql`
- 检查数据库用户权限

### 端口被占用
```bash
# 查看端口占用
sudo lsof -i :3000
# 或
sudo netstat -tulpn | grep 3000

# 修改端口
# 在 .env 文件中修改 PORT 值，然后重启应用
```

## 十、防火墙和安全组配置

### 1. UFW 防火墙配置（Ubuntu/Debian）

#### 启用并配置 UFW
```bash
# 检查防火墙状态
sudo ufw status

# 设置默认策略（拒绝所有入站，允许所有出站）
sudo ufw default deny incoming
sudo ufw default allow outgoing

# 允许 SSH（重要！防止被锁定）
sudo ufw allow 22/tcp
# 或限制 SSH 仅允许特定 IP
# sudo ufw allow from YOUR_IP_ADDRESS to any port 22

# 允许 HTTP
sudo ufw allow 80/tcp

# 允许 HTTPS
sudo ufw allow 443/tcp

# 3000 端口不需要对外开放（仅本地访问）
# 因为 Nginx 已经做了反向代理

# 启用防火墙
sudo ufw enable

# 查看规则
sudo ufw status numbered
sudo ufw status verbose
```

#### 高级配置（可选）
```bash
# 限制 SSH 连接频率（防止暴力破解）
sudo ufw limit 22/tcp

# 允许特定 IP 段访问
sudo ufw allow from 192.168.1.0/24

# 删除规则
sudo ufw status numbered
sudo ufw delete [规则编号]

# 重置所有规则
sudo ufw reset

# 禁用防火墙
sudo ufw disable
```

### 2. 云服务器安全组配置

#### 阿里云 ECS 安全组规则

**入方向规则：**

| 协议 | 端口范围 | 授权对象 | 优先级 | 说明 |
|------|---------|---------|--------|------|
| TCP | 22 | 你的IP/32 | 1 | SSH（建议限制IP） |
| TCP | 80 | 0.0.0.0/0 | 2 | HTTP |
| TCP | 443 | 0.0.0.0/0 | 2 | HTTPS |
| TCP | 3306 | 仅内网 | 100 | MySQL（禁止外网访问） |
| TCP | 3000 | 127.0.0.1/32 | 100 | Node.js应用（禁止外网访问） |

**出方向规则：**
- 保持默认（允许所有出站流量）

#### 腾讯云 CVM 安全组规则

访问：云服务器 → 安全组 → 入站规则

```
类型      协议端口    来源            策略    备注
SSH       22        你的IP/32      允许    SSH登录
HTTP      80        0.0.0.0/0      允许    HTTP访问
HTTPS     443       0.0.0.0/0      允许    HTTPS访问
MySQL     3306      拒绝所有        拒绝    禁止外部访问数据库
自定义     3000      拒绝所有        拒绝    禁止外部访问应用端口
```

#### AWS EC2 安全组规则

**Inbound Rules:**
```
Type            Protocol    Port Range    Source          Description
SSH             TCP         22            My IP           SSH access
HTTP            TCP         80            0.0.0.0/0       HTTP access
HTTPS           TCP         443           0.0.0.0/0       HTTPS access
```

**Outbound Rules:**
- All traffic allowed (default)

### 3. 端口说明和安全策略

#### 必须对外开放的端口
- **22 (SSH)**: 管理服务器，建议限制 IP 访问
- **80 (HTTP)**: Nginx 提供 Web 服务
- **443 (HTTPS)**: Nginx 提供 HTTPS 服务

#### 禁止对外开放的端口
- **3000**: Node.js 应用端口（仅允许 localhost 访问）
- **3306**: MySQL 数据库端口（仅允许内网访问）

#### 安全架构说明
```
外部请求 → [80/443端口] → Nginx → [localhost:3000] → Express应用
                                         ↓
                                   [localhost:3306]
                                      MySQL数据库
```

### 4. 验证配置

#### 验证防火墙规则
```bash
# 查看 UFW 状态
sudo ufw status verbose

# 测试端口监听
sudo netstat -tulpn | grep -E '(80|443|3000|3306)'

# 或使用 ss 命令
sudo ss -tulpn | grep -E '(80|443|3000|3306)'
```

#### 从外部测试端口
```bash
# 在本地电脑测试（替换为你的服务器IP）
telnet YOUR_SERVER_IP 80      # 应该能连接
telnet YOUR_SERVER_IP 443     # 应该能连接
telnet YOUR_SERVER_IP 3000    # 应该超时/拒绝（正确）
telnet YOUR_SERVER_IP 3306    # 应该超时/拒绝（正确）

# 或使用 nmap
nmap YOUR_SERVER_IP
```

#### 测试 Web 访问
```bash
# 测试 Nginx 反向代理
curl http://YOUR_SERVER_IP/api/users

# 测试直接访问应用端口（应该失败）
curl http://YOUR_SERVER_IP:3000/api/users
```

### 5. MySQL 数据库安全加固

```bash
# 编辑 MySQL 配置
sudo vim /etc/mysql/mysql.conf.d/mysqld.cnf

# 确保绑定到 localhost
bind-address = 127.0.0.1

# 重启 MySQL
sudo systemctl restart mysql

# 验证 MySQL 只监听本地
sudo netstat -tulpn | grep 3306
# 应该显示 127.0.0.1:3306
```

### 6. Nginx 安全配置

```bash
# 编辑 Nginx 配置
sudo vim /etc/nginx/sites-available/vue3-backend
```

添加安全头部：
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 安全头部
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # 限制请求体大小
    client_max_body_size 10M;

    # 限制请求速率（防止 DDoS）
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

    location / {
        # 应用速率限制
        limit_req zone=api_limit burst=20 nodelay;

        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

重启 Nginx：
```bash
sudo nginx -t
sudo systemctl restart nginx
```

### 7. 快速配置脚本

创建一键配置脚本：
```bash
#!/bin/bash
# security-setup.sh

echo "=== 配置防火墙和安全组 ==="

# 1. 配置 UFW
echo "配置 UFW 防火墙..."
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
echo "y" | sudo ufw enable

# 2. 检查端口监听
echo "\n检查端口监听状态..."
sudo ss -tulpn | grep -E '(80|443|3000|3306)'

# 3. 显示防火墙状态
echo "\n防火墙规则:"
sudo ufw status verbose

echo "\n=== 配置完成 ==="
echo "请确保在云服务商控制台配置安全组规则！"
```

## 十一、安全检查清单

- [ ] UFW 防火墙已启用
- [ ] 仅开放 22, 80, 443 端口
- [ ] 云服务商安全组规则已配置
- [ ] 3000 端口仅监听 localhost
- [ ] 3306 端口仅监听 localhost
- [ ] SSH 密钥登录已配置（禁用密码登录）
- [ ] MySQL root 用户禁止远程登录
- [ ] Nginx 安全头部已配置
- [ ] 已配置 HTTPS（Let's Encrypt）
- [ ] 定期更新系统和依赖包

## 十二、其他安全建议

1. 定期更新依赖包：`npm audit fix`
2. 使用环境变量管理敏感信息
3. 配置 SSL 证书（使用 Let's Encrypt）
4. 定期备份数据库
5. 监控应用日志和性能指标
6. 使用 fail2ban 防止暴力破解
7. 定期检查系统日志：`sudo tail -f /var/log/auth.log`
