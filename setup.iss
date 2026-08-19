#define AppName    "렌슈"
#define AppVersion "1.0.0"
#define AppExe     "server.exe"
#define AppURL     "http://localhost:3000"

[Setup]
AppId={{B3F2A1C4-7E9D-4F0A-8B2E-1D3C5A6E7F8B}
AppName={#AppName}
AppVersion={#AppVersion}
AppPublisher=Renshu
DefaultDirName={autopf}\Renshu
DefaultGroupName={#AppName}
OutputDir=installer
OutputBaseFilename=RenshuSetup
SetupIconFile=
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
; 이미 설치된 경우 업그레이드 허용
AllowNoIcons=yes
; 관리자 권한 없이도 설치 가능
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=dialog

[Languages]
Name: "korean"; MessagesFile: "compiler:Languages\Korean.isl"

[Files]
; 메인 실행 파일
Source: "release\{#AppExe}"; DestDir: "{app}"; Flags: ignoreversion

; SQLite DB (없으면 첫 실행 시 자동 생성)
; Source: "release\db.sqlite"; DestDir: "{app}"; Flags: ignoreversion onlyifdoesntexist

[Icons]
; 시작 메뉴
Name: "{group}\{#AppName} 실행";    Filename: "{app}\{#AppExe}"
Name: "{group}\{#AppName} 제거";    Filename: "{uninstallexe}"
; 바탕화면
Name: "{commondesktop}\{#AppName}"; Filename: "{app}\{#AppExe}"; Tasks: desktopicon

[Tasks]
Name: "desktopicon"; Description: "바탕화면에 바로가기 만들기"; GroupDescription: "추가 설정:"; Flags: checked

[Run]
; 설치 완료 후 실행 + 브라우저 자동 오픈
Filename: "{app}\{#AppExe}";          Description: "{#AppName} 서버 시작"; Flags: postinstall nowait
Filename: "{#AppURL}";                Description: "브라우저로 열기";       Flags: postinstall shellexec nowait skipifsilent

[UninstallRun]
; 제거 시 프로세스 종료
Filename: "taskkill"; Parameters: "/F /IM {#AppExe}"; Flags: runhidden

[Code]
// 설치 전 Chrome/Edge 존재 여부 경고
function InitializeSetup(): Boolean;
var
  ChromePath, EdgePath: String;
  HasBrowser: Boolean;
begin
  ChromePath := ExpandConstant('{localappdata}\Google\Chrome\Application\chrome.exe');
  EdgePath   := ExpandConstant('{localappdata}\Microsoft\Edge\Application\msedge.exe');
  HasBrowser := FileExists(ChromePath)
             or FileExists('C:\Program Files\Google\Chrome\Application\chrome.exe')
             or FileExists('C:\Program Files (x86)\Google\Chrome\Application\chrome.exe')
             or FileExists(EdgePath)
             or FileExists('C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe');

  if not HasBrowser then
  begin
    MsgBox(
      '경고: Google Chrome 또는 Microsoft Edge가 설치되어 있지 않습니다.' + #13#10 +
      '' + #13#10 +
      '검색 기능을 사용하려면 Chrome 또는 Edge가 필요합니다.' + #13#10 +
      '설치 후 계속하거나, 나중에 설치하셔도 됩니다.',
      mbConfirmation, MB_OK
    );
  end;

  Result := True;
end;
