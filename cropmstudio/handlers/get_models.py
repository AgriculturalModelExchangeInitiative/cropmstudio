import json

import tornado
from jupyter_server.base.handlers import APIHandler

from ..crop2ml_utils.utils import get_models

class GetModels(APIHandler):
    # The following decorator should be present on all verb methods (head, get, post,
    # patch, put, delete, options) to ensure only authorized user can request the
    # Jupyter server
    @tornado.web.authenticated
    def get(self):
        path = self.get_argument('package', None)
        models = get_models(path)

        self.finish(json.dumps({
            "success": True,
            "models": models
        }))
