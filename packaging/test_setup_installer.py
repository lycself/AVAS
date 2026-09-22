"""Compile production Setup and execute its Pascal decisions with scripted I/O.

Uses a disposable payload; never installs AVAS or contacts the release service.
Run with the repository Python and --iscc <ISCC.exe> (also run by release CI).
"""
import argparse
from pathlib import Path
import subprocess
import tempfile

from build import ROOT, find_iscc


MOCKS = r'''
var
  TestCase, Downloads, Dialogs, Executions, Closed: Integer;

procedure Check(Value: Boolean; Message: String);
begin
  if not Value then RaiseException('ASSERT: ' + Message);
end;

procedure TestClose;
begin
  Closed := Closed + 1;
end;

function TestMessage(Text: String; Kind: TMsgBoxType; Buttons: Integer): Integer;
begin
  Dialogs := Dialogs + 1;
  if Buttons = MB_ABORTRETRYIGNORE then begin
    Check(Pos('could not', Lowercase(Text)) > 0, 'failure must reach user');
    if TestCase = 3 then begin
      Check(Pos('network fixture', Text) > 0, 'show actual network error');
      Result := IDRETRY;
    end else if TestCase = 4 then Result := IDABORT
    else Result := IDIGNORE;
  end else if Buttons = MB_YESNOCANCEL then begin
    if TestCase = 5 then Result := IDNO
    else if TestCase = 6 then Result := IDCANCEL
    else Result := IDYES;
  end else Result := IDOK;
end;

procedure TestDownload;
var Commit, Revision, Hash: String;
begin
  Downloads := Downloads + 1;
  if ((TestCase = 2) or (TestCase = 4)) or
     ((TestCase = 3) and (Downloads = 1)) then RaiseException('network fixture');
  if ((Downloads = 2) and (TestCase <> 3)) or (Downloads = 3) then begin
    if TestCase = 7 then RaiseException('checksum fixture');
    exit;
  end;
  Commit := 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
  Revision := '101';
  Hash := 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
  if TestCase = 0 then Revision := '99';
  if TestCase = 1 then Commit := 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
  if TestCase = 8 then Hash := 'invalid';
  SaveStringToFile(ExpandConstant('{tmp}\setup-latest.ini'),
    '[Setup]'#13#10'Scheme=unused'#13#10'Schema=1'#13#10'Commit=' + Commit
    + #13#10'Revision=' + Revision + #13#10'Name=AVAS-2.0.0-setup.exe'#13#10'SHA256=' + Hash, False);
end;

function TestExec(FileName, Params, WorkingDir: String; ShowCmd: Integer; Wait: TExecWait; var Code: Integer): Boolean;
begin
  Executions := Executions + 1;
  Check(Pos('/NOCHECKUPDATE', Params) > 0, 'child must not discover again');
  Check(Pos('/LANG=en', Params) > 0, 'language handed off');
  Check(Pos('/SL5', Uppercase(Params)) = 0, 'private loader flag forwarded');
  Code := 0;
  Result := TestCase <> 9;
  if not Result then Code := 2;
end;
'''

