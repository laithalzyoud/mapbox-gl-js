uniform mat4 u_matrix;
uniform vec3 u_tl_parent;
uniform float u_scale_parent;
uniform float u_buffer_scale;

attribute vec3 a_pos;
attribute vec3 a_texture_pos;

varying vec3 v_pos0;
varying vec3 v_pos1;


void main() {
    gl_Position = u_matrix * vec4(a_pos, 1);
    vec3 tmp = vec3(a_texture_pos / 8192.0);
    v_pos0 = tmp;
}