import { ShapeFile } from './js/ShapeFile.js'
import { DBaseFile } from './js/DBaseFile.js'
import { View } from './js/View.js'
import { Http } from './js/Http.js'

async function loadRide(fileName)
{
    let response = await fetch(`/gminobranie/data/${fileName}`);
    let content = await response.text();
    let parser = new DOMParser();
    let gpx = parser.parseFromString(content, "text/xml");
    let points = gpx.getElementsByTagName("trkpt");
    let path = [];
    path.push({ x: parseFloat(points[0].getAttribute('lon')), y: parseFloat(points[0].getAttribute('lat'))});

    for (let i = 1; i < points.length; i++) 
    {
        path.push({ x: parseFloat(points[i].getAttribute('lon')), y: parseFloat(points[i].getAttribute('lat'))});
    }

    return path;
}

async function loadData({ borders_2_shape_url, borders_shape_url, borders_dbf_url, ride_urls })
{
    let borders_2_shape = new ShapeFile(new DataView(await Http.request({ url: borders_2_shape_url, responseType: 'arraybuffer' })));
    let borders_shape = new ShapeFile(new DataView(await Http.request({ url: borders_shape_url, responseType: 'arraybuffer' })));
    let borders_dbf = new DBaseFile(new DataView(await Http.request({ url: borders_dbf_url, responseType: 'arraybuffer' })));
    let rides = await Promise.all(ride_urls.map(loadRide));
    return { borders_2_shape, borders_shape, borders_dbf, rides };
}

function normalizeShape(shape)
{
    let background_color = 0;
    let background_color_step = 360 / shape.items.length;

    for (let item of shape.items)
    {
        item.paths = [];
        let parts = [...item.parts].concat([item.points.length]);
        
        for (let k = 1; k < parts.length; k++)
        {
            let from = parts[k - 1];
            let to = parts[k];
            let path = new Path2D();
            console.log(`item(${item.number}) from(${from}) to(${to})`);
            path.moveTo(item.points[to * 2 - 2], item.points[to * 2 - 1]);
            path.background_color = `hsl(${Math.round(background_color)}, 100%, 90%)`;
            path.background_color_selected = `hsl(${Math.round(background_color)}, 100%, 50%)`;

            for (let i = from; i < to; i++)
            {
                path.lineTo(item.points[i * 2], item.points[i * 2 + 1]);
            }

            item.paths.push(path);
        }

        background_color += background_color_step;
    }
}

function normalizeRide(ride, translate_x, translate_y, scale_x, scale_y)
{
    let path = new Path2D();
    path.moveTo
    (
        translate_x + (ride[0].x - 14.116667) * scale_x,
        translate_y + (ride[0].y - 49.000000) * scale_y
    );

    for (let i = 1; i < ride.length; i++)
    {
        path.lineTo
        (
            translate_x + (ride[i].x - 14.116667) * scale_x,
            translate_y + (ride[i].y - 49.000000) * scale_y
        );
    }

    return path;
}

// TODO: Konwersja koordynatów z standardu PUWG 1992 (EPSG:2180) do WGS84 (ESPG:4326)

async function normalizeData({ borders_2_shape, borders_shape, borders_dbf, rides })
{
    normalizeShape(borders_2_shape);
    normalizeShape(borders_shape);
    let scale_x = (borders_shape.max_x - borders_shape.min_x) / (24.150000 - 14.116667);
    let scale_y = (borders_shape.max_y - borders_shape.min_y) / (54.833333 - 49.000000);
    rides = rides.map(ride => normalizeRide(ride, borders_shape.min_x, borders_shape.min_y, scale_x, scale_y));
    return { borders_2_shape, borders_shape, borders_dbf, rides };
}

async function onLoad()
{
    let data_urls = 
    {
        borders_2_shape_url: '/gminobranie/data/Wojewodztwa_Small.shp',
        borders_shape_url: '/gminobranie/data/Gminy_Small.shp',
        borders_dbf_url: '/gminobranie/data/Gminy.dbf',
        ride_urls: ['Ride_01.xml', 'Ride_02.xml', 'Ride_03.xml', 'Ride_04.xml', 'Ride_05.xml', 'Ride_06.xml']
    }
    let data = await loadData(data_urls);
    let normalized_data = await normalizeData(data);
    let view = new View(Object.assign(normalized_data, { width: 2500, height: 2500}));
    document.querySelector('.loader').remove();
}

window.onload = onLoad;

// https://gis-support.pl/baza-wiedzy-2/dane-do-pobrania/granice-administracyjne/
// https://mapshaper.org/