
export interface IOSSEntity {
	// return cdn url
	upload(name:string,buffer:Buffer):Promise<string>;
}