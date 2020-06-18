// If the user is not including numeric.js already, add shim so this library works. Removes dependency on numeric.js
function identity(n) { return diag(rep([n],1)); }


function diag(d) {
    var i, i1, j, n = d.length, A = Array(n), Ai;
    for (i = n - 1; i >= 0; i--) {
        Ai = Array(n);
        i1 = i + 2;
        for (j = n - 1; j >= i1; j -= 2) {
            Ai[j] = 0;
            Ai[j - 1] = 0;
        }
        if (j > i) { Ai[j] = 0; }
        Ai[i] = d[i];
        for (j = i - 1; j >= 1; j -= 2) {
            Ai[j] = 0;
            Ai[j - 1] = 0;
        }
        if (j === 0) { Ai[0] = 0; }
        A[i] = Ai;
    }
    return A;
};


function clone(A,k,n) {
    if(typeof k === "undefined") { k=0; }
    if(typeof n === "undefined") { n = sdim(A).length; }
    var i,ret = Array(A.length);
    if(k === n-1) {
        for(i in A) { if(A.hasOwnProperty(i)) ret[i] = A[i]; }
        return ret;
    }
    for(i in A) {
        if(A.hasOwnProperty(i)) ret[i] = clone(A[i],k+1,n);
    }
    return ret;
}

function inv(a) {
    var s = dim(a), abs = Math.abs, m = s[0], n = s[1];
    var A = clone(a), Ai, Aj;
    var I = identity(m), Ii, Ij;
    var i, j, k, x;
    for (j = 0; j < n; ++j) {
        var i0 = -1;
        var v0 = -1;
        for (i = j; i !== m; ++i) { k = abs(A[i][j]); if (k > v0) { i0 = i; v0 = k; } }
        Aj = A[i0]; A[i0] = A[j]; A[j] = Aj;
        Ij = I[i0]; I[i0] = I[j]; I[j] = Ij;
        x = Aj[j];
        for (k = j; k !== n; ++k)    Aj[k] /= x;
        for (k = n - 1; k !== -1; --k) Ij[k] /= x;
        for (i = m - 1; i !== -1; --i) {
            if (i !== j) {
                Ai = A[i];
                Ii = I[i];
                x = Ai[j];
                for (k = j + 1; k !== n; ++k)  Ai[k] -= Aj[k] * x;
                for (k = n - 1; k > 0; --k) { Ii[k] -= Ij[k] * x; --k; Ii[k] -= Ij[k] * x; }
                if (k === 0) Ii[0] -= Ij[0] * x;
            }
        }
    }
    return I;
}

function dotMMsmall(x,y) {
    var i,j,k,p,q,r,ret,foo,bar,woo,i0,k0,p0,r0;
    p = x.length; q = y.length; r = y[0].length;
    ret = Array(p);
    for(i=p-1;i>=0;i--) {
        foo = Array(r);
        bar = x[i];
        for(k=r-1;k>=0;k--) {
            woo = bar[q-1]*y[q-1][k];
            for(j=q-2;j>=1;j-=2) {
                i0 = j-1;
                woo += bar[j]*y[j][k] + bar[i0]*y[i0][k];
            }
            if(j===0) { woo += bar[0]*y[0][k]; }
            foo[k] = woo;
        }
        ret[i] = foo;
    }
    return ret;
}

function transpose(x) {
    var i,j,m = x.length,n = x[0].length, ret=Array(n),A0,A1,Bj;
    for(j=0;j<n;j++) ret[j] = Array(m);
    for(i=m-1;i>=1;i-=2) {
        A1 = x[i];
        A0 = x[i-1];
        for(j=n-1;j>=1;--j) {
            Bj = ret[j]; Bj[i] = A1[j]; Bj[i-1] = A0[j];
            --j;
            Bj = ret[j]; Bj[i] = A1[j]; Bj[i-1] = A0[j];
        }
        if(j===0) {
            Bj = ret[0]; Bj[i] = A1[0]; Bj[i-1] = A0[0];
        }
    }
    if(i===0) {
        A0 = x[0];
        for(j=n-1;j>=1;--j) {
            ret[j][0] = A0[j];
            --j;
            ret[j][0] = A0[j];
        }
        if(j===0) { ret[0][0] = A0[0]; }
    }
    return ret;
}

function dotMV(A,x) {
    var p = A.length, Ai, i,j;
    var ret = Array(p), accum;
    for(i=p-1;i>=0;i--) {
        Ai = A[i];
        accum = 0;
        for(j in Ai) {
            if(!(Ai.hasOwnProperty(j))) continue;
            if(x[j]) accum += Ai[j]*x[j];
        }
        if(accum) ret[i] = accum;
    }
    return ret;
}

