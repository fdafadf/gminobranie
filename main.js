import { App } from "./js/App.js";

async function onLoad()
{
    feather.replace();
    
    let borders_file_names =
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
    }

    window.app = new App();
    await window.app.initialize(borders_file_names, '/gminobranie');
    document.querySelector('.loader').remove();
}

window.onload = onLoad;