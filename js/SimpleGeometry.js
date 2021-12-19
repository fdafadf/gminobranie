export class SimpleGeometry
{
    /**
     * @param {number[][]} points 
     * @returns 
     */
    static getPointsBoundingRectangle(points)
    {
        let xs = points.map(p => p[0]);
        let ys = points.map(p => p[1]);
        let left = Math.min.apply(Math, xs);
        let right = Math.max.apply(Math, xs);
        let top = Math.max.apply(Math, ys);
        let bottom = Math.min.apply(Math, ys);
        return { left, right, top, bottom }
    }
    
    /**
     * @param {import("./App").Rectangle} param0 
     * @param {number} x 
     * @param {number} y 
     * @returns 
     */
    static isPointInRectangle({ left, right, top, bottom }, x, y)
    {
        return x >= left && x <= right && y <= top && y >= bottom;
    }
    
    /**
     * @param {import("./App").Rectangle} a 
     * @param {import("./App").Rectangle} b 
     * @returns 
     */
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