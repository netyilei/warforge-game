
module.exports = {
	apps : [
		
		{
			name: 'pp-match-logic-1',
			script: '../../build/pp-match-logic/start.js',
		
			// Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
			args: 'local-config.match-logic-1.js match-logic-1',
			instances: 1,
			autorestart: true,
			watch: false,
			max_memory_restart: '1G',
			
			log_date_format: "YYYY-MM-DD HH:mm",
			error_file:"logs-match-logic-1/pm2/app_error.txt",
			out_file:"logs-match-logic-1/pm2/app_out.txt",

			env:{
				sname:"pp-match-logic-1",
			},
		},

	],
};
