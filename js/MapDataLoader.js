import { ShapeFile } from './ShapeFile.js'
import { DBaseFile } from './DBaseFile.js'
import { Http } from './Http.js'

export class MapDataLoader
{
    constructor(base_url)
    {
        this.base_url = base_url;
        this.activities = [];
    }

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

        for (let item of borders.gminy.shapes.items)
        {
            item.visited_count = 0;
        }

        return borders;
    }

    removeActivity(activity)
    {
        this.checkVisitedBorders(activity, true);
        let index = this.activities.findIndex(a => a === activity);
        this.activities.splice(index, 1);
    }

    getUrl(file_name)
    {
        return `${this.base_url}/data/${file_name}`;
    }
    
    static normalizeCoordinates(path, projection)
    {
        // Konwersja koordynatów z standardu PUWG 1992 (EPSG:2180) do WGS84 (ESPG:4326)
    
        for (let point of path)
        {
            [point[0], point[1]] = proj4(projection, [point[1], point[0]]);
        }
    }

    static async fetchText(url)
    {
        return await (await fetch(url)).text();
    }
    
    static async fetchXmlDocument(url, type = "text/xml")
    {
        return new DOMParser().parseFromString(await MapDataLoader.fetchText(url), type);
    }
    
    static async fetchShapeFile(url)
    {
        return new ShapeFile(new DataView(await Http.request({ url, responseType: 'arraybuffer' })));
    }
    
    static async fetchDBaseFile(url)
    {
        return new DBaseFile(new DataView(await Http.request({ url, responseType: 'arraybuffer' })));
    }
    
    static async fetchActivity(url)
    {
        return this.parseActivity(await MapDataLoader.fetchText(url));
    }

    static parseActivity(content)
    {
        let gpx = new DOMParser().parseFromString(content, "text/xml");
        let start_date = gpx.querySelector('metadata > time').textContent;
        let name = gpx.querySelector('trk > name').textContent;
        // double distanceInMeters = 6378137 * ProjectionMath.greatCircleDistance(lon1 * Math.PI/180, lat1 * Math.PI/180, lon2 * Math.PI/180, lat2 * Math.PI/180);
        let path = [...gpx.getElementsByTagName("trkpt")].map(p => ([parseFloat(p.getAttribute('lat')), parseFloat(p.getAttribute('lon'))]));
        let distance = 0;
        let id = start_date;
        return { id, name, start_date, distance, streams: [{ type: 'latlng', data: path }] };
    }
}