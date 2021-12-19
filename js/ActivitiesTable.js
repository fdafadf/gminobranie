import { Activity } from "./Activity.js";
import { ActivitiesYear } from "./ActivitiesYear.js";
import { ActivitiesGroupCollection } from "./ActivitiesGroupCollection.js";

/** @typedef {(HTMLTableRowElement & { item: Activity }) } ActivitiesTableRow */

const CONTROL_CONTENT_TEMPLATE = `
<table id="activities-table" class="selectable">
    <thead>
        <tr>
            <th><input type="checkbox" /></th>
            <th>Date</th>
            <th>Distance</th>
            <th>Name</th>
        </tr>
    </thead>
    <tbody class="activities-table-menu">
        <tr>
            <td colspan="4">
                <button class="button remove-button disabled">Remove Selected</button>
            </td>
        </tr>
    </tbody>
    <tbody class="items">
    </tbody>
</table>
`

export class ActivitiesTable
{
    constructor()
    {
        this.element = document.createElement('div');
        this.element.classList.add('table-container');
        this.element.innerHTML = CONTROL_CONTENT_TEMPLATE;
        this.element_table = this.element.querySelector('#activities-table');
        /** @type {HTMLElement} */
        this.element_items = this.element.querySelector('.items');
        this.element_menu = this.element.querySelector('.activities-table-menu');
        this.element_remove_button = this.element.querySelector('.remove-button');
        // @ts-ignore
        this.element_remove_button.innerHTML = feather.icons.trash.toSvg();
        this.element.addEventListener('click', e => this._handleClick(e.target));
        this.element.querySelector('th input').addEventListener('click', this._onSelectAll.bind(this));
        this.element.querySelectorAll('th:first-child').forEach(th => th.classList.add('menu-item'));
        // @ts-ignore
        this.onSelectionChanged = _ => {};
    }

    /**
     * @param {ActivitiesGroupCollection} activities_year 
     */
    set(activities_year)
    {
        // @ts-ignore
        this.element_items.replaceChildren();
        
        for (let group of activities_year.groups.values())
        {
            for (let activity of group.activities)
            {
                this.addRow(activity);
            }
        }
    }

    /**
     * @param {Activity} activity 
     */
    addRow(activity)
    {
        let tr = document.createElement('tr');
        let td_checkbox = document.createElement('td');
        let td_date = document.createElement('td');
        let td_name = document.createElement('td');
        let td_distance = document.createElement('td');
        let checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        try { td_date.innerText = new Date(activity.start_date).toLocaleDateString(); } 
        catch { td_date.innerText = activity.entity.start_date; }
        td_date.classList.add('data-type-date');
        td_distance.classList.add('data-type-date');

        if (activity.entity.source == 'strava')
        {
            let a_name = document.createElement('a');
            a_name.innerText = activity.entity.name;
            a_name.href = `https://www.strava.com/activities/${activity.entity.id}`;
            a_name.target = '_blank';

            td_name.appendChild(a_name);

            if (activity.entity.type == 'VirtualRide')
            {
                let icon_container = document.createElement('span');
                icon_container.style.marginLeft = '0.5em';
                // @ts-ignore
                icon_container.innerHTML = feather.icons['monitor'].toSvg();
                td_name.appendChild(icon_container);
            }

            if (activity.entity.error)
            {
                let icon_container = document.createElement('span');
                icon_container.style.marginLeft = '0.5em';
                // @ts-ignore
                icon_container.innerHTML = feather.icons['alert-circle'].toSvg();
                td_name.appendChild(icon_container);
            }

        }
        else
        {
            td_name.innerText = activity.entity.name;
        }

        td_name.setAttribute('colspan', '2');
        try 
        { 
            td_distance.innerText = activity.entity.distance 
                ? `${Math.round(parseFloat(activity.entity.distance) / 1000)} km`
                : '';
        } 
        catch {}
        td_checkbox.appendChild(checkbox);
        tr.appendChild(td_checkbox);
        tr.appendChild(td_date);
        tr.appendChild(td_distance);
        tr.appendChild(td_name);
        // @ts-ignore
        tr.item = activity;
        this.element_items.appendChild(tr);
    }

    /**
     * @param {Activity[]} activities 
     */
    select(activities)
    {
        this.unselectAll();

        if (activities)
        {
            /** @type {Object.<string, boolean>} */
            let ids = {};
            activities.forEach(activity => ids[activity.entity.id] = true);
            this.rows().forEach(row => 
            {
                if (ids[row.item.entity.id])
                {
                    row.item.selected = true;
                    row.classList.add('selected');
                    row.querySelector('input').checked = true;
                }
            });
        }
        
        this._handleSelectionChanged();
    }

    selectAll()
    {
        this.element.querySelectorAll('input').forEach(e => e.checked = true);
        this.rows().forEach(tr => { 
            tr.classList.add('selected');
            tr.item.selected = true;
        });
        this.element_table.classList.add('some-selected');
    }

    unselectAll()
    {
        this.element.querySelectorAll('input').forEach(e => e.checked = false);
        this.rows().forEach(tr => { 
            tr.classList.remove('selected');
            tr.item.selected = false;
        });
        this.element_table.classList.remove('some-selected');
    }

    /**
     * @returns {NodeListOf<ActivitiesTableRow>}
     */
    rows()
    {
        // @ts-ignore
        return this.element_items.querySelectorAll('tr');
    }

    /**
     * @returns {ActivitiesTableRow[]}
     */
    get selected_rows()
    {
        // @ts-ignore
        return [...this.element_items.querySelectorAll('input:checked')].map(input => input.closest('tr'));
    }

    /**
     * @param {EventTarget} target 
     */
    _handleClick(target)
    {
        // @ts-ignore
        if (target.closest('tbody')?.classList.contains('items'))
        {
            /** @type {ActivitiesTableRow} */
            // @ts-ignore
            let tr = target.closest('tr');

            // @ts-ignore
            if (target.tagName == 'TD')
            {
                tr.item.selected = tr.classList.toggle('selected');
                this._handleSelectionChanged();
                let checkbox = tr.querySelector('input');
                checkbox.checked = !checkbox.checked;
                this.onSelectionChanged?.();
            }
            // @ts-ignore
            else if (target.tagName == 'INPUT')
            {
                tr.classList.toggle('selected');
            }
        }
    }

    _handleSelectionChanged()
    {
        if (this.element.querySelector('tr.selected'))
        {
            this.element_table.classList.add('some-selected');
            this.element_remove_button.classList.remove('disabled');
        }
        else
        {
            this.element_table.classList.remove('some-selected');
            this.element_remove_button.classList.add('disabled');
        }
    }

    /**
     * @param {any} e 
     */
    _onSelectAll(e)
    {
        if (e.target.checked)
        {
            this.selectAll();
            this._handleSelectionChanged();
            this.onSelectionChanged?.();
        }
        else
        {
            this.unselectAll();
            this._handleSelectionChanged();
            this.onSelectionChanged?.();
        }
    }
}