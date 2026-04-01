export interface RequestHeader {
    name: string
    value: string
}

export interface RequestOption {
    domain: string
    path?: string
    method?: ConnectMethod
    query?: any
    body?: any
    header?: RequestHeader | RequestHeader[]
    timeout?: number
}

export enum ConnectMethod {
    GET = 'GET',
    POST = 'POST',
    PUT = 'PUT',
    DELETE = 'DELETE'
}

export default class Http {
    protected static _instance: Http;
    public static get instance(): Http {
        if (!this._instance) {
            this._instance = new Http();
        }
        return this._instance;
    }

    public async connect(requestOption: RequestOption): Promise<any> {
        let xhr: XMLHttpRequest = new XMLHttpRequest();
        xhr.timeout = requestOption.timeout || 5000;
        let method: string = requestOption.method || "GET";
        let domain: string = requestOption.domain;
        let param: string = requestOption.query ? this.paramToString(requestOption.query) : "";
        let path: string = requestOption.path || "";
        xhr.open(method, domain + path + param, true);
        if (requestOption.header) {
            if (Array.isArray(requestOption.header)) {
                requestOption.header.forEach((header: RequestHeader) => {
                    xhr.setRequestHeader(header.name, header.value);
                });
            } else {
                xhr.setRequestHeader(requestOption.header.name, requestOption.header.value);
            }
        }
        xhr.onerror = () => {
            console.error(xhr);
        }
        let sendData: any = requestOption.body ? JSON.stringify(requestOption.body) : null;
        xhr.send(sendData);
        let data = await new Promise((resolve, reject) => {
            xhr.onloadend = async () => {
                if (xhr.readyState == 4 && xhr.status === 200) {
                    let json: any;
                    try {
                        json = JSON.parse(xhr.responseText);
                    } catch (error) {
                        json = xhr.responseText;
                    }
                    resolve(json);
                } else {
                    console.error(xhr);
                    reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
                }
            }
        });
        return data;
    }

    private paramToString(param: any): string {
        let str: string = "";
        for (let key in param) {
            if (param[key] !== null && param[key] !== undefined) {
                str += `&${key}=${param[key]}`;
            }
        }
        return str ? "?" + str.substring(1) : "";
    }
}
