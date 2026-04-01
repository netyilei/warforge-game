
module.exports = {
	apps : [
		
		{
			name: 'pp-account',
			script: '../../build/pp-account/start.js',
		
			// Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
			args: 'noconfig account',
			instances: 1,
			autorestart: true,
			watch: false,
			max_memory_restart: '1G',
			
			log_date_format: "YYYY-MM-DD HH:mm",
			error_file:"logs-account/pm2/app_error.txt",
			out_file:"logs-account/pm2/app_out.txt",

			env:{
				sname:"pp-account",
			},
		},

	],
};
