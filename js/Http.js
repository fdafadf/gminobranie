export class Http
{
    /**
     * 
     * @param {{ method?: string, url: string, responseType: XMLHttpRequestResponseType }} param0 
     * @returns 
     */
    static async request({ method='GET', url, responseType })
    {
        return await new Promise((resolve, reject) => 
        {
            let xhr = new XMLHttpRequest();
            xhr.open('GET', url);
            xhr.responseType = responseType;
            // @ts-ignore
            xhr.onload = e => resolve(e.currentTarget.response);
            xhr.onerror = reject;
            xhr.send(null);
        });
    }
}