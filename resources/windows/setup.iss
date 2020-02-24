#define MyAppName "VPN.ht"
#define MyInstallName "VPNht-Setup"
#define MyAppVersion "0.0.0"
#define MyAppPublisher "VPN.ht"
#define MyAppURL "https://vpn.ht/"
#define MyAppExeName "VPNht.exe"

[Setup]
AppId={#MyAppName}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={pf}\{#MyAppName}
DefaultGroupName={#MyAppName}
PrivilegesRequired=admin
DisableProgramGroupPage=yes
OutputDir=..\..\build\
OutputBaseFilename={#MyInstallName}
LicenseFile=license.txt
SetupIconFile=..\..\packages\client\target\static\setup.ico
UninstallDisplayName=VPN.ht
UninstallDisplayIcon={app}\{#MyAppExeName}
Compression=lzma
SolidCompression=yes

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: checkedonce

[Files]
Source: "..\..\build\win\VPNht-win32-x64\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs; BeforeInstall: PreInstall
Source: "..\..\resources\windows\tuntap\*"; DestDir: "{app}\tuntap"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\..\resources\windows\openvpn\*"; DestDir: "{app}\openvpn"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\..\build\win\post_install.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\..\build\win\pre_uninstall.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\..\resources\windows\nssm\nssm.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\..\build\win\vpnht-service.exe"; DestDir: "{app}"; DestName: "vpnht-service.exe"; Flags: ignoreversion

[Code]
var ResultCode: Integer;
procedure PreInstall();
begin
    Exec('net.exe', 'stop vpnht', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
    Exec('taskkill.exe', '/F /IM VPNht.exe', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
    Exec('gpupdate.exe', '/force', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
end;

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{commonstartup}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{commondesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[InstallDelete]
Type: filesandordirs; Name: "{userappdata}\vpn.ht"
Type: filesandordirs; Name: "{app}"

[Run]
Filename: "{app}\post_install.exe"; Flags: runhidden; StatusMsg: "Configuring VPN.ht..."

[UninstallRun]
Filename: "{app}\pre_uninstall.exe"; Flags: runhidden

[UninstallDelete]
Type: filesandordirs; Name: "{app}"
Type: filesandordirs; Name: "C:\ProgramData\{#MyAppName}"
Type: filesandordirs; Name: "{userappdata}\vpn.ht"
