function compact(theta, azm, ele) //inp, by)
{
	var ret = {}
	var r2d = 180.0/Math.PI;
	var derotate_y = function(vector, by_angle){
		var res = {}
		// The vector is mapped to x,y,z via:-
		// x = Math.cos(vector);
		// y = Math.sin(vector);
		// z = 0;
		// The rest is applying the irot3_y function by_angle
		// res.x = Math.cos(by_angle)*Math.cos(vector);
		// res.y = Math.sin(vector);
		// res.z = Math.sin(by_angle)*Math.cos(vector);
		//
		// This is the entire compacted version derived from:-
		// a) convert the vector, 
		// b) apply the single y rotation 
		// c) find the look angles from new vector in this frame
		// which is from above x,y,z rotation:-
		// ret.azm = Math.atan(ret.y/ret.x);
		// ret.ele = Math.asin(ret.z);
		res.azm = Math.atan(Math.sin(vector)/(Math.cos(by_angle)*Math.cos(vector)));
		res.ele = Math.asin(Math.sin(by_angle)*Math.cos(vector));
		return res;
	}
	var ret = derotate_y(theta, ele);
	console.log("True Elevation angle = " + (ret.ele*r2d).toFixed(1) + 
		" Alpha = " + (ret.azm*r2d).toFixed(1) + 
		" New Azm = " + ((azm+ret.azm)*r2d).toFixed(1));
		
	console.log("Ele: " + (ret.ele*r2d).toFixed(1) + 
		" Azm = " + ((azm+ret.azm)*r2d).toFixed(1));
		
	return ret;
}

function runtest() 
{
	var d2r = Math.PI/180;
	var r2d = 180.0/Math.PI;
	var azm = parseFloat($("#testazm").val())*d2r;
	var ele = parseFloat($("#testele").val())*d2r; 
	var aa3 = (parseFloat($("#testaa3").val()))*d2r;
	compact(aa3, azm, ele);
}

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

