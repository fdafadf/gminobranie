import { Map } from './Map.js';
import { MapBorders } from './MapBorders.js';
import { MapActivities } from './MapActivities.js';
import { ActivitiesTable } from './ActivitiesTable.js';
import { StravaConnectionManager } from './StravaConnectionManager.js';
import { ActivitiesControl } from './ActivitiesControl.js';
import { ToggleButton } from './ToggleButton.js';
import { StravaConnectButton } from './StravaConnectButton.js';
import { Chart } from './Chart.js';
import { ProcesssFilesDialog } from './ProcesssFilesDialog.js';
import { AppNotifications } from './AppNotifications.js';
import { AppDatabase } from './AppDatabase.js';
import { Activity } from './Activity.js';
import { ActivitiesYear } from "./ActivitiesYear.js";
import { ActivitiesYearControl } from './ActivitiesYearControl.js';
import { handleDrop } from './App.handleDrop.js';
import { handleFetchButtonSelected } from './App.handleFetchButtonSelected.js';

/**
 * @typedef {{ left: number, right: number, top: number, bottom: number }} Rectangle
 * @typedef {{ min_x: number, max_x: number, min_y: number, max_y: number }} ShapesArea
 * @typedef { ShapesArea & { background_color: any, background_color_selected: any, number: any, paths: Path2D[], activities: Activity[], parts: number[], points: number[] }} ShapesItem
 * @typedef { ShapesArea & { items: ShapesItem[] }} Shapes
 * @typedef {{ rows: string[][] }} Labels
 * @typedef {{ shapes: Shapes, labels: Labels, projection: string }} LabeledShapes
 * @typedef {{ kraj: { shapes: Shapes }, wojewodztwa: { shapes: Shapes }, gminy: LabeledShapes }} Borders
 * @typedef {{ id: string, name: string, start_date: string, distance: string, source: string, visited_communities: string[], map?: { id: string, summary_polyline: string }, type: string, error?: any }} ActivityEntity
 * @typedef {{ id: string, latlng: number[][], error?: any }} ActivityStreamsEntity
 * @typedef {{ id: number, strava?: { all_pages_fetched: boolean, all_activities_downloaded: boolean, last_fetched_page: number }}} ActivitiesYearEntity
 */

export class App
{
    /**
     * @param {Borders} borders 
     * @param {StravaConnectionManager} strava 
     */
    constructor(borders, strava)
    {
        this.strava = strava;
        this.elements =
        {
            header: document.querySelector('header'),
            side: document.querySelector('div#side'),
            chart_dialog: document.querySelector('#chart-dialog'),
            chart_button: document.querySelector('td#chart-button'),
            /** @type {HTMLElement} */
            map_container: document.querySelector('div#map-container'),
            /** @type {HTMLElement} */
            passed_counter: document.querySelector('td#passed-counter'),
            activities_counter: document.querySelector('td#activities-counter'),
            /** @type {HTMLElement} */
            gmina: document.querySelector('td#gmina'),
        }

        this.elements.chart_button.addEventListener('click', this._handleChartButtonClick.bind(this));
        this.elements.chart_dialog.addEventListener('click', this._handleChartDialogClick.bind(this));

        this.activities = new ActivitiesControl();

        this.connect_button = new StravaConnectButton();
        this.connect_button.element.addEventListener('click', this._handleConnectButtonClick.bind(this));

        this.activities_table = new ActivitiesTable();
        this.activities_table.element_remove_button.addEventListener('click', this._handleRemoveButtonClick.bind(this));
        this.activities_table.onSelectionChanged = this._handleTableSelectionChanged.bind(this);
        
        this.chart = new Chart();
        
        this.show_activities_list_button = new ToggleButton(document.querySelector('#activity-list-button'));
        this.show_activities_list_button.checked = true;
        this.show_activities_list_button.element.addEventListener('click', this._handleActivitiesListButtonClick.bind(this));
    
        this.processing_files_dialog = new ProcesssFilesDialog();

        this.notifications = new AppNotifications();

        this._handleFirstInteraction = this._handleFirstInteraction.bind(this);
        window.addEventListener('click', this._handleFirstInteraction);
        
        this.map = new Map(this.elements.map_container.clientWidth, this.elements.map_container.clientHeight, new MapBorders(borders), new MapActivities(borders.gminy.projection));
        this.map.onCommunityHovered = this._handleMapCommunityHovered.bind(this);
        this.map.onCommunitySelected = this._handleMapCommunitySelected.bind(this);

        this.elements.header.appendChild(this.connect_button.element);
        this.elements.side.appendChild(this.activities_table.element);
        this.elements.chart_dialog.appendChild(this.chart.element);
        this.elements.map_container.appendChild(this.map.element);
        
        this.database = new AppDatabase();
    }

