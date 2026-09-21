"""Run before other application imports in both Windows launchers."""
from avas.installation_lock import acquire

acquire()
