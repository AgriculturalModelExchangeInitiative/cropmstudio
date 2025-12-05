import base64
import json
import os

import tornado
from jupyter_server.base.handlers import APIHandler

from pycropml.topology import Topology


class DisplayModelHandler(APIHandler):
    """
    Handler for get an image of the workflow

    Expects JSON data with the following structure:
    {
        "Path": "path/to/package"
    }
    """

    @tornado.web.authenticated
    def post(self):
        try:
            data = self.get_json_body()
            self.log.info(f"Received display model request")

            path = data.get('Path', '')

            # Validation
            if not path:
                self.finish(json.dumps({
                    "success": False,
                    "error": "You must provide a package path."
                }))
                return

            # Get package name from path
            package_name = os.path.basename(path)

            # Create topology instance
            try:
                topo = Topology(package_name, pkg=path)

                # Generate the workflow image
                # The Topology class generates an SVGimage file
                # We need to get the image data and encode it
                image_data = topo.get_wf_svg()

                # Check if the data is binary or text
                if isinstance(image_data, bytes):
                    # Binary data (PNG, JPG, etc.) - encode to base64
                    encoded_image = f"data:image/svg+xml;base64,{base64.b64encode(image_data).decode('utf-8')}"
                    image_type = 'binary'
                elif isinstance(image_data, str):
                    # Text data (SVG as text) - send as is
                    encoded_image = f"data:image/svg+xml;base64,{image_data}"
                    image_type = 'svg'
                else:
                    raise ValueError(f"Unexpected image data type: {type(image_data)}")

                self.finish(json.dumps({
                    "success": True,
                    "package_name": package_name,
                    "image": encoded_image,
                    "image_type": image_type,
                    "message": f"Successfully generated workflow for package {package_name}"
                }))

            except Exception as e:
                self.log.error(f"Error generating topology: {str(e)}", exc_info=True)
                self.finish(json.dumps({
                    "success": False,
                    "error": f"Error generating workflow: {str(e)}"
                }))

        except Exception as e:
            self.log.error(f"Error displaying model: {str(e)}", exc_info=True)
            self.finish(json.dumps({
                "success": False,
                "error": str(e)
            }))
