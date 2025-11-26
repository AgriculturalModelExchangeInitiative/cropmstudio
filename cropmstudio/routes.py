import json

from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join
import tornado

from .handlers import CreatePackageHandler, GetPackagesHandler, ImportPackageHandler

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
        (hello_route_pattern, HelloRouteHandler),
        (url_path_join(base_url, "cropmstudio", "create-package"), CreatePackageHandler),
        (url_path_join(base_url, "cropmstudio", "get-packages"), GetPackagesHandler),
        (url_path_join(base_url, "cropmstudio", "import-package"), ImportPackageHandler)
    ]

    web_app.add_handlers(host_pattern, handlers)
