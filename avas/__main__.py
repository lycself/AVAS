"""Allow ``python -m avas ...`` as an alias of the ``avas`` command."""
import sys

from avas.cli.main import main

if __name__ == "__main__":
    sys.exit(main())
