import { kdutils } from "kdweb-core/lib/utils";
import { RobotEnvTools } from "./RobotEnvTools";


async function main() {
	for(let i = 0 ; i < 100 ; i ++) {
		await RobotEnvTools.createRobot("Robot_" + kdutils.intRandom(100000,1000000),null)
	}
	console.log("> done")
	process.exit()
}

async function mainGroup() {
	for(let i = 0 ; i < 10 ; i ++) {
		await RobotEnvTools.createRobot("Robot_" + kdutils.intRandom(200000,2000000),null,{
			groupID:1001,
		})
	}
	console.log("> done")
	process.exit()
}
async function mainGroup2() {
	for(let i = 0 ; i < 10 ; i ++) {
		await RobotEnvTools.createRobot("Robot_" + kdutils.intRandom(200000,2000000),null,{
			groupID:1002,
		})
	}
	console.log("> done 2")
	process.exit()
}
async function mainGroup3() {
	for(let i = 0 ; i < 10 ; i ++) {
		await RobotEnvTools.createRobot("Robot_" + kdutils.intRandom(200000,2000000),null,{
			groupID:1003,
		})
	}
	console.log("> done 3")
	process.exit()
}

main()