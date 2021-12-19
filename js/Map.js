import { ActivitiesYear } from "./ActivitiesYear.js";
import { ActivitiesGroupCollection } from "./ActivitiesGroupCollection.js";
import { MapActivities } from "./MapActivities.js";
import { MapBorders } from "./MapBorders.js";

export class Map
{
    onCommunityHovered = () => {}

    /**
     * @param {number} width 
     * @param {number} height 
     * @param {MapBorders} borders 
     * @param {MapActivities} activities 
     */
    constructor(width, height, borders, activities)
    {
        /** @type {MapBorders} */
        this.borders = borders;
        /** @type {MapActivities} */
        this.activities = activities;
        this.transform = { scale: 1, x: 0, y: 0 };
        this.mouse = 
        { 
            position: { x: -1, y: -1 },
            drag: { x: -1, y: -1 }
        };
        /** @type {import("./App.js").ShapesItem} */
        this.selected_community = null;
        /** @type {import("./App.js").ShapesItem} */
        this.hovered_community = null;
        /** @type {() => void} */
        this.onCommunitySelected = null;
        this.element = document.createElement('canvas');
        this.context = this.element.getContext('2d');
        this.buffer = new OffscreenCanvas(width, height);
        /** @type {OffscreenCanvasRenderingContext2D} */
        this.buffer_context = this.buffer.getContext('2d');
        this.transform.scale = width / (borders.boundaries.right - borders.boundaries.left);
        this.transform.x = -borders.boundaries.right / 2;
        this.transform.y = -borders.boundaries.top / 2;
        this._initialize(width, height);
        this.redraw();
        let content_area = document.querySelector('div#content');
        content_area.addEventListener('wheel', this._onWheel.bind(this), { passive: false });
        content_area.addEventListener('mousedown', this._onMouseDown.bind(this));
        content_area.addEventListener('mouseup', this._onMouseUp.bind(this));
        content_area.addEventListener('mousemove', this._onMouseMove.bind(this));
        content_area.addEventListener('mouseout', this._onMouseOut.bind(this));
    }

    /**
     * @param {ActivitiesGroupCollection} activities_year 
     */
    setActivities(activities_year)
    {
        this.borders.markActivities(activities_year);
        this.activities.set(activities_year);
    }

    /**
     * @param {number} width 
     * @param {number} height 
     */
    _initialize(width, height)
    {
        this.element.width = width;
        this.element.height = height;
        this.buffer.width = width;
        this.buffer.height = height;
    }

    /**
     * @param {number} width 
     * @param {number} height 
     */
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

        if (this.selected_community)
        {
            this.context.lineWidth = 2 / this.transform.scale;
            this.context.strokeStyle = 'black';
            
            for (let path of this.selected_community.paths)
            {
                this.context.stroke(path);
            }
        }

        this.context.lineWidth = 1 / this.transform.scale;
        this.context.strokeStyle = 'black';
        
        if (this.hovered_community)
        {
            for (let path of this.hovered_community.paths)
            {
                this.context.stroke(path);
            }
        }
        
        this.context.strokeStyle = 'red';

        for (let activity of this.activities.items)
        {
            if (activity.selected)
            {
                let canvas_path = this.activities.canvas_paths.get(activity);

                if (canvas_path)
                {
                    this.context.stroke(canvas_path);
                }
            }
        }
    }

    redraw()
    {
        this.drawTo(this.buffer_context, this.transform);
        this.draw();
    }

    /**
     * @param {CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D} context 
     * @param {*} transform 
     */
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

    /**
     * @param {CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D} context 
     * @param {*} transform 
     */
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

    /**
     * @param {*} e 
     */
    _onWheel(e)
    {
        e.preventDefault();
        e.stopPropagation();
        this.transform.scale *= e.deltaY < 0 ? 1.2 : 0.8;
        this.redraw();
    }

    /**
     * @param {MouseEvent} e 
     */
    _onMouseDown(e)
    {
        this.mouse.drag.x = e.x;
        this.mouse.drag.y = e.y;
    }

    /**
     * @param {MouseEvent} e 
     */
    _onMouseUp(e)
    {
        if (e.x != this.mouse.drag.x || e.y != this.mouse.drag.y)
        {
            this.transform.x += (e.x - this.mouse.drag.x) / this.transform.scale;
            this.transform.y -= (e.y - this.mouse.drag.y) / this.transform.scale;
            this.mouse.drag.x = -1;
            this.mouse.drag.y = -1;
            this.redraw();
        }
        else
        {
            this.mouse.drag.x = -1;
            this.mouse.drag.y = -1;

            if (this.hovered_community)
            {
                if (this.selected_community == this.hovered_community)
                {
                    this.selected_community = null;
                    this.onCommunitySelected?.();
                }
                else
                {
                    this.selected_community = this.hovered_community;
                    this.onCommunitySelected?.();
                }
            }
        }
    }

    /**
     * @param {MouseEvent} e 
     */
    _onMouseMove(e)
    {
        this.mouse.position.x = e.x;
        this.mouse.position.y = e.y;

        if (this.mouse.drag.x >= 0)
        {
            this.draw();
        }
        else if (this._updateHoveredCommunity(e.x, e.y))
        {
            this.draw();
        }
    }

    /**
     * @param {MouseEvent} e 
     */
    _onMouseOut(e)
    {
        this.mouse.position.x = -1;
        this.mouse.position.y = -1;
    }

    /**
     * @param {number} x 
     * @param {number} y 
     * @returns 
     */
    _updateHoveredCommunity(x, y)
    {
        for (let item of this.borders.gminy.shapes.items)
        {
            for (let path of item.paths)
            {
                if (this.context.isPointInPath(path, x, y))
                {
                    if (this.hovered_community != item)
                    {
                        this.hovered_community = item;
                        this.onCommunityHovered();
                        return true;
                    }
                    
                    return false;
                }
            }
        }

        if (this.hovered_community)
        {
            this.hovered_community = null;
            this.onCommunityHovered();
            return true;
        }
        
        return false;
    }
}