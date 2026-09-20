; Inno Setup script for AVAS (compile through packaging\build.py, or:
;   ISCC.exe /DAppVersion=2.0.0 /DSourceDir=..\dist\AVAS /DOutputDir=..\dist\installer packaging\avas.iss)
;
; Installs dist\AVAS\ (AVASGui.exe, AVAS.exe and their files) for the current
; user without administrator rights by default (the setup offers "all users"
; too), creates Start menu / optional desktop shortcuts, can put AVAS.exe on
; the user's PATH for the command line, and runs Microsoft's WebView2
; bootstrapper when the runtime is missing.

#ifndef AppVersion
  #define AppVersion "2.0.0"
#endif
#ifndef SourceDir
  #define SourceDir "..\dist\AVAS"
#endif
#ifndef OutputDir
  #define OutputDir "..\dist\installer"
#endif

[Setup]
AppId={{6B7C0E2A-6F6B-4E0B-9C5D-3A1F4B2C8D71}
AppName=AVAS
AppVersion={#AppVersion}
AppVerName=AVAS {#AppVersion}
AppPublisher=AVAS developers
AppComments=Advanced Virtual Accelerator Software
DefaultDirName={autopf}\AVAS
DefaultGroupName=AVAS
DisableProgramGroupPage=yes
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=dialog
OutputDir={#OutputDir}
OutputBaseFilename=AVAS-{#AppVersion}-setup
SetupIconFile={#SourceDir}\_internal\avas\gui\web\avas.ico
UninstallDisplayIcon={app}\AVASGui.exe
Compression=lzma2/max
SolidCompression=yes
WizardStyle=modern
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
ChangesEnvironment=yes
CloseApplications=yes

[Languages]
Name: "en"; MessagesFile: "compiler:Default.isl"
Name: "zh"; MessagesFile: "languages\ChineseSimplified.isl"

[CustomMessages]
en.DesktopIcon=Create a desktop shortcut
zh.DesktopIcon=创建桌面快捷方式
en.AddToPath=Add AVAS.exe to PATH (command line: avas run ...)
zh.AddToPath=将 AVAS.exe 加入 PATH（命令行：AVAS run ...）
en.RunAvas=Start AVAS
zh.RunAvas=启动 AVAS
en.WebView2=Installing Microsoft Edge WebView2 runtime...
zh.WebView2=正在安装 Microsoft Edge WebView2 运行时……

[Tasks]
Name: "desktopicon"; Description: "{cm:DesktopIcon}"
Name: "addtopath"; Description: "{cm:AddToPath}"; Flags: unchecked

[Files]
Source: "{#SourceDir}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\AVAS"; Filename: "{app}\AVASGui.exe"; WorkingDir: "{userdocs}"
Name: "{group}\{cm:UninstallProgram,AVAS}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\AVAS"; Filename: "{app}\AVASGui.exe"; WorkingDir: "{userdocs}"; Tasks: desktopicon

[Registry]
Root: HKCU; Subkey: "Environment"; ValueType: expandsz; ValueName: "Path"; ValueData: "{olddata};{app}"; \
  Tasks: addtopath; Check: NeedsAddPath(ExpandConstant('{app}'))

[Run]
Filename: "{app}\_internal\MicrosoftEdgeWebview2Setup.exe"; Parameters: "/silent /install"; StatusMsg: "{cm:WebView2}"; \
  Flags: waituntilterminated skipifdoesntexist; Check: WebView2Missing
Filename: "{app}\AVASGui.exe"; Description: "{cm:RunAvas}"; Flags: nowait postinstall skipifsilent

[Code]
function WebView2Missing: Boolean;
var
  Version: String;
begin
  Result := True;
  if RegQueryStringValue(HKLM, 'SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}', 'pv', Version) and (Version <> '') and (Version <> '0.0.0.0') then
    Result := False
  else if RegQueryStringValue(HKLM, 'SOFTWARE\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}', 'pv', Version) and (Version <> '') and (Version <> '0.0.0.0') then
    Result := False
  else if RegQueryStringValue(HKCU, 'SOFTWARE\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}', 'pv', Version) and (Version <> '') and (Version <> '0.0.0.0') then
    Result := False;
end;

function NeedsAddPath(Dir: String): Boolean;
var
  Paths: String;
begin
  if not RegQueryStringValue(HKCU, 'Environment', 'Path', Paths) then
  begin
    Result := True;
    exit;
  end;
  Result := Pos(';' + Uppercase(Dir) + ';', ';' + Uppercase(Paths) + ';') = 0;
end;

procedure RemoveFromPath(Dir: String);
var
  Paths: String;
  P: Integer;
begin
  if not RegQueryStringValue(HKCU, 'Environment', 'Path', Paths) then
    exit;
  P := Pos(';' + Uppercase(Dir) + ';', ';' + Uppercase(Paths) + ';');
  if P = 0 then
    exit;
  Delete(Paths, P - 1, Length(Dir) + 1);
  if (Length(Paths) > 0) and (Paths[1] = ';') then
    Delete(Paths, 1, 1);
  RegWriteExpandStringValue(HKCU, 'Environment', 'Path', Paths);
end;

procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
begin
  if CurUninstallStep = usPostUninstall then
    RemoveFromPath(ExpandConstant('{app}'));
end;
