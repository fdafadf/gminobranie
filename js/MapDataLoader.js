import { ShapeFile } from './ShapeFile.js'
import { DBaseFile } from './DBaseFile.js'
import { Http } from './Http.js'

/**
 * @typedef {{ kraj: { shapes: string }, wojewodztwa: { shapes: string }, gminy: { shapes: string, labels: string, projection: string } }} BordersFilePaths
 */

export class MapDataLoader
{
    /**
     * @param {string} base_url 
     */
    constructor(base_url)
    {
        this.base_url = base_url;
        //this.activities = [];
    }

    /**
     * @param {BordersFilePaths} param0 
     * @returns 
     */
    async fetchBorders({ kraj, wojewodztwa, gminy })
    {
        let borders = 
        {
            kraj: 
            {
                shapes: await MapDataLoader.fetchShapeFile(this.getUrl(kraj.shapes))
            },
            wojewodztwa: 
            {
                shapes: await MapDataLoader.fetchShapeFile(this.getUrl(wojewodztwa.shapes))
            },
            gminy: 
            {
                shapes: await MapDataLoader.fetchShapeFile(this.getUrl(gminy.shapes)),
                labels: await MapDataLoader.fetchDBaseFile(this.getUrl(gminy.labels)),
                projection: await MapDataLoader.fetchText(this.getUrl(gminy.projection))
            }
        }

        return borders;
    }

    // removeActivity(activity)
    // {
    //     this.checkVisitedBorders(activity, true);
    //     let index = this.activities.findIndex(a => a === activity);
    //     this.activities.splice(index, 1);
    // }

    /**
     * @param {string} file_name 
     * @returns 
     */
    getUrl(file_name)
    {
        return `${this.base_url}/data/${file_name}`;
    }
    
    // static normalizeCoordinates(path, projection)
    // {
    //     // Konwersja koordynatów z standardu PUWG 1992 (EPSG:2180) do WGS84 (ESPG:4326)
    
    //     for (let point of path)
    //     {
    //         [point[0], point[1]] = proj4(projection, [point[1], point[0]]);
    //     }
    // }

    /**
     * @param {string} url 
     * @returns 
     */
    static async fetchText(url)
    {
        return await (await fetch(url)).text();
    }
    
    /**
     * @param {string} url 
     * @param {DOMParserSupportedType} type
     * @returns 
     */
    static async fetchXmlDocument(url, type = "text/xml")
    {
        return new DOMParser().parseFromString(await MapDataLoader.fetchText(url), type);
    }
    
    /**
     * @param {string} url 
     * @returns 
     */
    static async fetchShapeFile(url)
    {
        return new ShapeFile(new DataView(await Http.request({ url, responseType: 'arraybuffer' })));
    }
    
    /**
     * @param {string} url 
     * @returns 
     */
    static async fetchDBaseFile(url)
    {
        return new DBaseFile(new DataView(await Http.request({ url, responseType: 'arraybuffer' })));
    }
    
    // /**
    //  * @param {string} url 
    //  * @returns 
    //  */
    // static async fetchActivity(url)
    // {
    //     return this.parseActivity(await MapDataLoader.fetchText(url));
    // }

    /**
     * @param {string | ArrayBuffer} content 
     * @returns 
     */
    static parseGpx(content)
    {
        // @ts-ignore
        let gpx = new DOMParser().parseFromString(content, "text/xml");
        let start_date = gpx.querySelector('metadata > time').textContent;
        let name = gpx.querySelector('trk > name').textContent;
        // @ts-ignore
        let trkpts = [...gpx.getElementsByTagName("trkpt")];
        let latlng = trkpts.map(p => ([parseFloat(p.getAttribute('lat')), parseFloat(p.getAttribute('lon'))]));
        let distance = '';
        let id = start_date;
        /** @type {string[]} */
        let visited_communities = [];
        let activity_entity = { id, name, start_date, distance, source: 'gpx', visited_communities, type: '' };
        let activity_streams_entity = { id, latlng };
        return { activity_entity, activity_streams_entity };
    }
}

