import { DropDown } from './DropDown.js';
import { ActivitiesYearControl } from './ActivitiesYearControl.js';
import { ActivitiesGroupCollection } from "./ActivitiesGroupCollection.js";
import { ActivitiesYearCollection } from "./ActivitiesYearCollection.js";

export class ActivitiesControl 
{
    constructor() 
    {
        /** @type {HTMLElement} */
        let year_dropdown_button = document.querySelector('td#year-button');
        let year_dropdown_header = document.createElement('tr');
        
        for (let column of ['Year', 'GPX', 'STRAVA'])
        {
            let th = document.createElement('th');
            th.innerText = column;
            year_dropdown_header.appendChild(th);
        }

        // @ts-ignore
        year_dropdown_header.children[1].colSpan = 2;
        /** @type {DropDown<ActivitiesYearControl>} */
        this.dropdown = new DropDown(year_dropdown_button, year_dropdown_header);
        this.dropdown.comparer = (a, b) => b.item.entity.id - a.item.entity.id;
        this.dropdown.onCollapse = this._handleDropdownCollapse.bind(this);
        this.items = new ActivitiesYearCollection();
        this.ensureActivitiesYearRow(0, async _ => this.items);
    }

    /**
     * @type {ActivitiesYearControl}
     */
    get selected_activities_year_control()
    {
        return this.dropdown.selected_row;
    }

    /**
     * @param {number} year
     * @param {(year: number) => Promise<ActivitiesGroupCollection>} factory
     * @returns {Promise<ActivitiesYearControl>}
     */
    async ensureActivitiesYearRow(year, factory)
    {
        return this.dropdown.find(control => control?.item?.entity?.id == year)
            ?? this.dropdown.add(new ActivitiesYearControl(await factory(year)));
    }

    async refresh() 
    {
        for (let activities_year of this.items.items.values())
        {
            let control = this.dropdown.find(control => control?.item?.entity?.id == activities_year.entity.id);

            if (! control)
            {
                control = new ActivitiesYearControl(activities_year);
                this.dropdown.add(control);
            }
        }
    }
    
    _handleDropdownCollapse()
    {
        for (let activities_year of this.items.items.values())
        {
            activities_year.groups.get('gpx').new_activities_count = 0;
        }
        
        this.dropdown.refresh();
    }
}
