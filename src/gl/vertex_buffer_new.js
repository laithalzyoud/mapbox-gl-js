// @flow

import assert from 'assert';

import type {
    StructArray,
    StructArrayMember
} from '../util/struct_array';

import type Program from '../render/program';
import type Context from '../gl/context';

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

        const vertexData = [
            // Front
            .5, .5,  // bottom right 
            0, .5, // top right
            .5, 0, // bottom left
            .5, .5, // bottom left
        ];
        //first two vertices second two textures
        let buffers = [
            9570, 3643, 1,  8192, 0, 8192       * 1, //top right
            8105, 6155, 1,  8192, 8192, 8192    * 1, //bottom right
            4547, 3643, 1,  0, 0, 8192    * 1, //top left
            4547, 3643, 1,  0, 0, 8192    * 1, //top left
            8105, 6155, 1,  8192, 8192, 8192    * 1, //bottom right
            6012, 6155, 1,  0, 8192, 8192 * 1] //bottom left
            
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
