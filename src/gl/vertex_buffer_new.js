// @flow

import assert from 'assert';

import type {
    StructArray,
    StructArrayMember
} from '../util/struct_array';

import type Program from '../render/program';
import type Context from '../gl/context';
import { getIntersectionDistance } from '../style/style_layer/fill_extrusion_style_layer';
import { distance } from 'gl-matrix/src/gl-matrix/vec2';


/**
 * @enum {string} AttributeType
 * @private
 * @readonly
 */
const AttributeType = {
    Int8:   'BYTE',
    Uint8:  'UNSIGNED_BYTE',
    Int16:  'SHORT',
    Uint16: 'UNSIGNED_SHORT',
    Int32:  'INT',
    Uint32: 'UNSIGNED_INT',
    Float32: 'FLOAT'
};

function getequations(array) {

    let p1x = array["int16"][0]
    let p1y = array["int16"][1]
    let p2x = array["int16"][12]
    let p2y = array["int16"][13]

    let s1 = (p2y - p1y) / (p2x - p1x)

    let c1 = -(s1*p1x - p1y)
    
    p1x = array["int16"][4]
    p1y = array["int16"][5]
    p2x = array["int16"][8]
    p2y = array["int16"][9]

    let s2 = (p2y - p1y) / (p2x - p1x)

    let c2 = -(s2*p1x - p1y)

    return {s1, c1, s2, c2};
}

function getintersect(equations)
{
    let intersectx = (equations['c2']-equations['c1']) / (equations['s1']-equations['s2'])
    let intersecty = (equations['s1'] * intersectx) + equations['c1']
    return {intersectx, intersecty}
}

function finddistances(intersections, array)
{
    let p11x = array["int16"][0]
    let p11y = array["int16"][1]
    let p12x = array["int16"][12]
    let p12y = array["int16"][13]
    let p21x = array["int16"][4]
    let p21y = array["int16"][5]
    let p22x = array["int16"][8]
    let p22y = array["int16"][9]

    let intx = intersections["intersectx"]
    let inty = intersections["intersecty"]

    let d0 = Math.sqrt(Math.pow(p11x - intx, 2) + Math.pow(p11y - inty, 2))
    let d1 = Math.sqrt(Math.pow(p12x - intx, 2) + Math.pow(p12y - inty, 2))  
    let d2 = Math.sqrt(Math.pow(p21x - intx, 2) + Math.pow(p21y - inty, 2))  
    let d3 = Math.sqrt(Math.pow(p22x - intx, 2) + Math.pow(p22y - inty, 2))

    let d11 = d0 + d1
    let d22 = d2 + d3

    console.log(d0)
    console.log(d1)
    console.log(d2)
    console.log(d3)
    console.log(d11)
    console.log(d22)
    return {d0, d1, d2, d3, d11, d22}
}

/**
 * The `VertexBuffer` class turns a `StructArray` into a WebGL buffer. Each member of the StructArray's
 * Struct type is converted to a WebGL atribute.
 * @private
 */
class VertexBufferNew {
    length: number;
    attributes: $ReadOnlyArray<StructArrayMember>;
    itemSize: number;
    dynamicDraw: ?boolean;
    context: Context;
    buffer: WebGLBuffer;

