export class MapActivities
{
    constructor()
    {
        this.items = [];
        this.items.forEach(activity => activity.path2d = MapActivities.createPath2d(activity));
    }

    add(activity)
    {
        activity.path2d = MapActivities.createPath2d(activity)
        this.items.push(activity);
    }

    remove(activity)
    {
        this.items.splice(this.items.findIndex(a => a === activity), 1);
    }

    drawTo(context, transform)
    {
        context.lineWidth = 2 / transform.scale;
        context.strokeStyle = '#4444aa';
        //context.shadowBlur = 7;
        //context.shadowColor = "lightgray";

        for (let activity of this.items)
        {
            context.stroke(activity.path2d);
        }
    }

    static createPath2d(activity)
    {
        let path = activity.path;
        let path2d = new Path2D();
        path2d.moveTo(path[0][0], path[0][1]);
    
        for (let i = 1; i < path.length; i++)
        {
            path2d.lineTo(path[i][0], path[i][1]);
        }
    
        return path2d;
    }
}