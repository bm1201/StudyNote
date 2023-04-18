/*
- 사용방법
    1. mapConf에 옵션 및 속성값을 추가하여 NaverMapContainer에 props로 전송

- 지원기능
    1. marker 표출함수
    -기능 : data를 기반으로 key를 PK로 갖는 마커를 지도위에 생성
    -형태(모든 속성값 필수입력)
    fnMarker : {
        key  : "",                    // 마커 key 컬럼 지정 => PK의 역할
        coord : {lon : "", lat : ""}, // 마커 좌표(위도, 경도) 컬럼 지정
        data : []                     // 마커 데이터
    },

    ex) fnMarker : {
            key  : "nodeId",
            coord : {lon : "lon", lat : "lat"},
            data : [{
                "nodeId": "3140013700",
                "lon": 127.5325581,
                "lat": 35.99196044
            }]
        }

        new navermaps.LatLng(35.99196044, 127.5325581])위치에 nodeId의 값을 PK로 가진 마커 생성
    
    3. marker 관련 이벤트 함수
    -기능 : data와 동일한 데이터를 가진 마커에 이벤트처리
    -형태
    fnMarkerEvt : {
        type : "", //이벤트 타입 지정 (필수)
        data : []  //이벤트 실행할 데이터 (선택)
    }

    -type 종류
    Animation : data와 동일한 데이터를 가진 마커에 애니메이션 기능을 추가한다. 만약 이미 애니매이션 기능이 있는 마커가 있다면 해당 마커 애니메이션 이벤트 제거한다.
    // MapClick : 지도에서 클릭 한 위치의 좌표를 반환한다.

    ex)
*/