export class MapBorders
{v
    shape_background = 'white';
    shape_background_visited = '#e5ffe5';

    constructor({ wojewodztwa, gminy })
    {
        MapBorders.createPath2dInShapefile(wojewodztwa.shapes);
        MapBorders.createPath2dInShapefile(gminy.shapes);
        MapBorders.calculateColors(gminy);
        this.wojewodztwa = wojewodztwa;
        this.gminy = gminy;
        this.boundaries = 
        { 
            left: gminy.shapes.min_x, 
            right: gminy.shapes.max_x, 
            top: gminy.shapes.max_x, 
            bottom: gminy.shapes.min_x 
        }
    }

    drawTo(context)
    {
        context.filter = 'none';
        context.shadowBlur = 0;
        context.strokeStyle = 'gray';
        // //context.lineWidth = 1.5 / Math.min(this.scale_x, this.scale_y);
        
        for (let item of this.gminy.shapes.items)
        {
            context.fillStyle = item.visited_count > 0 ? this.shape_background_visited : this.shape_background;

            for (let path of item.paths)
            {
                context.stroke(path);
                context.fill(path);
            }
        }
        
        // context.strokeStyle = 'black';
        // //context.lineWidth = 1 / Math.min(this.scale_x, this.scale_y);
        
        for (let item of this.wojewodztwa.shapes.items)
        {
            for (let path of item.paths)
            {
                context.stroke(path);
            }
        }
    }

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
            
            for (let path of item.paths)
            {
                path.background_color = `hsl(${Math.round(color)}, 80%, 95%)`;
                path.background_color_selected = `hsl(${Math.round(color)}, 100%, 50%)`;
            }
        }
    }
}