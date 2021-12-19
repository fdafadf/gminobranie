export class CanvasContextTransform
{
    /**
     * @param {CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D} context 
     */
    constructor(context)
    {
        this.context = context;
        this.matrix = [1, 0, 0, 1, 0, 0];
    }

    /**
     * @param {number} x 
     * @param {number} y 
     */
    translate(x, y)
    {
        this.matrix[4] += this.matrix[0] * x + this.matrix[2] * y;
        this.matrix[5] += this.matrix[1] * x + this.matrix[3] * y;
        this.context.translate(x, y);
    }
    
    /**
     * @param {number} x 
     * @param {number} y 
     */
    scale(x, y)
    {
        this.matrix[0] *= x;
        this.matrix[1] *= x;
        this.matrix[2] *= y;
        this.matrix[3] *= y;    
        this.context.scale(x, y);
    }
}