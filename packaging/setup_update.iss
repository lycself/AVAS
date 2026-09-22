// Stable schema 1 protocol. Only immutable assets from the official repository
// may be executed. A child skips discovery, so one click cannot chase releases.
var
  SetupDownloadPage: TDownloadWizardPage;
  SetupCheckDone, SetupHandedOff, SetupMetadata: Boolean;
  SetupExitCode: Integer;

function SetupSkipCheck: Boolean;
var I: Integer;
begin
  Result := WizardSilent;
  for I := 1 to ParamCount do
    if CompareText(ParamStr(I), '/NOCHECKUPDATE') = 0 then Result := True;
end;

function SetupForwardParam(Value: String): Boolean;
var Key: String; P: Integer;
begin
  Key := Uppercase(Value);
  P := Pos('=', Key);
  if P > 0 then Key := Copy(Key, 1, P - 1);
  // Never forward Inno's private /SL5, /SPAWNWND or loader handshake flags.
  Result := Pos('|' + Key + '|',
    '|/DIR|/GROUP|/TASKS|/MERGETASKS|/COMPONENTS|/TYPE|/LOADINF|/SAVEINF|/LOG|/SP-|/NORESTART|/CLOSEAPPLICATIONS|/NOCLOSEAPPLICATIONS|/RESTARTAPPLICATIONS|/NORESTARTAPPLICATIONS|') > 0;
end;

function SetupQuote(Value: String): String;
var I, Slashes, J: Integer;
begin
  Result := '"';
  Slashes := 0;
  for I := 1 to Length(Value) do begin
    if Value[I] = '\' then Slashes := Slashes + 1
    else begin
      if Value[I] = '"' then begin
        for J := 1 to Slashes * 2 + 1 do Result := Result + '\';
      end else
        for J := 1 to Slashes do Result := Result + '\';
      Result := Result + Value[I];
      Slashes := 0;
    end;
  end;
  for J := 1 to Slashes * 2 do Result := Result + '\';
  Result := Result + '"';
end;

function SetupHex(Value: String; Count: Integer): Boolean;
var I: Integer;
begin
  Result := False;
  if Length(Value) <> Count then exit;
  for I := 1 to Length(Value) do
    if Pos(Value[I], '0123456789abcdef') = 0 then exit;
  Result := True;
end;

function SetupAssetName(Value: String): Boolean;
var I: Integer;
begin
  Result := False;
  if (Copy(Value, 1, 5) <> 'AVAS-') or
     (Copy(Value, Length(Value) - 9, 10) <> '-setup.exe') then exit;
  for I := 1 to Length(Value) do
    if Pos(Value[I], '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.+_-') = 0 then exit;
  Result := True;
end;

function SetupDownloadProgress(const Url, FileName: String; const Progress, ProgressMax: Int64): Boolean;
begin
  Result := not SetupDownloadPage.AbortedByUser;
  if SetupMetadata and (Progress > 65536) then
    RaiseException(CustomMessage('SetupInvalid'));
end;

procedure InitializeWizard;
begin
  SetupDownloadPage := CreateDownloadPage(CustomMessage('CheckSetup'),
    CustomMessage('SetupDownload'), @SetupDownloadProgress);
end;

procedure CancelButtonClick(CurPageID: Integer; var Cancel, Confirm: Boolean);
begin
  if SetupHandedOff then begin
    Cancel := True;
    Confirm := False;
  end;
end;

function NextButtonClick(CurPageID: Integer): Boolean;
var
  MetaPath, Commit, Name, Hash, RevisionText, Url, ErrorText, Params, Arg: String;
  Revision, Choice, I: Integer;
