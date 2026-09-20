"""Read versions and prepare an undoable editor restoration; never overwrite inputs."""
from avas.gui import context, filehistory
from avas.gui.bridge import UserError, rpc
from avas.gui.locks import require_unlocked


def _project(path):
    project = context.project().require()
    if not filehistory.supported(project, path):
        raise UserError('File history is available for lattice, beam.txt and input.txt.')
    return project


@rpc('history.list')
def list_versions(path):
    return filehistory.revisions(_project(path), path)


@rpc('history.version')
def read_version(path, revision):
    return filehistory.version(_project(path), path, revision)


@rpc('history.prepareRestore')
def prepare_restore(path, revision, currentText):
    require_unlocked()
    project = _project(path)
    data = filehistory.version(project, path, revision)
    filehistory.record(project, path, currentText, 'before-restore')
    return {'text': data['text']}