    async initialize()
    {
        let activities = await this.database.getActivities();

        for (let activity of activities)
        {
            await this.ensureActivitiesYear(activity.year);
            this.activities.items.addActivity(activity);
        }

        let streams = await this.database.getActivityStreams();
        
        for (let activity_streams of streams)
        {
            let activity = this.activities.items.findActivity(activity_streams.id);

            if (activity)
            {
                activity.streams = activity_streams;
            }
        };
        
        if (this.strava.is_connected)
        {
            await this._handleStravaConnected();
        }
        else
        {
            this._handleStravaDisconnected();
        }

        let current_year = new Date().getFullYear();
        let current_activities_year = this.ensureActivitiesYear(current_year);
        this.activities.refresh();

        // Default selected year is current.
        this.activities.dropdown.selected_row = await this.activities.ensureActivitiesYearRow(current_year, _ => current_activities_year);

        // Load programmatically selected year.
        await this._handleSelectedActivitiesYearChanged();

        // Remove green labels for new activties.
        this.activities._handleDropdownCollapse();

        // Handlers.
        this.activities.dropdown.onRowSelected = this._handleSelectedActivitiesYearChanged.bind(this);
        window.addEventListener('dragover', this._handleDragOver.bind(this));
        window.addEventListener('dragenter', this._handleDragEnter.bind(this));
        window.addEventListener('drop', handleDrop.bind(this));
        this._registerMapContainerResizeHandler();
    }

    /**
     * @param {number} year 
     * @returns 
     */
    async ensureActivitiesYear(year)
    {
        let activities_year = this.activities.items.get(year);

        if (! activities_year)
        {
            activities_year = await this.database.getActivitiesYear(year);

            if (! activities_year)
            {
                let activities_year_entity =
                {
                    id: year
                };
                this.database.add('ActivitiesYear', activities_year_entity);
                activities_year = new ActivitiesYear(activities_year_entity);
            }

            this.activities.items.add(activities_year);
        }

        return activities_year;
    }

    /**
     * @param {Activity} activity 
     */
    async removeActivity(activity)
    {
        this.database.removeActivity(activity);
        this.database.removeActivityStreams(activity.streams);
        this.activities.items.removeActivity(activity);
    }
     
    /**
     * @param {Activity} activity 
     */
    async addActivityStreams(activity)
    {
        activity.entity.visited_communities = this.map.borders.calculateVisitedCommunities(activity.streams.latlng);
        await this.database.updateActivity(activity);
        await this.database.addActivityStreams(activity.streams);
    }

    /**
     * @param {DragEvent} e 
     * @returns 
     */
    _handleDragOver(e)
    {
        e.preventDefault();

        // @ts-ignore
        if (e.dataTransfer.types.includes("Files"))
        {
            e.dataTransfer.dropEffect = 'copy';
            return true;
        }
        else
        {
            e.dataTransfer.dropEffect = 'none';
        }
    }

    /**
     * @param {DragEvent} e 
     * @returns 
     */
    _handleDragEnter(e)
    {
    }

    /**
     * @param {DragEvent} e 
     * @returns 
     */
    _handleDragLeave(e)
    {
        e.preventDefault();
    }
    
    async _handleSelectedActivitiesYearChanged()
    {
        let selected_activities_year = this.activities.selected_activities_year_control.item;
        this.activities_table.set(selected_activities_year);
        this.map.setActivities(selected_activities_year);
        await this._handleSelectedActivitiesYearDataChanged();
        this.map.redraw();
    }
    
    async _handleSelectedActivitiesYearDataChanged()
    {
        let selected_activities_year = this.activities.selected_activities_year_control.item;
        this.activities.dropdown.element_label.innerText = `${selected_activities_year.title}`;
        this.elements.passed_counter.innerText = selected_activities_year.findVisitedCommunities().size.toString();
    }
    