begin
  Result := True;
  if (CurPageID <> wpWelcome) or SetupCheckDone then exit;
  // Unattended deployments install the pinned, bundled version by default.
  if SetupSkipCheck then begin
    Log('Installer update discovery explicitly skipped or unattended.');
    SetupCheckDone := True;
    exit;
  end;
  Result := False;
  repeat
    try
      if {#AppRevision} <= 0 then RaiseException(CustomMessage('SetupUnknown'));
      SetupMetadata := True;
      SetupDownloadPage.Clear;
      MetaPath := ExpandConstant('{tmp}\setup-latest.ini');
      DeleteFile(MetaPath);
      SetupDownloadPage.Add('https://github.com/lycself/AVAS/releases/download/avas-latest/setup-latest.ini',
        'setup-latest.ini', '');
      SetupDownloadPage.Show;
      try
        SetupDownloadPage.Download;
      finally
        SetupDownloadPage.Hide;
      end;
      Commit := GetIniString('Setup', 'Commit', '', MetaPath);
      Name := GetIniString('Setup', 'Name', '', MetaPath);
      Hash := GetIniString('Setup', 'SHA256', '', MetaPath);
      RevisionText := GetIniString('Setup', 'Revision', '', MetaPath);
      Revision := StrToIntDef(RevisionText, 0);
      if (GetIniString('Setup', 'Schema', '', MetaPath) <> '1') or
         not SetupHex(Commit, 40) or not SetupHex(Hash, 64) or
         not SetupAssetName(Name) or (Revision <= 0) then
        RaiseException(CustomMessage('SetupInvalid'));
      if (Commit = '{#AppCommit}') or (Revision <= {#AppRevision}) then begin
        SetupCheckDone := True;
        Result := True;
        exit;
      end;
      Choice := MsgBox(FmtMessage(CustomMessage('SetupAvailable'), [Name + ' (' + Copy(Commit, 1, 7) + ')',
        '{#AppVersion}' + ' (' + Copy('{#AppCommit}', 1, 7) + ')']),
        mbConfirmation, MB_YESNOCANCEL);
      if Choice = IDCANCEL then exit;
      if Choice = IDNO then begin
        SetupCheckDone := True;
        Result := True;
        exit;
      end;
      SetupMetadata := False;
      Url := 'https://github.com/lycself/AVAS/releases/download/avas-' + Commit + '/' + Name;
      SetupDownloadPage.Clear;
      SetupDownloadPage.Add(Url, 'AVAS-latest-setup.exe', Hash);
      SetupDownloadPage.Show;
      try
        SetupDownloadPage.Download;
      finally
        SetupDownloadPage.Hide;
      end;
      // Retain deployment options, but lock the child to this verified download.
      Params := '';
      for I := 1 to ParamCount do begin
        Arg := ParamStr(I);
        // The parent still owns its log; give the child a separate file.
        if CompareText(Copy(Arg, 1, 5), '/LOG=') = 0 then Arg := Arg + '.latest.log';
        if SetupForwardParam(Arg) then Params := Params + ' ' + SetupQuote(Arg);
      end;
      Params := Params + ' /NOCHECKUPDATE /LANG=' + ActiveLanguage;
      if IsAdminInstallMode then Params := Params + ' /ALLUSERS'
      else Params := Params + ' /CURRENTUSER';
      WizardForm.Hide;
      try
        // Wait so Inno retains the temporary executable until its child exits.
        if not Exec(ExpandConstant('{tmp}\AVAS-latest-setup.exe'), Params, '',
          SW_SHOWNORMAL, ewWaitUntilTerminated, SetupExitCode) then
          RaiseException(SysErrorMessage(SetupExitCode));
      finally
        WizardForm.Show;
      end;
      if SetupExitCode <> 0 then
        MsgBox(FmtMessage(CustomMessage('SetupChildFailed'), [IntToStr(SetupExitCode)]), mbError, MB_OK);
      SetupHandedOff := True;
      WizardForm.Close;
      exit;
    except
      ErrorText := GetExceptionMessage;
      Log('Installer update failed: ' + ErrorText);
      Choice := MsgBox(FmtMessage(CustomMessage('SetupFailed'), [ErrorText]), mbError, MB_ABORTRETRYIGNORE);
      if Choice = IDIGNORE then begin
        SetupCheckDone := True;
        Result := True;
        exit;
      end;
      if Choice = IDABORT then begin
        SetupHandedOff := True;
        SetupExitCode := 1;
        WizardForm.Close;
        exit;
      end;
    end;
  until False;
end;
