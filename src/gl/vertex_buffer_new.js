// @flow

import assert from 'assert';

import type {
    StructArray,
    StructArrayMember
} from '../util/struct_array';

import type Program from '../render/program';
import type Context from '../gl/context';

import { generateMesh } from './triangulation';

import { transform, transformInverse } from './pers';

import { triangulate } from './del'

import EXTENT from '../data/extent';

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

        // texture coordinates
        var T = generateMesh(20, 0, 1, 0, 1)

        // vertex coordinates, unwarped
        var V = generateMesh(20, -1, 1, -1, 1)

        // polygon representing the corners
        var poly = [[array["int16"][8], array["int16"][9]], [array["int16"][12], array["int16"][13]], [array["int16"][0], array["int16"][1]], [array["int16"][4], array["int16"][5]]];

        // var poly = [[-1.2, 1], [0.9, 1.1], [-1, -1], [0.6, -1.6]];

        // flat arrays for the perspective transformation
        var dst = poly.flat();
        // var src = dst;
        var src = [-1, 1, 1, 1, -1, -1, 1, -1];

        // warp to mesh
        var W = new Array();
        for (var i = 0; i < V.length; i++) {
            W.push(transform(src, dst, V[i][0], V[i][1]));
        }

        // generate triangles from unwarped vertices
        var triangles = triangulate(V);


        var newUV = new Array();
        var newVertex = new Array();

        for (var i = 0; i < triangles.length; i++) {
            newUV.push([T[triangles[i]][0], T[triangles[i]][1], 1])
            newVertex.push([W[triangles[i]][0], W[triangles[i]][1], 1])
        }

        let buffers = []

        for (let i = 0; i < newUV.length; i++) {
            const row = [newVertex[i][0], newVertex[i][1], newVertex[i][2], newUV[i][0]*8192, newUV[i][1]*8192, newUV[i][2]*8192];
            buffers.push(row);
        }

        buffers = buffers.flat()

        const Int16buffers = new Int16Array(buffers)
        
        gl.bufferData(gl.ARRAY_BUFFER, Int16buffers, gl.STATIC_DRAW);
        

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
