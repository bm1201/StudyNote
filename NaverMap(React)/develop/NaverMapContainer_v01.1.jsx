import React from "react";
import { useEffect, useRef, useState} from "react";
import useAxiosPrivate from '@/hooks/useAxiosPrivate';
import { MSG } from '@/resources/js/message';
import "./NaverMapContainer.css";
import nodeAdd from '../../../public/images/node_add.png';
import nodeEdit from '../../../public/images/node_edit.png';
import nodeNom from '../../../public/images/node_nom.png';
import nodeSel from '../../../public/images/node_sel.png';

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
    const navermap = useRef(null);

    //네이버지도
    const map = useRef(null);

    //마커관련 변수
    const markerArray = useRef([]); //지도 위의 표출마커
    const selectMarker = useRef(null); //선택마커 관리
    const insertMarker = useRef(null); //추가마커 관리
    const editMarker = useRef(null);   //편집마커 관리

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

    // 마커 표출 관련 Effect
    useEffect(() => {
        if(props.mapConf.fnMarker?.data.length > 0){
            // 지도 위의 마커 초기화
            if(markerArray.current.length != 0){
                for(let i=0, n=markerArray.current.length; i<n; i++){
                    markerArray.current[i].setMap(null);
                }
            }

            map.current.setZoom(props.mapConf.mapZoomSize);
            
            // 마커 관련 데이터 세팅
            const markerDatalist = props.mapConf.fnMarker.data;
            const markerKey = props.mapConf.fnMarker.key;
            const markerLat = props.mapConf.fnMarker.coord.lat;
            const markerLon = props.mapConf.fnMarker.coord.lon;

            let markerArr = [];
            
            for(let i=0, n=markerDatalist.length; i<n; i++){
                //마커표출
                const marker = new navermaps.Marker({
                    position: new navermaps.LatLng(markerDatalist[i][markerLat], markerDatalist[i][markerLon]),
                    size : (5,5),
                    zIndex : 200,
                    icon : nodeNom,
                    // draggable : false, //마커 중복여부 확인 시 true 변경 후 확인
                });

                marker[markerKey] = markerDatalist[i][markerKey];
                marker.setMap(map.current);

                markerArr.push(marker);
            }

            markerArray.current = markerArr;
        }
    }, [props.mapConf.fnMarker?.data]);

    // 마커 이벤트 관련 Effect
    useEffect(() => {
        if(props.mapConf.fnMarkerEvt?.type !== null){
            const markerEvtType = props.mapConf.fnMarkerEvt?.type;
            const markerEvtData = props.mapConf.fnMarkerEvt?.data;

            if(markerEvtType === "SELECT"){
                //선택마커 초기화
                if(selectMarker.current !== null){
                    selectMarker.current.setIcon(nodeNom);
                }
                selectMarker.current= null;

                //마커 키 컬럼명
                const markerKey = props.mapConf.fnMarker.key;
                
                map.current.setCenter(new navermaps.LatLng(markerEvtData[props.mapConf.fnMarker.coord.lat], markerEvtData[props.mapConf.fnMarker.coord.lon]));
                map.current.setZoom(14);

                for(let i=0, n=markerArray.current.length; i<n ;i++){
                    if(markerArray.current[i][markerKey] === markerEvtData[markerKey]){
                        selectMarker.current = markerArray.current[i];
                        markerArray.current[i].setIcon(nodeSel);
                        break;
                    }
                }
            }

            if(markerEvtType === "ADD"){
                navermaps.Event.addListener(map.current, 'click', function (e) {
                    if(insertMarker.current !== null){
                        //기존 추가마커 삭제
                        insertMarker.current.setMap(null);
                    }
                    
                    const marker = new navermaps.Marker({
                        position: new navermaps.LatLng(e.coord.y, e.coord.x),
                        size : (5,5),
                        icon : nodeAdd,
                        // draggable : false, //마커 중복여부 확인 시 true 변경 후 확인
                    });
                    marker.setMap(map.current);
                    insertMarker.current = marker;
                });
            }

            if(markerEvtType === "EDIT"){
                navermaps.Event.addListener(map.current, 'click', function (e) {
                    if(editMarker.current !== null){
                        //기존 편집마커 삭제
                        editMarker.current.setMap(null);
                    }

                    const marker = new navermaps.Marker({
                        position: new navermaps.LatLng(e.coord.y, e.coord.x),
                        size : (5,5),
                        icon : nodeEdit,
                        // draggable : false, //마커 중복여부 확인 시 true 변경 후 확인
                    });
                    marker.setMap(map.current);
                    editMarker.current = marker;
                });
            }

            if(markerEvtType === "CANCEL" || markerEvtType === "RELOAD"){
                //추가마커 있는 경우 초기화
                if(insertMarker.current !== null){
                    insertMarker.current.setMap(null);
                    insertMarker.current = null;
                    //이벤트 초기화
                    navermaps.Event.clearListeners(map.current, "click");
                }

                //선택마커 있는 경우 초기화
                if(selectMarker.current !== null){
                    for(let i=0, n=markerArray.current.length; i<n; i++){
                        markerArray.current[i].setIcon(nodeNom);
                    }
                    selectMarker.current = null;
                }

                //편집마커 초기화
                if(editMarker.current !== null){
                    editMarker.current.setMap(null);
                    editMarker.current = null;
                    //이벤트 초기화
                    navermaps.Event.clearListeners(map.current, "click");
                }
            }
        }
    }, [props.mapConf.fnMarkerEvt?.type, props.mapConf.fnMarkerEvt?.data]);

    /******************** 공통기능 ********************/
    // 지도 줌 크기 재조절 함수
    useEffect(() => {
        if(props.mapConf.mapZoomSize !== undefined){
            map.current.setZoom(props.mapConf.mapZoomSize);
        }
    }, [props.mapConf.mapZoomSize]);

    return (
        <div ref={navermap} style={{width: "100%", height: "100%"}}>
        </div>
    );

};

export default NaverMapContainer;
