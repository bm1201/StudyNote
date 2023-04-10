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

    //네이버지도
    const map = useRef(null);

    /***** mapDetail타입 관련 변수*****/
    //지도 크기 내에 표출된 폴리라인 및 마커 관리
    const markerMinMaxArray = useRef([]);
    const polyLineMinMaxArray = useRef([]);

    //시작, 종료 노드 관리
    const startNodeMarker = useRef(null);
    const endNodeMarker = useRef(null);

    //선택된 폴리라인 관리
    const polyLineArray = useRef([]);

    //구간상세정보 관리
    const mapDetailArr = useRef([]);

    /***** map, gridMap타입 관련 변수*****/
    //마커관련 변수
    const markerArray = useRef([]);
    const beforeMarker = useRef(null);
   
    const beforePolyLine = useRef(null);

    const startMarker = useRef(null);
    const endMarker = useRef(null);
    
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
    
    //지도 크기 안의 모든 폴리라인, 노드 표출함수
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

            //버튼모드
            let mode = props.mode?.mode;
            
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
                    if(props.clickData !== undefined && Object.keys(props.clickData).length > 0){
                        //선택한 로우가 있는 경우
                        if(props.clickData.beginNodeId === datalist[i].nodeId){
                            let marker = new navermaps.Marker({
                                position: new navermaps.LatLng(datalist[i].lat, datalist[i].lon),
                                size : (5,5),
                                zIndex : 200,
                                icon : pointImage,
                                draggable : true
                            });
                            
                            marker["nodeId"] = datalist[i].nodeId;
                            marker.setMap(map.current);
                            markerArr.push(marker);

                            startNodeMarker.current = marker;
                        }else if(props.clickData.endNodeId === datalist[i].nodeId){
                            let marker = new navermaps.Marker({
                                position: new navermaps.LatLng(datalist[i].lat, datalist[i].lon),
                                size : (5,5),
                                zIndex : 200,
                                icon : pointImage,
                                draggable : true
                            });
                            
                            marker["nodeId"] = datalist[i].nodeId;
                            marker.setMap(map.current);
                            markerArr.push(marker);

                            endNodeMarker.current = marker;
                        }else{
                            let marker = new navermaps.Marker({
                                position: new navermaps.LatLng(datalist[i].lat, datalist[i].lon),
                                size : (5,5),
                                zIndex : 200,
                                draggable : true
                            });
                            
                            marker["nodeId"] = datalist[i].nodeId;
                            marker.setMap(map.current);
                            markerArr.push(marker);
                        }
                    }else{
                        //선택한 로우가 없는 경우
                        let marker = new navermaps.Marker({
                            position: new navermaps.LatLng(datalist[i].lat, datalist[i].lon),
                            size : (5,5),
                            zIndex : 200,
                            draggable : true
                        });
                        
                        marker["nodeId"] = datalist[i].nodeId;
                        marker.setMap(map.current);
                        markerArr.push(marker);
                    }
                    
                    //마커이벤트 추가
                    if(mode === "C" || mode === "U"){
                        navermaps.Event.addListener(marker, 'click', function (e) {
                            if(e.overlay.getIcon() === null){
                                if(document.activeElement.id === "beginNodeId"){
                                    //시작노드인 경우
                                    if(startNodeMarker.current === null){
                                        for(let i=0; i<props.formDtlConf.columns.length; i++){
                                            if(props.formDtlConf.columns[i].id === "beginNodeId"){
                                                props.formDtlConf.columns[i].value = e.overlay.nodeId;
                                                props.setFormDtlConf({...props.formDtlConf});
                                            }
                                        }
                                        e.overlay.setIcon(pointImage);
                                        startNodeMarker.current = e.overlay;
                                    }else{
                                        //기존 시작노드 초기화
                                        startNodeMarker.current.setIcon(null);
        
                                        for(let i=0; i<props.formDtlConf.columns.length; i++){
                                            if(props.formDtlConf.columns[i].id === "beginNodeId"){
                                                props.formDtlConf.columns[i].value = e.overlay.nodeId;
                                                props.setFormDtlConf({...props.formDtlConf});
                                            }
                                        }
                                        e.overlay.setIcon(pointImage);
                                        startNodeMarker.current = e.overlay;
                                    }
                                }else if(document.activeElement.id === "endNodeId"){
                                    //종료노드인 경우
                                    if(endNodeMarker.current === null){
                                        for(let i=0; i<props.formDtlConf.columns.length; i++){
                                            if(props.formDtlConf.columns[i].id === "endNodeId"){
                                                props.formDtlConf.columns[i].value = e.overlay.nodeId;
                                                console.log(props.formDtlConf);
                                                props.setFormDtlConf({...props.formDtlConf});
                                            }
                                        }
                                        e.overlay.setIcon(pointImage);
                                        endNodeMarker.current = e.overlay;
                                    }else{
                                        //기존 종료노드 초기화
                                        endNodeMarker.current.setIcon(null);
        
                                        for(let i=0; i<props.formDtlConf.columns.length; i++){
                                            if(props.formDtlConf.columns[i].id === "endNodeId"){
                                                props.formDtlConf.columns[i].value = e.overlay.nodeId;
                                                props.setFormDtlConf({...props.formDtlConf});
                                            }
                                        }
                                        e.overlay.setIcon(pointImage);
                                        endNodeMarker.current = e.overlay;
                                    }
                                }
                            }else{
                                if(document.activeElement.id === "beginNodeId"){
                                    for(let i=0; i<props.formDtlConf.columns.length; i++){
                                        if(props.formDtlConf.columns[i].id === "beginNodeId"){
                                            props.formDtlConf.columns[i].value = null;
                                            console.log(props.formDtlConf);
                                            props.setFormDtlConf({...props.formDtlConf});
                                        }
                                    }
                                    e.overlay.setIcon(null);
                                }else if(document.activeElement.id === "endNodeId"){
                                    for(let i=0; i<props.formDtlConf.columns.length; i++){
                                        if(props.formDtlConf.columns[i].id === "endNodeId"){
                                            props.formDtlConf.columns[i].value = null;
                                            console.log(props.formDtlConf);
                                            props.setFormDtlConf({...props.formDtlConf});
                                        }
                                    }
                                    e.overlay.setIcon(null);
                                }
                            }
                        })
                    }
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
                    polyline["linkDist"] = datalist[i].linkDist;
                    polyLineArr.push(polyline);
                    polyLineArr[i].setMap(map.current);
                }

                
                for(let j=0; j<polyLineArr.length; j++){
                    //폴리라인 이벤트 추가
                    if(mode === "C" || mode === "U"){
                        //선택한 경우 폴리라인 색깔변경 및 Ref로 값 관리
                        navermaps.Event.addListener(polyLineArr[j], 'click', function (e) {
                            if(e.overlay.getOptions("strokeColor") === "#808080"){
                                e.overlay.setOptions("strokeColor", "#FF0000")
                                
                                //상세데이터 표출 관리
                                mapDetailArr.current = props.rows2;
                                mapDetailArr.current.push({linkId : e.overlay.linkId, linkDist : e.overlay.linkDist});
                                props.setRows2([...mapDetailArr.current]);

                                //선택된 폴리라인 관리
                                polyLineArray.current.push(e.overlay);
                            }else{
                                e.overlay.setOptions("strokeColor", "#808080")

                                //상세데이터 표출 관리
                                mapDetailArr.current = props.rows2;
                                for(let i=0; i<mapDetailArr.current.length; i++){
                                    if(mapDetailArr.current[i].linkId === e.overlay.linkId){
                                        mapDetailArr.current.splice(i,1);
                                        props.setRows2([...mapDetailArr.current]);
                                    }
                                }

                                //선택된 폴리라인 관리
                                for(let i=0; i<polyLineArray.current.length; i++){
                                    if(polyLineArray.current[i].linkId === e.overlay.linkId){
                                        polyLineArray.current.splice(i,1);
                                    }
                                }
                            }
                        })
                    }
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

            //버튼모드
            let mode = props.mode?.mode;

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
                        //draggable : true
                    });
                    
                    marker["nodeId"] = datalist[i].nodeId;
                    marker.setMap(map.current);
                    markerArr.push(marker);

                    //마커이벤트 추가
                    if(mode === "C" || mode === "U"){
                        navermaps.Event.addListener(marker.current[i], 'click', function (e) {
                            if(e.overlay.getIcon() === null){
                                e.overlay.setIcon(pointImage);
                            }else{
                                e.overlay.setIcon(null);
                            }
                        })
                    }
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

            //버튼모드
            let mode = props.mode?.mode;

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
                    
                    if(mode === "C" || mode === "U"){
                        navermaps.Event.addListener(polyLineArr[j], 'click', function (e) {
                            //선택한 경우 폴리라인 색깔변경
                            if(e.overlay.getOptions("strokeColor") === "#808080"){
                                e.overlay.setOptions("strokeColor", "#FF0000")
                            }else{
                                e.overlay.setOptions("strokeColor", "#808080")
                            }
                        })
                    }
                }

                polyLineMinMaxArray.current = polyLineArr;
            });
        }
    }

    /***** 모드 변경에 따른 지도 데이터 관리 *****/
    useEffect(() => {
        let mode = props.mode?.mode;
        
        //모드가 조회인 경우
        if(mode === "R"){
            //선택한 폴리라인 삭제
            for(let i=0; i<polyLineArray.current.length; i++){
                polyLineArray.current[i].setMap(null);
            }

            //선택한 노드 기본 이미지로 초기화
            for(let i=0; i<markerMinMaxArray.current.length; i++){
                if(markerMinMaxArray.current[i].getIcon() !== null){
                    markerMinMaxArray.current[i].setIcon(null);
                }
            }
        }

        //모드가 추가인 경우
        if(mode === "C"){
            //선택한 폴리라인 삭제
            for(let i=0; i<polyLineArray.current.length; i++){
                polyLineArray.current[i].setMap(null);
            }

            //선택한 노드 기본 이미지로 초기화
            for(let i=0; i<markerMinMaxArray.current.length; i++){
                if(markerMinMaxArray.current[i].getIcon() !== null){
                    markerMinMaxArray.current[i].setIcon(null);
                }
            }

            for(let i=0; i<polyLineArray.current.length; i++){
                navermaps.Event.addListener(polyLineArray.current[i], 'click', function (e) {
                    console.log("실행1");
                    console.log(e.overlay);
                    //선택한 경우 폴리라인 색깔변경
                    if(e.overlay.getOptions("strokeColor") === "#808080"){
                        e.overlay.setOptions("strokeColor", "#FF0000");

                        //상세데이터 표출 관리
                        mapDetailArr.current = props.rows2;
                        mapDetailArr.current.push({linkId : e.overlay.linkId, linkDist : e.overlay.linkDist});
                        props.setRows2([...mapDetailArr.current]);
                        
                        //선택된 폴리라인 관리
                        polyLineArray.current.push(e.overlay);
                    }else{
                        e.overlay.setOptions("strokeColor", "#808080");

                        //상세데이터 표출 관리
                        mapDetailArr.current = props.rows2;
                        for(let i=0; i<mapDetailArr.current.length; i++){
                            if(mapDetailArr.current[i].linkId === e.overlay.linkId){
                                mapDetailArr.current.splice(i,1);
                                props.setRows2([...mapDetailArr.current]);
                            }
                        }
                        
                        //선택된 폴리라인 관리
                        for(let i=0; i<polyLineArray.current.length; i++){
                            if(polyLineArray.current[i].linkId === e.overlay.linkId){
                                polyLineArray.current.splice(i,1);
                            }
                        }
                    }
                })
            }

            for(let i=0; i<polyLineMinMaxArray.current.length; i++){
                navermaps.Event.addListener(polyLineMinMaxArray.current[i], 'click', function (e) {
                    console.log("실행2");
                    console.log(e.overlay);
                    //선택한 경우 폴리라인 색깔변경
                    if(e.overlay.getOptions("strokeColor") === "#808080"){
                        e.overlay.setOptions("strokeColor", "#FF0000");
                        
                        //상세데이터 표출 관리
                        mapDetailArr.current = props.rows2;
                        mapDetailArr.current.push({linkId : e.overlay.linkId, linkDist : e.overlay.linkDist});
                        props.setRows2([...mapDetailArr.current]);
                        
                        //선택된 폴리라인 관리
                        polyLineArray.current.push(e.overlay);
                    }else{
                        e.overlay.setOptions("strokeColor", "#808080");
                        
                        //상세데이터 표출 관리
                        mapDetailArr.current = props.rows2;
                        for(let i=0; i<mapDetailArr.current.length; i++){
                            if(mapDetailArr.current[i].linkId === e.overlay.linkId){
                                mapDetailArr.current.splice(i,1);
                                props.setRows2([...mapDetailArr.current]);
                            }
                        }

                        //선택된 폴리라인 관리
                        for(let i=0; i<polyLineArray.current.length; i++){
                            if(polyLineArray.current[i].linkId === e.overlay.linkId){
                                polyLineArray.current.splice(i,1);
                            }
                        }
                    }
                })
            }

            for(let i=0; i<markerMinMaxArray.current.length; i++){
                navermaps.Event.addListener(markerMinMaxArray.current[i], 'click', function (e) {
                    console.log("실행3");
                    console.log(e.overlay);
                    if(e.overlay.getIcon() === null){
                        if(document.activeElement.id === "beginNodeId"){
                            //시작노드인 경우
                            if(startNodeMarker.current === null){
                                for(let i=0; i<props.formDtlConf.columns.length; i++){
                                    if(props.formDtlConf.columns[i].id === "beginNodeId"){
                                        props.formDtlConf.columns[i].value = e.overlay.nodeId;
                                        props.setFormDtlConf({...props.formDtlConf});
                                    }
                                }
                                e.overlay.setIcon(pointImage);
                                startNodeMarker.current = e.overlay;
                            }else{
                                //기존 시작노드 초기화
                                startNodeMarker.current.setIcon(null);

                                for(let i=0; i<props.formDtlConf.columns.length; i++){
                                    if(props.formDtlConf.columns[i].id === "beginNodeId"){
                                        props.formDtlConf.columns[i].value = e.overlay.nodeId;
                                        props.setFormDtlConf({...props.formDtlConf});
                                    }
                                }
                                e.overlay.setIcon(pointImage);
                                startNodeMarker.current = e.overlay;
                            }
                        }else if(document.activeElement.id === "endNodeId"){
                            //종료노드인 경우
                            if(endNodeMarker.current === null){
                                for(let i=0; i<props.formDtlConf.columns.length; i++){
                                    if(props.formDtlConf.columns[i].id === "endNodeId"){
                                        props.formDtlConf.columns[i].value = e.overlay.nodeId;
                                        console.log(props.formDtlConf);
                                        props.setFormDtlConf({...props.formDtlConf});
                                    }
                                }
                                e.overlay.setIcon(pointImage);
                                endNodeMarker.current = e.overlay;
                            }else{
                                //기존 종료노드 초기화
                                endNodeMarker.current.setIcon(null);

                                for(let i=0; i<props.formDtlConf.columns.length; i++){
                                    if(props.formDtlConf.columns[i].id === "endNodeId"){
                                        props.formDtlConf.columns[i].value = e.overlay.nodeId;
                                        props.setFormDtlConf({...props.formDtlConf});
                                    }
                                }
                                e.overlay.setIcon(pointImage);
                                endNodeMarker.current = e.overlay;
                            }
                        }
                    }else{
                        if(document.activeElement.id === "beginNodeId"){
                            for(let i=0; i<props.formDtlConf.columns.length; i++){
                                if(props.formDtlConf.columns[i].id === "beginNodeId"){
                                    props.formDtlConf.columns[i].value = null;
                                    console.log(props.formDtlConf);
                                    props.setFormDtlConf({...props.formDtlConf});
                                }
                            }
                            e.overlay.setIcon(null);
                        }else if(document.activeElement.id === "endNodeId"){
                            for(let i=0; i<props.formDtlConf.columns.length; i++){
                                if(props.formDtlConf.columns[i].id === "endNodeId"){
                                    props.formDtlConf.columns[i].value = null;
                                    console.log(props.formDtlConf);
                                    props.setFormDtlConf({...props.formDtlConf});
                                }
                            }
                            e.overlay.setIcon(null);
                        }
                    }
                })
            }
        }

        //모드가 수정인 경우
        if(mode === "U"){
            for(let i=0; i<polyLineArray.current.length; i++){
                navermaps.Event.addListener(polyLineArray.current[i], 'click', function (e) {
                    console.log("실행1");
                    console.log(e.overlay);
                    //선택한 경우 폴리라인 색깔변경
                    if(e.overlay.getOptions("strokeColor") === "#808080"){
                        e.overlay.setOptions("strokeColor", "#FF0000");

                        //상세데이터 표출 관리
                        mapDetailArr.current = props.rows2;
                        mapDetailArr.current.push({linkId : e.overlay.linkId, linkDist : e.overlay.linkDist});
                        props.setRows2([...mapDetailArr.current]);
                        
                        //선택된 폴리라인 관리
                        polyLineArray.current.push(e.overlay);
                    }else{
                        e.overlay.setOptions("strokeColor", "#808080");

                        //상세데이터 표출 관리
                        mapDetailArr.current = props.rows2;
                        for(let i=0; i<mapDetailArr.current.length; i++){
                            if(mapDetailArr.current[i].linkId === e.overlay.linkId){
                                mapDetailArr.current.splice(i,1);
                                props.setRows2([...mapDetailArr.current]);
                            }
                        }
                        
                        //선택된 폴리라인 관리
                        for(let i=0; i<polyLineArray.current.length; i++){
                            if(polyLineArray.current[i].linkId === e.overlay.linkId){
                                polyLineArray.current.splice(i,1);
                            }
                        }
                    }
                })
            }

            for(let i=0; i<polyLineMinMaxArray.current.length; i++){
                navermaps.Event.addListener(polyLineMinMaxArray.current[i], 'click', function (e) {
                    console.log("실행2");
                    console.log(e.overlay);
                    //선택한 경우 폴리라인 색깔변경
                    if(e.overlay.getOptions("strokeColor") === "#808080"){
                        e.overlay.setOptions("strokeColor", "#FF0000");
                        
                        //상세데이터 표출 관리
                        mapDetailArr.current = props.rows2;
                        mapDetailArr.current.push({linkId : e.overlay.linkId, linkDist : e.overlay.linkDist});
                        props.setRows2([...mapDetailArr.current]);
                        
                        //선택된 폴리라인 관리
                        polyLineArray.current.push(e.overlay);
                    }else{
                        e.overlay.setOptions("strokeColor", "#808080");
                        
                        //상세데이터 표출 관리
                        mapDetailArr.current = props.rows2;
                        for(let i=0; i<mapDetailArr.current.length; i++){
                            if(mapDetailArr.current[i].linkId === e.overlay.linkId){
                                mapDetailArr.current.splice(i,1);
                                props.setRows2([...mapDetailArr.current]);
                            }
                        }

                        //선택된 폴리라인 관리
                        for(let i=0; i<polyLineArray.current.length; i++){
                            if(polyLineArray.current[i].linkId === e.overlay.linkId){
                                polyLineArray.current.splice(i,1);
                            }
                        }
                    }
                })
            }

            for(let i=0; i<markerMinMaxArray.current.length; i++){
                navermaps.Event.addListener(markerMinMaxArray.current[i], 'click', function (e) {
                    console.log("실행3");
                    console.log(e.overlay);
                    if(e.overlay.getIcon() === null){
                        if(document.activeElement.id === "beginNodeId"){
                            //시작노드인 경우
                            if(startNodeMarker.current === null){
                                for(let i=0; i<props.formDtlConf.columns.length; i++){
                                    if(props.formDtlConf.columns[i].id === "beginNodeId"){
                                        props.formDtlConf.columns[i].value = e.overlay.nodeId;
                                        props.setFormDtlConf({...props.formDtlConf});
                                    }
                                }
                                e.overlay.setIcon(pointImage);
                                startNodeMarker.current = e.overlay;
                            }else{
                                //기존 시작노드 초기화
                                startNodeMarker.current.setIcon(null);

                                for(let i=0; i<props.formDtlConf.columns.length; i++){
                                    if(props.formDtlConf.columns[i].id === "beginNodeId"){
                                        props.formDtlConf.columns[i].value = e.overlay.nodeId;
                                        props.setFormDtlConf({...props.formDtlConf});
                                    }
                                }
                                e.overlay.setIcon(pointImage);
                                startNodeMarker.current = e.overlay;
                            }
                        }else if(document.activeElement.id === "endNodeId"){
                            //종료노드인 경우
                            if(endNodeMarker.current === null){
                                for(let i=0; i<props.formDtlConf.columns.length; i++){
                                    if(props.formDtlConf.columns[i].id === "endNodeId"){
                                        props.formDtlConf.columns[i].value = e.overlay.nodeId;
                                        console.log(props.formDtlConf);
                                        props.setFormDtlConf({...props.formDtlConf});
                                    }
                                }
                                e.overlay.setIcon(pointImage);
                                endNodeMarker.current = e.overlay;
                            }else{
                                //기존 종료노드 초기화
                                endNodeMarker.current.setIcon(null);

                                for(let i=0; i<props.formDtlConf.columns.length; i++){
                                    if(props.formDtlConf.columns[i].id === "endNodeId"){
                                        props.formDtlConf.columns[i].value = e.overlay.nodeId;
                                        props.setFormDtlConf({...props.formDtlConf});
                                    }
                                }
                                e.overlay.setIcon(pointImage);
                                endNodeMarker.current = e.overlay;
                            }
                        }
                    }else{
                        if(document.activeElement.id === "beginNodeId"){
                            for(let i=0; i<props.formDtlConf.columns.length; i++){
                                if(props.formDtlConf.columns[i].id === "beginNodeId"){
                                    props.formDtlConf.columns[i].value = null;
                                    console.log(props.formDtlConf);
                                    props.setFormDtlConf({...props.formDtlConf});
                                }
                            }
                            e.overlay.setIcon(null);
                        }else if(document.activeElement.id === "endNodeId"){
                            for(let i=0; i<props.formDtlConf.columns.length; i++){
                                if(props.formDtlConf.columns[i].id === "endNodeId"){
                                    props.formDtlConf.columns[i].value = null;
                                    console.log(props.formDtlConf);
                                    props.setFormDtlConf({...props.formDtlConf});
                                }
                            }
                            e.overlay.setIcon(null);
                        }
                    }
                })
            }
        }
        
        //모드가 취소나 삭제인 경우
        if(mode === 'N' || mode === 'D'){
            //선택한 폴리라인 초기화
            for(let i=0; i<polyLineArray.current.length; i++){
                polyLineArray.current[i].setMap(null);
            }

            //선택한 노드 기본 이미지로 초기화
            for(let i=0; i<markerMinMaxArray.current.length; i++){
                if(markerMinMaxArray.current[i].getIcon() !== null){
                    markerMinMaxArray.current[i].setIcon(null);
                }
            }

            for(let i=0; i<markerMinMaxArray.current.length; i++){
                navermaps.Event.clearInstanceListeners(markerMinMaxArray.current[i]);
            }

            for(let i=0; i<polyLineMinMaxArray.current.length; i++){
                navermaps.Event.clearInstanceListeners(polyLineMinMaxArray.current[i]);
            }
        }
    }, [props.mode])

    /******************** 지도 센터 변경 시  지도크기 안의 폴리라인 및 노드 재표출 ********************/
    useEffect(()=>{
        if(props.mapConf.minMaxEvt !== undefined){
            if(props.mapConf.minMaxEvt.flag){
                getPolyLineMarkerMinMax();
            }
        }
    },[props.mapConf.mapCenter?.lon, props.mapConf.mapCenter?.lat])

    /******************** 조회 시 지도크기 안의 폴리라인 및 노드 표출 ********************/
    useEffect(() => {
        if(props.mapConf.minMaxEvt !== undefined){
            if(props.mapConf.minMaxEvt.flag){
                getPolyLineMarkerMinMax();
            }

            //지도 드레그 시 폴리라인 및 노드 재표출
            navermaps.Event.addListener(map.current, 'dragend', function(e){
                props.mapConf.mapCenter.lon = e.coord.x;
                props.mapConf.mapCenter.lat = e.coord.y;
                props.mapOptConf({...props.mapConf});
            });
        }
    }, [props.mapConf.minMaxEvt?.flag])
    
    /******************** 수집구간 상세 폴리라인 표출 함수 ********************/
    useEffect(() => {
        let viewDatalist = props.mapConf?.viewDatalist;

        if(viewDatalist !== undefined && viewDatalist.length > 0){
            // 폴리라인 초기화
            if(polyLineArray.current.length != 0){
                for(let i=0; i<polyLineArray.current.length; i++){
                    polyLineArray.current[i].setMap(null);
                }
            }

            //버튼모드
            let mode = props.mode?.mode;

            
            //지도 센터이동
            let lon = (viewDatalist[0].lon + viewDatalist[viewDatalist.length-1].lon)/2;
            let lat = (viewDatalist[0].lat + viewDatalist[viewDatalist.length-1].lat)/2;

            map.current.setCenter(new navermaps.LatLng(lat, lon));
            props.mapConf.mapCenter.lon = lon;
            props.mapConf.mapCenter.lat = lat;
            props.mapOptConf({...props.mapConf});

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
                    clickable : true,
                    zIndex : 100
                });
                
                polyline["linkId"] = Object.keys(linkObj)[i];
                polyline.setMap(map.current);
                polyLineArr.push(polyline);

                if(mode === "C" || mode === "U"){
                    //폴리라인 클릭 이벤트
                    navermaps.Event.addListener(polyLineArr[j], 'click', function (e) {
                        if(e.overlay.getOptions("strokeColor") === "#808080"){
                            //선택한 경우
                            e.overlay.setOptions("strokeColor", "#FF0000");
                            polyLineArray.current.push(e.overlay);
                        }else{
                            //선택하지 않은 경우
                            e.overlay.setOptions("strokeColor", "#808080");
                            for(let i=0; i<polyLineArray.current.length; i++){
                                if(polyLineArray.current[i].linkId === e.overlay.linkId){
                                    polyLineArray.current.splice(i,1);
                                }
                            }
                        }
                    })
                }
            }
            polyLineArray.current = polyLineArr;
        }
    }, [props.mapConf.viewDatalist])
    
    /******************** 지도 줌 크기 재조절 함수 ********************/
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
                    //draggable : true, //마커 중복여부 확인 시 true 변경 후 확인
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
                        //draggable : true, //마커 중복여부 확인 시 true 변경 후 확인
                        // title : props.clickData,
                        map: map.current
                    });
    
                    let markerE = new navermaps.Marker({
                        position: new navermaps.LatLng(props.clickData[props.mapConf.vtx][props.clickData[props.mapConf.vtx].length-1][1],
                                                       props.clickData[props.mapConf.vtx][props.clickData[props.mapConf.vtx].length-1][0]),
                        size : (5,5),
                        zIndex : 200,
                        //draggable : true, //마커 중복여부 확인 시 true 변경 후 확인
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
        }
    }, [props.clickData]);

    return (
        <div ref={navermap} style={{width: "100%", height: "100%"}}>
        </div>
    );

};

export default NaverMapContainer;
