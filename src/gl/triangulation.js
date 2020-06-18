// np.linspace equivalent
function makeArr(startValue, stopValue, cardinality) {
    var arr = [];
    var step = (stopValue - startValue) / (cardinality - 1);
    for (var i = 0; i < cardinality; i++) {
        arr.push(startValue + (step * i));
    }
    return arr;
}

// np.meshgrid equivalent
function meshgrid(array1, array2) {
    let mesh = Array();
    for (var i=0; i<array1.length; i++) {
        for (var j=0; j<array2.length; j++) {
            mesh.push([array1[i], array2[j]])
        }
    }
    return mesh;
}

// generate the space for triangulation
export function generateMesh(length, xmin=0, xmax=1, ymin=0, ymax=1) {
    let x = makeArr(xmin, xmax, length)
    let y = makeArr(ymin, ymax, length)
    let xy = meshgrid(x, y)
    return xy
}