function dim(x) {
    var y,z;
    if(typeof x === "object") {
        y = x[0];
        if(typeof y === "object") {
            z = y[0];
            if(typeof z === "object") {
                return _dim(x);
            }
            return [x.length,y.length];
        }
        return [x.length];
    }
    return [];
}

function _dim(x) {
    var ret = [];
    while(typeof x === "object") { ret.push(x.length); x = x[0]; }
    return ret;
}

function sdim(A,ret,k) {
    if(typeof ret === "undefined") { ret = []; }
    if(typeof A !== "object") return ret;
    if(typeof k === "undefined") { k=0; }
    if(!(k in ret)) { ret[k] = 0; }
    if(A.length > ret[k]) ret[k] = A.length;
    var i;
    for(i in A) {
        if(A.hasOwnProperty(i)) dim(A[i],ret,k+1);
    }
    return ret;
};

function rep(s, v, k) {
    if (typeof k === "undefined") { k = 0; }
    var n = s[k], ret = Array(n), i;
    if (k === s.length - 1) {
        for (i = n - 2; i >= 0; i -= 2) { ret[i + 1] = v; ret[i] = v; }
        if (i === -1) { ret[0] = v; }
        return ret;
    }
    for (i = n - 1; i >= 0; i--) { ret[i] = rep(s, v, k + 1); }
    return ret;
};













function round(num) {
    return Math.round(num * 10000000000) / 10000000000;
}

function getNormalizationCoefficients(srcPts, dstPts, isInverse) {
    if (isInverse) {
        var tmp = dstPts;
        dstPts = srcPts;
        srcPts = tmp;
    }

    var r1 = [srcPts[0], srcPts[1], 1, 0, 0, 0, -1 * dstPts[0] * srcPts[0], -1 * dstPts[0] * srcPts[1]];
    var r2 = [0, 0, 0, srcPts[0], srcPts[1], 1, -1 * dstPts[1] * srcPts[0], -1 * dstPts[1] * srcPts[1]];
    var r3 = [srcPts[2], srcPts[3], 1, 0, 0, 0, -1 * dstPts[2] * srcPts[2], -1 * dstPts[2] * srcPts[3]];
    var r4 = [0, 0, 0, srcPts[2], srcPts[3], 1, -1 * dstPts[3] * srcPts[2], -1 * dstPts[3] * srcPts[3]];
    var r5 = [srcPts[4], srcPts[5], 1, 0, 0, 0, -1 * dstPts[4] * srcPts[4], -1 * dstPts[4] * srcPts[5]];
    var r6 = [0, 0, 0, srcPts[4], srcPts[5], 1, -1 * dstPts[5] * srcPts[4], -1 * dstPts[5] * srcPts[5]];
    var r7 = [srcPts[6], srcPts[7], 1, 0, 0, 0, -1 * dstPts[6] * srcPts[6], -1 * dstPts[6] * srcPts[7]];
    var r8 = [0, 0, 0, srcPts[6], srcPts[7], 1, -1 * dstPts[7] * srcPts[6], -1 * dstPts[7] * srcPts[7]];

    var matA = [r1, r2, r3, r4, r5, r6, r7, r8];
    var matB = dstPts;
    var matC;

    try {
        matC = inv(dotMMsmall(transpose(matA), matA));
        // matC = dotMMsmall(transpose(matA), matA);


    } catch (e) {
        console.log(e);
        return [1, 0, 0, 0, 1, 0, 0, 0];
    }

    var matD = dotMMsmall(matC, transpose(matA));
    var matX = dotMV(matD, matB);
    for (var i = 0; i < matX.length; i++) {
        matX[i] = round(matX[i]);
    }
    matX[8] = 1;

    return matX;
}


export function transform (srcPts, dstPts, x, y) {
    var coeffs = getNormalizationCoefficients(srcPts, dstPts, false);
    var coordinates = [];
    coordinates[0] = (coeffs[0] * x + coeffs[1] * y + coeffs[2]) / (coeffs[6] * x + coeffs[7] * y + 1);
    coordinates[1] = (coeffs[3] * x + coeffs[4] * y + coeffs[5]) / (coeffs[6] * x + coeffs[7] * y + 1);
    return coordinates;
}

export function transformInverse (srcPts, dstPts, x, y) {
    var coeffsInv = getNormalizationCoefficients(srcPts, dstPts, true);
    var coordinates = [];
    coordinates[0] = (coeffsInv[0] * x + coeffsInv[1] * y + coeffsInv[2]) / (coeffsInv[6] * x + coeffsInv[7] * y + 1);
    coordinates[1] = (coeffsInv[3] * x + coeffsInv[4] * y + coeffsInv[5]) / (coeffsInv[6] * x + coeffsInv[7] * y + 1);
    return coordinates;
}