    async _handleActivitiesYearsDataChanged()
    {
        this.activities.dropdown.refresh();
    }

    _handleActivitiesListButtonClick()
    {
        if (this.show_activities_list_button.checked)
        {
            document.querySelector('div#side').classList.remove('hidden');
        }
        else
        {
            document.querySelector('div#side').classList.add('hidden');
        }
    }

    _handleMapCommunityHovered()
    {
        if (this.map.hovered_community)
        {
            let row = this.map.borders.gminy.labels.rows[this.map.hovered_community.number - 1];
            let name = row[2];
            let code = row[1].trim();
            this.elements.gmina.innerText = `${name}`; //`${name} (${code})`;
        }
        else 
        {
            this.elements.gmina.innerText = '';
        }
    }

    _handleMapCommunitySelected()
    {
        this.activities_table.select(this.map.selected_community?.activities);
        this.map.redraw();
    }

    async _handleFirstInteraction()
    {
        window.removeEventListener('click', this._handleFirstInteraction);

        //if (localStorage.get)
        this.notifications.add('You can drop GPX files')
    }

    /**
     * @param {Event} e 
     */
    async _handleRemoveButtonClick(e)
    {
        let rows = this.activities_table.selected_rows;
        rows.forEach(row => row.remove());
        rows.forEach(row => this.removeActivity(row.item));
        this._handleActivitiesYearsDataChanged();
        this._handleSelectedActivitiesYearChanged();
    }

    _handleTableSelectionChanged()
    {
        this.map.redraw();
    }

    async _handleConnectButtonClick()
    {
        if (this.connect_button.user_name)
        {
            this.strava.disconnect();
            this.connect_button.user_name = null;
            this._handleStravaDisconnected();
        }
        else
        {
            this.connect_button.element.classList.add('disabled');
            await this.strava.connect();
            await this._handleStravaConnected();
            this.connect_button.element.classList.remove('disabled');
        }
    }

    async _handleStravaConnected()
    {
        let created_at_year = new Date(this.strava.is_connected.created_at).getFullYear();
        let current_year = new Date().getFullYear();

        for (let year = created_at_year; year <= current_year; year++)
        {
            let row = await this.activities.ensureActivitiesYearRow(year, year => this.ensureActivitiesYear(year));
            let entity = row.item.entity;

            if (entity.strava)
            {
                // if (entity.strava.all_pages_fetched && entity.strava.all_activities_downloaded)
                // {
                //     row.strava_status = 'synchronize';
                // }
                // else
                // {
                //     row.strava_status = 'not-fetched';
                // }
            }
            else
            {
                //row.strava_status = 'not-fetched';
                entity.strava =
                {
                    all_pages_fetched: false,
                    all_activities_downloaded: false,
                    last_fetched_page: 0
                }

                this.database.updateActivitiesYear(row.item);
            }

            if (! row.onFetchRequested)
            {
                row.onFetchRequested = handleFetchButtonSelected.bind(this);
            }
        }

        this.connect_button.user_name = this.strava.athlete.firstname;
        document.body.classList.remove('strava-disabled');
    }

    _handleStravaDisconnected()
    {
        document.body.classList.add('strava-disabled');
    }

    _handleChartButtonClick()
    {
        /** @type {{ title: string, value: number, year: number }[]} */
        let chart_items = [];

        for (let activities_year of this.activities.items.items.values())
        {
            let title = activities_year.entity.id.toString();
            let value = activities_year.calculateCommunitiesVisitCount();
            chart_items.push({ title, value, year: activities_year.entity.id });
        }
        
        chart_items.sort((a, b) => a.year - b.year);
        this.chart.set(chart_items);
        this.elements.chart_dialog.classList.add('open');
    }

    _handleChartDialogClick()
    {
        this.elements.chart_dialog.classList.remove('open');
    }

    _registerMapContainerResizeHandler()
    {
        window.addEventListener('resize', e => this._handleMapContainerResize());
    }

    _handleMapContainerResize()
    {
        this.map.resize(this.elements.map_container.clientWidth, this.elements.map_container.clientHeight);
    }
}
