기능: 멀티로그인 지원하기
    다른 유저와 플레이하는 즐거움을 주기 위해
    게임 시스템으로서
    나는 멀티 플레이를 지원하고 싶다

    시나리오: 클라이언트가 서버에 처음 접속한다.
        만일   클라이언트가 서버에 접속하면
        그러면 서버가 클라이언트한테 id와 color를 주고
        그리고 클라인어트를 이를 받는다.

    시나리오: 클라이언트는 서버에 처음 접속해서 받은 색깔로 hero 객체를 만든다.
        만일   클라이언트가 서버로부터 WELCOME: {id: 3, color:"rgb(255,0,0)"} 을 받았으면
        그러면 빨간색 동그라미를 만든다.

    시나리오: 서버에 접속한 다른 클라이언트들이 보인다.
        조건   서버에 클라이언트A, B가 접속해 있고
        만일   서버에 새로운 클라이언트C 가 접속하면
        그러면 클라이언트A 한테 클라이언트C 가 보이고
        그리고 클라이언트C 한테 클라이언트A 와 B 가 보인다.
