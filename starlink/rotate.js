
// Matrix rotations. Note, column-major result used.

//             /                          \ /   \   /   \
//             | 1      0          0      | | x |   | x'|
// Rx(theta) = | 0  cos(theta) sin(theta) | | y | = | y'|
//             | 0 -sin(theta) cos(theta) | | z |   | z'|
//             \                          / \   /   \   /
function rot3_x(inp, by)
{
	var res = {}
	res.x = inp.x;
	res.y =  Math.cos(by) * inp.y +  Math.sin(by) * inp.z;
	res.z = -Math.sin(by) * inp.y +  Math.cos(by) * inp.z;
	return res;
}
function get3_x(theta)
{
	var c = Math.cos(theta);
	var s = Math.sin(theta);
	var res = [
		1,  0,  0,
		0,  c,  s,
		0, -s,  c
	];
	return res;
}

//              /                           \ /   \   /   \
//              | 1      0           0      | | x |   | x'|
// iRx(theta) = | 0  cos(theta) -sin(theta) | | y | = | y'|
//              | 0  sin(theta)  cos(theta) | | z |   | z'|
//              \                           / \   /   \   /
function irot3_x(inp, by)
{
	var res = {};
	var cosby_ve =  Math.cos(by);
	var sinby_ve =  Math.sin(by);
	var sinby_ne = -Math.sin(by);
	res.x = inp.x;
	res.y = (cosby_ve * inp.y) + (sinby_ne * inp.z);
	res.z = (sinby_ve * inp.y) + (cosby_ve * inp.z);
	return res;
}
function geti3_x(theta)
{
	var c = Math.cos(theta);
	var s = Math.sin(theta);
	var res = [
		1,  0,  0,
		0,  c, -s,
		0,  s,  c
	];
	return res;
}

//             /                            \ /   \   /   \
//             | -cos(theta) 0  -sin(theta) | | x |   | x'|
// Ry(theta) = |       0     1      0       | | y | = | y'|
//             |  sin(theta) 0   cos(theta) | | z |   | z'|
//             \                            / \   /   \   /
function rot3_y(inp, by)
{
	var res = {}
	res.x = Math.cos(by) * inp.x + -Math.sin(by) * inp.z;
	res.y = inp.y;
	res.z = Math.sin(by) * inp.x +  Math.cos(by) * inp.z;
	return res;
}
function get3_y(theta)
{
	var c = Math.cos(theta);
	var s = Math.sin(theta);
	var res = [
		-c, 0, -s,
		0,  1,  0,
		s,  0,  c
	];
	return res;
}

//              /                            \ /   \   /   \
//              |  cos(theta) 0   sin(theta) | | x |   | x'|
// iRy(theta) = |       0     1      0       | | y | = | y'|
//              | -sin(theta) 0   cos(theta) | | z |   | z'|
//              \                            / \   /   \   /
function irot3_y(inp, by)
{
	var res = {}
	res.x = Math.cos(by) * inp.x + -Math.sin(by) * inp.z;
	res.y = inp.y;
	res.z = Math.sin(by) * inp.x +  Math.cos(by) * inp.z;
	return res;
}
function geti3_y(theta)
{
	var c = Math.cos(theta);
	var s = Math.sin(theta);
	var res = [
		c,  0, s,
		0,  1,  0,
		-s, 0,  c
	];
	return res;
}

//             /                           \ /   \   /   \
//             |  cos(theta) sin(theta)  0 | | x |   | x'|
// Rz(theta) = | -sin(theta) cos(theta)  0 | | y | = | y'|
//             |      0          0       1 | | z |   | z'|
//             \                           / \   /   \   /
function rot3_z(inp, by)
{
	var res = {}
	res.x =  Math.cos(by) * inp.x + Math.sin(by) * inp.y;
	res.y = -Math.sin(by) * inp.x + Math.cos(by) * inp.y;
	res.z = inp.z;
	return res;
}
function get3_z(theta)
{
	var c = Math.cos(theta);
	var s = Math.sin(theta);
	var res = [
		c,  s, 0,
		-s, c, 0,
		0,  0, 1
	];
	return res;
}

//              /                            \ /   \   /   \
//              |  cos(theta) -sin(theta)  0 | | x |   | x'|
// iRz(theta) = |  sin(theta)  cos(theta)  0 | | y | = | y'|
//              |       0          0       1 | | z |   | z'|
//              \                            / \   /   \   /
function irot3_z(inp, by)
{
	var res = {}
	res.x = Math.cos(by) * inp.x + -Math.sin(by) * inp.y;
	res.y = Math.sin(by) * inp.x +  Math.cos(by) * inp.y;
	res.z = inp.z;
	return res;
}
function geti3_z(theta)
{
	var c = Math.cos(theta);
	var s = Math.sin(theta);
	var res = [
		c, -s,  0,
		s,  c,  0,
		0,  0,  1
	];
	return res;
}


function matrix3x1(m, v)
{
	var res = [0,0,0];
	res[0] = (v[0] * m[0]) + (v[1] * m[3]) + (v[2] * m[6]);
	res[1] = (v[0] * m[1]) + (v[1] * m[4]) + (v[2] * m[7]);
	res[2] = (v[0] * m[2]) + (v[1] * m[5]) + (v[2] * m[8]);
	return res;
}

