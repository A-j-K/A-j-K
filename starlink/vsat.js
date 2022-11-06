

function sat(args, with_vel_mag = true, stime = false)
{
	var rval = { ok: false };
	rval.data = {};
	var at_time;// = new Date();
	if(stime === false) {
		at_time = new Date(args.at_time.getTime());
	}
	else {
		at_time = stime;
	}
	rval.observerGeo = {};
	rval.observerGeo.hgt = args.hgt;
	rval.observerGeo.lat_degrees = args.lat;
	rval.observerGeo.lon_degrees = args.lon;
	rval.observerGeo.lat_radians = satellite.degreesToRadians(rval.observerGeo.lat_degrees);
	rval.observerGeo.lon_radians = satellite.degreesToRadians(rval.observerGeo.lon_degrees);
	var satrec = args.satrec;
	if(typeof satrec === 'undefined') return rval;

	rval.data.sat = {};
	rval.data.sat.satnum = satrec.satnum;
	rval.data.sat.inclo = satellite.radiansToDegrees(satrec.inclo);
	rval.data.sat.ecco = satrec.ecco; // eccentricity
	rval.data.sat.nodeo = satrec.nodeo; // right ascension of ascending node
	rval.data.sat.mo = satrec.mo; // mean anomaly
	rval.data.sat.no = satrec.no; // mean motion
	rval.data.sat.argpo = satrec.argpo; // argument of perigee
	rval.data.sat.bstar = satrec.bstar; // B* Drag Term
	rval.data.sat.epochyr = satrec.epochyr;
	rval.data.sat.epochdays = satrec.epochdays;
	rval.data.sat.tsince = 0;

	var positionAndVelocity = satellite.propagate(satrec, at_time);
	if(!('velocity' in positionAndVelocity)) {
		return rval;
	}
	if(!('position' in positionAndVelocity)) {
		return rval;
	}
	rval.data.sat.tsince = satrec.t;
	rval.data.sat.jdsatepoch = satrec.jdsatepoch;
	rval.positionEci = positionAndVelocity.position;
	var velocityEci = {};
	velocityEci.xdot = positionAndVelocity.velocity.x;
	velocityEci.ydot = positionAndVelocity.velocity.y;
	velocityEci.zdot = positionAndVelocity.velocity.z;
	if(with_vel_mag) {
		velocityEci.vdot = Math.sqrt(
			Math.pow(positionAndVelocity.velocity.x, 2) +
			Math.pow(positionAndVelocity.velocity.y, 2) +
			Math.pow(positionAndVelocity.velocity.z, 2)
		);
	}
	rval.velocityEci = velocityEci;
	var observerGd = {
		longitude: rval.observerGeo.lon_radians,
		latitude: rval.observerGeo.lat_radians,
		height: rval.observerGeo.hgt
	};
	rval.gmst = satellite.gstime(at_time);
	var positionEcf   = satellite.eciToEcf(positionAndVelocity.position, rval.gmst),
		observerEcf   = satellite.geodeticToEcf(observerGd),
		positionGd    = satellite.eciToGeodetic(positionAndVelocity.position, rval.gmst),
		lookAngles    = satellite.ecfToLookAngles(observerGd, positionEcf);
	rval.positionEcf = positionEcf;
	rval.observerEcf = observerEcf;
	rval.groundPoint = {};
	rval.groundPoint.hgt_kms = positionGd.height;
	rval.groundPoint.lat_radians = positionGd.latitude;
	rval.groundPoint.lon_radians = positionGd.longitude;
	rval.groundPoint.lat_degrees = satellite.radiansToDegrees(positionGd.latitude);
	rval.groundPoint.lon_degrees = satellite.radiansToDegrees(positionGd.longitude);
	rval.lookAngles = {};
	rval.lookAngles.az_radians = lookAngles.azimuth;
	rval.lookAngles.el_radians = lookAngles.elevation;
	rval.lookAngles.range_kms = lookAngles.rangeSat;
	rval.lookAngles.az_degrees = satellite.radiansToDegrees(lookAngles.azimuth);
	rval.lookAngles.el_degrees = satellite.radiansToDegrees(lookAngles.elevation);

	var sunpos_altaz_radians = SunCalc.getPosition(at_time, args.lat, args.lon);
	rval.data.sunpos_altaz_radians = sunpos_altaz_radians;
	rval.data.sunpos_altaz_degrees ={};
	rval.data.sunpos_altaz_degrees.altitude = satellite.radiansToDegrees(sunpos_altaz_radians.altitude);
	rval.data.sunpos_altaz_degrees.azimuth = satellite.radiansToDegrees(sunpos_altaz_radians.azimuth);

	// Earth's shadow calculations, see https://www.celestrak.com/columns/v03n01/
	rval.data.sunpos_eci = sunpos_eci(at_time);
	rval.data.psun = Math.sqrt( // Distance, in km, between satellite and Sun's centre
		Math.pow(positionAndVelocity.position.x - rval.data.sunpos_eci.x, 2) +
		Math.pow(positionAndVelocity.position.y - rval.data.sunpos_eci.y, 2) +
		Math.pow(positionAndVelocity.position.z - rval.data.sunpos_eci.z, 2)
	);
	rval.data.pearth = Math.sqrt( // Distance, in km, between the satellite and Earth's centre
		Math.pow(positionAndVelocity.position.x, 2) +
		Math.pow(positionAndVelocity.position.y, 2) +
		Math.pow(positionAndVelocity.position.z, 2)
	);
	// Semidiameters
	rval.data.theta_e = Math.asin((12742./2.) / rval.data.pearth);
	rval.data.theta_s = Math.asin((1391000./2.) / rval.data.psun);
	rval.data.dotproduct_peps = Math.abs((positionAndVelocity.position.x * rval.data.sunpos_eci.x) +
							(positionAndVelocity.position.y * rval.data.sunpos_eci.y) +
							(positionAndVelocity.position.z * rval.data.sunpos_eci.z));
	rval.data.theta = Math.acos(rval.data.dotproduct_peps / (rval.data.psun * rval.data.pearth));
	// Make the determination.
	rval.data.shadow = "none"; // The default is no shadow unless...
	if(rval.data.theta_e > rval.data.theta_s && rval.data.theta < (rval.data.theta_e - rval.data.theta_s)) {
		rval.data.shadow = "umbral";
	}
	else if(Math.abs(rval.data.theta_e - rval.data.theta_s) < (rval.data.theta) &&
			rval.data.theta < (rval.data.theta_e + rval.data.theta_s)) {
		rval.data.shadow = "penumbral";
	}
	else if ((rval.data.theta_s > rval.data.theta_e) &&
			(rval.data.theta < (rval.data.theta_s - rval.data.theta_e))) {
		rval.data.shadow = "annular";
	}

	rval.ok = true;
	return rval;
}

