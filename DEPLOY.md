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

## 十、安全建议

1. 使用防火墙限制端口访问
2. 定期更新依赖包：`npm audit fix`
3. 使用环境变量管理敏感信息
4. 配置 SSL 证书（使用 Let's Encrypt）
5. 定期备份数据库
6. 监控应用日志和性能指标
