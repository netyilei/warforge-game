
module.exports = {
	apps : [
		
		{
			name: 'pp-srs-layer-1',
			script: '../../build/pp-srs-layer/start.js',
		
			// Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
			args: 'local-config.layer-1.js srs-layer-1',
			instances: 1,
			autorestart: true,
			watch: false,
			max_memory_restart: '1G',
			
			log_date_format: "YYYY-MM-DD HH:mm",
			error_file:"logs-srs-layer-1/pm2/app_error.txt",
			out_file:"logs-srs-layer-1/pm2/app_out.txt",

			env:{
				sname:"pp-srs-layer-1",
			},
		},

	],
};
