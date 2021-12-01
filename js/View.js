import { CanvasContextTransform } from "./CanvasContextTransform.js";

export class View
{
    constructor({ borders_shape, borders_dbf, rides, width, height })
    {
        this.scale_x = width / (borders_shape.max_x - borders_shape.min_x);
        this.scale_y = height / (borders_shape.max_y - borders_shape.min_y);
        this.borders_shape = borders_shape;
        this.borders_dbf = borders_dbf;
        this.rides = rides;
        this.canvas = document.createElement('canvas');
        this.canvas.width = height;
        this.canvas.height = height;
        this.canvas.addEventListener("mousemove", this._onMouseMove.bind(this));
        this.context = this.canvas.getContext("2d");
        this.context_transform = this._createCanvasContextTransform(this.context);
        this._createCanvasPaths();

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

        this.buffer = this._createBuffer(this.borders_shape, width, height);
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

    _createBuffer(shape_file, width, height)
    {
        let canvas = new OffscreenCanvas(width, height);
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

    _createCanvasPaths()
    {
        let background_color = 0;
        let background_color_step = 360 / this.borders_shape.items.length;

        for (let item of this.borders_shape.items)
        {
            item.paths = [];
            let parts = [...item.parts].concat([item.points.length]);
            
            for (let k = 1; k < parts.length; k++)
            {
                let from = parts[k - 1];
                let to = parts[k];
                let path = new Path2D();
                console.log(`item(${item.number}) from(${from}) to(${to})`);
                path.moveTo(item.points[to * 2 - 2], item.points[to * 2 - 1]);
                path.background_color = `hsl(${Math.round(background_color)}, 100%, 90%)`;
                path.background_color_selected = `hsl(${Math.round(background_color)}, 100%, 50%)`;

                for (let i = from; i < to; i++)
                {
                    path.lineTo(item.points[i * 2], item.points[i * 2 + 1]);
                }

                item.paths.push(path);
            }

            background_color += background_color_step;
        }
    }
}