function matrix3x3(m1, m2)
{
	// column-major result
	var res = [
		0,0,0, 
		0,0,0, 
		0,0,0
	]; 
	res[0] = (m1[0] * m2[0]) + (m1[1] * m2[3]) + (m1[2] * m2[6]);
	res[1] = (m1[0] * m2[1]) + (m1[1] * m2[4]) + (m1[2] * m2[7]);
	res[2] = (m1[0] * m2[3]) + (m1[1] * m2[5]) + (m1[2] * m2[8]);
	res[3] = (m1[3] * m2[0]) + (m1[4] * m2[3]) + (m1[5] * m2[6]);
	res[4] = (m1[3] * m2[1]) + (m1[4] * m2[4]) + (m1[5] * m2[7]);
	res[5] = (m1[3] * m2[3]) + (m1[4] * m2[5]) + (m1[5] * m2[8]);	
	res[6] = (m1[6] * m2[0]) + (m1[7] * m2[3]) + (m1[8] * m2[6]);
	res[7] = (m1[6] * m2[1]) + (m1[7] * m2[4]) + (m1[8] * m2[7]);
	res[8] = (m1[6] * m2[3]) + (m1[7] * m2[5]) + (m1[8] * m2[8]);
	return res;	
}

function rot3_composite(inp, azm, ele)
{
	var mx = get3_x(ele);
	var my = geti3_y(ele);
	var mz = get3_z(azm);
	var m = matrix3x3(mx, mz);
	var v = [inp.x, inp.y, inp.z];
	if(false) {
		// rotate in a single operation
		var r = matrix3x1(m, v);
	}
	else {
		// rotate with two operations
		//var r = matrix3x1(mx, v);
		//r = matrix3x1(mz, r);
		var r = matrix3x1(my, v);
		var p = {};
		p.x = r[0], p.y=r[1], p.z=r[2];
		console.log(forVecDisplay(p));
		r = matrix3x1(mz, r);
		p.x = r[0], p.y=r[1], p.z=r[2];
		console.log(forVecDisplay(p));
	}
	var res = {};
	res.x = r[0];
	res.y = r[1];
	res.z = r[2];
	return res;
}

function testrun(aa3, azm, ele) 
{
	console.log("========");
	console.log("RUN TEST");
	console.log("========");
	var r2d = 180.0/Math.PI;
	
	var vaa3 = toVec(aa3);
	console.log("Input vec for azm: " + (azm*r2d).toFixed(3) + ", ele: " + (ele*r2d).toFixed(3) + ", aa3: " + aa3.toFixed(3) + ":-");
	console.log(forVecDisplay(vaa3));
	
	/*
	xres = irot3_x(vaa3, ele);
	console.log("irot3_x vec by: " + ele.toFixed(3));
	console.log(forVecDisplay(xres));
	
	var zres = rot3_z(xres, azm);
	console.log("rot3_z vec by: " + azm.toFixed(3));
	console.log(forVecDisplay(zres));

	var la = toLA(zres);
	console.log("look angle LA:");
	console.log(forLADisplay(la));
	*/
	console.log("Test composite");
	console.log("==============");
	var c = rot3_composite(vaa3, azm, ele);
	console.log(forVecDisplay(c));
	var new_la = toLA(c);
	console.log(forLADisplay(new_la));
	
}

function runtest() 
{
	var azms = 
	[
		0, 30, 45, 60, 90, 
		90+30, 90+45, 90+60, 90+89.9,
		0-30, 0-45, 0-60, 0-90,
		0-90-30, 0-90-45, 0-90-60, 0-90-89.9		
	];
	var d2r = Math.PI/180;
	var r2d = 180.0/Math.PI;
	azms.forEach(function(azm, index) {
		var ele = parseFloat($("#testele").val())*d2r; // anti-rotation
		var aa3 = (parseFloat($("#testaa3").val()))*d2r;
		testrun(aa3, azm*d2r, ele);
	});	
}

function toVec(inp) 
{
	var res = {};
	res.x = Math.cos(inp);
	res.y = Math.sin(inp);
	res.z = 0;
	return res;
}

function toLA(vec)
{
	// Since i-hat, j-hat and k-hat always describe a unit vector
	// the radius of the sphere of rotation is always 1 so no need
	// to calculate the expensive magnitude.
	//var r = Math.sqrt((vec.z*vec.z) + (vec.y*vec.y) + (vec.x*vec.x));
	var r = 1;
	var rval = {};
	
	// Azm
	rval.azm = Math.acos((vec.x*1) + (vec.y*0));
	if(vec.y < 0) rval.azm *= -1;
	rval.azm_deg = rval.azm * 180.0/Math.PI;
	
	// Ele
	rval.ele = Math.asin(vec.z/r);
	rval.ele_deg = rval.ele * 180.0/Math.PI;
	return rval;
}

function forVecDisplay(inp)
{
	var out = {};
	out.x = inp.x.toFixed(3);
	out.y = inp.y.toFixed(3);
	out.z = inp.z.toFixed(3);
	return out;
}

function forLADisplay(inp)
{
	var out = inp;
	out.azm = (180.0/Math.PI * inp.azm).toFixed(3);
	out.ele = (180.0/Math.PI * inp.ele).toFixed(3);
	out.azm_deg = out.azm_deg.toFixed(3);
	out.ele_deg = out.ele_deg.toFixed(3);
	return out;
}

