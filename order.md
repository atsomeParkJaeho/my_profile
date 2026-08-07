# home.tsx 수정
1. homePage.tsx 아래 내용과 같이 수정
   1. admin@test.com <- 관리자 계정만 추가, 수정, 삭제 할수 있게끔 만든다
   2. 이메일, 연락처, 위치, 웹사이트, 소속, 기술스텍 db에서 수정, 가능하게끔 추가
      * db 테이블은 myself_info 참조
   3. social link-> sns_instar, sns_naver_blog 수정 가능하게끔 추가
      * db 테이블은 myself_info 참조
   4. career는 career_list db 테이블 참조하여 수정,추가,삭제 가능하게끔 추가해줘
      * homePage.tsx에 보일때는 order_no 기준 오름차순으로 보이게끔 한다


# 2026-08-07
   * 현재 프로젝트 아래 내용과 같이 추가해줘
     1. 게시판 비회원 댓글기능 추가
        * 아래 맞춰 db에 댓글 테이블 추가
          * 생성일, 수정일, 생성시간, 수정시간, 이름, 작성시 비밀번호, 내용
          * 댓글 작성시 자동입력 방지 추가 (권유하는 무료 라이브러리)
   
   * smtp 아래와 같이 반영해줘
     1. @contact-02.html에서 class="container" 영역 ui로 반영
     2. 한국어로 설정
     3. db에 보낸 기록 저장
     4. @leftMenu.tsx에 반영된 내용 이동탭 추가
     5. 전송시 endpoint email주소는 "woghsla85@naver.com" 로 오게끔 추가