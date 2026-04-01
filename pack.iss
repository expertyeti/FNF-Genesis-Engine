[Setup]
AppId={{87213177-AAB0-4351-829E-218A31FDF29C}
AppName=Genesis Engine
AppVersion=1.0.0
AppPublisher=imbritex
DefaultDirName={localappdata}\Genesis Engine
DefaultGroupName=Genesis Engine
OutputBaseFilename=Instalador_Genesis_Engine
Compression=lzma
SolidCompression=yes
PrivilegesRequired=lowest 

; Este es solo para el archivo instalador (el que le pasas a la gente). 
; Si también se ve en blanco, significa que el conversor de PNG a ICO falló.
SetupIconFile=C:\Users\Britex\Proyectos\Genesis\FNF\icons\icon.ico

[Languages]
Name: "spanish"; MessagesFile: "compiler:Languages\Spanish.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
; Solo empaquetamos lo estrictamente necesario
Source: "C:\Users\Britex\Proyectos\Genesis\dist\Genesis Engine\Genesis Engine-win_x64.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "C:\Users\Britex\Proyectos\Genesis\dist\Genesis Engine\resources.neu"; DestDir: "{app}"; Flags: ignoreversion
Source: "C:\Users\Britex\Proyectos\Genesis\dist\Genesis Engine\extensions\*"; DestDir: "{app}\extensions"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
; Le agregamos "WorkingDir: {app}" por seguridad, y dejamos que Windows use el icono de tu .exe
Name: "{group}\Genesis Engine"; Filename: "{app}\Genesis Engine-win_x64.exe"; WorkingDir: "{app}"
Name: "{autodesktop}\Genesis Engine"; Filename: "{app}\Genesis Engine-win_x64.exe"; WorkingDir: "{app}"; Tasks: desktopicon

[Run]
Filename: "{app}\Genesis Engine-win_x64.exe"; WorkingDir: "{app}"; Description: "{cm:LaunchProgram,Genesis Engine}"; Flags: nowait postinstall skipifsilent