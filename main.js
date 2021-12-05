import { Map } from './js/Map.js';
import { MapBorders } from './js/MapBorders.js';
import { MapActivities } from './js/MapActivities.js';
import { MapData } from './js/MapData.js';
import { Table } from './js/Table.js';

function configureOnResize(map, map_container)
{
    map_container.style.position = 'relative';
    map.element.style.position = 'absolute';
    let resize_observer = new ResizeObserver(_ => map.resize(map_container.clientWidth, map_container.clientHeight));
    resize_observer.observe(map_container);
}

function refreshLabels(data)
{
    passed_counter.innerText = data.gminy.shapes.items.filter(item => item.visited_count > 0).length;
    activities_counter.innerText = data.activities.length;
}

async function onLoad()
{
    feather.replace();
    // document.querySelector('.loader').remove();
    // return
    let data_base_url = '/gminobranie';
    let data_file_names =
    {
        borders: 
        {
            kraj:
            {
                shapes: 'Country_Small.shp'
            },
            wojewodztwa: 
            {
                shapes: 'Wojewodztwa_Small.shp'
            },
            gminy: 
            {
                shapes: 'Gminy_Small.shp',
                labels: 'Gminy.dbf',
                projection: 'Gminy.prj'
            }
        },
        activities: ['Ride_01.xml', 'Ride_02.xml', 'Ride_03.xml', 'Ride_04.xml', 'Ride_05.xml', 'Ride_06.xml']
    }
    let table = new Table('#activities_table');
    let data = new MapData(data_base_url);
    await data.loadBorders(data_file_names.borders);
    let map_borders = new MapBorders(data);
    await Promise.all(data_file_names.activities.map(async file_name => {
        let activity = await data.loadActivity(file_name);
        table.addRow(activity);
    }));
    let map_activities = new MapActivities(data.activities);
    let map_container = document.querySelector('div#map-container');
    let map = new Map(map_container.clientWidth, map_container.clientHeight, map_borders, map_activities);
    table.noFilesReceived = files => 
    {
        for (let file of files)
        {
            let activity = MapData.parseActivity(file);
            data.addActivity(activity);
            activity.path2d = MapActivities.createPath2d(activity);
            table.addRow(activity);
        }

        refreshLabels(data);
        map.draw();
    }
    map.onSelectedBordersItemChanged = () => 
    {
        if (map.selected_borders_item)
        {
            let row = data.gminy.labels.rows[map.selected_borders_item.number - 1];
            let name = row[2];
            let code = row[1].trim();
            gmina.innerText = `${name}`; //`${name} (${code})`;
        }
        else 
        {
            gmina.innerText = '';
        }
    }
    document.querySelector('button#remove-button').addEventListener('click', () =>
    {
        for (let row of table.selectedRows)
        {
            data.removeActivity(row.item);
            row.parentElement.removeChild(row);
        }

        refreshLabels(data);
        map.draw();
    });
    document.querySelector('button#connect-button').addEventListener('click', () => { alert('Not implemented') });
    configureOnResize(map, map_container);
    refreshLabels(data);
    map_container.appendChild(map.element);
    document.querySelector('.loader').remove();
}

window.onload = onLoad;