// Suns position in the ECI frame.
function sunpos_eci(in_date = false)
{
	var rval = {};
	if(in_date === false) in_date = new Date();
	var JD = vsat_julianday(in_date);
	var UT1 = (JD - 2451545) / 36525;
	var longmsum = 280.4606184 + 36000.77005361 * UT1;
	var msun = 357.5277233 + 35999.05034 * UT1;
	var ecliptic = longmsum + 1.914666471 * Math.sin(msun * Math.PI/180.)+0.918994643 * Math.sin(2 * msun * Math.PI/180.);
	var eccen = 23.439291-0.0130042 * UT1;
	var sundistance = 1.496E+8; // * 0.989;
	rval.jd = JD;
	rval.ut1 = UT1;
	rval.x = (Math.cos(ecliptic * Math.PI/180.)) * sundistance;
	rval.y = (Math.cos(eccen * Math.PI/180.) * Math.sin(ecliptic * Math.PI/180.)) * sundistance;
	rval.z = (Math.sin(eccen * Math.PI/180.) * Math.sin(ecliptic * Math.PI/180.)) * sundistance;
	rval.d = Math.sqrt(
		Math.pow(rval.x, 2) +
		Math.pow(rval.y, 2) +
		Math.pow(rval.z, 2)
	) / 1000000;
	return rval;
}

function vsat_julianday(in_date = false)
{
	if(in_date === false) in_date = new Date;
	return 367.0 *
		in_date.getUTCFullYear() - Math.floor(7 * (in_date.getUTCFullYear() + Math.floor((in_date.getUTCMonth() + 1 + 9) / 12.0)) * 0.25) +
		Math.floor(275 * (in_date.getUTCMonth() + 1) / 9.0) + in_date.getUTCDate() + 1721013.5 +
		((in_date.getUTCMilliseconds() / 60000 + in_date.getUTCSeconds() / 60.0 + in_date.getUTCMinutes()) / 60.0 + in_date.getUTCHours()) / 24.0;
}

