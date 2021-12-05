export class MapBorders
{
    shape_background = 'white';
    shape_background_visited = '#c5ffc5';

    constructor({ kraj, wojewodztwa, gminy })
    {
        MapBorders.createPath2dInShapefile(kraj.shapes);
        MapBorders.createPath2dInShapefile(wojewodztwa.shapes);
        MapBorders.createPath2dInShapefile(gminy.shapes);
        MapBorders.calculateColors(gminy);
        this.kraj = kraj;
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
            context.fillStyle = item.visited_count > 0 ? this.shape_background_visited : item.background_color;
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
            item.background_color = `hsl(${Math.round(color)}, 80%, 98%)`;
            item.background_color_selected = `hsl(${Math.round(color)}, 100%, 50%)`;
        }
    }
}