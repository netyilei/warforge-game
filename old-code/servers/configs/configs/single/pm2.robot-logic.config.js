
module.exports = {
	apps : [
		
		{
			name: 'pp-robot-logic-1',
			script: '../../build/pp-robot-logic/start.js',
		
			// Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
			args: 'local-config.robot-logic-1.js robot-logic-1',
			instances: 1,
			autorestart: true,
			watch: false,
			max_memory_restart: '1G',
			
			log_date_format: "YYYY-MM-DD HH:mm",
			error_file:"logs-robot-logic-1/pm2/app_error.txt",
			out_file:"logs-robot-logic-1/pm2/app_out.txt",

			env:{
				sname:"pp-robot-logic-1",
			},
		},

	],
};
