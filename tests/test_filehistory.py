"""History RPCs and all persistence routes, using disposable projects only."""
import json
from pathlib import Path
import shutil

import pytest

from avas.gui import context, filehistory, bridge
from avas.gui.project import Project
from avas.gui.settings import Settings
from avas.gui.textio import read_text, write_text


@pytest.fixture
def project(tmp_path, monkeypatch):
    from avas.gui import services  # noqa: F401
    from avas.gui import locks
    root = tmp_path / 'project'
    shutil.copytree(Path(__file__).parents[1] / 'examples/hwr010/InputFile', root / 'InputFile')
    p = Project(Settings(str(tmp_path / 'settings.json')))
    p.path = str(root)
    monkeypatch.setattr(context, '_project', p)
    monkeypatch.setattr(locks, 'inputs_locked', lambda: False)
    return p


def rpc(method, **params):
    reply = json.loads(bridge.dispatch(method, params))
    assert reply['ok'], reply
    return reply['result']


def texts(project, path):
    return [filehistory.version(project, path, r['id'])['text'] for r in filehistory.revisions(project, path)]


def test_shared_timeline_restore_and_noop(project):
    path = project.lattice_path()
    initial = read_text(path)
    first = initial + '\n! text + structure\n'
    second = first + '! visual change\n'
    assert rpc('history.list', path=path) == []
    rpc('lattice.write', name=project.lattice_name(), text=first, source='lattice')
    rpc('lattice.write', name=project.lattice_name(), text=second, source='visual')
    versions = rpc('history.list', path=path)
    assert [r['source'] for r in versions] == ['visual', 'lattice', 'before-save']
    rpc('lattice.write', name=project.lattice_name(), text=second, source='visual')
    assert rpc('history.list', path=path) == versions
    unsaved = second + '! not saved yet\n'
    restored = rpc('history.prepareRestore', path=path, revision=versions[-1]['id'], currentText=unsaved)
    assert restored['text'] == initial
    assert read_text(path) == second.replace('\r\n', '\n')  # restoration does not write the input
    assert texts(project, path)[0] == unsaved
    rpc('files.save', path=path, text=restored['text'], source='restore')
    assert read_text(path) == initial.replace('\r\n', '\n')
    assert unsaved in texts(project, path)
    assert rpc('history.list', path=path)[0]['source'] == 'restore'
    # No in-memory index: a new Project instance sees the same persisted versions.
    reopened = Project(project.settings)
    reopened.path = project.path
    assert filehistory.revisions(reopened, path) == rpc('history.list', path=path)


def test_beam_settings_files_and_assistant_sources(project):
    beam_path = project.input_file('beam.txt')
    before = read_text(beam_path)
    beam = rpc('beam.load')
    beam['form']['current'] = '0.25'
    rpc('beam.save', form=beam['form'])
    assert texts(project, beam_path)[-1] == before
    assert rpc('history.list', path=beam_path)[0]['source'] == 'beam'
    settings = rpc('settings.load')
    settings['form']['steppercycle'] = '123'
    rpc('settings.save', form=settings['form'], meta=settings['meta'])
    input_path = project.input_file('input.txt')
    assert rpc('history.list', path=input_path)[0]['source'] == 'settings'
    write_text(input_path, read_text(input_path) + '! approved AI change\n', source='assistant')
    assert rpc('history.list', path=input_path)[0]['source'] == 'assistant'
    rpc('files.save', path=beam_path, text=read_text(beam_path) + '! files page\n')
    assert rpc('history.list', path=beam_path)[0]['source'] == 'file'


def test_run_lock_and_revision_validation(project, monkeypatch, tmp_path):
    from avas.gui import locks
    path = project.lattice_path()
    write_text(path, read_text(path) + '! change\n')
    revision = rpc('history.list', path=path)[0]['id']
    monkeypatch.setattr(locks, 'inputs_locked', lambda: True)
    assert rpc('history.version', path=path, revision=revision)['text'] == read_text(path)
    result = json.loads(bridge.dispatch('history.prepareRestore', dict(path=path, revision=revision, currentText='draft')))
    assert not result['ok']
    for method, args in [('history.version', dict(path=path, revision='../../secret')),
                         ('history.list', dict(path=str(tmp_path / 'outside.txt')))]:
        assert not json.loads(bridge.dispatch(method, args))['ok']


