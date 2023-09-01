
function sat(satrec, at_time)
{
	var groundPoint = { ok: false };
	var positionAndVelocity = satellite.propagate(satrec, at_time);	
	groundPoint.gmst = satellite.gstime(at_time);
	var positionGd = satellite.eciToGeodetic(positionAndVelocity.position, groundPoint.gmst);
	groundPoint.hgt_kms = positionGd.height;
	groundPoint.hgt_meters = positionGd.height * 1000.0;
	groundPoint.lat_radians = positionGd.latitude;
	groundPoint.lon_radians = positionGd.longitude;
	groundPoint.lat_degrees = satellite.radiansToDegrees(positionGd.latitude);
	groundPoint.lon_degrees = satellite.radiansToDegrees(positionGd.longitude);
	groundPoint.ok = true;
	return groundPoint;
}

/*
function satvert(name, groundpoints)
{
	rval = "";
	rval += "<Placemark>";
	rval += "<name>" + name + "</name>";
	rval += "<styleUrl>#arcline</styleUrl>";
	rval += "<LineString><extrude>1</extrude><tessellate>1</tessellate><altitudeMode>absolute</altitudeMode>";
	rval += "<coordinates>";

	groundpoints.forEach((groundpoint) => {
		rval += groundpoint.lon_degrees + ",";
		rval += groundpoint.lat_degrees + ",0 ";
		rval += groundpoint.lon_degrees + ",";
		rval += groundpoint.lat_degrees + ",";
		rval += groundpoint.hgt_meters + " ";
	});

	rval += "</coordinates></LineString></Placemark>";
	return rval;
}
*/

function satarc(name, groundpoints)
{
	rval = "&lt;Placemark&gt;";
	rval += "&lt;name&gt;" + name + " arc&lt;/name&gt;";
	rval += "&lt;styleUrl&gt#satarc&lt;/styleUrl&gt;";
	rval += "&lt;LineString&gt;";
	rval += "&lt;altitudeMode&gt;absolute&lt;/altitudeMode&gt;";
	rval += "&lt;extrude&gt;1&lt;/extrude&gt;";
	rval += "&lt;coordinates&gt;";
	var first = 1;
	groundpoints.forEach((groundpoint) => {
		if(first == 0) {
			rval += " ";
		}
		rval += groundpoint.lon_degrees.toFixed(3) + ",";
		rval += groundpoint.lat_degrees.toFixed(3) + ",";
		rval += groundpoint.hgt_meters.toFixed(3);
		if(first == 1) {
			first = 0;
		}
	});

	rval += "&lt;/coordinates&gt;";
	rval += "&lt;/LineString&gt;";
	rval += "&lt;/Placemark&gt;";
	
	return rval;
}

function satedges(name, groundpoints)
{
	rval = "";

	groundpoints.forEach((groundpoint) => {
		rval += "&lt;Placemark&gt;";
		rval += "&lt;styleUrl&gt#satedge&lt;/styleUrl&gt;";
		rval += "&lt;Linestring&gt;";
		rval += "&lt;extrude&gt1&lt;/extrude&gt;";
		rval += "&lt;tessellate&gt1&lt;/tessellate&gt;";
		rval += "&lt;altitudeMode&gt1&lt;/altitudeMode&gt;";
		rval += "&lt;coordinates&gt;";
		rval += groundpoint.lon_degrees.toFixed(2) + ",";
		rval += groundpoint.lat_degrees + ",0 \n";
		rval += groundpoint.lon_degrees + ",";
		rval += groundpoint.lat_degrees + ",";
		rval += groundpoint.hgt_meters + " \n";
		rval += "&lt;/coordinates&gt;";
		rval += "&lt;/Linestring&gt;";
		rval += "&lt;/Placemark&gt;";
	});

	return rval;
}

function execute()
{
	$("#btn_copyclip").hide();
	$("#btn_savefile").hide();
	$("#maintable").hide();

	var op = $("#maintable");
	op.empty();
	var sdate = $("#sdate").val();
	var tstep = parseInt($("#timestep").val());
	var estep = parseInt($("#edgestep").val());
	var line0 = $("#satline0").val();
	var line1 = $("#satline1").val();
	var line2 = $("#satline2").val();
	var scantime = $("#scantime").val() * 60;

	var satrec =  satellite.twoline2satrec(line1, line2);
	satrec.line0 = line0;

	var sdate_obj = new Date(sdate);
	start_time = sdate_obj.getTime();
	end_time   = start_time + scantime;

	var coords = [];

	var output = "";
	while(start_time < end_time) {
		var sendclock = new Date(start_time);
		var result = sat(satrec, sendclock);
		coords.push(result);
		start_time += (tstep);
	}

	output = satarc(line0, coords);

	if(estep > 0) {
		output += satedges(line0, coords);
	}
	
	var head = "";  
	var style = styler();
	var tail = "&lt;/Document&gt;  &lt;/kml&gt;";

	head += "&lt;?xml version=\"1.0\" encoding=\"UTF-8\"?&gt;";
	head += "&lt;kml xmlns=\"http://www.opengis.net/kml/2.2\"&gt;";
	head += "&lt;Document&gt;"
	head += rval += "&lt;name&gt" + line0 + "&lt;/name&gt;";


	op.append(head);
	op.append(style);
	op.append("\n\n");
	op.append(output);
	op.append(tail);


	$("#maintable").show();
	$("#btn_copyclip").show();

	var filename = $('#satline0').val() + ".kml";
	filename = filename.replace(" ", "_");
	$('#btn_savefile').html("Save file : " + filename);
	$("#btn_savefile").show();
}

function styler()
{
	rval = "";
	rval += "&lt;Style id=\"satarc\"&gt; &lt;LineStyle&gt; &lt;color&gt;501400FF&lt;/color&gt; &lt;width&gt;10&lt;/width&gt; &lt;/LineStyle&gt; &lt;/Style&gt;";
	rval += "&lt;Style id=\"satedge\"&gt; &lt;LineStyle&gt; &lt;color&gt;501400FF&lt;/color&gt; &lt;width&gt;15&lt;/width&gt; &lt;/LineStyle&gt; &lt;/Style&gt;";
	return rval;
}

// Stackoverflow (thank you as usual)
// https://stackoverflow.com/questions/36639681/how-to-copy-text-from-a-div-to-clipboard
function CopyToClipboard(containerid) {
	if (document.selection) {
	  var range = document.body.createTextRange();
	  range.moveToElementText(document.getElementById(containerid));
	  range.select().createTextRange();
	  document.execCommand("copy");
	} else if (window.getSelection) {
	  var range = document.createRange();
	  range.selectNode(document.getElementById(containerid));
	  window.getSelection().removeAllRanges();
	  window.getSelection().addRange(range);
	  document.execCommand("copy");
	  //alert("Text has been copied, now paste in the text-area")
	}
  }
