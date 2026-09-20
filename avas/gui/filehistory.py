"""Persistent local text revisions shared by all GUI editing routes."""
from contextlib import contextmanager
import hashlib
import json
import os
from pathlib import Path
import re
import threading
import time
import uuid

from avas.data import filekinds
from avas.gui.bridge import UserError

_lock = threading.RLock()
MAX_TEXT = 2 * 1024 * 1024


def canonical(path):
    return os.path.normcase(os.path.realpath(path))


def supported(project, path):
    if not project or not project.is_open:
        return False
    target = canonical(path)
    if target == canonical(project.lattice_path()):
        return not target.endswith('.dat')
    if not target.startswith(canonical(project.input_dir) + os.sep):
        return False
    return (os.path.basename(target).lower() in ('beam.txt', 'input.txt')
            or _folder(project, path).exists()
            or (os.path.isfile(target) and filekinds.detect(target) == filekinds.KIND_LATTICE))


def _folder(project, path):
    try:
        identity = os.path.relpath(canonical(path), canonical(project.path))
    except ValueError:  # A configured lattice may be on another Windows drive.
        identity = canonical(path)
    key = hashlib.sha256(identity.encode('utf-8')).hexdigest()
    folder = Path(project.path) / '.avas_history' / key
    if not canonical(folder).startswith(canonical(project.path) + os.sep):
        raise UserError('The history directory must be inside the project.')
    return folder


def revisions(project, path):
    folder = _folder(project, path)
    result = []
    if folder.exists():
        for file in sorted(folder.glob('*.json'), reverse=True):
            data = json.loads(file.read_text(encoding='utf-8'))
            result.append({k: data[k] for k in ('id', 'time', 'source', 'sha256', 'restored_from') if k in data})
    return result


def record(project, path, text, source, restored_from=None):
    if len(text.encode('utf-8')) > MAX_TEXT:
        raise UserError('File history supports text files up to 2 MB.')
    digest = hashlib.sha256(text.encode('utf-8')).hexdigest()
    with _lock:
        previous = revisions(project, path)
        if previous and previous[0]['sha256'] == digest:
            return previous[0]['id']
        folder = _folder(project, path)
        folder.mkdir(parents=True, exist_ok=True)
        revision = f'{time.time_ns():020d}-{uuid.uuid4().hex}'
        data = dict(id=revision, time=time.time(), source=source, sha256=digest, text=text)
        if restored_from:
            data['restored_from'] = restored_from
        tmp = folder / (revision + '.tmp')
        tmp.write_text(json.dumps(data, ensure_ascii=False), encoding='utf-8')
        os.replace(tmp, folder / (revision + '.json'))
        return revision


def version(project, path, revision):
    if not re.fullmatch(r'\d{20}-[0-9a-f]{32}', revision):
        raise UserError('History version not found.')
    file = _folder(project, path) / (revision + '.json')
    if not file.is_file():
        raise UserError('History version not found.')
    data = json.loads(file.read_text(encoding='utf-8'))
    if hashlib.sha256(data['text'].encode('utf-8')).hexdigest() != data['sha256']:
        raise UserError('The history version failed its integrity check.')
    return data


@contextmanager
def capture(path, source='file', restored_from=None):
    # Do not initialise GUI settings for standalone callers of textio.
    from avas.gui import context
    from avas.gui.textio import read_text, normalized_write_text
    project = context._project
    if not project or not project.is_open:
        yield
        return
    target = version(project, path, restored_from) if restored_from else None
    if not supported(project, path):
        before = read_text(path) if os.path.isfile(path) and os.path.getsize(path) <= MAX_TEXT else None
        yield
        # A new/empty file may become recognisable as a lattice on its first save.
        if supported(project, path):
            with _lock:
                if before is not None:
                    record(project, path, before, 'before-save')
                record(project, path, read_text(path), source)
        return
    with _lock:
        if os.path.isfile(path):
            record(project, path, read_text(path), 'before-save')
        yield
        if os.path.isfile(path):
            written = read_text(path)
            if target:
                source = 'restore' if written == normalized_write_text(target['text']) else 'restore-edited'
            record(project, path, written, source, restored_from)
