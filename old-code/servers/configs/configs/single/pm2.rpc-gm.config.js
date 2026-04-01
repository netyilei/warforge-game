
module.exports = {
	apps : [
		
		{
			name: 'pp-rpc-gm',
			script: '../../build/pp-rpc-gm/start.js',
		
			// Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
			args: 'local-config.gm.js rpc-gm',
			instances: 1,
			autorestart: true,
			watch: false,
			max_memory_restart: '1G',
			
			log_date_format: "YYYY-MM-DD HH:mm",
			error_file:"logs-rpc-gm/pm2/app_error.txt",
			out_file:"logs-rpc-gm/pm2/app_out.txt",

			env:{
				sname:"pp-rpc-gm",
			},
		},

	],
};
