import json

from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join
import tornado

from .handlers import CreateModelHandler, CreatePackageHandler, GetModels, GetModelHeader, GetModelUnitInputsOutputs, GetModelUnitParametersets, GetModelUnitTestsets, GetPackagesHandler, ImportPackageHandler, PlatformToCrop2MLHandler, Crop2MLToPlatformHandler, DisplayModelHandler

class HelloRouteHandler(APIHandler):
    # The following decorator should be present on all verb methods (head, get, post,
    # patch, put, delete, options) to ensure only authorized user can request the
    # Jupyter server
    @tornado.web.authenticated
    def get(self):
        self.finish(json.dumps({
            "data": (
                "Hello, world!"
                " This is the '/cropmstudio/hello' endpoint."
                " Try visiting me in your browser!"
            ),
        }))


def setup_route_handlers(web_app):
    host_pattern = ".*$"
    base_url = web_app.settings["base_url"]

    hello_route_pattern = url_path_join(base_url, "cropmstudio", "hello")
    handlers = [
        # test handler, should be removed
        (hello_route_pattern, HelloRouteHandler),

        # GET handlers
        (url_path_join(base_url, "cropmstudio", "get-models"), GetModels),
        (url_path_join(base_url, "cropmstudio", "get-model-header"), GetModelHeader),
        (url_path_join(base_url, "cropmstudio", "get-model-unit-inputs-outputs"), GetModelUnitInputsOutputs),
        (url_path_join(base_url, "cropmstudio", "get-model-unit-parametersets"), GetModelUnitParametersets),
        (url_path_join(base_url, "cropmstudio", "get-model-unit-testsets"), GetModelUnitTestsets),
        (url_path_join(base_url, "cropmstudio", "get-packages"), GetPackagesHandler),

        # POST handlers
        (url_path_join(base_url, "cropmstudio", "create-model"), CreateModelHandler),
        (url_path_join(base_url, "cropmstudio", "create-package"), CreatePackageHandler),
        (url_path_join(base_url, "cropmstudio", "display-model"), DisplayModelHandler),
        (url_path_join(base_url, "cropmstudio", "import-package"), ImportPackageHandler),
        (url_path_join(base_url, "cropmstudio", "Crop2ML-to-platform"), Crop2MLToPlatformHandler),
        (url_path_join(base_url, "cropmstudio", "platform-to-Crop2ML"), PlatformToCrop2MLHandler)
    ]

    web_app.add_handlers(host_pattern, handlers)
