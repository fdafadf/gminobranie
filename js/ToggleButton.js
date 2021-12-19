
export class ToggleButton
{
    /**
     * @param {HTMLElement} element 
     */
    constructor(element)
    {
        this.element = element;
        this.element.addEventListener('click', this._handleClick.bind(this));
    }

    set checked(value)
    {
        if (value)
        {
            this.element.classList.add('checked');
        }
        else
        {
            this.element.classList.remove('checked');
        }
    }

    get checked()
    {
        return this.element.classList.contains('checked');
    }
    
    _handleClick()
    {
        this.element.classList.toggle('checked');
    }
}
