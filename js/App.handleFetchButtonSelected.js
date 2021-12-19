import { ActivitiesYearControl } from "./ActivitiesYearControl.js";
import { Activity } from "./Activity.js";
import { App } from "./App.js";

/**
 * @this {App}
 * @param {ActivitiesYearControl} control 
 */
export async function handleFetchButtonSelected(control)
{
    control.element.closest('table').classList.add('strava-disabled');
    control.element_strava_count.innerText = "Counting...";
    let item = control.item;

    if (! item.entity.strava.all_pages_fetched)
    {
        let date_zero = new Date(0, 0, 1, 0, 0, 0, 0);
        let after = Math.round(date_zero.setFullYear(item.entity.id) / 1000);
        let before = Math.round(date_zero.setFullYear(item.entity.id + 1) / 1000);
        let page = item.entity.strava.last_fetched_page + 1; 
        /** @type {import("./App").ActivityEntity[]} */
        let entities;

        do
        {
            entities = await this.strava.getActivities({ page, after, before });
            
            for (let entity of entities)
            {
                if (this.activities.items.containsActivityId(entity.id))
                {
                    // How to show?
                }
                else
                {
                    entity.source = 'strava';
                    let activity = new Activity(entity);
                    this.database.addActivity(activity);
                    this.activities.items.addActivity(activity);
                }
            }

            item.entity.strava.last_fetched_page = page;
            await this.database.updateActivitiesYear(item);
            page++;
        }
        while (entities.length)

        item.entity.strava.all_pages_fetched = true;
        await this.database.updateActivitiesYear(item);
        //control.strava_status = 'synchronized';
    }

    let downloaded_count = 0;
    item.activities.forEach(activity => { if (activity.is_downloaded) downloaded_count++ });
    control.element_strava_count.innerText = `${downloaded_count} / ${item.activities.size}`;

    for (let activity_id of item.activities.keys())
    {
        let activity = item.activities.get(activity_id);

        if (! activity.is_downloaded)
        {
            downloaded_count++;
            control.element_strava_count.innerText = `${downloaded_count} / ${item.activities.size}`;
            /** @type {import("./App.js").ActivityStreamsEntity & { distance: number[][] }} */
            let activity_streams_entity = 
            {
                id: activity_id,
                latlng: null,
                distance: null
            };

            try
            {
                if (activity.entity.map?.id)
                {
                    if (activity.entity.map?.summary_polyline)
                    {
                        // @ts-ignore
                        activity_streams_entity.latlng = polyline.decode(activity.entity.map.summary_polyline);
                    }
                    else
                    {
                        activity.entity.error = 'Activity without track.';
                        this.database.updateActivity(activity);
                    }
                }
                else
                {
                    let strava_activity_streams = await this.strava.getActivityStreams(activity_id);
                    strava_activity_streams.forEach(stream => activity_streams_entity[stream.type] = stream.data);
                }
                
                // Konwersja koordynatów z standardu PUWG 1992 (EPSG:2180) do WGS84 (ESPG:4326)
            
                if (activity_streams_entity?.latlng)
                {
                    for (let point of activity_streams_entity.latlng)
                    {
                        // @ts-ignore
                        [point[0], point[1]] = proj4(this.map.borders.gminy.projection, [point[1], point[0]]);
                    }
                    
                    activity.streams = activity_streams_entity;
                    await this.addActivityStreams(activity);
                }
        
                this.activities.items.addActivity(activity);
            }
            catch (exception)
            {
                console.error(exception);

                if (exception == 'Bad request: 429')
                {
                    alert('Strava request limit has been reached.');
                    return;
                }

                activity.entity.error = exception;
                this.database.updateActivity(activity);
            }
        }
    }

    control.refresh();
    control.element.closest('table').classList.remove('strava-disabled');
}