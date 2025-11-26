import json
import os

import tornado

from jupyter_server.base.handlers import APIHandler

class GetPackagesHandler(APIHandler):
    # The following decorator should be present on all verb methods (head, get, post,
    # patch, put, delete, options) to ensure only authorized user can request the
    # Jupyter server
    @tornado.web.authenticated
    def get(self):
        pkg_directory = "./packages"
        packages = []
        for f in os.listdir(pkg_directory):
            packages.append(os.path.join(pkg_directory, f))

        self.finish(json.dumps({
            "packages": packages
        }))
