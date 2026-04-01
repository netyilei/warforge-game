
module.exports = {
	apps : [
		
		{
			name: 'pp-chat-service-1',
			script: '../../build/pp-chat-service/start.js',
		
			args: 'local-config.chat-1.js chat-service-1',
			instances: 1,
			exec_mode: 'fork',
			autorestart: true,
			watch: false,
			max_memory_restart: '1G',
			
			log_date_format: "YYYY-MM-DD HH:mm",
			error_file:"logs-chat-service-1/pm2/app_error.txt",
			out_file:"logs-chat-service-1/pm2/app_out.txt",

			env:{
				sname:"pp-chat-service-1",
			},
		},

		{
			name: 'pp-chat-service-2',
			script: '../../build/pp-chat-service/start.js',
		
			args: 'local-config.chat-2.js chat-service-2',
			instances: 1,
			exec_mode: 'fork',
			autorestart: true,
			watch: false,
			max_memory_restart: '1G',
			
			log_date_format: "YYYY-MM-DD HH:mm",
			error_file:"logs-chat-service-2/pm2/app_error.txt",
			out_file:"logs-chat-service-2/pm2/app_out.txt",

			env:{
				sname:"pp-chat-service-2",
			},
		},

	],
};
