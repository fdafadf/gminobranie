export class Chart
{
    constructor()
    {
        this.element = document.createElement('div');
        this.element_values = document.createElement('div');
        this.element_columns = document.createElement('div');
        this.element_labels = document.createElement('div');
        this.element.classList.add('chart');
        this.element.appendChild(this.element_columns);
        this.element.appendChild(this.element_values);
        this.element.appendChild(this.element_labels);
    }

    /**
     * @param {{ title: string, value: number }[]} items 
     */
    set(items)
    {
        // @ts-ignore
        this.element_columns.replaceChildren();
        // @ts-ignore
        this.element_values.replaceChildren();
        // @ts-ignore
        this.element_labels.replaceChildren();
        let max = Math.max.apply(Math, items.map(item => item.value));

        for (let item of items)
        {
            let column = document.createElement('div');
            column.style.height = `${Math.round((item.value / max) * 100)}%`;
            let value = document.createElement('div');
            value.innerText = item.value.toString();
            let label = document.createElement('div');
            label.innerText = item.title;
            this.element_columns.appendChild(column);
            this.element_values.appendChild(value);
            this.element_labels.appendChild(label);
        }
    }
}