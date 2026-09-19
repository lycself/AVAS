import os.path

from avas.utils.readfile import read_txt, read_dst_fast

from avas.utils.inputconfig import InputConfig
def get_mass_freq(project_path):
    """Beam mass / frequency / current from ``<project>/InputFile/beam.txt``."""
    return get_mass_freq_from_dir(os.path.join(project_path, "InputFile"))


def get_mass_freq_from_dir(input_dir):
    """Same as :func:`get_mass_freq` but takes the input directory itself."""
    beam_txt = os.path.join(input_dir, 'beam.txt')
    res = read_txt(beam_txt, case_sensitive=True)
    beam_parameter = {'numofcharge': None,
                      'particlerestmass': None,
                       'current': None,
                       'particlenumber': None,
                       'frequency': None,
                       'kneticenergy': None,}

    if res.get('readparticledistribution') is None or res.get('readparticledistribution') == "unknown":

        beam_parameter["particlerestmass"] = float(res.get('particlerestmass'))
        beam_parameter["frequency"] = float(res.get('frequency'))
        beam_parameter["current"] = float(res.get("current"))


    else:
        dstfile = os.path.join(input_dir, res.get('readparticledistribution'))
        dst_res = read_dst_fast(dstfile)

        beam_parameter["particlerestmass"] = float(dst_res.get('basemassinmev'))
        beam_parameter["frequency"] = float(dst_res.get('freq'))
        beam_parameter["current"] = float(dst_res.get("ib"))

    return beam_parameter

def get_timestep(project_path):
    res = get_mass_freq(project_path)


    BaseMassInMeV = res["particlerestmass"]
    freq = res["frequency"]

    input_obj = InputConfig()
    item = {"projectPath": project_path,}
    input = input_obj.create_from_file(item)
    print(27, input)
    steppercycle = input["data"]["inputParams"]['steppercycle']
    timestep = 1 / freq / steppercycle
    return timestep

if __name__ == '__main__':
    project_path = r'C:\Users\shliu\Desktop\test_lattice'
    res = get_mass_freq(project_path)
    print(res)