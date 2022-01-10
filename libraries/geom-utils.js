// written by Doug Rezabek for CS 559 final project

function VertexList() {
	this.verts = [];
}
VertexList.prototype.add = function(vert) {
	this.verts.push(vert);
	return this;
}
VertexList.prototype.clone = function() {
	var nv = new VertexList();
	this.verts.forEach(function(v) {
		nv.add(v.slice());
	});
	return nv;
}
VertexList.prototype.transform = function(matrix, dst) {
	this.verts.forEach(function(v) {
		twgl.m4.transformPoint(matrix, v, v);
	});
	return this;
}

function createPolygon(sides, plane) {
	plane = plane || "xy";
	var a,b;
	if(plane == "xy") {
		a = 0;
		b = 1;
	} else if (plane == "xz") {
		a = 0;
		b = 2;
	} else if (plane == "yz") {
		a = 1;
		b = 2;
	}
	var verts = new VertexList();
	var step = 2*Math.PI/sides;
	for(var i = 0; i < sides; i++) {
		var theta = step*i;
		var l = [0, 0, 0];
		l[a] = Math.cos(theta);
		l[b] = Math.sin(theta);
		verts.add(l);
	}
	return verts;
}

function createPolygonPrism(pA, pB) {
	var n0 = 0;
	var n1 = 1;
	var ma = pA.verts.length;
	var mb = pB.verts.length;
	var max = Math.max(ma, mb);
	var tris = [];
	for(var i = 0; i < max; i++) {
		var a1 = i % ma;
		var a2 = (i + 1) % ma;
		var b1 = i % mb;
		var b2 = (i + 1) % mb;
		if(b1 != b2) {
			var t1 = new Triangle(pA.verts[a1], pB.verts[b1], pB.verts[b2]);
			t1.uvA = [n0, n0];
			t1.uvB = [n1, n0];
			t1.uvC = [n1, n1];
			tris.push(t1);
		}
		if(a1 != a2) {
			var t2 = new Triangle(pA.verts[a2], pA.verts[a1], pB.verts[b2]);
			t2.uvA = [n0, n1];
			t2.uvB = [n0, n0];
			t2.uvC = [n1, n1];
			tris.push(t2);
		}
	}
	return new TriangleMesh(tris);
}

function flatten(list, out) {
	var out = out || [];
	if(list.length == null)
		out.push(list);
	else {
		for(var i = 0; i < list.length; i++) {
			flatten(list[i], out);
		}
	}
	return out;
}

function Triangle(a, b, c, A, B, C) {
	this.vertA = a || [0, 0, 0];
	this.vertB = b || [0, 0, 0];
	this.vertC = c || [0, 0, 0];
	this.uvA = A || [0, 0];
	this.uvB = B || [0, 0];
	this.uvC = C || [0, 0];
}

function TriangleMesh(tris) {
	this.tris = tris || [];
}
TriangleMesh.prototype.concat = function(other) {
	return new TriangleMesh(this.tris.concat(other.tris));
}
TriangleMesh.prototype.add = function(triangle) {
	this.tris.push(triangle);
	return this;
}
TriangleMesh.prototype.finalize = function(kvertices, knormals, kuvcoors) {
	var tris = this.tris;
	var v3 = twgl.v3;
	var normalMap = {};
	tris.forEach(function(tri) {
		var normA = normalMap[tri.vertA] = normalMap[tri.vertA] || [0, 0, 0];
		var normB = normalMap[tri.vertB] = normalMap[tri.vertB] || [0, 0, 0];
		var normC = normalMap[tri.vertC] = normalMap[tri.vertC] || [0, 0, 0];
		var na = v3.negate(tri.vertA);
		var b = tri.vertB;
		var c = tri.vertC;
		var n = v3.normalize(v3.cross(v3.add(b, na), v3.add(c, na)));
		v3.add(normA, n, normA);
		v3.add(normB, n, normB);
		v3.add(normC, n, normC);
	});
	Object.keys(normalMap).forEach(function(k) {
		var norm = normalMap[k];
		v3.normalize(norm, norm);
	});
	var vertices = [];
	var normals = [];
	var uvcoors = [];
	tris.forEach(function(tri) {
		vertices.push([tri.vertA, tri.vertB, tri.vertC]);
		normals.push([normalMap[tri.vertA], normalMap[tri.vertB], normalMap[tri.vertC]]);
		uvcoors.push([tri.uvA, tri.uvB, tri.uvC]);
	});
	kvertices = kvertices || "vertices";
	knormals = knormals || "normals";
	kuvcoors = kuvcoors || "uvcoors";
	var out = {};
	out[kvertices] = {numComponents: 3, data: flatten(vertices)};
	out[knormals] = {numComponents: 3, data: flatten(normals)};
	out[kuvcoors] = {numComponents: 2, data: flatten(uvcoors)};
	return out;
}