SCENARIOS = r'''
procedure InitializeWizard;
var Advanced: Boolean;
begin
  InitUpdate;
  Check(SetupAssetName('AVAS-2.0.0-setup.exe'), 'valid name');
  Check(not SetupAssetName('../bad.exe'), 'traversal');
  Check(not SetupAssetName('AVAS-a/setup.exe'), 'path');
  Check(not SetupHex('zz', 2), 'invalid hash');
  Check(not SetupForwardParam('/SL5=private'), 'loader flag');
  Check(SetupForwardParam('/DIR=C:\test dir'), 'directory flag');
  Check(SetupQuote('C:\test\') = '"C:\test\\"', 'trailing slash quoting');
  for TestCase := 0 to 10 do begin
    SetupCheckDone := False;
    SetupHandedOff := False;
    Downloads := 0;
    Dialogs := 0;
    Executions := 0;
    Closed := 0;
    Advanced := NextUpdate(wpWelcome);
    case TestCase of
      0, 1: Check(Advanced and (Dialogs = 0) and (Executions = 0), 'current/older');
      2: Check(Advanced and (Dialogs = 1) and (Executions = 0), 'offline ignore');
      3: Check(not Advanced and (Downloads = 3) and (Closed = 1), 'retry then handoff');
      4: Check(not Advanced and (Closed = 1) and (Executions = 0), 'abort');
      5: Check(Advanced and (Downloads = 1) and (Executions = 0), 'decline');
      6: Check(not Advanced and (Executions = 0), 'cancel confirmation');
      7: Check(Advanced and (Dialogs = 2) and (Executions = 0), 'checksum failure');
      8: Check(Advanced and (Dialogs = 1) and (Executions = 0), 'invalid metadata');
      9: Check(Advanced and (Dialogs = 2) and (Closed = 0), 'launch failure fallback');
      10: Check(not Advanced and (Executions = 1) and (Closed = 1), 'handoff never installs old');
    end;
  end;
  SaveStringToFile(ExpandConstant('{param:RESULT}'), '11 scenarios passed', False);
end;

function NextButtonClick(CurPageID: Integer): Boolean;
begin
  Result := False; // exit before installing even the disposable fixture
end;
'''


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--iscc')
    args = ap.parse_args()
    compiler = find_iscc(args.iscc)
    if not compiler:
        raise RuntimeError('Inno Setup is required for installer verification')
    root = Path(ROOT)
    with tempfile.TemporaryDirectory(prefix='avas-setup-test-') as temp:
        folder = Path(temp)
        source = folder / 'source'
        icon = source / '_internal/avas/gui/web/avas.ico'
        icon.parent.mkdir(parents=True)
        icon.write_bytes((root / 'avas/gui/web/avas.ico').read_bytes())
        (source / 'AVASGui.exe').write_text('disposable compile fixture')
        command = [compiler, '/Q', '/DAppCommit=' + 'a' * 40, '/DAppRevision=100',
                   f'/DSourceDir={source}', f'/DOutputDir={folder}']
        # Both languages and every production directive compile unmodified.
        subprocess.run([*command, str(root / 'packaging/avas.iss')], check=True)
        actual = (root / 'packaging/setup_update.iss').read_text(encoding='utf-8')
        # Replace only I/O boundaries in the disposable test copy.
        for before, after in [
            ('procedure InitializeWizard;', 'procedure InitUpdate;'),
            ('function NextButtonClick(', 'function NextUpdate('),
            ('Result := WizardSilent;', 'Result := False;'),
            ('SetupDownloadPage.Download;', 'TestDownload;'),
            ('MsgBox(', 'TestMessage('), ('not Exec(', 'not TestExec('),
            ('WizardForm.Close;', 'TestClose;'),
        ]:
            actual = actual.replace(before, after)
        base = (root / 'packaging/avas.iss').read_text(encoding='utf-8')
        messages = base.split('[CustomMessages]\n', 1)[1].split('[Tasks]', 1)[0]
        harness = folder / 'harness.iss'
        harness.write_text(
            '#define AppCommit "' + 'a' * 40 + '"\n#define AppRevision "100"\n#define AppVersion "2.0.0"\n'
            '[Setup]\nAppName=AVAS test\nAppVersion=1\nDefaultDirName={tmp}\\avas-test\n'
            'PrivilegesRequired=lowest\nUninstallable=no\nCreateAppDir=no\nDisableWelcomePage=no\n'
            'OutputBaseFilename=harness\nOutputDir=.\n'
            '[Languages]\nName: "en"; MessagesFile: "compiler:Default.isl"\n'
            f'Name: "zh"; MessagesFile: "{root / "packaging/languages/ChineseSimplified.isl"}"\n'
            '[CustomMessages]\n' + messages + '\n[Code]\n' + MOCKS + actual + SCENARIOS,
            encoding='utf-8-sig')
        subprocess.run([compiler, '/Q', str(harness)], check=True)
        result = folder / 'result.txt'
        run = subprocess.run([str(folder / 'harness.exe'), '/VERYSILENT', '/SUPPRESSMSGBOXES',
                              '/CURRENTUSER', '/LANG=en', f'/RESULT={result}', f'/LOG={folder / "test.log"}'],
                             timeout=40)
        if not result.exists() or result.read_text() != '11 scenarios passed':
            raise RuntimeError(f'Pascal test failed ({run.returncode}):\n'
                               + (folder / 'test.log').read_text(errors='replace'))
        print('Production installer compiled; 11 Pascal flow scenarios passed.')


if __name__ == '__main__':
    main()
