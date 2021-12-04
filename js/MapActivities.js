export class MapActivities
{
    constructor(activities)
    {
        this.activities = activities;
        this.activities.forEach(activity => activity.path2d = MapActivities.createPath2d(activity));
    }

    drawTo(context, transform)
    {
        context.lineWidth = 2 / transform.scale;
        context.strokeStyle = '#4444aa';
        //context.shadowBlur = 7;
        //context.shadowColor = "lightgray";

        for (let activity of this.activities)
        {
            context.stroke(activity.path2d);
        }
    }

    static createPath2d(activity)
    {
        let path = activity.path;
        let path2d = new Path2D();
        path2d.moveTo(path[0].x, path[0].y);
    
        for (let i = 1; i < path.length; i++)
        {
            path2d.lineTo(path[i].x, path[i].y);
        }
    
        return path2d;
    }
}