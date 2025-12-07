import base64
from io import BytesIO
import json
import os
from pathlib import Path
from zipfile import ZipFile

import tornado

from jupyter_server.base.handlers import APIHandler

class DownloadPackageHandler(APIHandler):
    """
    Handler for downloading a package as a ZIP file.

    Expects JSON data with the following structure:
    {
        "Path": "path/to/package"
    }

    Returns JSON with base64-encoded ZIP data that can be used to trigger a download.
    """

    @tornado.web.authenticated
    def post(self):
        try:
            data = self.get_json_body()
            self.log.info(f"Received download package request")

            path = data.get('Path', '')

            # Validation
            if not path:
                self.finish(json.dumps({
                    "success": False,
                    "error": "You must provide a package path."
                }))
                return

            # Check if directory exists
            directory = Path(path)
            if not directory.is_dir():
                self.finish(json.dumps({
                    "success": False,
                    "error": f"Directory not found: {path}"
                }))
                return

            # Create in-memory ZIP file
            bytes_zip = BytesIO()

            try:
                with ZipFile(bytes_zip, "w") as zf:
                    for root, dirs, files in os.walk(directory):
                        for file in files:
                            file_path = os.path.join(root, file)
                            # Store relative path in ZIP
                            arcname = os.path.relpath(file_path, os.path.join(directory, '..'))
                            zf.write(file_path, arcname)

                # Encode ZIP to base64
                b64_data = base64.b64encode(bytes_zip.getvalue()).decode('utf-8')
                package_name = directory.name

                self.finish(json.dumps({
                    "success": True,
                    "package_name": package_name,
                    "download": f"data:application/zip;base64,{b64_data}",
                    "filename": f"{package_name}.zip",
                    "message": f"Successfully created ZIP for package {package_name}"
                }))

            except Exception as e:
                self.log.error(f"Error creating ZIP: {str(e)}", exc_info=True)
                self.finish(json.dumps({
                    "success": False,
                    "error": f"Error creating ZIP file: {str(e)}"
                }))

        except Exception as e:
            self.log.error(f"Error downloading package: {str(e)}", exc_info=True)
            self.finish(json.dumps({
                "success": False,
                "error": str(e)
            }))
