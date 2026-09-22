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
#ifndef AppCommit
  #define AppCommit ""
#endif
#ifndef AppRevision
  #define AppRevision "0"
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
DisableWelcomePage=no
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
en.CheckSetup=Checking for the latest AVAS installer...
zh.CheckSetup=正在检查最新版 AVAS 安装包……
en.SetupDownload=Downloading the verified installer
zh.SetupDownload=下载并校验安装包
en.SetupAvailable=A newer installer is available: %1.%nIncluded version: %2.%n%nDownload and install it now? Choose No to install the included version.
zh.SetupAvailable=发现新版安装包：%1。%n内置版本：%2。%n%n是否下载并安装新版？选择“否”安装内置版本。
en.SetupFailed=Could not check, download, or start the latest installer.%n%n%1%n%nRetry: try again. Ignore: install the included version (it may be outdated). Abort: exit setup.
zh.SetupFailed=检查、下载或启动最新版安装包失败。%n%n%1%n%n重试：重新尝试。忽略：安装内置版本（可能不是最新版）。中止：退出安装。
en.SetupInvalid=The official installer metadata is invalid or incompatible.
zh.SetupInvalid=官方安装包信息无效或不兼容。
en.SetupUnknown=This installer has no comparable build revision. The latest version could not be determined.
zh.SetupUnknown=此安装包缺少可比较的构建标识，无法判断是否为最新版。
en.SetupChildFailed=The downloaded installer exited with code %1. The included version has not been installed.
zh.SetupChildFailed=下载的安装器已退出，退出码为 %1。尚未安装内置版本。

[Tasks]
Name: "desktopicon"; Description: "{cm:DesktopIcon}"
Name: "addtopath"; Description: "{cm:AddToPath}"; Flags: unchecked

[Files]
Source: "{#SourceDir}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[INI]
Filename: "{app}\avas-install.ini"; Section: "UI"; Key: "Language"; String: "{code:InitialLanguage}"; Flags: uninsdeleteentry uninsdeletesectionifempty

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
#include "setup_update.iss"
function InitialLanguage(Param: String): String;
begin
  if ActiveLanguage = 'zh' then
    Result := 'zh_CN'
  else
    Result := 'en';
end;

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
