
module.exports = {
	apps : [
		
		{
			name: 'pp-game-texas-1',
			script: '../../build/pp-game-texas/start.js',
		
			// Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
			args: 'noconfig game-texas-1',
			instances: 1,
			autorestart: true,
			watch: false,
			max_memory_restart: '1G',
			
			log_date_format: "YYYY-MM-DD HH:mm",
			error_file:"logs-game-texas-1/pm2/app_error.txt",
			out_file:"logs-game-texas-1/pm2/app_out.txt",

			env:{
				sname:"pp-game-texas-1",
			},
		},

		{
			name: 'pp-game-texas-2',
			script: '../../build/pp-game-texas/start.js',
		
			// Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
			args: 'noconfig game-texas-2',
			instances: 1,
			autorestart: true,
			watch: false,
			max_memory_restart: '1G',
			
			log_date_format: "YYYY-MM-DD HH:mm",
			error_file:"logs-game-texas-2/pm2/app_error.txt",
			out_file:"logs-game-texas-2/pm2/app_out.txt",

			env:{
				sname:"pp-game-texas-2",
			},
		},

	],
};
