import { ActivitiesYear } from "./ActivitiesYear.js";
import { ActivitiesGroupCollection } from "./ActivitiesGroupCollection.js";
import { SimpleGeometry } from "./SimpleGeometry.js";

export class MapBorders
{
    shape_background = 'white';
    shape_background_visited = '#c5ffc5';

    /**
     * @param {import("./App.js").Borders} borders 
     */
    constructor(borders)
    {
        MapBorders.createPath2dInShapefile(borders.kraj.shapes);
        MapBorders.createPath2dInShapefile(borders.wojewodztwa.shapes);
        MapBorders.createPath2dInShapefile(borders.gminy.shapes);
        MapBorders.calculateColors(borders.gminy);
        this.kraj = borders.kraj;
        this.wojewodztwa = borders.wojewodztwa;
        /** @type {import("./App.js").LabeledShapes} */
        this.gminy = borders.gminy;
        this.boundaries = 
        { 
            left: borders.gminy.shapes.min_x, 
            right: borders.gminy.shapes.max_x, 
            top: borders.gminy.shapes.max_x, 
            bottom: borders.gminy.shapes.min_x 
        }
        this.path_test_context = document.createElement('canvas').getContext("2d");
    }

    /**
     * @param {CanvasRenderingContext2D} context 
     * @param {*} transform 
     */
    drawPreviewTo(context, transform)
    {
        context.strokeStyle = 'gray';
        context.lineWidth = 1 / transform.scale;
        
        for (let item of this.wojewodztwa.shapes.items)
        {
            for (let path of item.paths)
            {
                context.stroke(path);
            }
        }
    }

    /**
     * @param {CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D} context 
     * @param {*} transform 
     */
    drawTo(context, transform)
    {
        context.filter = 'none';
        context.strokeStyle = '#aaa';
        context.lineWidth = 1 / transform.scale;
        context.shadowColor = 'rgb(163, 163, 163)';
        context.shadowBlur = 3;
        context.fillStyle = 'hsl(195, 80%, 95%)';
        
        for (let item of this.kraj.shapes.items)
        {
            for (let path of item.paths)
            {
                context.fill(path);
                context.stroke(path);
            }
        }
        
        context.shadowBlur = 0;
        context.strokeStyle = 'gray';
        context.lineWidth = 1 / transform.scale;
        
        for (let item of this.gminy.shapes.items)
        {
            context.fillStyle = item.activities?.length > 0 ? this.shape_background_visited : item.background_color;
            //context.fillStyle = item.background_color;

            for (let path of item.paths)
            {
                context.stroke(path);
                context.fill(path);
            }
        }
        
        // context.strokeStyle = 'black';
        
        for (let item of this.wojewodztwa.shapes.items)
        {
            for (let path of item.paths)
            {
                context.stroke(path);
            }
        }
    }
    
    /*
    updateActivitiesYearVisitedCount(activities_year, activity)
    {
        let shapes = this.gminy.shapes.items;
        let visits = {};

        let ride_bounding_rectangle = SimpleGeometry.getPointsBoundingRectangle(activity.path);
                
        for (let shape of shapes)
        {
            let item_bounding_rectangle = { left: shape.min_x, right: shape.max_x, top: shape.max_y, bottom: shape.min_y };
            
            if (SimpleGeometry.areRectanglesOverlap(ride_bounding_rectangle, item_bounding_rectangle))
            {
                paths: for (let path of shape.paths)
                {
                    for (let point of activity.path)
                    {
                        if (this.path_test_context.isPointInPath(path, point[0], point[1]))
                        {
                            debugger

                            if (remove)
                            {
                                
                                shape.visited_count--;
                            }
                            else
                            {
                                shape.visited_count++;
                            }

                            break paths;
                        }
                    }
                }
            }
        }

    }

    calculateActivitiesYearVisitedCount(activities_year)
    {
        for (let item of this.gminy.shapes.items)
        {
            item.visited_count_backup = item.visited_count;
            item.visited_count = 0;
        }

        this.clearVisitedCount();
        this.updateVisitedCount(activities_year.gpx.activities);
        this.updateVisitedCount(activities_year.strava.activities_with_streams);
        debugger
        activities_year.visited = this.gminy.shapes.items.filter(item => item.visited_count > 0).length;

        for (let item of this.gminy.shapes.items)
        {
            item.visited_count = item.visited_count_backup;
        }
    }
    
    clearVisitedCount()
    {
        for (let item of this.gminy.shapes.items)
        {
            item.visited_count = 0;
        }
    }
    */
    
    // /**
    //  * @param {Activity[]} activities
    //  * @param {boolean} remove 
    //  */
    // updateVisitedCounts(activities, remove)
    // {
    //     activities.forEach(activity => this.updateVisitedCount(activity, remove));
    // }

    /**
     * @param {ActivitiesGroupCollection} activities_year
     */
    markActivities(activities_year)
    {
        for (let item of this.gminy.shapes.items)
        {
            let label = this.gminy.labels.rows[item.number - 1][1];
            item.activities = activities_year.findActivitiesInCommunity(label);
        }
    }

    /**
     * @param {number[][]} latlng
     * @returns {string[]}
     */
    calculateVisitedCommunities(latlng)
    {
        let visited_communities = [];
        let ride_bounding_rectangle = SimpleGeometry.getPointsBoundingRectangle(latlng);
                
        for (let item of this.gminy.shapes.items)
        {
            let item_bounding_rectangle = { left: item.min_x, right: item.max_x, top: item.max_y, bottom: item.min_y };
            
            if (SimpleGeometry.areRectanglesOverlap(ride_bounding_rectangle, item_bounding_rectangle))
            {
                paths: for (let path of item.paths)
                {
                    for (let point of latlng)
                    {
                        if (this.path_test_context.isPointInPath(path, point[0], point[1]))
                        {
                            visited_communities.push(this.gminy.labels.rows[item.number - 1][1]);
                            break paths;
                        }
                    }
                }
            }
        }

        return visited_communities;
    }

    /**
     * 
     * @param {import("./App.js").Shapes} shape 
     */
    static createPath2dInShapefile(shape)
    {
        for (let item of shape.items)
        {
            item.paths = [];
            let parts = [...item.parts].concat([item.points.length]);
            
            for (let k = 1; k < parts.length; k++)
            {
                let from = parts[k - 1];
                let to = parts[k];
                let path = new Path2D();
                path.moveTo(item.points[to * 2 - 2], item.points[to * 2 - 1]);
    
                for (let i = from; i < to; i++)
                {
                    path.lineTo(item.points[i * 2], item.points[i * 2 + 1]);
                }
    
                item.paths.push(path);
            }
        }
    }

    /**
     * @param {import("./App.js").LabeledShapes} param0 
     */
    static calculateColors({ shapes, labels })
    {
        let rows = labels.rows.map((row, index) => ({ number: index, code: row[1] }));
        rows.sort((a, b) => (a.code > b.code) ? 1 : -1);
        let order = new Array(rows.length);
    
        for (let i = 0; i < rows.length; i++)
        {
            order[rows[i].number] = i;
        }
    
        let color_step = 360 / shapes.items.length;
    
        for (let item of shapes.items)
        {
            let item_order = item.number; //order[item.number];
            let color = color_step * item_order;
            item.background_color = `hsl(${Math.round(color)}, 80%, 98%)`;
            item.background_color_selected = `hsl(${Math.round(color)}, 100%, 50%)`;
        }
    }
}