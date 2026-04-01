

export interface IRobotProcessWorker {
	checkGSStatus(gsName:string):boolean 

	sendToGS(userID:number,msgName:string,jsonObj:any):Promise<boolean>
}