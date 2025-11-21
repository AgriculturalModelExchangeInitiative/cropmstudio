import json
import tornado

from jupyter_server.base.handlers import APIHandler

class CreatePackageHandler(APIHandler):
    # The following decorator should be present on all verb methods (head, get, post,
    # patch, put, delete, options) to ensure only authorized user can request the
    # Jupyter server
    @tornado.web.authenticated
    def post(self):
        data = self.get_json_body()
        self.log.warning(f"DATA: {data}")
        self.finish(json.dumps({
            "data": data,
        }))
