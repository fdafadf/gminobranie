import { ActivitiesYear } from "./ActivitiesYear.js";
import { ActivitiesGroupCollection } from "./ActivitiesGroupCollection.js";

export class ActivitiesYearControl 
{
    /**
     * @param {ActivitiesGroupCollection} item 
     */
    constructor(item)
    {
        /** @type {ActivitiesGroupCollection} */
        this.item = item;
        /** @type {(control: ActivitiesYearControl) => void} */
        this.onFetchRequested = null;
        /** @type {HTMLTableRowElement & { control: any }} */
        // @ts-ignore
        this.element = document.createElement('tr');
        this.td_label = document.createElement('td');
        this.td_gpx = document.createElement('td');
        this.td_gpx_new = document.createElement('td');
        this.td_gpx_new_label = document.createElement('span');
        /** @type {HTMLElement & { status: string }} */
        // @ts-ignore
        this.td_strava = document.createElement('td');
        this.element_strava_count = document.createElement('span');
        this.element_strava_fetch = document.createElement('span');
        this.element_strava_synchronize = document.createElement('span');
        this.element_strava_progress = document.createElement('span');
        this.element_strava_count.classList.add('count');
        // @ts-ignore
        this.element_strava_fetch.innerHTML = feather.icons.download.toSvg();
        this.element_strava_fetch.classList.add('button');
        this.element_strava_fetch.classList.add('strava');
        this.element_strava_fetch.classList.add('fetch');
        this.element_strava_fetch.addEventListener('click', this._handleFetchButtonClick.bind(this));
        // @ts-ignore
        this.element_strava_synchronize.innerHTML = feather.icons['refresh-ccw'].toSvg();
        this.element_strava_synchronize.classList.add('button');
        this.element_strava_synchronize.classList.add('strava');
        this.element_strava_synchronize.classList.add('synchronize');
        this.element_strava_synchronize.addEventListener('click', this._handleFetchButtonClick.bind(this));
        // @ts-ignore
        this.element_strava_progress.innerHTML = feather.icons.loader.toSvg();
        this.element_strava_progress.classList.add('strava');
        this.element_strava_progress.classList.add('progress');
        this.element_strava_progress.classList.add('rotate-animation');
        this.td_gpx.classList.add('gpx-total');
        this.td_gpx_new.style.display = 'none';
        this.td_gpx_new.appendChild(this.td_gpx_new_label);
        this.td_gpx_new.classList.add('gpx-new');
        this.td_strava.style.textAlign = 'end';
        this.td_strava.style.padding = '0';
        this.td_strava.appendChild(this.element_strava_count);
        this.td_strava.appendChild(this.element_strava_fetch);
        this.td_strava.appendChild(this.element_strava_synchronize);
        this.td_strava.appendChild(this.element_strava_progress);
        this.td_label.innerText = item.title;
        this.element.control = this;
        this.element.appendChild(this.td_label);
        this.element.appendChild(this.td_gpx);
        this.element.appendChild(this.td_gpx_new);
        this.element.appendChild(this.td_strava);
    }

    refresh()
    {
        let gpx = this.item.groups.get('gpx');

        if (gpx.activities.length)
        {
            this.td_gpx.innerText = `${gpx.activities.length - gpx.new_activities_count}`;
    
            if (gpx.new_activities_count)
            {
                this.td_gpx_new_label.innerText = `+${gpx.new_activities_count}`;
                this.td_gpx.colSpan = 1;
                this.td_gpx_new.style.display = null;
            }
            else
            {
                this.td_gpx.colSpan = 2;
                this.td_gpx_new.style.display = 'none';
            }
        }
        else
        {
            this.td_gpx.innerText = '';
            this.td_gpx.colSpan = 2;
            this.td_gpx_new.style.display = 'none';
        }

        this.td_strava.classList.remove('not-fetched', 'in-progress', 'synchronized');

        if (this.item.entity.strava)
        {
            let strava = this.item.groups.get('strava');

            if (strava)
            {
                let downloaded_count = strava.activities.filter(a => a.is_downloaded).length;

                if (this.item.entity.strava?.all_pages_fetched && downloaded_count == strava.activities.length)
                {
                    this.td_strava.classList.add('synchronized');
                }
                else
                {
                    this.td_strava.classList.add('not-fetched');
                }
                
                this.element_strava_count.innerText = `${downloaded_count} / ${strava.activities.length}`;
            }
            else
            {
                this.element_strava_count.innerText = '';
            }
        }
    }

    get strava_status()
    {
        return this.td_strava.status;
    }

    set strava_status(value)
    {
        this.td_strava.status = value;
        this.td_strava.classList.remove('not-fetched', 'in-progress', 'synchronized');
        this.td_strava.classList.add(value);
    }

    /**
     * @param {MouseEvent} e 
     */
    _handleFetchButtonClick(e)
    {
        e.preventDefault(); 
        e.stopPropagation();
        this.strava_status = 'in-progress';
        this.onFetchRequested(this);
    }
}