    /**
     * @param dynamicDraw Whether this buffer will be repeatedly updated.
     * @private
     */
    constructor(context: Context, array: StructArray, attributes: $ReadOnlyArray<StructArrayMember>, dynamicDraw?: boolean) {
        this.length = array.length;
        this.attributes = attributes;
        this.itemSize = array.bytesPerElement;
        this.dynamicDraw = dynamicDraw;

        this.context = context;
        const gl = context.gl;
        this.buffer = gl.createBuffer();
        context.bindVertexBuffer.set(this.buffer);
        //first two vertices second two textures

        console.log(array.arrayBuffer)
        // let arr = [-1.3 , 1.0, 0, 0, 0.9, 1.2, 0, 0, -1, -1, 0, 0, 0.6, -1.6, 0, 0]

        let equations = getequations(array)
        
        console.log(equations)

        let intersections = getintersect(equations)

        console.log(intersections)

        let distances = finddistances(intersections, array)

        console.log("distance")
        console.log(distances)


        // let v1 = 1.98034398
        // let v2 = 2.129653964
        // let v3 = 1.885226832
        // let v4 = 2.020050125

        

        let v1 = distances["d22"] / distances["d1"]
        let v2 = distances["d11"] / distances["d3"]
        let v3 = distances["d11"] / distances["d2"]
        let v4 = distances["d22"] / distances["d0"]
        console.log(v1)
        console.log(v2)
        console.log(v3)
        console.log(v4)

        // let buffers = [
        //     array["int16"][0] ,  array["int16"][1],  1,  8192  *  v1,            0,  8192  *  v1,  //top     right  4837.061195 
        //     array["int16"][4] ,  array["int16"][5],  1,  8192  *  v2,  8192  *  v2,  8192  *  v2,  //bottom  right   4861.285838  
        //     array["int16"][8] ,  array["int16"][9],  1,            0,            0,  8192  *  v3,  //top     left   2602.860734  
        //     array["int16"][12], array["int16"][13],  1,            0,  8192  *  v4,  8192  *  v4,  //bottom  left  2793.166841  
        // ]

        let buffers = [
            array["int16"][0] ,  array["int16"][1],  1,      0,      0,  8192 * v1,  //top     right  4837.061195 
            array["int16"][4] ,  array["int16"][5],  1,  8192 * v2 ,      0,  8192 * v2,  //bottom  right   4861.285838  
            array["int16"][8] ,  array["int16"][9],  1,      0,  8192 * v3 ,  8192 * v3,  //top     left   2602.860734  
            array["int16"][12],  array["int16"][13], 1,  8192 * v4,  8192 * v4,  8192 * v4,  //bottom  left  2793.166841  
        ]
        

        // let buffers = [
        //     4368,  2135,  1,  8192  *   .95,              0,  8192  *   .95,  //top     right  4837.061195 
        //     6346,  5765,  1,  8192  *  1.03,  8192  *  1.03,  8192  *  1.03,  //bottom  left   4861.285838  
        //     2096,  3405,  1,              0,              0,  8192  *   .91,  //top     left   2602.860734  
        //     3812,  6940,  1,              0,  8192  *   .98,  8192  *   .98,  //bottom  right  2793.166841  
        // ]

        const Uint16buffers = new Uint16Array(buffers)
        
        console.log(Uint16buffers)
        gl.bufferData(gl.ARRAY_BUFFER, Uint16buffers, gl.STATIC_DRAW);
        

        if (!this.dynamicDraw) {
            delete array.arrayBuffer;
        }
    }

    bind() {
        this.context.bindVertexBuffer.set(this.buffer);
    }

    updateData(array: StructArray) {
        assert(array.length === this.length);
        const gl = this.context.gl
        this.bind();
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, array.arrayBuffer);
    }

    enableAttributes(gl: WebGLRenderingContext, program: Program<*>) {
        for (let j = 0; j < this.attributes.length; j++) {
            const member = this.attributes[j];
            const attribIndex: number | void = program.attributes[member.name];
            if (attribIndex !== undefined) {
                gl.enableVertexAttribArray(attribIndex);
            }
        }
    }

    /**
     * Set the attribute pointers in a WebGL context
     * @param gl The WebGL context
     * @param program The active WebGL program
     * @param vertexOffset Index of the starting vertex of the segment
     */
    setVertexAttribPointers(gl: WebGLRenderingContext, program: Program<*>, vertexOffset: ?number) {
        for (let j = 0; j < this.attributes.length; j++) {
            const member = this.attributes[j];
            const attribIndex: number | void = program.attributes[member.name];
            let c = 0;
            let itemsizee = 8
            let memberofset = 0
            if(this.attributes[j].name == "a_pos")
            {
                c = 3;
                itemsizee = 12
                memberofset = 0

            }
            else
            {
                c = 3;
                itemsizee = 12
                memberofset = 6
            }
            if (attribIndex !== undefined) {
                gl.vertexAttribPointer(
                    attribIndex,
                    c,
                    (gl: any)[AttributeType[member.type]],
                    false,
                    itemsizee,
                    memberofset
                );
            }
        }
    }

    /**
     * Destroy the GL buffer bound to the given WebGL context
     */
    destroy() {
        const gl = this.context.gl;
        if (this.buffer) {
            gl.deleteBuffer(this.buffer);
            delete this.buffer;
        }
    }
}

export default VertexBufferNew;
