import { Map } from './Map.js';
import { MapBorders } from './MapBorders.js';
import { MapActivities } from './MapActivities.js';
import { MapDataLoader } from './MapDataLoader.js';
import { Table } from './Table.js';
import { ConnectionManager } from './Strava.js';
import { Database } from './Database.js';

class ConnectButton
{
    constructor(element)
    {
        this.element = element;
        this.user_name_element = element.children[0].children[1];
    }
    
    get user_name()
    {
        return this.user_name_element.innerText;
    }

    set user_name(value)
    {
        if (value)
        {
            this.element.classList.add('connected');
            this.element.classList.remove('disconnected');
        }
        else
        {
            this.element.classList.add('disconnected');
            this.element.classList.remove('connected');
        }
        
        this.user_name_element.innerText = value ?? '';
    }
}

export class App
{
    async initialize(borders_file_names, base_path)
    {
        this.elements =
        {
            fetch_button: document.querySelector('button#fetch-button'),
            remove_button: document.querySelector('button#remove-button'),
            map_container: document.querySelector('div#map-container'),
            passed_counter: document.querySelector('td#passed-counter'),
            activities_table: document.querySelector('table#activities-table'),
            activities_counter: document.querySelector('td#activities-counter'),
            gmina: document.querySelector('td#gmina'),
            connect_button: document.querySelector('td#connect-button'),
            status_bar: document.querySelector('div#status-bar'),
        }

        this.loaded_activities = {};
        this.connect_button = new ConnectButton(this.elements.connect_button);
        this.strava = new ConnectionManager(base_path);
        this.database = new Database();
        this.activities_table = new Table(this.elements.activities_table);
        this.data_loader = new MapDataLoader(base_path);
        this.borders = await this.data_loader.fetchBorders(borders_file_names);
        this.map_borders = new MapBorders(this.borders);
        this.map_activities = new MapActivities();
        this.map = new Map(this.elements.map_container.clientWidth, this.elements.map_container.clientHeight, this.map_borders, this.map_activities);
        this.elements.map_container.appendChild(this.map.element);
        
        this.activities_table.onRowHoverChanged = this._handleActivityTableRowHoverChanged.bind(this);
        this.map.onSelectedBordersItemChanged = this._handleSelectedBordersItemChanged.bind(this);
        this.activities_table.onFilesReceived = this._handleFilesReceived.bind(this);
        this.connect_button.element.addEventListener('click', this._handleConnectButtonClick.bind(this));
        this.elements.fetch_button.addEventListener('click', this._handleFetchButtonClick.bind(this));
        this.elements.remove_button.addEventListener('click', this._handleRemoveButtonClick.bind(this));
        this._registerMapContainerResizeHandler();

        await this.strava.checkAuthorizationRedirect();
        
        if (this.strava.is_connected)
        {
            this._handleStravaConnected();
        }

        await this.loadActivitiesFromDatabase();
    }

    async loadActivitiesFromDatabase()
    {
        let activities = await this.database.items('Activities');

        for (let activity_id in activities)
        {
            this._handleActivityLoadedFromDatabase(activities[activity_id]);
        }
        
        this._handleActivityCollectionModified();
    }

    showActivity(activity)
    {
        this.activities_table.addRow(activity);
        activity.path = activity.streams.filter(s => s.type == 'latlng')[0].data;
        MapDataLoader.normalizeCoordinates(activity.path, this.borders.gminy.projection);
        this.map_borders.updateVisitedCount(activity);
        this.map_activities.add(activity);
    }
    
    _handleStravaConnected()
    {
        this.connect_button.user_name = this.strava.athlete.firstname;
    }
    
    _handleActivityLoadedFromDatabase(activity)
    {
        this.loaded_activities[activity.id] = activity;
        if (activity.type == "VirtualRide") return;
        this.showActivity(activity);
    }

    async _handleFilesReceived(files)
    {
        for (let file of files)
        {
            let activity = MapDataLoader.parseActivity(file);
            await this.database.add('Activities', activity);
            this.showActivity(activity);
        }

        this._handleActivityCollectionModified();
    }

    _handleActivityCollectionModified()
    {
        this.elements.passed_counter.innerText = this.borders.gminy.shapes.items.filter(item => item.visited_count > 0).length;
        this.elements.activities_counter.innerText = this.map_activities.items.length;
        this.map.redraw();
    }

    _handleActivityTableRowHoverChanged()
    {
        this.map.draw();
    }

    async _handleConnectButtonClick()
    {
        if (this.connect_button.user_name)
        {
            this.strava.disconnect();
            this.connect_button.user_name = null;
        }
        else
        {
            this.connect_button.element.classList.add('disabled');
            await this.strava.connect();
            this._handleStravaConnected();
            this.connect_button.element.classList.remove('disabled');
        }
    }

    async _handleRemoveButtonClick(e)
    {
        for (let row of this.activities_table.selected_rows)
        {
            this.map_activities.remove(row.item);
            this.map_borders.updateVisitedCount(row.item, true);
            row.parentElement.removeChild(row);
            this.database.delete('Activities', row.item.id);
        }

        this._handleActivityTableRowHoverChanged();
        this._handleActivityCollectionModified();
    }

    async _handleFetchButtonClick(e)
    {
        if (this.strava.is_connected)
        {
            e.target.disabled = true;
            this.elements.status_bar.innerText = 'Loading...';
            this.elements.status_bar.style.display = 'block';
            let activities = await this.strava.getActivities();
            let index = 1;

            for (let activity of activities)
            {
                this.elements.status_bar.innerText = `Loading ${index}/${activities.length}...`;

                if (this.loaded_activities[activity.id])
                {
                    continue;
                }

                activity.streams = await this.strava.getActivityStreams(activity.id);
                await this.database.add('Activities', activity);
                this._handleActivityLoadedFromDatabase(activity);
                index++;
            }

            this._handleActivityCollectionModified();
            this.elements.status_bar.style.display = 'none';
            e.target.disabled = false;
        }
    }

    _handleSelectedBordersItemChanged()
    {
        if (this.map.selected_borders_item)
        {
            let row = this.borders.gminy.labels.rows[this.map.selected_borders_item.number - 1];
            let name = row[2];
            let code = row[1].trim();
            this.elements.gmina.innerText = `${name}`; //`${name} (${code})`;
        }
        else 
        {
            this.elements.gmina.innerText = '';
        }
    }

    _registerMapContainerResizeHandler()
    {
        this.elements.map_container.style.position = 'relative';
        this.map.element.style.position = 'absolute';
        let resize_observer = new ResizeObserver(this._handleMapContainerResize.bind(this));
        resize_observer.observe(this.elements.map_container);
    }

    _handleMapContainerResize()
    {
        this.map.resize(this.elements.map_container.clientWidth, this.elements.map_container.clientHeight);
    }
}
