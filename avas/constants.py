"""Physical constants and the keyword groups of the legacy simulation code.

The keyword lists are derived from ``avas.data.schema`` (the single source of
truth for lattice keywords); only the error-study groupings, which the schema
does not express, are spelled out here.
"""
from avas.data import schema

c_light = 299792458
Pi = 3.14159265358979323846

# elements: field-model and matrix-model elements have a length, diagnostics do not
mulpud_element = [k for k, kw in schema.LATTICE_KEYWORDS.items()
                  if kw.category in (schema.FIELD_ELEMENT, schema.MATRIX_ELEMENT)]
control_diag_element = [k for k, kw in schema.LATTICE_KEYWORDS.items() if kw.category == schema.DIAG]
all_element = list(schema.ELEMENT_KEYWORDS)

# lines copied into the lattice.txt the engine reads for a plain run
mulp_basic_command = mulpud_element + ["start", "end"] + [
    k for k, kw in schema.LATTICE_KEYWORDS.items()
    if kw.category in (schema.SUPERPOSE, schema.OUTPUT, schema.OTHER)]

# error study groupings (avas/sim/error.py, err_adjust.py)
error_elemment_command = ['err_quad_ncpl_stat', 'err_quad_ncpl_dyn', 'err_cav_ncpl_stat', 'err_cav_ncpl_dyn',
                          'err_quad_cpl_stat', 'err_quad_cpl_dyn', 'err_cav_cpl_stat', 'err_cav_cpl_dyn', ]

#静态动态
error_elemment_command_stat_ncpl = ['err_quad_ncpl_stat', 'err_cav_ncpl_stat']
error_elemment_command_dyn_ncpl = ['err_quad_ncpl_dyn', 'err_cav_ncpl_dyn']

error_elemment_command_quad_ncpl = ['err_quad_ncpl_stat', 'err_quad_ncpl_dyn']
error_elemment_command_cav_ncpl = ['err_cav_ncpl_stat', 'err_cav_ncpl_dyn', ]


error_elemment_command_stat_cpl = ['err_quad_cpl_stat', 'err_cav_cpl_stat']
error_elemment_command_dyn_cpl = ['err_quad_cpl_dyn', 'err_cav_cpl_dyn']

error_elemment_command_quad_cpl = ['err_quad_cpl_stat', 'err_quad_cpl_dyn']
error_elemment_command_cav_cpl = ['err_cav_cpl_stat', 'err_cav_cpl_dyn', ]


error_beam_command = ['err_beam_stat', 'err_beam_dyn']
error_beam_stat = ['err_beam_stat']
error_beam_dyn = ['err_beam_dyn']


error_elemment_dyn_on = ['err_quad_dyn_on', 'err_cav_dyn_on']
error_elemment_stat_on = ['err_quad_stat_on', 'err_cav_stat_on']

error_beam_dyn_on = ['err_beam_dyn_on']
error_beam_stat_on = ['err_beam_stat_on']

# lines written to the lattice of one dynamic-error run
err_write_command = mulp_basic_command + ['err_step', 'err_cav_ncpl_dyn', 'err_quad_ncpl_dyn', 'err_beam_dyn',
                                          'err_quad_dyn_on', 'err_cav_dyn_on', 'err_beam_dyn_on' ]

error_elemment_command_ncpl = ['err_quad_ncpl_stat', 'err_quad_ncpl_dyn', 'err_cav_ncpl_stat', 'err_cav_ncpl_dyn']

error_elemment_command_quad = ['err_quad_ncpl_stat', 'err_quad_cpl_stat',
                                      'err_quad_ncpl_dyn', 'err_quad_cpl_dyn', ]

error_elemment_command_cav = ['err_cav_ncpl_stat', 'err_cav_cpl_stat',
                                      'err_cav_ncpl_dyn', 'err_cav_cpl_dyn', ]

greek_letters_upper = {'alpha': 'Α', 'beta': 'Β', 'gamma': 'Γ', 'phi': 'Φ'}

decimals7 = 7
