
module.exports = {
	apps : [
		
		{
			name: 'pp-login',
			script: '../../build/pp-login/start.js',
		
			// Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
			args: 'local-config.login.js login',
			instances: 1,
			autorestart: true,
			watch: false,
			max_memory_restart: '1G',
			
			log_date_format: "YYYY-MM-DD HH:mm",
			error_file:"logs-login/pm2/app_error.txt",
			out_file:"logs-login/pm2/app_out.txt",

			env:{
				sname:"pp-login",
			},
		},

	],
};
