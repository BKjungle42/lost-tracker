from pkg_resources import resource_string

__version__ = resource_string('lost_tracker', 'version.txt').strip()
