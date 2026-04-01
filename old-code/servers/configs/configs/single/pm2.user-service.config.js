
module.exports = {
	apps : [
		
		{
			name: 'pp-user-service-1',
			script: '../../build/pp-user-service/start.js',
		
			// Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
			args: 'local-config.user-service-1.js user-service-1',
			instances: 1,
			autorestart: true,
			watch: false,
			max_memory_restart: '1G',
			
			log_date_format: "YYYY-MM-DD HH:mm",
			error_file:"logs-user-service-1/pm2/app_error.txt",
			out_file:"logs-user-service-1/pm2/app_out.txt",

			env:{
				sname:"pp-user-service-1",
			},
		},

		{
			name: 'pp-user-service-2',
			script: '../../build/pp-user-service/start.js',
		
			// Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
			args: 'local-config.user-service-2.js user-service-2',
			instances: 1,
			autorestart: true,
			watch: false,
			max_memory_restart: '1G',
			
			log_date_format: "YYYY-MM-DD HH:mm",
			error_file:"logs-user-service-2/pm2/app_error.txt",
			out_file:"logs-user-service-2/pm2/app_out.txt",

			env:{
				sname:"pp-user-service-2",
			},
		},

		{
			name: 'pp-user-service-3',
			script: '../../build/pp-user-service/start.js',
		
			// Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
			args: 'local-config.user-service-3.js user-service-3',
			instances: 1,
			autorestart: true,
			watch: false,
			max_memory_restart: '1G',
			
			log_date_format: "YYYY-MM-DD HH:mm",
			error_file:"logs-user-service-3/pm2/app_error.txt",
			out_file:"logs-user-service-3/pm2/app_out.txt",

			env:{
				sname:"pp-user-service-3",
			},
		},

		{
			name: 'pp-user-service-4',
			script: '../../build/pp-user-service/start.js',
		
			// Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
			args: 'local-config.user-service-4.js user-service-4',
			instances: 1,
			autorestart: true,
			watch: false,
			max_memory_restart: '1G',
			
			log_date_format: "YYYY-MM-DD HH:mm",
			error_file:"logs-user-service-4/pm2/app_error.txt",
			out_file:"logs-user-service-4/pm2/app_out.txt",

			env:{
				sname:"pp-user-service-4",
			},
		},

	],
};
