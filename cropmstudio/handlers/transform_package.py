import json

import tornado
from jupyter_server.base.handlers import APIHandler

from pycropml.cyml import transpile_package, transpile_component


class Crop2MLToPlatformHandler(APIHandler):
    """
    Handler for transforming a platform model to crop2ml

    Expects JSON data with the following structure:
    {
        "platform-to-Crop2ML": {
            "Path": "path/to/package",
            "Languages": ["Java", "Python", ...],
            "Platforms": ["Simplace", "Bioma", ...]
        }
    }
    """

    @tornado.web.authenticated
    def post(self):
        try:
            data = self.get_json_body()
            self.log.info(f"Received package transformation request")
            # Extract form data
            path = data.get('Path', '')
            languages = data.get('Languages', {})
            platforms = data.get('Platforms', {})

            # Validation
            if not path:
                self.finish(json.dumps({
                    "success": False,
                    "error": "You must provide a package path."
                }))
                return

            # Combine languages and platforms into one list
            target_list = []

            # Map UI names to transpiler codes
            language_map = {
                'Java': 'java',
                'CSharp': 'cs',
                'Fortran': 'f90',
                'Python': 'py',
                'R': 'r',
                'Cpp': 'cpp'
            }

            platform_map = {
                'Simplace': 'simplace',
                'Bioma': 'bioma',
                'Dssat': 'dssat',
                'OpenAlea': 'openalea',
                'Record': 'record',
                'Stics': 'stics',
                'Apsim': 'apsim',
                'Sirius': 'sirius'
            }

            # Add selected languages (check boolean values)
            for lang_name, lang_code in language_map.items():
                if languages.get(lang_name, False):
                    target_list.append(lang_code)

            # Add selected platforms (check boolean values)
            for platform_name, platform_code in platform_map.items():
                if platforms.get(platform_name, False):
                    target_list.append(platform_code)

            self.log.warning(f"TARGET {target_list}")
            if not target_list:
                self.finish(json.dumps({
                    "success": False,
                    "error": "You must select at least one target language or platform."
                }))
                return

            # Perform transformation for each target
            errors = []
            successes = []

            for target in target_list:
                try:
                    self.log.info(f"Transpiling package {path} to {target}")
                    transpile_package(path, target)
                    successes.append(target)
                except Exception as e:
                    error_msg = f"Error transpiling to {target}: {str(e)}"
                    self.log.error(error_msg, exc_info=True)
                    errors.append(error_msg)

            # Prepare response
            response = {
                "success": len(errors) == 0,
                "successes": successes,
                "message": f"Successfully transpiled to: {', '.join(successes)}" if successes else "No successful transformations"
            }

            if errors:
                response["errors"] = errors
                response["message"] = f"Completed with errors. Successes: {', '.join(successes)}. Errors: {len(errors)}"

            self.finish(json.dumps(response))

        except Exception as e:
            self.log.error(f"Error transforming package: {str(e)}", exc_info=True)
            self.finish(json.dumps({
                "success": False,
                "error": str(e)
            }))


class PlatformToCrop2MLHandler(APIHandler):
    """
    Handler for transforming a platform model to crop2ml

    Expects JSON data with the following structure:
    {
        "platform-to-Crop2ML": {
            "Path": "path/to/package",
            "Languages": ["Java", "Python", ...],
            "Platforms": ["Simplace", "Bioma", ...]
        }
    }
    """

    @tornado.web.authenticated
    def post(self):
        try:
            data = self.get_json_body()
            self.log.info(f"Received package transformation request")
            # Extract form data
            path = data.get('Path', '')
            languages = data.get('Languages', {})
            platforms = data.get('Platforms', {})

            # Validation
            if not path:
                self.finish(json.dumps({
                    "success": False,
                    "error": "You must provide a package path."
                }))
                return

            # Combine languages and platforms into one list
            target_list = []

            # Map UI names to transpiler codes
            language_map = {
                'Java': 'java',
                'CSharp': 'cs',
                'Fortran': 'f90',
                'Python': 'py',
                'R': 'r',
                'Cpp': 'cpp'
            }

            platform_map = {
                'Simplace': 'simplace',
                'Bioma': 'bioma',
                'Dssat': 'dssat',
                'OpenAlea': 'openalea',
                'Record': 'record',
                'Stics': 'stics',
                'Apsim': 'apsim',
                'Sirius': 'sirius'
            }

            # Add selected languages (check boolean values)
            for lang_name, lang_code in language_map.items():
                if languages.get(lang_name, False):
                    target_list.append(lang_code)

            # Add selected platforms (check boolean values)
            for platform_name, platform_code in platform_map.items():
                if platforms.get(platform_name, False):
                    target_list.append(platform_code)

            self.log.warning(f"TARGET {target_list}")
            if not target_list:
                self.finish(json.dumps({
                    "success": False,
                    "error": "You must select at least one target language or platform."
                }))
                return

            # Perform transformation for each target
            errors = []
            successes = []

            for target in target_list:
                try:
                    self.log.info(f"Transpiling package {path} to {target}")
                    transpile_component(path, path, target)
                    successes.append(target)
                except Exception as e:
                    error_msg = f"Error transpiling to {target}: {str(e)}"
                    self.log.error(error_msg, exc_info=True)
                    errors.append(error_msg)

            # Prepare response
            response = {
                "success": len(errors) == 0,
                "successes": successes,
                "message": f"Successfully transpiled to: {', '.join(successes)}" if successes else "No successful transformations"
            }

            if errors:
                response["errors"] = errors
                response["message"] = f"Completed with errors. Successes: {', '.join(successes)}. Errors: {len(errors)}"

            self.finish(json.dumps(response))

        except Exception as e:
            self.log.error(f"Error transforming package: {str(e)}", exc_info=True)
            self.finish(json.dumps({
                "success": False,
                "error": str(e)
            }))
