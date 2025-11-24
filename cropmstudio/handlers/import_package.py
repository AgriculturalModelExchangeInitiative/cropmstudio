import base64
from io import BytesIO
import json
from pathlib import Path
from zipfile import BadZipFile, ZipFile

import tornado

from jupyter_server.base.handlers import APIHandler

class ImportPackageHandler(APIHandler):
    # The following decorator should be present on all verb methods (head, get, post,
    # patch, put, delete, options) to ensure only authorized user can request the
    # Jupyter server
    @tornado.web.authenticated
    def post(self):
        data = self.get_json_body()
        dirpath = "./packages"

        package = data.get("package", None)
        if package is None:
            raise tornado.web.HTTPError(400, f"The package is missing")

        try:
            zip_data = package.split('base64,', 1)[1]
            data_bytes = base64.b64decode(zip_data)
        except:
            raise tornado.web.HTTPError(500, f"ZIP data can't be extracted from blob")

        if (not Path(dirpath).is_dir):
            Path(dirpath).mkdir()

        try:
            with ZipFile(BytesIO(data_bytes)) as zip:
                zip.extractall(dirpath)
        except BadZipFile as e:
            raise tornado.web.HTTPError(500, f"Data are not ZIP")
        except Exception as e:
            raise tornado.web.HTTPError(500, f"Unexpected error while extracting ZIP")

        self.finish(json.dumps({
            "success": True,
            "data": data
        }))
