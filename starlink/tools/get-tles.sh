#!/bin/bash

SCRIPTDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

DATE=$(date +'%Y-%m-%d')

FOLDER="${SCRIPTDIR}/TLES/TLE_${DATE}"

if [[ ! -d $FOLDER ]]; then
        mkdir -p $FOLDER
fi

curl -sSL "https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=2le" > $FOLDER/starlink.2le
curl -sSL "https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=json-pretty" > $FOLDER/starlink.json
curl -sSL "https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=tle" > $FOLDER/starlink.tle

if [[ -e $FOLDER/starlink.json ]]; then
        pushd $FOLDER >/dev/null
        gzip -f starlink.json
        popd >/dev/null
fi

if [[ -e $FOLDER/starlink.2le ]]; then
        ${SCRIPTDIR}/tle2json $FOLDER/starlink.2le $FOLDER/starlink-2le.json
fi

if [[ -e $FOLDER/starlink.tle ]]; then
        ${SCRIPTDIR}/tle3json $FOLDER/starlink.tle $FOLDER/starlink-tle.json
fi

if [[ ! -d "${SCRIPTDIR}/TLES/TLE_DEFAULT" ]]; then
        mkdir "${SCRIPTDIR}/TLE_DEFAULT"
fi

if [[ -d "${SCRIPTDIR}/TLES/TLE_DEFAULT" ]]; then
        if [[ -e $FOLDER/starlink.2le ]]; then
                cp -f $FOLDER/starlink.2le ${SCRIPTDIR}/TLES/TLE_DEFAULT/starlink.2le
        fi
        if [[ -e $FOLDER/starlink.tle ]]; then
                cp -f $FOLDER/starlink.tle ${SCRIPTDIR}/TLES/TLE_DEFAULT/starlink.tle
        fi
        if [[ -e $FOLDER/starlink.json.gz ]]; then
                cp -f $FOLDER/starlink.json.gz ${SCRIPTDIR}/TLES/TLE_DEFAULT/starlink.json.gz
        fi
        if [[ -e $FOLDER/starlink-2le.json ]]; then
                cp -f $FOLDER/starlink-2le.json ${SCRIPTDIR}/TLES/TLE_DEFAULT/starlink-2le.json
        fi
		if [[ -e $FOLDER/starlink-tle.json ]]; then
                cp -f $FOLDER/starlink-tle.json ${SCRIPTDIR}/TLES/TLE_DEFAULT/starlink-tle.json
        fi
fi
