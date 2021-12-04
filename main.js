import { Map } from './js/Map.js';
import { MapBorders } from './js/MapBorders.js';
import { MapActivities } from './js/MapActivities.js';
import { MapData } from './js/MapData.js';
import { Table } from './js/Table.js';

async function onLoad()
{
    let table = new Table('#activities_table');
    feather.replace();
    let data_base_url = '/gminobranie';
    let data_file_names =
    {
        borders: 
        {
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
    map.selectedBordersItemChanged = () => 
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
    passed_counter.innerText = data.gminy.shapes.items.filter(item => item.visited).length;
    activities_counter.innerText = data.activities.length;
    map_container.appendChild(map.element);
    document.querySelector('.loader').remove();
}

window.onload = onLoad;