def test_external_change_and_failed_save_preserve_previous(project, monkeypatch):
    from avas.gui import textio
    path = project.lattice_path()
    initial = read_text(path)
    write_text(path, initial + '! saved\n')
    Path(path).write_text('start\ndrift 1 0.02\nend\n! external\n', encoding='utf-8')
    external = read_text(path)
    def fail(*args):
        raise OSError('simulated write failure')
    monkeypatch.setattr(textio, '_write_text', fail)
    with pytest.raises(OSError):
        write_text(path, 'must not be recorded as saved')
    assert read_text(path) == external
    assert texts(project, path)[0] == external
    assert 'must not be recorded as saved' not in texts(project, path)


def test_history_integrity_and_invalid_lattice_remain_recoverable(project):
    path = project.input_file('alternate.txt')
    Path(path).write_text('start\ndrift 1 0.02\nend\n', encoding='utf-8')
    write_text(path, 'invalid temporary text\n')
    versions = rpc('history.list', path=path)
    assert len(versions) == 2
    assert rpc('files.open', path=path)['historyAvailable']
    assert 'drift' in rpc('history.version', path=path, revision=versions[-1]['id'])['text']
    file = filehistory._folder(project, path) / (versions[0]['id'] + '.json')
    data = json.loads(file.read_text(encoding='utf-8'))
    data['text'] = 'corrupted'
    file.write_text(json.dumps(data), encoding='utf-8')
    assert not json.loads(bridge.dispatch('history.version', dict(path=path, revision=versions[0]['id'])))['ok']


def test_new_lattice_first_save_and_project_move(project, tmp_path):
    path = project.input_file('new_lattice.txt')
    Path(path).write_text('', encoding='utf-8')
    content = 'start\ndrift 1 0.02\nend\n'
    rpc('files.save', path=path, text=content)
    assert texts(project, path) == [content, '']
    moved_root = tmp_path / 'moved'
    shutil.copytree(project.path, moved_root)
    moved = Project(project.settings)
    moved.path = str(moved_root)
    assert texts(moved, moved.input_file('new_lattice.txt')) == [content, '']


def test_sandbox_and_unrelated_files_are_not_tracked(project, tmp_path):
    path = tmp_path / 'sandbox' / 'input.txt'
    write_text(str(path), 'spacecharge 1\n')
    assert not filehistory.supported(project, str(path))
    assert not (Path(project.path) / '.avas_history').exists()


@pytest.mark.parametrize("method", ["files.save", "lattice.write"])
@pytest.mark.parametrize("edited", [False, True])
def test_restore_save_provenance(project, method, edited):
    path = project.lattice_path()
    write_text(path, "start\nend\n")
    target = rpc('history.list', path=path)[0]['id']
    write_text(path, "start\n! later\nend\n")
    draft = "start\n! unsaved\nend\n"
    text = rpc('history.prepareRestore', path=path, revision=target, currentText=draft)['text']
    # Line ending conversion and adding the final newline are not user edits.
    text = text.rstrip('\n').replace('\n', '\r\n')
    if edited:
        text += '\n! modified'
    args = {'path': path} if method == 'files.save' else {'name': project.lattice_name()}
    rpc(method, **args, text=text, restored_from=target)
    versions = rpc('history.list', path=path)
    assert versions[0]['restored_from'] == target
    assert versions[0]['source'] == ('restore-edited' if edited else 'restore')
    assert draft in texts(project, path)
    assert any(v['id'] == target for v in versions)
    rpc(method, **args, text=text, restored_from=target)
    assert rpc('history.list', path=path) == versions
    rpc(method, **args, text=text + '\n! ordinary')
    assert 'restored_from' not in rpc('history.list', path=path)[0]


def test_restore_invalid_source_and_failed_save(project, monkeypatch):
    from avas.gui import textio
    path = project.lattice_path()
    write_text(path, 'start\nend\n')
    target = rpc('history.list', path=path)[0]['id']
    before = read_text(path)
    versions = rpc('history.list', path=path)
    result = json.loads(bridge.dispatch('files.save', dict(path=path, text='bad', restored_from='missing')))
    assert not result['ok']
    assert read_text(path) == before
    assert rpc('history.list', path=path) == versions
    def fail(*args):
        raise OSError('failed restoration save')
    monkeypatch.setattr(textio, '_write_text', fail)
    with pytest.raises(OSError):
        write_text(path, 'changed', restored_from=target)
    assert rpc('history.list', path=path) == versions
