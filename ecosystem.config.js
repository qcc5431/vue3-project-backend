module.exports = {
  apps: [
    {
      name: "vue3-backend", // 应用名称
      script: "./src/server.js", // 启动脚本
      instances: 1, // 实例数量，1表示单实例，'max'表示最大CPU核心数
      exec_mode: "fork", // 执行模式：'fork'或'cluster'
      watch: false, // 是否监听文件变化自动重启
      max_memory_restart: "500M", // 内存超过500M自动重启
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      env_development: {
        NODE_ENV: "development",
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      error_file: "./logs/err.log", // 错误日志路径
      out_file: "./logs/out.log", // 输出日志路径
      log_date_format: "YYYY-MM-DD HH:mm:ss", // 日志日期格式
      merge_logs: true, // 合并日志
      autorestart: true, // 自动重启
      min_uptime: "10s", // 应用运行少于时间被认为是异常启动
      max_restarts: 10, // 最大异常重启次数
      restart_delay: 4000, // 重启延迟时间
    },
  ],
};
