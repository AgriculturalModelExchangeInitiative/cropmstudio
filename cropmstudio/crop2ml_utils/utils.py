"""
Data Adapter - Convert JSON Schema format to writeXML format

This module converts data from the new JSON Schema structure
to the legacy format expected by writeunitXML and writecompositionXML
"""


import os

from pycropml import pparse

def adapt_header_data(json_data):
    """
    Adapt header data from JSON Schema format to writeXML format

    Args:
        json_data: Dict with JSON Schema format from create-model.json

    Returns:
        Dict in writeXML format with lowercase keys
    """
    return {
        'packageName': json_data['Path'],
        'modelType': json_data['Model type'],
        'modelName': json_data['Model name'],
        'modelID': json_data['Model ID'],
        'version': json_data['Version'],
        'timestep': json_data['Timestep'],
        'title': json_data['Title'],
        'authors': json_data['Authors'],
        'institution': json_data['Institution'],
        'reference': json_data['Reference'],
        'description': json_data['ExtendedDescription']
    }


def adapt_inputs_outputs(json_data):
    """
    Adapt inputs/outputs from JSON Schema format (array) to writeXML format (dict of arrays)

    Args:
        json_data: Dict with 'Inputs', 'Functions', 'init' from inputs-outputs-form.json

    Returns:
        Dict with 'Inputs' (as dict of arrays), 'Functions', 'init'
    """
    inputs_list = json_data.get('Inputs', [])

    # Convert array of objects to dict of arrays (column-oriented)
    df_dict = {
        'Name': [],
        'Type': [],
        'Description': [],
        'InputType': [],
        'Category': [],
        'DataType': [],
        'Len': [],
        'Default': [],
        'Min': [],
        'Max': [],
        'Unit': [],
        'Uri': []
    }

    for item in inputs_list:
        df_dict['Name'].append(item.get('Name', ''))
        df_dict['Type'].append(item.get('Type', ''))
        df_dict['Description'].append(item.get('Description', ''))
        df_dict['InputType'].append(item.get('InputType', ''))
        df_dict['Category'].append(item.get('Category', ''))
        df_dict['DataType'].append(item.get('DataType', ''))
        df_dict['Len'].append(item.get('Len', ''))
        df_dict['Default'].append(item.get('Default', ''))
        df_dict['Min'].append(item.get('Min', ''))
        df_dict['Max'].append(item.get('Max', ''))
        df_dict['Unit'].append(item.get('Unit', ''))
        df_dict['Uri'].append(item.get('Uri', ''))

    return {
        'Inputs': df_dict,
        'Functions': json_data.get('Functions', []),
        'init': json_data.get('init', False)
    }


def adapt_parametersets(json_data):
    """
    Adapt parameter sets from JSON Schema format to writeXML format

    Args:
        json_data: Dict with 'parametersets' array from parametersets-form.json

    Returns:
        Dict in format: {name: [{param: value}, description]}
    """
    if not json_data or 'parametersets' not in json_data:
        return {}

    result = {}
    for pset in json_data.get('parametersets', []):
        name = pset.get('name', '')
        description = pset.get('description', '')
        parameters = pset.get('parameters', {})

        result[name] = [parameters, description]

    return result


def adapt_testsets(json_data):
    """
    Adapt test sets from JSON Schema format to writeXML format

    Args:
        json_data: Dict with 'testsets' array from testsets-form.json

    Returns:
        Dict in format: {testset_name: [{test_name: {inputs: {}, outputs: {}}}, description, parameterset]}
    """
    if not json_data or 'testsets' not in json_data:
        return {}

    result = {}
    for tset in json_data.get('testsets', []):
        testset_name = tset.get('name', '')
        description = tset.get('description', '')
        parameterset = tset.get('parameterset', '')
        tests = tset.get('tests', [])

        tests_dict = {}
        for test in tests:
            test_name = test.get('name', '')
            inputs = test.get('inputs', {})
            outputs_raw = test.get('outputs', {})

            # Convert outputs format: {name: {value, precision}} -> {name: [value, precision]}
            outputs = {}
            for var_name, var_data in outputs_raw.items():
                value = var_data.get('value', '')
                precision = var_data.get('precision', '')
                outputs[var_name] = [value, precision]

            tests_dict[test_name] = {
                'inputs': inputs,
                'outputs': outputs
            }

        result[testset_name] = [tests_dict, description, parameterset]

    return result


def adapt_composition_models(json_data):
    """
    Adapt composition models list from JSON Schema format to writeXML format

    Args:
        json_data: Dict with 'models' array from models-list.json

    Returns:
        List of model reference strings
    """
    if not json_data or 'models' not in json_data:
        return []

    return json_data.get('models', [])


def adapt_composition_links(json_data):
    """
    Adapt composition links from JSON Schema format to writeXML format

    Args:
        json_data: Dict with 'links' array from links-form.json

    Returns:
        List of link dicts with 'Link type', 'Source', 'Target'
    """
    if not json_data or 'links' not in json_data:
        return []

    # Format is already correct, just return the links
    return json_data.get('links', [])


def adapt_unit_model_complete(header, inputsOutputs, parametersets=None, testsets=None):
    """
    Adapt complete unit model data to writeXML format

    Args:
        header: Header data from create-model.json
        inputsOutputs: Inputs/outputs data from inputs-outputs-form.json
        parametersets: Optional parameter sets data from parametersets-form.json
        testsets: Optional test sets data from testsets-form.json

    Returns:
        Tuple (datas, df, paramsetdict, testsetdict) for writeunitXML
    """
    # datas = adapt_header_data(header)
    datas = header
    df = adapt_inputs_outputs(inputsOutputs)
    paramsetdict = adapt_parametersets(parametersets) if parametersets else {}
    testsetdict = adapt_testsets(testsets) if testsets else {}

    return datas, df, paramsetdict, testsetdict


def adapt_composition_model_complete(header, models, links):
    """
    Adapt complete composition model data to writeXML format

    Args:
        header: Header data from create-model.json
        models: Models list from models-list.json
        links: Links data from links-form.json

    Returns:
        Tuple (datas, listmodel, listlink) for writecompositionXML
    """
    # datas = adapt_header_data(header)
    datas = header
    listmodel = adapt_composition_models(models)
    listlink = adapt_composition_links(links)

    return datas, listmodel, listlink


def get_models(path: str) -> list[str]:
    """
    Get the models for a given package path.

    Args:
        path: The path of the package

    Returns:
        List of model paths
    """
    if not path or not os.path.isdir(os.path.join(path, 'crop2ml')):
        return []

    models = []
    for f in os.listdir(os.path.join(path, 'crop2ml')):
        split = f.split('.')
        if all([split[-1] == 'xml', split[0] in ['unit','composition']]):
            models.append(f)

    return models


def parse_xml(path: str, modelName: str):
    """
    Parses the xml file and calls _buildEdit method to order collected datas
    """
    parsing = pparse.model_parser(path)

    for j in parsing:
        if j.name == modelName:
            return j