function drawsat_list(rval, planetarium, se)
{
	var above_count = 0;
	var maxb,minb,maxl,old,a,b,c,oldx,oldy,bstep;
	var bstep = 2;
	var sdate_obj = new Date(se.getTime() - 0); // Only future points (10*60000));
	var edate_obj = new Date(se.getTime() + (10*60000));
	var start_time = sdate_obj.getTime();
	var end_time   = edate_obj.getTime();
	var old = { moved:false };
	var c = planetarium.ctx;
	var args_copy = rval.args;
	var green = new Array;
	var yellow = new Array;
	var orange = new Array;
	var blue = new Array;
	var labelled = false;
	var labelled_x, labelled_y;
	var satid = "";
	var cbshowsatid = $("#cbshowsatid");
	var showsatid = (cbshowsatid.prop("checked")) ? true : false;
	var cbshowlit = $("#cbshowlit");
	var showlit = (cbshowlit.prop("checked")) ? true : false;
	var cbshowlitpath = $("#cbshowlitpath");
	var showlitpath = (cbshowlitpath.prop("checked")) ? true : false;
	var cbshowunlitpath = $("#cbshowunlitpath");
	var showunlitpath = (cbshowunlitpath.prop("checked")) ? true : false;
	

	for(start_time = sdate_obj.getTime(); start_time < end_time; ) {
		var p = planetarium;
		var sendclock = new Date(start_time);
		var rval = sat(args_copy, true, sendclock);
		satid = rval.data.sat.satnum;
		if(!rval.ok) {
			return false;
		}
		// The chances of seeing something that hight are remote.
		if(rval.groundPoint.hgt_kms > 5000.) {
			return false;
		}
		if(rval.ok && rval.lookAngles.el_degrees > 0) {
			var element = {};
			element.az = rval.lookAngles.az_radians;
			element.el = rval.lookAngles.el_radians;
			var above_test = (10 - (element.el/10)) * 0.5;
			if(above_test < 1) above_test = 1;
			if(above_count < above_test) {
				if(!showlit) {
					green.push(element);
				}
				else {
					switch(rval.data.shadow) {
						case "umbral": blue.push(element); break;
						case "penumbral": orange.push(element); break;
						default: green.push(element);
					}					
				}
			}
			else {
				if(rval.data.sunpos_altaz_degrees.altitude > 0) {
					yellow.push(element);
				}
				else {
					switch(rval.data.shadow) {
						case "umbral": blue.push(element); break;
						case "penumbral": orange.push(element); break;
						default: yellow.push(element);
					}
				}
				if(false && above_count == 0) {
					start_time -= (1*60000);
					continue;
				}
			}
			end_time += 1000; // Keep going until el < 0 degrees.
			above_count++;
			if(above_count > 5000) end_time = start_time; // Graceful abort, too many points.
		}
		start_time += 1000;
		var temp = new Date(start_time);
		start_time = temp.getTime();
	}
	if(green.length > 0) {
		c.save();
		c.beginPath();
		c.strokeStyle = "green";
		c.lineWidth = 4;
		old = { moved:false };
		green.forEach(function(ele, idx) {
			if(!labelled) {
				if(showsatid) {
					var pos = p.azel2xy((ele.az - p.az_off * p.d2r), ele.el, p.wide, p.tall);
					p.drawText(satid, pos.x, pos.y);
				}
				labelled = true;
			}
			old = vsatjoinpoint(p, "az", ele.az, ele.el, old, maxl);
		});
		c.stroke();
		c.restore();
	}
	if(showunlitpath && blue.length > 0) {
		c.save();
		c.beginPath();
		c.strokeStyle = "blue";
		c.lineWidth = 1;
		old = { moved:false };
		blue.forEach(function(element, idx) {
			old = vsatjoinpoint(p, "az", element.az, element.el, old, maxl);
		});
		c.stroke();
		c.restore();
	}
	if(showlitpath && orange.length > 0) {
		c.save();
		c.beginPath();
		c.strokeStyle = "orange";
		c.lineWidth = 1.5;
		old = { moved:false };
		orange.forEach(function(element, idx) {
			old = vsatjoinpoint(p, "az", element.az, element.el, old, maxl);
		});
		c.stroke();
		c.restore();
	}
	if(showlitpath && yellow.length > 0) {
		c.save();
		c.beginPath();
		c.strokeStyle = "yellow";
		if(rval.data.sunpos_altaz_degrees.altitude > -2) {
			c.strokeStyle = "#B8860B";
		}
		c.lineWidth = 1;
		old = { moved:false };
		yellow.forEach(function(element, idx) {
			old = vsatjoinpoint(p, "az", element.az, element.el, old, maxl);
		});
		c.stroke();
		c.restore();
	}
}

