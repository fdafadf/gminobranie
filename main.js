import { ShapeFile } from './js/ShapeFile.js'
import { DBaseFile } from './js/DBaseFile.js'
import { View } from './js/View.js'
import { Http } from './js/Http.js'

async function fetchText(url)
{
    return await (await fetch(url)).text();
}

async function fetchXmlDocument(url, type = "text/xml")
{
    return new DOMParser().parseFromString(await fetchText(url), type);
}

async function fetchShapeFile(url)
{
    return new ShapeFile(new DataView(await Http.request({ url, responseType: 'arraybuffer' })));
}

async function fetchDBaseFile(url)
{
    return new DBaseFile(new DataView(await Http.request({ url, responseType: 'arraybuffer' })));
}

async function fetchRide(fileName)
{
    let gpx = await fetchXmlDocument(`/gminobranie/data/${fileName}`);
    let time = gpx.querySelector('metadata > time').textContent;
    let name = gpx.querySelector('trk > name').textContent;
    let path = [...gpx.getElementsByTagName("trkpt")].map(p => ({ x: parseFloat(p.getAttribute('lon')), y: parseFloat(p.getAttribute('lat'))}));
    return { name, time, path };
}

function createPath2dInShapefile(shape)
{
    for (let item of shape.items)
    {
        item.paths = [];
        let parts = [...item.parts].concat([item.points.length]);
        
        for (let k = 1; k < parts.length; k++)
        {
            let from = parts[k - 1];
            let to = parts[k];
            let path = new Path2D();
            path.moveTo(item.points[to * 2 - 2], item.points[to * 2 - 1]);

            for (let i = from; i < to; i++)
            {
                path.lineTo(item.points[i * 2], item.points[i * 2 + 1]);
            }

            item.paths.push(path);
        }
    }
}

function createPath2dInRide(ride)
{
    let ride_path = ride.path;
    let path2d = new Path2D();
    path2d.moveTo(ride_path[0].x, ride_path[0].y);

    for (let i = 1; i < ride_path.length; i++)
    {
        path2d.lineTo(ride_path[i].x, ride_path[i].y);
    }

    ride.path2d = path2d;
}

function calculateColors({ shapes, labels })
{
    let rows = labels.rows.map((row, index) => ({ number: index, code: row[1] }));
    rows.sort((a, b) => (a.code > b.code) ? 1 : -1);
    let order = new Array(rows.length);

    for (let i = 0; i < rows.length; i++)
    {
        order[rows[i].number] = i;
    }

    let color_step = 360 / shapes.items.length;

    for (let item of shapes.items)
    {
        let item_order = item.number; //order[item.number];
        let color = color_step * item_order;
        
        for (let path of item.paths)
        {
            path.background_color = `hsl(${Math.round(color)}, 80%, 95%)`;
            path.background_color_selected = `hsl(${Math.round(color)}, 100%, 50%)`;
        }
    }
}

function convertRideCoordinates(ride, projection)
{
    // Konwersja koordynatów z standardu PUWG 1992 (EPSG:2180) do WGS84 (ESPG:4326)

    for (let point of ride.path)
    {
        [point.x, point.y] = proj4(projection, [point.x, point.y]);
    }
}

function getPointsBoundingRectangle(points)
{
    let xs = points.map(p => p.x);
    let ys = points.map(p => p.y);
    let left = Math.min.apply(Math, xs);
    let right = Math.max.apply(Math, xs);
    let top = Math.max.apply(Math, ys);
    let bottom = Math.min.apply(Math, ys);
    return { left, right, top, bottom }
}

function isPointInRectangle({ left, right, top, bottom }, x, y)
{
    return x >= left && x <= right && y <= top && y >= bottom;
}

function areRectanglesOverlap(a, b)
{
    return isPointInRectangle(a, b.left, b.top)
        || isPointInRectangle(a, b.left, b.bottom)
        || isPointInRectangle(a, b.right, b.top)
        || isPointInRectangle(a, b.right, b.bottom)
        || isPointInRectangle(b, a.left, a.top)
        || isPointInRectangle(b, a.left, a.bottom)
        || isPointInRectangle(b, a.right, a.top)
        || isPointInRectangle(b, a.right, a.bottom);
}

function checkVisitedBorders({ shapes, labels }, rides)
{
    let context = document.createElement('canvas').getContext("2d");

    for (let ride of rides)
    {
        let ride_bounding_rectangle = getPointsBoundingRectangle(ride.path);
                
        for (let item of shapes.items)
        {
            if (!item.visited)
            {
                let item_bounding_rectangle = { left: item.min_x, right: item.max_x, top: item.max_y, bottom: item.min_y };
                
                if (areRectanglesOverlap(ride_bounding_rectangle, item_bounding_rectangle))
                {
                    paths: for (let path of item.paths)
                    {
                        for (let point of ride.path)
                        {
                            if (context.isPointInPath(path, point.x, point.y))
                            {
                                item.visited = true;
                                break paths;
                            }
                        }
                    }
                }
            }
        }
    }

    for (let item of shapes.items)
    {
        if (item.visited)
        {
            for (let path of item.paths)
            {
                path.background_color = 'GreenYellow';
                path.background_color_selected = 'Chartreuse';
            }
        }
    }
}

async function onLoad()
{
    let data = 
    {
        borders: 
        {
            wojewodztwa: 
            {
                shapes: await fetchShapeFile('/gminobranie/data/Wojewodztwa_Small.shp')
            },
            gminy: 
            {
                shapes: await fetchShapeFile('/gminobranie/data/Gminy_Small.shp'),
                labels: await fetchDBaseFile('/gminobranie/data/Gminy.dbf'),
                projection: await fetchText('/gminobranie/data/Gminy.prj')
            }
        },
        rides: await Promise.all(['Ride_01.xml', 'Ride_02.xml', 'Ride_03.xml', 'Ride_04.xml', 'Ride_05.xml', 'Ride_06.xml'].map(fetchRide))
        //rides: await Promise.all(['Ride_01.xml'].map(fetchRide))
    }
    
    createPath2dInShapefile(data.borders.wojewodztwa.shapes);
    createPath2dInShapefile(data.borders.gminy.shapes);
    calculateColors(data.borders.gminy);
    data.rides.forEach(ride => convertRideCoordinates(ride, data.borders.gminy.projection));
    data.rides.forEach(createPath2dInRide);
    checkVisitedBorders(data.borders.gminy, data.rides);
    let view = new View(data, 2500, 2500);
    document.querySelector('.loader').remove();
}

window.onload = onLoad;