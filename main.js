import { App } from "./js/App.js";
import { MapDataLoader } from "./js/MapDataLoader.js";
import { StravaConnectionManager } from "./js/StravaConnectionManager.js";

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

    let data_loader = new MapDataLoader('/gminobranie');
    let strava = new StravaConnectionManager('/gminobranie');
    await strava.checkAuthorizationRedirect();
    let borders = await data_loader.fetchBorders(borders_file_names);
    let app = window.app = new App(borders, strava);
    await app.initialize();
    document.querySelector('.loader').remove();
}

window.onload = onLoad;