import json
import os

import tornado
from jupyter_server.base.handlers import APIHandler

from ..crop2ml_utils import adapt_unit_model_complete, adapt_composition_model_complete, writecompositionXML, writeunitXML


class CreateModelHandler(APIHandler):
    """
    Handler for creating crop models (unit or composition)

    Expects JSON data with the following structure:
    {
        "header": { ... },  # create-model.json schema
        "modelData": {      # unit-model.json or composition-model.json schema
            "inputsOutputs": { ... },  # for unit models
            "parametersets": { ... },  # optional, for unit models
            "testsets": { ... },       # optional, for unit models
            "models": { ... },         # for composition models
            "links": { ... }           # for composition models
        }
    }
    """

    @tornado.web.authenticated
    def post(self):
        try:
            data = self.get_json_body()
            self.log.info(f"Received model creation request")
            self.log.warning(f"Data: {data}")

            # Extract header and model data
            header = data.get('model-header', {})
            model_type = header.get('Model type', '').lower()

            if not model_type:
                self.finish(json.dumps({
                    "success": False,
                    "error": "Model type not specified in header"
                }))
                return

            header['Path'] = os.path.join(header['Path'], 'crop2ml')

            # Create model based on type
            if model_type == 'unit':
                self._create_unit_model(header, data)
            elif model_type == 'composition':
                self._create_composition_model(header, data)
            else:
                self.finish(json.dumps({
                    "success": False,
                    "error": f"Unknown model type: {model_type}"
                }))
                return

            self.finish(json.dumps({
                "success": True,
                "message": f"{model_type.capitalize()} model created successfully",
                "model_name": header.get('Model name', ''),
                "model_type": model_type
            }))

        except Exception as e:
            self.log.error(f"Error creating model: {str(e)}", exc_info=True)
            self.finish(json.dumps({
                "success": False,
                "error": str(e)
            }))

    def _create_unit_model(self, header, model_data):
        """
        Create a unit model XML file

        Args:
            header: Header data from create-model.json
            model_data: Model data with inputsOutputs, parametersets, testsets
        """
        self.log.info("Creating unit model")

        # Extract components
        inputs_outputs = model_data.get('unit/inputs-outputs', {})
        parametersets = model_data.get('unit/parametersets', None)
        testsets = model_data.get('unit/testsets', None)

        # Adapt to writeXML format
        datas, df, paramsetdict, testsetdict = adapt_unit_model_complete(
            header,
            inputs_outputs,
            parametersets,
            testsets
        )

        self.log.debug(f"Adapted data: datas={datas.keys()}, df={df.keys()}")

        # Create XML
        xml_writer = writeunitXML(
            datas=datas,
            df=df,
            paramsetdict=paramsetdict,
            testsetdict=testsetdict,
            iscreate=True,
            local=False
        )

        xml_writer._write()
        self.log.info(f"Unit model '{datas['Model name']}' created successfully")

    def _create_composition_model(self, header, model_data):
        """
        Create a composition model XML file

        Args:
            header: Header data from create-model.json
            model_data: Model data with models and links
        """
        self.log.info("Creating composition model")

        # Extract components
        models = model_data.get('composition/models', {})
        links = model_data.get('composition/links', {})

        # Adapt to writeXML format
        datas, listmodel, listlink = adapt_composition_model_complete(
            header,
            models,
            links
        )

        self.log.debug(f"Adapted data: datas={datas.keys()}, models={len(listmodel)}, links={len(listlink)}")

        # Create XML
        xml_writer = writecompositionXML(
            data=datas,
            listmodel=listmodel,
            listlink=listlink,
            iscreate=True
        )

        xml_writer.write()
        self.log.info(f"Composition model '{datas['Model name']}' created successfully")
