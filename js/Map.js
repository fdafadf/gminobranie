export class Map
{
    constructor(width, height, borders, activities)
    {
        this.borders = borders;
        this.activities = activities;
        this.transform = { scale: 1, x: 0, y: 0 };
        this.mouse = 
        { 
            position: { x: -1, y: -1 },
            drag: { x: -1, y: -1 }
        };
        this.element = document.createElement('canvas');
        this.context = this.element.getContext('2d');
        this.buffer = new OffscreenCanvas(width, height);
        this.buffer_context = this.buffer.getContext('2d');
        this.transform.scale = width / (borders.boundaries.right - borders.boundaries.left);
        this.transform.x = -borders.boundaries.right / 2;
        this.transform.y = -borders.boundaries.top / 2;
        this._initialize(width, height);
        this.redraw();
        this.element.addEventListener('wheel', this._onWheel.bind(this), { passive: false });
        this.element.addEventListener('mousedown', this._onMouseDown.bind(this));
        this.element.addEventListener('mouseup', this._onMouseUp.bind(this));
        this.element.addEventListener('mousemove', this._onMouseMove.bind(this));
        this.element.addEventListener('mouseout', this._onMouseOut.bind(this));
    }

    _initialize(width, height)
    {
        this.element.width = width;
        this.element.height = height;
        this.buffer.width = width;
        this.buffer.height = height;
    }

    resize(width, height)
    {
        this._initialize(width, height);
        this.redraw();
    }

    draw()
    {
        this.context.resetTransform();
        this.context.fillStyle = 'rgb(243, 246, 249)';
        this.context.fillRect(0, 0, this.context.canvas.width, this.context.canvas.height);

        if (this.mouse.drag.x >= 0)
        {
            this.context.translate
            (
                this.mouse.position.x - this.mouse.drag.x, 
                this.mouse.position.y - this.mouse.drag.y
            );
        }

        this.context.drawImage(this.buffer, 0, 0);
        this._transformContext(this.context, this.transform);

        if (this.mouse.drag.x >= 0)
        {
            this.borders.drawPreviewTo(this.context, this.transform);
        }

        this.context.lineWidth = 2 / this.transform.scale;
        this.context.strokeStyle = 'black';
        
        if (this.selected_borders_item)
        {
            for (let path of this.selected_borders_item.paths)
            {
                this.context.stroke(path);
            }
        }
        
        this.context.strokeStyle = 'red';

        for (let activity of this.activities.items)
        {
            if (activity.hover)
            {
                this.context.stroke(activity.path2d);
            }
        }
    }

    redraw()
    {
        this.drawTo(this.buffer_context, this.transform);
        this.draw();
    }

    drawTo(context, transform)
    {
        context.resetTransform();
        context.fillStyle = 'rgb(243, 246, 249)';
        context.fillRect(0, 0, context.canvas.width, context.canvas.height);
        context.lineWidth = 1 / transform.scale;
        context.strokeStyle = 'gray';
        this._transformContext(context, transform);
        this.borders.drawTo(context, transform);
        this.activities.drawTo(context, transform);
    }

    _transformContext(context, transform)
    {
        let c_x = context.canvas.width / 2 - transform.x;
        let c_y = context.canvas.height / 2 - transform.y;
        context.transform(1, 0, 0, -1, 0, context.canvas.height);
        context.translate(transform.x, transform.y);
        context.translate(c_x, c_y);
        context.scale(transform.scale, transform.scale);
        context.translate(-c_x, -c_y);
    }

    _onWheel(e)
    {
        e.preventDefault();
        e.stopPropagation();
        this.transform.scale *= e.deltaY < 0 ? 1.2 : 0.8;
        this.redraw();
    }

    _onMouseDown(e)
    {
        this.mouse.drag.x = e.offsetX;
        this.mouse.drag.y = e.offsetY;
    }

    _onMouseUp(e)
    {
        if (e.offsetX != this.mouse.drag.x || e.offsetY != this.mouse.drag.y)
        {
            this.transform.x += (e.offsetX - this.mouse.drag.x) / this.transform.scale;
            this.transform.y -= (e.offsetY - this.mouse.drag.y) / this.transform.scale;
            this.mouse.drag.x = -1;
            this.mouse.drag.y = -1;
            this.redraw();
        }
        else
        {
            this.mouse.drag.x = -1;
            this.mouse.drag.y = -1;
        }
    }

    _onMouseMove(e)
    {
        this.mouse.position.x = e.offsetX;
        this.mouse.position.y = e.offsetY;

        if (this.mouse.drag.x >= 0)
        {
            this.draw();
        }
        else if (this._updateSelectedBordersItem(e.offsetX, e.offsetY))
        {
            this.draw();
        }
    }

    _onMouseOut(e)
    {
        this.mouse.position.x = -1;
        this.mouse.position.y = -1;
    }

    _updateSelectedBordersItem(x, y)
    {
        for (let item of this.borders.gminy.shapes.items)
        {
            for (let path of item.paths)
            {
                if (this.context.isPointInPath(path, x, y))
                {
                    if (this.selected_borders_item != item)
                    {
                        this.selected_borders_item = item;
                        this.onSelectedBordersItemChanged();
                        return true;
                    }
                    
                    return false;
                }
            }
        }

        if (this.selected_borders_item)
        {
            this.selected_borders_item = null;
            this.onSelectedBordersItemChanged();
            return true;
        }
        
        return false;
    }
}