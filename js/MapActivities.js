import { Activity } from "./Activity.js";
import { ActivitiesYear } from "./ActivitiesYear.js";
import { ActivitiesGroupCollection } from "./ActivitiesGroupCollection.js";

export class MapActivities
{
    /**
     * @param {string} projection 
     */
    constructor(projection)
    {
        /** @type {Activity[]} */
        this.items = [];
        /** @type {Map<any, Path2D>} */
        this.canvas_paths = new Map();
        this.projection = projection;
    }

    /**
     * @param {ActivitiesGroupCollection} activities_year 
     */
    set(activities_year)
    {
        this.items = [...activities_year.activities.values()].filter(activity => activity.streams);

        for (let activity of this.items)
        {
            if (! activity.is_accepted) continue;
            if (this.canvas_paths.has(activity)) continue;
            if (activity.streams?.latlng)
            {
                let canvas_path = MapActivities.createCanvasPath(activity.streams.latlng);
                this.canvas_paths.set(activity, canvas_path);
            }
        }
    }

    /**
     * @param {CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D} context 
     * @param {*} transform 
     */
    drawTo(context, transform)
    {
        context.lineWidth = 2 / transform.scale;
        context.strokeStyle = '#4444aa';
        context.strokeStyle = 'rgba(50, 50, 255, 0.4)';
        //context.shadowBlur = 7;
        //context.shadowColor = "lightgray";

        for (let item of this.items)
        {
            let canvas_path = this.canvas_paths.get(item);

            if (canvas_path)
            {
                context.stroke(canvas_path);
            }
        }
    }

    /**
     * @param {number[][]} path 
     */
    static createCanvasPath(path)
    {
        let path2d = new Path2D();
        path2d.moveTo(path[0][0], path[0][1]);
    
        for (let i = 1; i < path.length; i++)
        {
            path2d.lineTo(path[i][0], path[i][1]);
        }
    
        return path2d;
    }
}