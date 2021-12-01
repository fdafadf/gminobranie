import { CanvasContextTransform } from "./CanvasContextTransform.js";

export class View
{
    constructor({ borders_2_shape, borders_shape, borders_dbf, rides, width, height })
    {
        this.scale_x = width / (borders_shape.max_x - borders_shape.min_x);
        this.scale_y = height / (borders_shape.max_y - borders_shape.min_y);
        this.borders_2_shape = borders_2_shape;
        this.borders_shape = borders_shape;
        this.borders_dbf = borders_dbf;
        this.rides = rides;
        this.canvas = document.createElement('canvas');
        this.canvas.width = height;
        this.canvas.height = height;
        this.canvas.addEventListener("mousemove", this._onMouseMove.bind(this));
        this.context = this.canvas.getContext("2d");
        this.context_transform = this._createCanvasContextTransform(this.context);

        // for (let ride of rides)
        // {
        //     for (let item of borders_shape)
        //     {
        //         for (let path of item.paths)
        //         {
        //             for (point in rides)
        //             {

        //             }
        //             if (this.context.isPointInPath(path, e.offsetX, e.offsetY))
        //             {
        //             }
        //         }
        //     }
        // }

        this.buffer = this._createBuffer();
        this._drawBuffer();
        document.body.appendChild(this.canvas);
    }

    draw()
    {
        this.context.fillStyle = 'white';
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this._drawBuffer();

        if (this.selectedItem)
        {
            for (let path of this.selectedItem.paths)
            {
                this.context.fillStyle = path.background_color_selected;
                this.context.stroke(path);
                this.context.fill(path);
            }
            
            gmina.innerText = this.borders_dbf.rows[this.selectedItem.number - 1][2];
        }
        else
        {
            gmina.innerText = '';
        }

        this.context.strokeStyle = 'blue';

        for (let ride of this.rides)
        {
            this.context.stroke(ride);
        }
    }

    _drawBuffer()
    {
        this.context.save();
        this.context.resetTransform();
        this.context.drawImage(this.buffer, 0, 0); //, this.canvas.width, this.canvas.height, 0, 0, this.canvas.width, this.canvas.height);
        this.context.restore();
    }

    _createCanvasContextTransform(context)
    {
        let context_transform = new CanvasContextTransform(context);
        context.transform(1, 0, 0, -1, 0, context.canvas.height);
        context_transform.scale(this.scale_x, this.scale_y);
        context_transform.translate(-this.borders_shape.min_x, -this.borders_shape.min_y);
        context.lineWidth = 1 / Math.min(this.scale_x, this.scale_y);
        return context_transform;
    }

    _createBuffer()
    {
        let canvas = new OffscreenCanvas(this.canvas.width, this.canvas.height);
        let context = canvas.getContext("2d");
        this._createCanvasContextTransform(context);
        context.imageSmoothingEnabled = false;
        
        for (let item of this.borders_shape.items)
        {
            for (let path of item.paths)
            {
                context.fillStyle = path.background_color;
                context.stroke(path);
                context.fill(path);
            }
        }
        
        for (let item of this.borders_2_shape.items)
        {
            for (let path of item.paths)
            {
                context.stroke(path);
            }
        }

        return canvas;
    }

    _onMouseMove(e)
    {
        for (let item of this.borders_shape.items)
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
