const DropDown_Template = `
<span>
    <span></span>
    <span>
        <div class="table-container">
            <table class="selectable">
                <thead></thead>
                <tbody></tbody>
            </table>
        </div>
    </span>
</span>`;

/**
 * @template {{ element: HTMLElement }} TControl
 */
export class DropDown
{
    /**
     * @param {HTMLElement} element 
     * @param {HTMLTableRowElement} header_row 
     */
    constructor(element, header_row)
    {
        /** @type {HTMLElement} */
        this.element = element;
        this.element.classList.add('button');
        this.element.classList.add('dropdown');
        this.element.innerHTML = DropDown_Template;
        /** @type {HTMLElement} */
        this.element_label = this.element.querySelector(':scope > span > span:nth-child(1)');
        /** @type {HTMLTableSectionElement} */
        this.element_thead = this.element.querySelector(':scope > span > span:nth-child(2) table thead');
        /** @type {HTMLTableSectionElement} */
        this.element_tbody = this.element.querySelector(':scope > span > span:nth-child(2) table tbody');
        this.element.addEventListener('click', this._handleClick.bind(this));
        this.clear();
        this.element_thead.appendChild(header_row);
        this.onCollapse = null;
        /** @type {(control: TControl) => void} */
        this.onRowSelected = null;
        /** @type {(control_a: TControl, control_b: TControl) => number} */
        this.comparer = null;
    }

    expand()
    {
        this.element.classList.add('checked');
    }

    /**
     * @param {(control: TControl) => boolean} predicate 
     * @returns 
     */
    find(predicate)
    {
        for (let i = 0; i < this.element_tbody.rows.length; i++)
        {
            // @ts-ignore
            let control = this.element_tbody.rows[i]?.control;

            if (predicate(control))
            {
                return control;
            }
        }
    }

    /**
     * @param {TControl} control 
     * @returns 
     */
    add(control)
    {
        if (this.comparer)
        {
            // @ts-ignore
            for (let row of this.element_tbody.rows)
            {
                if (this.comparer(control, row.control) < 0)
                {
                    this.element_tbody.insertBefore(control.element, row);
                    return control;
                }
            }
        }

        this.element_tbody.appendChild(control.element);
        return control;
    }

    clear()
    {
        this.selected_index_value = -1;
        // @ts-ignore
        this.element_tbody.replaceChildren();
    }

    refresh()
    {
        // @ts-ignore
        for (let row of this.element_tbody.rows)
        {
            row.control.refresh();
        }
    }
    
    /**
     * @param {MouseEvent} e 
     */
    _handleClick(e)
    {
        if (this.element.classList.contains('checked'))
        {
            this.onCollapse?.();
        }
        
        this.element.classList.toggle('checked');
        // @ts-ignore
        let tr = e.target.closest('tr');
        
        if (tr.control)
        {
            this.onRowSelected?.(this.selected_row = tr.control);
        }
    }
}
