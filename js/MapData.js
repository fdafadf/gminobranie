import { ShapeFile } from './ShapeFile.js'
import { DBaseFile } from './DBaseFile.js'
import { Http } from './Http.js'
import { SimpleGeometry } from "./SimpleGeometry.js";

export class MapData
{
    constructor(base_url)
    {
        this.base_url = base_url;
        this.activities = [];
        this.context = document.createElement('canvas').getContext("2d");
    }

    async loadBorders({ kraj, wojewodztwa, gminy })
    {
        this.kraj = 
        {
            shapes: await MapData.fetchShapeFile(this.getUrl(kraj.shapes))
        };
        this.wojewodztwa = 
        {
            shapes: await MapData.fetchShapeFile(this.getUrl(wojewodztwa.shapes))
        };
        this.gminy = 
        {
            shapes: await MapData.fetchShapeFile(this.getUrl(gminy.shapes)),
            labels: await MapData.fetchDBaseFile(this.getUrl(gminy.labels)),
            projection: await MapData.fetchText(this.getUrl(gminy.projection))
        };

        for (let item of this.gminy.shapes.items)
        {
            item.visited_count = 0;
        }
    }

    async loadActivity(file_name)
    {
        return this.addActivity(await MapData.fetchActivity(this.getUrl(file_name)));
    }

    addActivity(activity)
    {
        MapData.normalizeCoordinates(activity, this.gminy.projection);
        this.checkVisitedBorders(activity, false);
        this.activities.push(activity);
        return activity;
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

    checkVisitedBorders(activity, remove)
    {
        let ride_bounding_rectangle = SimpleGeometry.getPointsBoundingRectangle(activity.path);
        
        // for (let item of this.gminy.shapes.items)
        // {
        //     item.visited_tmp = false;
        // }
                
        for (let item of this.gminy.shapes.items)
        {
            //if (!item.visited_tmp)
            //{
                let item_bounding_rectangle = { left: item.min_x, right: item.max_x, top: item.max_y, bottom: item.min_y };
                
                if (SimpleGeometry.areRectanglesOverlap(ride_bounding_rectangle, item_bounding_rectangle))
                {
                    paths: for (let path of item.paths)
                    {
                        for (let point of activity.path)
                        {
                            if (this.context.isPointInPath(path, point.x, point.y))
                            {
                                if (remove)
                                {
                                    item.visited_count--;
                                }
                                else
                                {
                                    item.visited_count++;
                                }

                                //item.visited_tmp = true;
                                break paths;
                            }
                        }
                    }
                }
            //}
        }
    }
    
    static normalizeCoordinates(activity, projection)
    {
        // Konwersja koordynatów z standardu PUWG 1992 (EPSG:2180) do WGS84 (ESPG:4326)
    
        for (let point of activity.path)
        {
            [point.x, point.y] = proj4(projection, [point.x, point.y]);
        }
    }

    static async fetchText(url)
    {
        return await (await fetch(url)).text();
    }
    
    static async fetchXmlDocument(url, type = "text/xml")
    {
        return new DOMParser().parseFromString(await MapData.fetchText(url), type);
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
        return this.parseActivity(await MapData.fetchText(url));
    }

    static parseActivity(content)
    {
        let gpx = new DOMParser().parseFromString(content, "text/xml");
        let time = gpx.querySelector('metadata > time').textContent;
        let name = gpx.querySelector('trk > name').textContent;
        let path = [...gpx.getElementsByTagName("trkpt")].map(p => ({ x: parseFloat(p.getAttribute('lon')), y: parseFloat(p.getAttribute('lat'))}));
        return { name, time, path };
    }
}