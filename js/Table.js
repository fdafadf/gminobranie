export class Table
{
    constructor(selector)
    {
        this.element = document.querySelector(selector);
        this.items = this.element.querySelector('.items');
        this.menu = this.element.querySelector('.menu');
        this.menu_button = this.element.querySelector('.menu-button');
        this.menu_button.addEventListener('click', this._onMenuButton.bind(this));
        this.element.addEventListener('click', e => this._onClick(e.target));
        this.element.querySelector('th input').addEventListener('click', this._onSelectAll.bind(this));
        this.element.querySelectorAll('button').forEach(button => button.addEventListener('click', () => { alert('Not implemented') }));
    }

    addRow(activity)
    {
        let tr = document.createElement('tr');
        let td_checkbox = document.createElement('td');
        let td_date = document.createElement('td');
        let td_name = document.createElement('td');
        let checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        try { td_date.innerText = new Date(activity.time).toLocaleString(); } 
        catch { td_date.innerText = activity.time; }
        td_name.innerText = activity.name;
        td_name.setAttribute('colspan', '2');
        td_checkbox.appendChild(checkbox);
        tr.appendChild(td_checkbox);
        tr.appendChild(td_date);
        tr.appendChild(td_name);
        this.items.appendChild(tr);
    }

    _onMenuButton()
    {
        this.menu.classList.toggle('hidden');
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