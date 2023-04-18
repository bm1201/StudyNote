import React from "react";
import { useEffect, useRef, useState} from "react";
import useAxiosPrivate from '@/hooks/useAxiosPrivate';
import { MSG } from '@/resources/js/message';
import "./NaverMapContainer.css";
import pointImage from '../../../public/images/map_icon_pointer.png';

/**
 * NaverMap을 만들어줌
 * @param props
 * - lat
 * - lon
 * - zoom
 * @returns {JSX.Element}
 * @constructor
 */

const navermaps = window.naver.maps

const NaverMapContainer = (props) => {
    const axiosPrivate = useAxiosPrivate();

    const navermap = useRef(null);

    const map = useRef(null);
    
    //마커관련 변수
    const markerArray = useRef([]);
    const beforeMarker = useRef(null);

    //폴리라인관련 변수
    const polyLineArray = useRef([]);
    const polyLineMinMaxArray = useRef([]);
    const markerMinMaxArray = useRef([]);
    const beforePolyLine = useRef(null);
    const startMarker = useRef(null);
    const endMarker = useRef(null);
    
    // const [mapConf, setMapConf] = useState(props.mapConf);
    
    //네이버지도
    useEffect(() => {
        map.current = new navermaps.Map(navermap.current, {//지도 추가, 좌표를 기점으로 주변 지도가 추가된다.
            center: new navermaps.LatLng(36.3504119, 127.3845475),
            zoom: 16,
            mapTypeId: navermaps.MapTypeId.TERRAIN
            // minZoom: 6,
            // maxZoom: 22,
            // scaleControl: false,
            // logoControl: true,
            // mapDataControl: true,
            // zoomControl: true,
            // mapTypeControl: true
            }
        )
    }, []);

    useEffect(() => {
        // /******************** 지도 센터 이동 ********************/
        // if(props.mapConf.mapEvt !== undefined){
        //     for(let i=0; i<props.mapConf.mapEvt.length; i++){
        //         if(props.mapConf.mapEvt[i].fucntionNm === "moveToCenter"){
        //             map.current.setCenter(new navermaps.LatLng(props.mapConf.mapEvt[i].data.lat, props.mapConf.mapEvt[i].data.lon));
        //         }
        //     }
        // }

        /******************** 조회 시 지도크기 안의 폴리라인 및 노드 표출 ********************/
        if(props.mapConf.minMaxEvt !== undefined){
            if(props.mapConf.minMaxEvt.flag){
                getPolyLineMarkerMinMax();
            }
        }
    }, [props.mapConf])
    
    /******************** 지도크기 안에 폴리라인 및 노드 표출 함수 ********************/
    useEffect(() => {
        if(props.mapConf.minMaxEvt !== undefined){
            navermaps.Event.addListener(map.current, 'dragend', function(){
                getPolyLineMarkerMinMax();
            });
        }
    }, [props.mapConf.minMaxEvt])
    
    
    const getPolyLineMarkerMinMax = () => {
        if(props.mapConf.minMaxEvt.marker.flag && props.mapConf.minMaxEvt.polyLine.flag){
            //마커초기화
            if(markerMinMaxArray.current.length != 0){
                for(let i=0; i<markerMinMaxArray.current.length; i++){
                    markerMinMaxArray.current[i].setMap(null);
                }
            }

            //폴리라인초기화
            if(polyLineMinMaxArray.current.length != 0){
                for(let i=0; i<polyLineMinMaxArray.current.length; i++){
                    polyLineMinMaxArray.current[i].setMap(null);
                }
            }

            //지도 크기 내의 폴리라인 전부 표출
            let min = map.current.getBounds()._min;
            let max= map.current.getBounds()._max;
            let param = {
                param : [
                    { field : "minX", value : min.y},
                    { field : "maxX", value : max.y},
                    { field : "minY", value : min.x},
                    { field : "maxY", value : max.x}
                ]
            };

            //노드 표출
            let markerMinmaxUrl = props.mapConf.minMaxEvt.marker.url;

            axiosPrivate.post(markerMinmaxUrl, param)
            .then((res) => {
                let datalist = res.data.items;
                let markerArr = [];
                
                for(let i=0; i<datalist.length; i++){
                    let marker = new navermaps.Marker({
                        position: new navermaps.LatLng(datalist[i].lat, datalist[i].lon),
                        size : (5,5),
                        zIndex : 200,
                        // icon : pointImage,
                        draggable : true
                    });
                    
                    marker["nodeId"] = datalist[i].nodeId;
                    marker.setMap(map.current);
                    markerArr.push(marker);
                }

                markerMinMaxArray.current = markerArr;
            });
            
            
            //폴리라인 표출
            let linkMinmaxUrl = props.mapConf.minMaxEvt.polyLine.url;

            axiosPrivate.post(linkMinmaxUrl, param)
            .then((res) => {
                let datalist = res.data.items;
                let polyLineArr = [];

                for(let i=0; i<datalist.length; i++){
                    //폴리라인
                    let polyline = new navermaps.Polyline({
                        path: datalist[i].linkVtx,
                        strokeWeight: 5,             //선 두께
                        strokeColor: '#808080',
                        strokeOpacity: 0.9,          //선 불투명도
                        strokeLineCap: 'round',      // 선 마감 스타일
                        strokeLineJoin: 'round',      // 선들이 맞닿는 부분의 마감 스타일
                        clickable : true
                    });
                    
                    polyline["linkId"] = datalist[i].linkId;
                    polyLineArr.push(polyline);
                    polyLineArr[i].setMap(map.current);
                }

                //이미 구간에 포함된 폴리라인 제거 및 이벤트 추가
                for(let j=0; j<polyLineArr.length; j++){
                    for(let k=0; k<polyLineArray.current.length; k++){
                        if(polyLineArr[j].linkId === polyLineArray.current[k].linkId){
                            polyLineArr[j].setMap(null);
                        }
                    }

                    navermaps.Event.addListener(polyLineArr[j], 'click', function (e) {
                        //선택한 경우 폴리라인 색깔변경
                        if(e.overlay.getOptions("strokeColor") === "#808080"){
                            e.overlay.setOptions("strokeColor", "#FF0000")
                        }else{
                            e.overlay.setOptions("strokeColor", "#808080")
                        }
                    })
                }

                polyLineMinMaxArray.current = polyLineArr;
            });
        }else if(props.mapConf.minMaxEvt.marker.flag){
            //마커초기화
            if(markerMinMaxArray.current.length != 0){
                for(let i=0; i<markerMinMaxArray.current.length; i++){
                    markerMinMaxArray.current[i].setMap(null);
                }
            }

            //지도 크기 내의 폴리라인 전부 표출
            let min = map.current.getBounds()._min;
            let max= map.current.getBounds()._max;
            let param = {
                param : [
                    { field : "minX", value : min.y},
                    { field : "maxX", value : max.y},
                    { field : "minY", value : min.x},
                    { field : "maxY", value : max.x}
                ]
            };

            //노드 표출
            let markerMinmaxUrl = props.mapConf.minMaxEvt.marker.url;

            axiosPrivate.post(markerMinmaxUrl, param)
            .then((res) => {
                let datalist = res.data.items;
                let markerArr = [];
                
                for(let i=0; i<datalist.length; i++){
                    let marker = new navermaps.Marker({
                        position: new navermaps.LatLng(datalist[i].lat, datalist[i].lon),
                        size : (5,5),
                        zIndex : 200,
                        // icon : pointImage,
                        draggable : true
                    });
                    
                    marker["nodeId"] = datalist[i].nodeId;
                    marker.setMap(map.current);
                    markerArr.push(marker);
                }

                markerMinMaxArray.current = markerArr;
            });
        }else if(props.mapConf.minMaxEvt.polyLine.flag){
            //폴리라인초기화
            if(polyLineMinMaxArray.current.length != 0){
                for(let i=0; i<polyLineMinMaxArray.current.length; i++){
                    polyLineMinMaxArray.current[i].setMap(null);
                }
            }

            //지도 크기 내의 폴리라인 전부 표출
            let min = map.current.getBounds()._min;
            let max= map.current.getBounds()._max;
            let param = {
                param : [
                    { field : "minX", value : min.y},
                    { field : "maxX", value : max.y},
                    { field : "minY", value : min.x},
                    { field : "maxY", value : max.x}
                ]
            };

            //폴리라인 표출
            let linkMinmaxUrl = props.mapConf.minMaxEvt.polyLine.url;

            axiosPrivate.post(linkMinmaxUrl, param)
            .then((res) => {
                let datalist = res.data.items;
                let polyLineArr = [];

                for(let i=0; i<datalist.length; i++){
                    //폴리라인
                    let polyline = new navermaps.Polyline({
                        path: datalist[i].linkVtx,
                        strokeWeight: 5,             //선 두께
                        strokeColor: '#808080',
                        strokeOpacity: 0.9,          //선 불투명도
                        strokeLineCap: 'round',      // 선 마감 스타일
                        strokeLineJoin: 'round',      // 선들이 맞닿는 부분의 마감 스타일
                        clickable : true
                    });
                    
                    polyline["linkId"] = datalist[i].linkId;
                    polyLineArr.push(polyline);
                    polyLineArr[i].setMap(map.current);
                }

                //이미 구간에 포함된 폴리라인 제거 및 이벤트 추가
                for(let j=0; j<polyLineArr.length; j++){
                    for(let k=0; k<polyLineArray.current.length; k++){
                        if(polyLineArr[j].linkId === polyLineArray.current[k].linkId){
                            polyLineArr[j].setMap(null);
                        }
                    }
                    
                    navermaps.Event.addListener(polyLineArr[j], 'click', function (e) {
                        //선택한 경우 폴리라인 색깔변경
                        if(e.overlay.getOptions("strokeColor") === "#808080"){
                            e.overlay.setOptions("strokeColor", "#FF0000")
                        }else{
                            e.overlay.setOptions("strokeColor", "#808080")
                        }
                    })
                }

                polyLineMinMaxArray.current = polyLineArr;
            });
        }
    }

    /******************** 제공구간 상세 폴리라인 표출 함수 ********************/
    useEffect(() => {
        let viewDatalist = props.mapConf.viewDatalist;
        
        if(viewDatalist !== undefined && viewDatalist.length > 0){
            // 폴리라인 초기화
            if(polyLineArray.current.length != 0){
                for(let i=0; i<polyLineArray.current.length; i++){
                    polyLineArray.current[i].setMap(null);
                }
            }

            let lon = (viewDatalist[0].lon + viewDatalist[viewDatalist.length-1].lon)/2;
            let lat = (viewDatalist[0].lat + viewDatalist[viewDatalist.length-1].lat)/2;
            //지도 센터이동
            map.current.setCenter(new navermaps.LatLng(lat, lon));

            let linkObj = {};
            let linkArr = [[viewDatalist[0].lon, viewDatalist[0].lat]];

            for(let i=1; i<viewDatalist.length; i++){
                if(viewDatalist[i].linkId === viewDatalist[i-1].linkId){
                    if(i === viewDatalist.length-1){
                        linkArr.push([viewDatalist[i].lon, viewDatalist[i].lat]);
                        linkObj[viewDatalist[i].linkId] = linkArr;
                    }else{
                        linkArr.push([viewDatalist[i].lon, viewDatalist[i].lat]);
                    }
                }else{
                    linkObj[viewDatalist[i-1].linkId] = linkArr;
                    linkArr = [];
                    linkArr.push([viewDatalist[i].lon, viewDatalist[i].lat]);
                }
            }
            
            let polyLineArr = [];
            
            for(let i=0; i<Object.keys(linkObj).length; i++){
                let polyline = new navermaps.Polyline({
                    path: linkObj[Object.keys(linkObj)[i]],
                    strokeWeight: 5,             //선 두께
                    strokeColor: "#FF0000",
                    strokeOpacity: 0.9,         //선 불투명도
                    strokeLineCap: 'round',     // 선 마감 스타일
                    strokeLineJoin: 'round',    // 선들이 맞닿는 부분의 마감 스타일
                    clickable : true
                });
                
                polyline["linkId"] = Object.keys(linkObj)[i];
                polyline.setMap(map.current);
                polyLineArr.push(polyline);

                // 선택한 경우 폴리라인 색깔변경 이벤트 추가
                navermaps.Event.addListener(polyline, 'click', function (e) {    
                    if(e.overlay.getOptions("strokeColor") === "#808080"){
                        e.overlay.setOptions("strokeColor", "#FF0000")
                    }else{
                        e.overlay.setOptions("strokeColor", "#808080")
                    }
                })
            }
            polyLineArray.current = polyLineArr;
        }
    }, [props.mapConf.viewDatalist])
    
    //지도 줌 크기 재조절 함수
    useEffect(() => {
        if(props.mapConf.mapZoomSize !== undefined){
            map.current.setZoom(props.mapConf.mapZoomSize);
        }
    }, [props.mapConf.mapZoomSize]);

    /******************** 마커 표출 함수 ********************/
    useEffect(() => {
        if(props.mapConf.fnType === "marker" && props.markerData.length !== 0 && props.markerData !== undefined){
            // 마커 초기화
            if(markerArray.current.length != 0){
                for(let i=0; i<markerArray.current.length; i++){
                    Object.values(markerArray.current[i])[0].setMap(null);
                }
            }

            map.current.setZoom(props.mapConf.mapZoomSize);
            map.current.setCenter(new navermaps.LatLng(36.3504119, 127.3845475));
            
            let markerArr = [];

            for(let i=0; i<props.markerData.length; i++){
                //마커표출
                let marker = new navermaps.Marker({
                    position: new navermaps.LatLng(props.markerData[i][props.mapConf.point.y], props.markerData[i][props.mapConf.point.x]),
                    size : (5,5),
                    zIndex : 200,
                    draggable : true, //마커 중복여부 확인 시 true 변경 후 확인
                });

                marker.setMap(map.current);

                let markerObj = {};
                markerObj[props.markerData[i][props.mapConf.markerKey]] = marker;
                markerArr.push(markerObj);
            }

            markerArray.current = markerArr;

            // updateMarkers(map.current, markerArr);
        }
    }, [props.markerData]);

    /******************** 폴리라인 표출 함수 ********************/
    useEffect(() => {
        if(props.mapConf.fnType === "polyLine" && props.polyLineData.length !== 0 && props.polyLineData !== undefined){
            // 폴리라인 초기화
            if(polyLineArray.current.length != 0){
                for(let i=0; i<polyLineArray.current.length; i++){
                    Object.values(polyLineArray.current[i])[0].setMap(null);
                }
            }

            //구간마커 초기화
            if(startMarker.current !== null){
                startMarker.current.setMap(null);
            }

            if(startMarker.current !== null){
                endMarker.current.setMap(null);
            }
            
            map.current.setZoom(props.mapConf.mapZoomSize);

            let polyLineArr = [];

            for(let i=0; i<props.polyLineData.length; i++){
                //VTX데이터가 있는 경우만 생성
                if(props.polyLineData[i][props.mapConf.vtx].length > 0){
                    //폴리라인
                    let polyline = new navermaps.Polyline({
                        path: props.polyLineData[i][props.mapConf.vtx],
                        strokeWeight: 5,             //선 두께
                        strokeColor: '#FF0000',
                        strokeOpacity: 0.9,          //선 불투명도
                        strokeLineCap: 'round',      // 선 마감 스타일
                        strokeLineJoin: 'round'      // 선들이 맞닿는 부분의 마감 스타일
                    });
                    
                    polyline.setMap(map.current);// 지도에 추가
                    let polyLineObj = {};
                    polyLineObj[props.polyLineData[i][props.mapConf.polyLineKey]] = polyline;
                    polyLineArr.push(polyLineObj);
                }
            }

            polyLineArray.current = polyLineArr;
        }
    }, [props.polyLineData]);

    /******************** 클릭한 rowdata 관련 함수 ********************/
    useEffect(() => {
        if(props.clickData.length !== 0 && props.clickData !== undefined){
            //클릭한 rowdata에 해당하는 마커 변경
            if(props.mapConf.fnType === 'marker'){
                if(beforeMarker.current !== null){
                    beforeMarker.current.setAnimation(null);
                }
    
                for(let i=0; i<markerArray.current.length; i++){
                    let tempKey = Object.keys(markerArray.current[i])[0];
                    if(tempKey === String(props.clickData[props.mapConf.markerKey])){
                        beforeMarker.current = markerArray.current[i][tempKey];
                        markerArray.current[i][tempKey].setAnimation(naver.maps.Animation.BOUNCE);
                        map.current.setCenter(new navermaps.LatLng(props.clickData[props.mapConf.point.y], props.clickData[props.mapConf.point.x]));
                        map.current.setZoom(16);
                    }
                }
            }
            
            //클릭한 rowdata에 해당하는 폴리라인 구간표출
            if(props.mapConf.fnType === 'polyLine'){
                //구간마커 초기화
                if(startMarker.current !== null){
                    startMarker.current.setMap(null);
                }
    
                if(startMarker.current !== null){
                    endMarker.current.setMap(null);
                }
    
                //구간표출
                if(props.clickData[props.mapConf.vtx] !== undefined && props.clickData[props.mapConf.vtx].length > 0){
                    let markerS = new navermaps.Marker({
                        position: new navermaps.LatLng(props.clickData[props.mapConf.vtx][0][1], props.clickData[props.mapConf.vtx][0][0]),
                        size : (5,5),
                        zIndex : 200,
                        draggable : true, //마커 중복여부 확인 시 true 변경 후 확인
                        // title : props.clickData,
                        map: map.current
                    });
    
                    let markerE = new navermaps.Marker({
                        position: new navermaps.LatLng(props.clickData[props.mapConf.vtx][props.clickData[props.mapConf.vtx].length-1][1],
                                                       props.clickData[props.mapConf.vtx][props.clickData[props.mapConf.vtx].length-1][0]),
                        size : (5,5),
                        zIndex : 200,
                        draggable : true, //마커 중복여부 확인 시 true 변경 후 확인
                        // title : props.data[i][props.mapConf.titleId],
                        map: map.current
                    });
    
                    markerS.setMap(map.current);
                    markerE.setMap(map.current);
    
                    startMarker.current = markerS;
                    endMarker.current = markerE;
    
                    map.current.setZoom(16);
                    map.current.setCenter(new navermaps.LatLng(props.clickData[props.mapConf.vtx][0][1], props.clickData[props.mapConf.vtx][0][0]));
                }
            }

            if(props.mapConf.fnType === 'minMax'){
                // map.current.setCenter();
            }
        }
    }, [props.clickData]);

    return (
        <div ref={navermap} style={{width: "100%", height: "100%"}}>
        </div>
    );

};

export default NaverMapContainer;
