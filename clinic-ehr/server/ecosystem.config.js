module.exports = {
  apps: [
    {
      name: 'clinic-ehr',
      script: 'src/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: 'logs/error.log',
      out_file: 'logs/out.log',
      time: true
    }
  ]
};
