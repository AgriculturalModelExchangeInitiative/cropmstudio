import json
import os

import tornado
from jupyter_server.base.handlers import APIHandler

from ..crop2ml_utils.utils import parse_xml


class GetModelHeader(APIHandler):
    # The following decorator should be present on all verb methods (head, get, post,
    # patch, put, delete, options) to ensure only authorized user can request the
    # Jupyter server
    @tornado.web.authenticated
    def get(self):
        path = self.get_argument('package', None)
        model = self.get_argument('model', None)
        if not path or not model or not os.path.isfile(os.path.join(path, 'crop2ml', model)):
            self.finish(json.dumps({
                "success": False,
                "error": "Error fetching the model"
            }))
            return

        modelType = model.split('.')[0]
        modelName = model.split('.')[1]

        xml = parse_xml(path, modelName)

        data = {
            "Path": path,
            "Model type": modelType,
            "Old name": xml.name,  # Store original name for rename detection
            "Model name": xml.name,
            "Model ID": ".".join(xml.modelid.split('.')[:-1]),
            "Version": xml.version,
            "Timestep": xml.timestep,
            "Title": xml.description.Title,
            "Authors": xml.description.Authors,
            "Institution": xml.description.Institution,
            "Reference": xml.description.Reference,
            "ExtendedDescription": xml.description.ExtendedDescription
        }

        self.finish(json.dumps({
            "success": True,
            "data": data
        }))

class GetModelUnitInputsOutputs(APIHandler):
    # The following decorator should be present on all verb methods (head, get, post,
    # patch, put, delete, options) to ensure only authorized user can request the
    # Jupyter server
    @tornado.web.authenticated
    def get(self):
        path = self.get_argument('package', None)
        model = self.get_argument('model', None)
        print(f"path {path}")
        print(f"model {model}")
        if not path or not model or not os.path.isfile(os.path.join(path, 'crop2ml', model)):
            self.finish(json.dumps({
                "success": False,
                "error": "Error fetching the model"
            }))
            return

        modelName = model.split('.')[1]

        xml = parse_xml(path, modelName)

        print(f"INPUT {xml.inputs}")
        print(f"OUTPUTS {xml.outputs}")

        # Build a dictionary to track variables and their types
        variables_dict = {}

        # Process inputs first
        if xml.inputs:
            for input_var in xml.inputs:
                var_data = {
                    "Type": "input",
                    "Name": input_var.name,
                    "Description": input_var.description,
                    "InputType": input_var.inputtype,
                    "Category": input_var.variablecategory if hasattr(input_var, "variablecategory") else input_var.parametercategory,
                    "DataType": input_var.datatype,
                    "Unit": input_var.unit
                }
                # Add optional fields only if they have values
                if hasattr(input_var, "len") and input_var.len:
                    var_data["Len"] = input_var.len
                if input_var.default:
                    var_data["Default"] = input_var.default
                if input_var.min is not None and str(input_var.min):
                    var_data["Min"] = str(input_var.min)
                if input_var.max is not None and str(input_var.max):
                    var_data["Max"] = str(input_var.max)
                if hasattr(input_var, "uri") and input_var.uri:
                    var_data["Uri"] = input_var.uri
                variables_dict[input_var.name] = var_data

        # Process outputs - if variable already exists, mark as "input & output"
        if xml.outputs:
            for output_var in xml.outputs:
                if output_var.name in variables_dict:
                    # Variable is both input and output
                    variables_dict[output_var.name]["Type"] = "input & output"
                else:
                    # Variable is only output
                    var_data = {
                        "Type": "output",
                        "Name": output_var.name,
                        "Description": output_var.description,
                        "InputType": output_var.inputtype,
                        "Category": output_var.variablecategory if hasattr(output_var, "variablecategory") else output_var.parametercategory,
                        "DataType": output_var.datatype,
                        "Unit": output_var.unit
                    }
                    # Add optional fields only if they have values
                    if hasattr(output_var, "len") and output_var.len:
                        var_data["Len"] = output_var.len
                    if output_var.default:
                        var_data["Default"] = output_var.default
                    if output_var.min is not None and str(output_var.min):
                        var_data["Min"] = str(output_var.min)
                    if output_var.max is not None and str(output_var.max):
                        var_data["Max"] = str(output_var.max)
                    if hasattr(output_var, "uri") and output_var.uri:
                        var_data["Uri"] = output_var.uri
                    variables_dict[output_var.name] = var_data

        # Convert dictionary to list
        inputs = list(variables_dict.values())

        # Convert Functions to array format
        functions = []
        if xml.function:
            functions = [{
                "file": func.filename.split("/")[-1],  # Extract filename with .pyx extension
                "type": func.type
            } for func in xml.function]

        data = {
            "Inputs": inputs,  # Now contains all variables with correct Type field
            "Functions": functions
        }

        self.finish(json.dumps({
            "success": True,
            "data": data
        }))


class GetModelUnitParametersets(APIHandler):
    @tornado.web.authenticated
    def get(self):
        path = self.get_argument('package', None)
        model = self.get_argument('model', None)

        if not path or not model or not os.path.isfile(os.path.join(path, 'crop2ml', model)):
            self.finish(json.dumps({
                "success": False,
                "error": "Error fetching the model"
            }))
            return

        modelName = model.split('.')[1]
        xml = parse_xml(path, modelName)

        parametersets = []
        if hasattr(xml, 'parametersets') and xml.parametersets:
            for pset in xml.parametersets:
                params = {}
                if hasattr(pset, 'params'):
                    for param in pset.params:
                        params[param.name] = str(param.value) if hasattr(param, 'value') else ""

                parametersets.append({
                    "name": pset.name,
                    "description": pset.description if hasattr(pset, 'description') else "",
                    "parameters": params
                })

        data = {"parametersets": parametersets}

        self.finish(json.dumps({
            "success": True,
            "data": data
        }))


class GetModelUnitTestsets(APIHandler):
    @tornado.web.authenticated
    def get(self):
        path = self.get_argument('package', None)
        model = self.get_argument('model', None)

        if not path or not model or not os.path.isfile(os.path.join(path, 'crop2ml', model)):
            self.finish(json.dumps({
                "success": False,
                "error": "Error fetching the model"
            }))
            return

        modelName = model.split('.')[1]
        xml = parse_xml(path, modelName)

        testsets = []
        if hasattr(xml, 'testsets') and xml.testsets:
            for tset in xml.testsets:
                tests = []
                if hasattr(tset, 'tests'):
                    for test in tset.tests:
                        inputs = {}
                        outputs = {}

                        # Process inputs
                        if hasattr(test, 'inputs'):
                            for inp in test.inputs:
                                inputs[inp.name] = str(inp.value) if hasattr(inp, 'value') else ""

                        # Process outputs
                        if hasattr(test, 'outputs'):
                            for out in test.outputs:
                                output_data = {"value": str(out.value) if hasattr(out, 'value') else ""}
                                if hasattr(out, 'precision') and out.precision:
                                    output_data["precision"] = str(out.precision)
                                outputs[out.name] = output_data

                        tests.append({
                            "name": test.name,
                            "inputs": inputs,
                            "outputs": outputs
                        })

                testsets.append({
                    "name": tset.name,
                    "description": tset.description if hasattr(tset, 'description') else "",
                    "parameterset": tset.parameterset if hasattr(tset, 'parameterset') else "",
                    "tests": tests
                })

        data = {"testsets": testsets}

        self.finish(json.dumps({
            "success": True,
            "data": data
        }))
