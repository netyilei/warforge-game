
module.exports = {
	apps : [
		
		{
			name: 'pp-srs-node-user-1',
			script: '../../build/pp-srs-node/start.js',
		
			// Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
			args: 'local-config.srs-user-1.js srs-node-user-1',
			instances: 1,
			autorestart: true,
			watch: false,
			max_memory_restart: '1G',
			
			log_date_format: "YYYY-MM-DD HH:mm",
			error_file:"logs-srs-node-user-1/pm2/app_error.txt",
			out_file:"logs-srs-node-user-1/pm2/app_out.txt",

			env:{
				sname:"pp-srs-node-user-1",
			},
		},

		{
			name: 'pp-srs-node-user-2',
			script: '../../build/pp-srs-node/start.js',
		
			// Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
			args: 'local-config.srs-user-2.js srs-node-user-2',
			instances: 1,
			autorestart: true,
			watch: false,
			max_memory_restart: '1G',
			
			log_date_format: "YYYY-MM-DD HH:mm",
			error_file:"logs-srs-node-user-2/pm2/app_error.txt",
			out_file:"logs-srs-node-user-2/pm2/app_out.txt",

			env:{
				sname:"pp-srs-node-user-2",
			},
		},

		{
			name: 'pp-srs-node-user-3',
			script: '../../build/pp-srs-node/start.js',
		
			// Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
			args: 'local-config.srs-user-3.js srs-node-user-3',
			instances: 1,
			autorestart: true,
			watch: false,
			max_memory_restart: '1G',
			
			log_date_format: "YYYY-MM-DD HH:mm",
			error_file:"logs-srs-node-user-3/pm2/app_error.txt",
			out_file:"logs-srs-node-user-3/pm2/app_out.txt",

			env:{
				sname:"pp-srs-node-user-3",
			},
		},

		{
			name: 'pp-srs-node-user-4',
			script: '../../build/pp-srs-node/start.js',
		
			// Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
			args: 'local-config.srs-user-4.js srs-node-user-4',
			instances: 1,
			autorestart: true,
			watch: false,
			max_memory_restart: '1G',
			
			log_date_format: "YYYY-MM-DD HH:mm",
			error_file:"logs-srs-node-user-4/pm2/app_error.txt",
			out_file:"logs-srs-node-user-4/pm2/app_out.txt",

			env:{
				sname:"pp-srs-node-user-4",
			},
		},

	],
};
