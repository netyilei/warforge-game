
module.exports = {
	apps : [
		
		{
			name: 'pp-robot-env-1',
			script: '../../build/pp-robot-env/start.js',
		
			// Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
			args: 'noconfig robot-env-1',
			instances: 1,
			autorestart: true,
			watch: false,
			max_memory_restart: '1G',
			
			log_date_format: "YYYY-MM-DD HH:mm",
			error_file:"logs-robot-env-1/pm2/app_error.txt",
			out_file:"logs-robot-env-1/pm2/app_out.txt",

			env:{
				sname:"pp-robot-env-1",
			},
		},

	],
};