var previous_projection = "stereo";

function scanattimenow()
{
	var now = new Date();
	var cb = $("#cbrealtime");
	if(cb.prop("checked")) {
		$("#sdate").val(now.toISOString());
	}
	else {
		now = new Date($("#sdate").val());
		var incby = getSimSpeed();
		if(incby < 1) {
			now.setMilliseconds(now.getMilliseconds() + (incby*1000));
		}
		else {
			now.setSeconds(now.getSeconds() + incby);
		}
		$("#sdate").val(now.toISOString());
	}
	var projection = $("#projection").val();
	if(projection != previous_projection) {
		previous_projection = projection;
		set_planetarium(now);
	}
	var obs = getObserverLocation();
	planetarium.setLongitude(obs.lon);
	planetarium.setLatitude(obs.lat);
	planetarium.updateClock(now);
	var background = "black";
	planetarium.background = background;
	planetarium.showhelp = false;
	planetarium.draw();
	planetarium.drawPlanets();
	executing = true;
	$(".starmap_btn_help").hide();
	scannow();
}

function getObserverLocation()
{
	var lat = $("#latitude").val();
	var lon = $("#longitude").val();
	var hgt = $("#height").val();

	return {
		lat: parseFloat(lat),
		lon: parseFloat(lon),
		hgt: parseFloat(hgt) / 1000
	}
}

function getSimSpeed()
{
	var speed = $("#simspeed").val();
	return parseFloat(speed);
}

function getFlatEarthMode()
{
	var mode = $("#cbfe").prop("checked");
	return mode;
}



function cb_callback_execute(id)
{
	toggle_execute(id);
}

function toggle_execute(id)
{
	var cb = $("#"+id);
	if(!cb.prop("checked") && executing) {
		console.log("Execute checkbox: disabled, haltining interval");
		window.clearInterval(timer);
		executing = false;
	}
	else if(!executing) {
		console.log("Execute checkbox: enabled, starting interval");
		var simspeed = getSimSpeed();
		simspeed *= 1000;
		timer = window.setInterval(scanattimenow, simspeed);
		executing = true;
	}
}

function sat_checkbox_callback(that)
{
	planetarium.draw();
	$(".satcb").each(function(idx, cb) {
		var o = $("#" + idx + ":checked");
		if(cb.checked) {
			display_sats.forEach(function(rval, idx) {
				if(parseInt(rval.args.satid) == parseInt(cb.id)) {
					console.log("Redrawing " + rval.args.satid);
					//drawsat_live(rval.args, planetarium);
					drawsat_list(rval, planetarium, rval.args.at_time);
				}
			});
		}
	});
}

function clear_sat_list()
{
	$("#maintable_div").empty();
	$("#maintable_div").html("<table id='maintable' width='100%'><tr></tr></table>");
	display_sats = null;
	display_sats = new Array();
}

