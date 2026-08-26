#define AppName    "렌슈"
#define AppVersion "1.0.0"
#define ViewerExe  "렌슈.exe"

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
AllowNoIcons=yes
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=dialog

[Languages]
Name: "korean"; MessagesFile: "compiler:Languages\Korean.isl"

[Files]
; Electron 뷰어 전체 (resources/ 안에 NestJS dist + node_modules + client/dist 포함)
Source: "viewer\dist\win-unpacked\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\{#AppName} 실행"; Filename: "{app}\{#ViewerExe}"
Name: "{group}\{#AppName} 제거"; Filename: "{uninstallexe}"
Name: "{userdesktop}\{#AppName}"; Filename: "{app}\{#ViewerExe}"; Tasks: desktopicon

[Tasks]
Name: "desktopicon"; Description: "바탕화면에 바로가기 만들기"; GroupDescription: "추가 설정:"

[Run]
Filename: "{app}\{#ViewerExe}"; Description: "{#AppName} 시작"; Flags: postinstall nowait

[UninstallRun]
Filename: "taskkill"; Parameters: "/F /IM {#ViewerExe}"; RunOnceId: "KillViewer"; Flags: runhidden

[Code]
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
