# home.tsx 수정
1. homePage.tsx 아래 내용과 같이 수정
   1. admin@test.com <- 관리자 계정만 추가, 수정, 삭제 할수 있게끔 만든다
   2. 이메일, 연락처, 위치, 웹사이트, 소속, 기술스텍 db에서 수정, 가능하게끔 추가
      * db 테이블은 myself_info 참조
   3. social link-> sns_instar, sns_naver_blog 수정 가능하게끔 추가
      * db 테이블은 myself_info 참조
   4. career는 career_list db 테이블 참조하여 수정,추가,삭제 가능하게끔 추가해줘
      * homePage.tsx에 보일때는 order_no 기준 오름차순으로 보이게끔 한다