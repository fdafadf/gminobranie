export class SimpleGeometry
{
    static getPointsBoundingRectangle(points)
    {
        let xs = points.map(p => p.x);
        let ys = points.map(p => p.y);
        let left = Math.min.apply(Math, xs);
        let right = Math.max.apply(Math, xs);
        let top = Math.max.apply(Math, ys);
        let bottom = Math.min.apply(Math, ys);
        return { left, right, top, bottom }
    }
    
    static isPointInRectangle({ left, right, top, bottom }, x, y)
    {
        return x >= left && x <= right && y <= top && y >= bottom;
    }
    
    static areRectanglesOverlap(a, b)
    {
        return SimpleGeometry.isPointInRectangle(a, b.left, b.top)
            || SimpleGeometry.isPointInRectangle(a, b.left, b.bottom)
            || SimpleGeometry.isPointInRectangle(a, b.right, b.top)
            || SimpleGeometry.isPointInRectangle(a, b.right, b.bottom)
            || SimpleGeometry.isPointInRectangle(b, a.left, a.top)
            || SimpleGeometry.isPointInRectangle(b, a.left, a.bottom)
            || SimpleGeometry.isPointInRectangle(b, a.right, a.top)
            || SimpleGeometry.isPointInRectangle(b, a.right, a.bottom);
    }
}