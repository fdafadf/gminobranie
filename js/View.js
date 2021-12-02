import { CanvasContextTransform } from "./CanvasContextTransform.js";

export class View
{
    constructor({ borders: { wojewodztwa, gminy }, rides }, width, height)
    {
        this.scale_x = width / (gminy.shapes.max_x - gminy.shapes.min_x);
        this.scale_y = height / (gminy.shapes.max_y - gminy.shapes.min_y);
        this.wojewodztwa = wojewodztwa;
        this.gminy = gminy;
        this.rides = rides;
        this.canvas = document.createElement('canvas');
        this.canvas.width = height;
        this.canvas.height = height;
        this.canvas.addEventListener("mousemove", this._onMouseMove.bind(this));
        this.context = this.canvas.getContext("2d");
        this.context.imageSmoothingEnabled = false;
        this.context_transform = this._createCanvasContextTransform(this.context);
        this.buffer = this._createBuffer();
        this._drawBuffer();
        document.body.appendChild(this.canvas);
        
        rides.forEach(ride => activities_table_body.appendChild(this._createActivityElement(ride)));
        visited_gminas.innerText = gminy.shapes.items.filter(item => item.visited).length;
        activities_counter.innerText = rides.length;
        this._bindButton(activities_button, this.toggleActivities);
    }

    draw()
    {
        this.context.shadowBlur = 0;
        this.context.fillStyle = 'white';
        this.context.clearRect(0, 0, this.gminy.shapes.max_x, this.gminy.shapes.max_y);
        this._drawBuffer();
        this.context.lineWidth = 2 / Math.min(this.scale_x, this.scale_y);
        this.context.strokeStyle = 'black';

        if (this.selectedItem)
        {
            for (let path of this.selectedItem.paths)
            {
                this.context.fillStyle = path.background_color_selected;
                this.context.stroke(path);
                this.context.fill(path);
            }
            
            let row = this.gminy.labels.rows[this.selectedItem.number - 1];
            let name = row[2];
            let code = row[1].trim();
            gmina.innerText = `${name} (${code})`;
        }
        else
        {
            gmina.innerText = '';
        }

        this.context.strokeStyle = 'blue';
        this.context.shadowBlur = 7;
        this.context.shadowColor = "lightgray";

        for (let ride of this.rides)
        {
            this.context.stroke(ride.path2d);
        }

        this.context.strokeStyle = 'red';
        this.context.stroke(this.rides[0].path2d);
    }

    toggleActivities()
    {
        activities_button.classList.toggle('selected');
        document.querySelector('table.activities').classList.toggle('hidden');
    }

    _bindButton(element, action)
    {
        element.classList.add('button');
        element.classList.add('selected');
        element.addEventListener('click', action);
    }

    _drawBuffer()
    {
        this.context.save();
        this.context.resetTransform();
        this.context.drawImage(this.buffer, 0, 0);
        this.context.restore();
    }

    _createCanvasContextTransform(context)
    {
        let context_transform = new CanvasContextTransform(context);
        context.transform(1, 0, 0, -1, 0, context.canvas.height);
        context_transform.scale(this.scale_x, this.scale_y);
        context_transform.translate(-this.gminy.shapes.min_x, -this.gminy.shapes.min_y);
        context.lineWidth = 1 / Math.min(this.scale_x, this.scale_y);
        return context_transform;
    }

    _createBuffer()
    {
        let canvas = new OffscreenCanvas(this.canvas.width, this.canvas.height);
        let context = canvas.getContext("2d");
        this._createCanvasContextTransform(context);
        context.imageSmoothingEnabled = false;
        context.strokeStyle = 'gray';
        context.shadowBlur = 7;
        context.shadowColor = "lightgray";
        context.lineWidth = 5 / Math.min(this.scale_x, this.scale_y);
        context.filter = 'blur(2px)';
        
        for (let item of this.wojewodztwa.shapes.items)
        {
            for (let path of item.paths)
            {
                context.stroke(path);
            }
        }
        
        context.filter = 'none';
        context.shadowBlur = 0;
        context.strokeStyle = 'gray';
        context.lineWidth = 1.5 / Math.min(this.scale_x, this.scale_y);
        
        for (let item of this.gminy.shapes.items)
        {
            for (let path of item.paths)
            {
                context.fillStyle = path.background_color;
                context.stroke(path);
                context.fill(path);
            }
        }
        
        context.strokeStyle = 'black';
        context.lineWidth = 1 / Math.min(this.scale_x, this.scale_y);
        
        for (let item of this.wojewodztwa.shapes.items)
        {
            for (let path of item.paths)
            {
                context.stroke(path);
            }
        }

        return canvas;
    }

    _createActivityElement(ride)
    {
        let tr = document.createElement('tr');
        let td_date = document.createElement('td');
        let td_name = document.createElement('td');
        td_date.innerText = ride.time;
        td_name.innerText = ride.name;
        tr.appendChild(td_date);
        tr.appendChild(td_name);
        return tr;
    }

    _onMouseMove(e)
    {
        for (let item of this.gminy.shapes.items)
        {
            for (let path of item.paths)
            {
                if (this.context.isPointInPath(path, e.offsetX, e.offsetY))
                {
                    if (this.selectedItem != item)
                    {
                        this.selectedItem = item;
                        this.draw();
                    }
                    
                    return;
                }
            }
        }

        if (this.selectedItem)
        {
            this.selectedItem = null;
            this.draw();
        }
    }
}
