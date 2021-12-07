export class Table
{
    constructor(element)
    {
        this.element = element;
        this.items = this.element.querySelector('.items');
        this.menu = this.element.querySelector('tbody.menu-item');
        this.menu_button = this.element.querySelector('.menu-button');
        this.menu_button.addEventListener('click', this._onMenuButton.bind(this));
        this.element.addEventListener('click', e => this._onClick(e.target));
        this.element.querySelector('th input').addEventListener('click', this._onSelectAll.bind(this));
        this.element.querySelectorAll('th:first-child').forEach(th => th.classList.add('menu-item'));
        this.element.addEventListener('dragover', this._handleDragOver.bind(this));
        this.element.addEventListener('dragenter', this._handleDragEnter.bind(this));
        //this.element.addEventListener('dragleave', this._handleDragLeave.bind(this));
        //this.element.addEventListener('mouseleave', this._handleDragLeave.bind(this));
        this.element.addEventListener('drop', this._handleDrop.bind(this));
    }

    addRow(activity)
    {
        let tr = document.createElement('tr');
        let td_checkbox = document.createElement('td');
        let td_date = document.createElement('td');
        let td_name = document.createElement('td');
        let td_distance = document.createElement('td');
        let checkbox = document.createElement('input');
        let a_name = document.createElement('a');
        checkbox.type = 'checkbox';
        try { td_date.innerText = new Date(activity.start_date).toLocaleDateString(); } 
        catch { td_date.innerText = activity.start_date; }
        a_name.innerText = activity.name;
        a_name.href = `https://www.strava.com/activities/${activity.id}`;
        a_name.target = '_blank';
        td_date.classList.add('data-type-date');
        td_distance.classList.add('data-type-date');
        td_name.appendChild(a_name);
        td_name.setAttribute('colspan', '2');
        try 
        { 
            td_distance.innerText = activity.distance 
                ? `${Math.round(parseFloat(activity.distance) / 1000)} km`
                : '';
        } 
        catch {}
        td_checkbox.classList.add('menu-item');
        td_checkbox.appendChild(checkbox);
        tr.appendChild(td_checkbox);
        tr.appendChild(td_date);
        tr.appendChild(td_distance);
        tr.appendChild(td_name);
        tr.item = activity;
        tr.onmouseenter = this._handleRowMouseEnter.bind(this);
        tr.onmouseleave = this._handleRowMouseLeave.bind(this);
        this.items.appendChild(tr);
    }

    get selected_rows()
    {
        return [...this.items.querySelectorAll('input:checked')].map(input => input.closest('tr'));
    }

    _handleRowMouseEnter(e)
    {
        e.target.closest('tr').item.hover = true;
        this.onRowHoverChanged();
    }

    _handleRowMouseLeave(e)
    {
        e.target.closest('tr').item.hover = false;
        this.onRowHoverChanged();
    }

    _handleDragOver(e)
    {
        e.preventDefault();

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

    _handleDragEnter(e)
    {
        if (this._handleDragOver(e))
        {
            this.element.querySelector('.drop').style.display = 'table-row-group';
        }
    }

    _handleDragLeave(e)
    {
        e.preventDefault();
        this.element.querySelector('.drop').style.display = 'none';
    }

    async _handleDrop(e)
    {
        e.preventDefault();
        this.element.querySelector('.drop').style.display = 'none';

        function readFile(file)
        {
            return new Promise(resolve => 
            {
                let file_reader = new FileReader();
                file_reader.onload = e => resolve(e.target.result);
                file_reader.readAsText(file);
            });
        }

        this.onFilesReceived(await Promise.all([...e.dataTransfer.files].map(readFile)));
    }

    _onMenuButton()
    {
        this.element.classList.toggle('expanded-menu');
    }

    _onClick(target)
    {
        if (target.closest('tbody')?.classList.contains('items'))
        {
            if (target.tagName == 'TD')
            {
                target.parentElement.classList.toggle('selected');
                let checkbox = target.parentElement.querySelector('input');
                checkbox.checked = !checkbox.checked;
            }
            else if (target.tagName == 'INPUT')
            {
                target.closest('tr').classList.toggle('selected');
            }
        }
    }

    _onSelectAll(e)
    {
        if (e.target.checked)
        {
            this.element.querySelectorAll('input').forEach(e => e.checked = true);
            this.items.querySelectorAll('tr').forEach(e => e.classList.add('selected'));
        }
        else
        {
            this.element.querySelectorAll('input').forEach(e => e.checked = false);
            this.items.querySelectorAll('tr').forEach(e => e.classList.remove('selected'));
        }
    }
}