import json
from pathlib import Path

from cookiecutter.main import cookiecutter
import tornado

from jupyter_server.base.handlers import APIHandler

class CreatePackageHandler(APIHandler):
    # The following decorator should be present on all verb methods (head, get, post,
    # patch, put, delete, options) to ensure only authorized user can request the
    # Jupyter server
    @tornado.web.authenticated
    def post(self):
        data = self.get_json_body()

        missing_args = []
        for arg in ["projectName", "packageName", "description"]:
            if data.get(arg, None) is None:
                missing_args.append(arg)
        if len(missing_args):
            raise tornado.web.HTTPError(400, f"The following data is missing to create a package: {', '.join(missing_args)}")

        dirpath = "./packages"
        project_name = data.get("projectName")
        package_name = data.get("packageName")
        authors = data.get("authors", "")
        description = data.get("description")
        license = data.get("license", "")

        if (not Path(dirpath).is_dir):
            Path(dirpath).mkdir()

        if (Path(dirpath, package_name).is_dir()):
            raise tornado.web.HTTPError(400, "This package already exists.")

        try:
            cookiecutter(
                "https://github.com/AgriculturalModelExchangeInitiative/cookiecutter-crop2ml",
                no_input=True,
                extra_context={
                    'project_name': project_name,
                    'repo_name': package_name,
                    'author_name': authors,
                    'description': description,
                    'open_source_license': license
                },
                output_dir=dirpath
            )
        except:
            raise tornado.web.HTTPError(500, "Could not create the package.")

        self.finish(json.dumps({
            "success": True,
            "data": data
        }))