function jsUcfirst(string)
{
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function skipPast(string)
{
	if(string.charAt(0) == "0" && string.charAt(1) == " ")  {
		return string.slice(2);
	}
	return string;
}


function show_sat_list(sats, ldate, lat, lon)
{
	var sunpos = SunCalc.getPosition(ldate, lat, lon);
	sunpos.altitude = satellite.radiansToDegrees(sunpos.altitude);
	var h1 = "<strong>", h2 = "</strong>";
	$("#maintable_div").html("<table id='maintable' width='100%'><tr></tr></table>");
	var header = "<tr>" +
		"<td class=\"satcbtd\" >&nbsp;</td>" +
		"<td>" + h1 + "Sat&nbsp;ID" + h2 + "</td>" +
		"<td>" + h1 + "Satellite&nbsp;Name" + h2 + "</td>" +
		"<td>" + h1 + "Class" + h2 + "</td>" +
		"<td>" + h1 + "RAAN" + h2 + "</td>" +
		//"<td>&nbsp;</td>" +
		"<td>" + h1 + "Az" + h2 + "</td>" +
		"<td>" + h1 + "El" + h2 + "</td>" +
		"<td>" + h1 + "Range (km)" + h2 + "</td>" +
		"<td>" + h1 + "Speed (km/s)" + h2 + "</td>" +
		"<td>" + h1 + "Height (km)" + h2 + "</td>" +
		"<td>" + h1 + "Shadow" + h2 + "</td>" +
		"</tr>";
	$('#maintable tr:last').after(header);

	sats.sort(function(a,b){
		return (a.data.sat.satnum > b.data.sat.satnum) ? 1 : ((b.data.sat.satnum > a.data.sat.satnum) ? -1 : 0);
	}); 

	sats.forEach(function(rval, index) {
		if(rval.groundPoint.hgt_kms < 5000.) {
			var shadow = sunpos.altitude > 0 ? "none" : rval.data.shadow;
			var id = rval.args.satid;
			var raan = 0;
			var tr = "";
			if(!isNaN(rval.data.sat.nodeo)) { 
				raan = rval.data.sat.nodeo.toFixed(1);
			}

			var satname = skipPast(rval.args.tleLine0);
			var google = '<a target="_blank" href="https://www.google.com/search?q=%22' + satname + '%22">GG</a>';
			var incltxt = '<a target="_blank" href="https://www.n2yo.com/satellite/?s=' + rval.data.sat.satnum + '">' + raan + '</a>';
			var heavens_above_jd = vsat_julianday(ldate) - 2400000 - 0.5;
			var href  = '<a target="_blank" href="https://heavens-above.com/orbit.aspx?satid=' + rval.data.sat.satnum + '">' + rval.data.sat.satnum + '</a>';
			var href2 = '<a target="_blank" href="https://heavens-above.com/passdetails.aspx?&satid=' + rval.data.sat.satnum + '&mjd=' + heavens_above_jd + '&type=A&size=600">'+ satname +'</a>';		
			tr = "<tr class=\"maindisplaytable\">" +
				"<td class=\"satcbtd\" width='1%'><input type='checkbox' class='satcb' id='"+id+"' onclick='sat_checkbox_callback(this.id)' checked='checked'></checkbox></td>" +
				"<td width='1%'>" + href + "</td>" +
				"<td width='1%'>" + href2 + "</td>" +
				"<td width='1%'>" + rval.args.source.substr(0, 4) + "</td>" +
				"<td>" + incltxt + "°</td>" +
				//"<td>" + google + "</td>" +
				'<td><span class="azimuth_display">' + rval.lookAngles.az_degrees.toFixed(1) + "</span>°</td>" +
				"<td>" + rval.lookAngles.el_degrees.toFixed(1) + "°</td>" +
				"<td>" + rval.lookAngles.range_kms.toFixed(1) + "</td>" +
				"<td>" + rval.velocityEci.vdot.toFixed(3) + "</td>" +
				"<td>" + rval.groundPoint.hgt_kms.toFixed(1) + "</td>" +
				"<td>" + jsUcfirst(shadow) + "</td>" +
				"</tr>";		
			$('#maintable tr:last').after(tr);
		}
	});
	$('.azimuth_display').click(function(){
		var azm = parseInt($(this).text());
		console.log(azm);
		planetarium.changeAzimuth(azm);
	});
	$(".satcbtd").hide();
}


function load_observer()
{
	var obs = {};
	$.getJSON("observer.json",
		function(data) {
			obs.lat = data.latitude;
			$("#latitude").val(obs.lat.toString());
			obs.lon = data.longitude;
			$("#longitude").val(obs.lon.toString());
			obs.hgt = data.height; // km
			$("#height").val(obs.hgt.toString());
		}).fail(
		function() { 
			console.log("Failed to load an observer location, default to the Greenwich Observatory");
			obs.lat = 51.476807;
			$("#latitude").val(obs.lat.toString());
			obs.lon = -0.000532;
			$("#longitude").val(obs.lon.toString());
			obs.hgt = 0.1; // km
			$("#height").val(obs.hgt.toString());
	});
	console.log("Load observer:");
	console.log(obs);
	return obs;
}

function load_sat(l0, l1, l2, name = "iss", sname = "iss", push = false)
{
	var satrec = satellite.twoline2satrec(l1, l2);
	var localsat = {};
	localsat.handle = 0;
	localsat.line0 = l0;
	localsat.line1 = l1;
	localsat.line2 = l2;
	localsat.source = name;
	localsat.source_short = sname;
	localsat.satrec = satrec;
	if(push) sats.push(localsat);
	return localsat;
}

function load_sats()
{
	sats = new Array;
	$.getJSON("all.json",
	function(data) {
		data.forEach(function(item, index) {
			var havesat = false;
			var satrec = satellite.twoline2satrec(item.TLE_LINE1, item.TLE_LINE2);
			if(satrec) {
				// Avoid duplicates that appearin multipleTLE files when combined.
				sats.forEach(function(satitem, idx) {
					if(satitem.satrec.satnum == satrec.satnum) {
						havesat = true;
					}
				});
				if(!havesat) {
					pos = item.SOURCE.indexOf(".json");
					localsat = load_sat(item.TLE_LINE0, item.TLE_LINE1, item.TLE_LINE2, item.SOURCE, item.SOURCE.substr(0, pos));
					sats.push(localsat);
				}
			}
		});
	},
	function() {
		console.log("Failed to open all.json");
	});
	return sats;
}

function drawsats_array(sats, planetarium)
{
	sats.forEach(function(rval, index) {
		if(rval.lookAngles.el_degrees > 0) {
			//console.log("Over horizon: " + rval.args.satid);
			//drawsat_live(rval.args, planetarium);
			drawsat_list(rval, planetarium, rval.args.at_time);
		}
	});
}


function scannow()
{
	clear_sat_list();
	var ldate_str = $("#sdate").val();
	var ldate = new Date(ldate_str);
	var obs = getObserverLocation();
	var lat = obs.lat;
	var lon = obs.lon;

	var sunpos = SunCalc.getPosition(ldate, obs.lat, obs.lon);
	var sunpostxt = "Sun elevation: " +
		satellite.radiansToDegrees(sunpos.altitude).toFixed(1) + "°, " +
		satellite.radiansToDegrees(sunpos.azimuth).toFixed(1) + "°, " +
		satellites.length.toString();
	$("#sunelevation").html(sunpostxt);
	satellites.forEach(function(item, index){
		if(item.handle > 0) {
			item.handle--;
		}
		else if(item.handle == 0) {
			var jd = vsat_julianday(ldate)
			var hgt = obs.hgt;
			var args = {
					lat: lat,
					lon: lon,
					hgt: hgt,
					at_time: ldate,
					tleLine0: item.line0,
					tleLine1: item.line1,
					tleLine2: item.line2,
					source: item.source_short,
					satrec: item.satrec
			};
			var rval = sat(args, true);
			var tleage = jd - rval.data.sat.jdsatepoch;
			if(!rval.ok) {
				item.handle = 60;
				console.log("Sat " + rval.data.sat.satnum +
					" " + args.tleLine0 + " " +
					"being removed because false return");
			}
			else if(tleage > 90) {
				item.handle = -1; // Never handle again.
				console.log("Sat " + rval.data.sat.satnum +
					" " + args.tleLine0 + " " +
					"TLE is too old: " + tleage.toFixed(0) + " days");
			}
			else {
				if(rval.groundPoint.hgt_kms > 38000) {
					item.handle = -1; // Never handle again
					console.log("Sat " + rval.data.sat.satnum +
						" being removed, too high at: " + rval.groundPoint.hgt_kms);
				}
				else if(rval.lookAngles.el_degrees > -5) {
					// At some point on the pass it must reach over 15degrees
					var t = args.at_time; // Temporaryily save
					for(var i = 20; i < 500; i+=20) {
						args.at_time = new Date(ldate.getTime()+(1000*i));
						var rval2 = sat(args, true);
						if(rval2.lookAngles.el_degrees > 0) {
							args.at_time = t; // restore time
							rval.args = args;
							display_sats.push(rval);
							i = 500;
						}
					}
				}					
			}
		}
	});
	if(display_sats.length > 0) {
		drawsats_array(display_sats, planetarium);
		show_sat_list(display_sats, ldate, lat, lon);
	}
};

function arrayRemove(arr, value) {
	return arr.filter(function(ele) {
		return ele.rval.data.sat.satnum != value;
	});
}

function testdraw(planetarium)
{
	if(!testdrawn) {
		var maxb,minb,maxl,old,a,b,c,oldx,oldy,bstep;
		bstep = 2;
		//maxb = (typeof planetarium.projection.maxb==="number") ? planetarium.projection.maxb : 90-bstep;
		maxb = 90;
		minb = 0;

		var step = Math.PI;
		var c = planetarium.ctx;
		c.beginPath();
		c.strokeStyle = "yellow";
		c.lineWidth = 1;
		maxl = planetarium.maxLine(5);
		old = {moved:false};
		step *= planetarium.d2r;
		bstep *= planetarium.d2r;
		minb *= planetarium.d2r;
		maxb *= planetarium.d2r;
		// Draw grid lines in elevation/declination/latitude
		for(a = Math.PI/2 ; a < Math.PI*2 ; a += step){
			old.moved = false;
			for(b = minb; b <= maxb ; b+= bstep) old = vsatjoinpoint(planetarium,"az",a,b,old,maxl);
			break;
		}
		c.stroke();
		testdrawn = true;
	}
	else {
		planetarium.draw();
		testdrawn = false;
	}
}


// Ripped from virtualsky.js as it appears to be a private function
// not accessable from my code but I want to draw all over the sky :)
function vsatjoinpoint(s,type,a,b,old,maxl)
{
	var x,y,show,c,pos;
	c = s.ctx;
	if(type=="az") pos = s.azel2xy((a-s.az_off*s.d2r),b,s.wide,s.tall);
	else if(type=="eq") pos = s.radec2xy(a,b);
	else if(type=="ec") pos = s.ecliptic2xy(a,b,s.times.LST);
	else if(type=="gal") pos = s.gal2xy(a,b);
	x = pos.x;
	y = pos.y;
	if(type=="az") show = true;
	else show = ((s.isVisible(pos.el)) ? true : false);
	if(show && isFinite(x) && isFinite(y)){
		if(type=="az"){
			if(!old.moved || Math.sqrt(Math.pow(old.x-x,2)+Math.pow(old.y-y,2)) > s.tall/2) c.moveTo(x,y);
			c.lineTo(x,y);
			old.moved = true;
		}else{
			// If the last point on s contour is more than a canvas width away
			// it is probably supposed to be behind us so we won't draw a line
			if(!old.moved || Math.sqrt(Math.pow(old.x-x,2)+Math.pow(old.y-y,2)) > maxl){
				c.moveTo(x,y);
				old.moved = true;
			}else c.lineTo(x,y);
		}
		old.x = x;
		old.y = y;
	}
	return old;
}

var testdrawn = false;

// Keeping this as a drawing reference but no longer used.
function defunct_drawsat_live(args, planetarium)
{
	above_count = 0;
	var maxb,minb,maxl,old,a,b,c,oldx,oldy,bstep;
	bstep = 2;
	var sdate_obj = new Date(args.at_time.getTime() - (10*60000));
	var edate_obj = new Date(args.at_time.getTime() + (10*60000));
	start_time = sdate_obj.getTime();
	end_time   = edate_obj.getTime();
	old = { moved:false };
	var c = planetarium.ctx;
	c.beginPath();
	c.strokeStyle = "yellow";
	c.lineWidth = 1.5;
	maxl = planetarium.maxLine();
	args_copy = args;
	for(start_time = sdate_obj.getTime(); start_time < end_time; ) {
		var sendclock = new Date(start_time);
		if(!rval.ok) {
			start_time = end_time;
			continue;
		}
		var rval = sat(args_copy, true, sendclock);
		if(rval.ok && rval.lookAngles.el_degrees > 0 && rval.groundPoint.hgt_kms < 5000) {
			if(false && above_count == 0) {
				start_time -= (1*60000);
				continue;
			}
			old = vsatjoinpoint(planetarium, "az", rval.lookAngles.az_radians, rval.lookAngles.el_radians, old, maxl);
			end_time += (1*60000) // Advance to get LOS
			above_count++;
		}
		start_time += 15000;
		var temp = new Date(start_time);
		start_time = temp.getTime();
	}
	c.stroke();
}
