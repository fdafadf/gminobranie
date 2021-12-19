import { Activity } from "./Activity.js";
import { MapDataLoader } from "./MapDataLoader.js";

export class ProcesssFilesDialog
{
    constructor()
    {
        this.element = document.querySelector('div#files-dialog');
        /** @type {HTMLElement} */
        this.element_label = this.element.querySelector('div.label');
        this.element_bar = this.element.querySelector('div.bar');
        this.element_close = this.element.ownerDocument.createElement('div');
        // @ts-ignore
        this.element_close.style = "flex: none; border-bottom: 0; align-items: center;";
        this.element_close.classList.add('button');
        // @ts-ignore
        this.element_close.innerHTML = feather.icons.x.toSvg();
        this.element_close.addEventListener('click', this._handleClick.bind(this));
        /** @type {{ file: File, element: HTMLElement, element_name: HTMLElement, element_background: HTMLElement, added: boolean, activity: Activity }[]} */
        this.items = null;
    }

    /**
     * @param {FileList} file_list 
     */
    set(file_list)
    {
        // @ts-ignore
        this.element_bar.replaceChildren();
        this.items = [];
        
        for (let i = 0; i < file_list.length; i++)
        {
            let file = file_list[i];
            let item = 
            {
                file,
                element: this.element.ownerDocument.createElement('div'),
                element_background: this.element.ownerDocument.createElement('div'),
                element_name: this.element.ownerDocument.createElement('div'),
                added: false,
                /** @type {Activity} */
                activity: null
            }
            item.element_name.innerText = item.file.name;
            item.element.appendChild(item.element_background);
            item.element.appendChild(item.element_name);
            this.element_bar.appendChild(item.element);
            this.items.push(item);
        }

        this.element_bar.appendChild(this.element_close);
    }

    open()
    {
        this.element.classList.add('open');
    }

    _handleClick()
    {
        this.element.classList.remove('open');
    }
}
