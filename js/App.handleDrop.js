import { Activity } from "./Activity.js";
import { App } from "./App.js";
import { MapDataLoader } from "./MapDataLoader.js";

/**
 * @this {App}
 * @param {DragEvent} e 
 */
export async function handleDrop(e)
{
    e.preventDefault();
    this.processing_files_dialog.set(e.dataTransfer.files);
    this.processing_files_dialog.open();
    this.processing_files_dialog.element_close.classList.add('disabled');
 
    // /**
    //  * @param  item 
    //  * @returns 
    //  */
    // function processFile(item)
    // {
    // }
 
    await Promise.all(this.processing_files_dialog.items.map(processFile.bind(this)));
    let added = this.processing_files_dialog.items.filter(item => item.added).length;
 
    if (added)
    {
        this.processing_files_dialog.element_label.innerText = `Completed. ${added} files added.`;
    }
    else
    {
        this.processing_files_dialog.element_label.innerText = `Completed. No files added.`;
    }

    this.processing_files_dialog.element_close.classList.remove('disabled');
    
    if (added)
    {
        this.activities.dropdown.refresh();
        this.activities.dropdown.expand();

        if (this.activities.dropdown.selected_row.item.groups.get('gpx').new_activities_count)
        {
            await this._handleSelectedActivitiesYearChanged();
        }
    }
    
    //this.element.querySelector('.drop').style.display = 'none';
    //this.onFilesReceived?.(e.dataTransfer.files);
}

/**
 * @this {App}
 * @param {*} item 
 */
function processFile(item)
{
    return new Promise(resolve => 
    {
        let file_reader = new FileReader();
        let onLoad = processFileOnLoad.bind(this);
        file_reader.onload = e => onLoad(e, item, resolve);
        file_reader.readAsText(item.file);
    });
}

/**
 * @this {App}
 * @param {ProgressEvent<FileReader>} e
 * @param {{ file: File, element: HTMLElement, element_name: HTMLElement, added: boolean, activity: Activity }} item
 * @param {(value: any) => void} resolve
 */
async function processFileOnLoad(e, item, resolve)
{
    try
    {
        let { activity_entity, activity_streams_entity } = MapDataLoader.parseGpx(e.target.result);
        
        // Konwersja koordynatów z standardu PUWG 1992 (EPSG:2180) do WGS84 (ESPG:4326)
    
        for (let point of activity_streams_entity.latlng)
        {
            // @ts-ignore
            [point[0], point[1]] = proj4(this.map.borders.gminy.projection, [point[1], point[0]]);
        }

        if (await this.activities.items.containsActivityId(activity_entity.id))
        {
            item.element.classList.add('gray');
            item.element_name.innerText = `${item.file.name} is duplicated`;
        }
        else
        {
            let activity = new Activity(activity_entity);
            await this.database.addActivity(activity);
            activity.streams = activity_streams_entity;
            await this.addActivityStreams(activity);
            let row = await this.activities.ensureActivitiesYearRow(activity.year, year => this.ensureActivitiesYear(year));
            this.activities.items.addActivity(activity);
            item.added = true;
            item.activity = activity;
            item.element.classList.add('green');
        }

        resolve();
    }
    catch (exception)
    {
        console.error(exception);
        item.element.classList.add('red');
        resolve();
    }
}