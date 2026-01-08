import { JSONExt } from '@lumino/coreutils';
import { IChangeEvent } from '@rjsf/core';

import { About, InputsTableField } from './components';
import { requestAPI } from './request';
import { IDict, IFormBuild, IMenuItem } from './types';
import {
  getModelHeaderData,
  getModelUnitInputsOutputs,
  getModelUnitParametersets,
  getModelUnitTestsets,
  getPackages
} from './utils';

import createCompositeModelSchema from './_schema/composition-model.json';
import createModelSchema from './_schema/create-model.json';
import createPackageSchema from './_schema/create-package.json';
import displayModelSchema from './_schema/display-model.json';
import downloadPackageSchema from './_schema/download-package.json';
import editModelSchema from './_schema/edit-model.json';
import importPackageSchema from './_schema/import-package.json';
import platformTransformSchema from './_schema/platform-transformation.json';
import createUnitModelSchema from './_schema/unit-model.json';

function createFromBuild(name: string): IFormBuild {
  const form = formBuilds[name];
  return {
    ...form,
    schema: JSONExt.deepCopy(form.schema),
    sourceData: {} // Always start with empty data when creating from menu
  };
}

const formBuilds: { [name: string]: IFormBuild } = {
  createPackage: {
    schema: createPackageSchema,
    submit: 'create-package'
  },
  importPackage: {
    schema: importPackageSchema,
    submit: 'import-package',
    uiSchema: {
      package: {
        'ui:options': { accept: '.zip' }
      }
    }
  },
  createUnitModelInputOutputs: {
    schema: createUnitModelSchema.properties.inputsOutputs,
    submit: null,
    uiSchema: {
      Inputs: {
        'ui:field': InputsTableField
      }
    },
    initFormData: async (data: IDict) => {
      // If editing (data has editModelSchema.$id), load existing data
      if (editModelSchema.$id in data) {
        return await getModelUnitInputsOutputs(
          data[editModelSchema.$id].package,
          data[editModelSchema.$id].model
        );
      }
      return {};
    },
    nextForm: async (data: IDict) => {
      return createFromBuild('createUnitModelParamSets');
    }
  },
  createUnitModelParamSets: {
    schema: createUnitModelSchema.properties.parametersets,
    submit: null,
    initFormData: async (data: IDict) => {
      // If editing, load existing data
      if (editModelSchema.$id in data) {
        return await getModelUnitParametersets(
          data[editModelSchema.$id].package,
          data[editModelSchema.$id].model
        );
      }
      return {};
    },
    nextForm: async (data: IDict) => createFromBuild('createUnitModelTestSets')
  },
  createUnitModelTestSets: {
    schema: createUnitModelSchema.properties.testsets,
    submit: 'create-model',
    initFormData: async (data: IDict) => {
      // If editing, load existing data
      if (editModelSchema.$id in data) {
        return await getModelUnitTestsets(
          data[editModelSchema.$id].package,
          data[editModelSchema.$id].model
        );
      }
      return {};
    }
  },
  createCompositeModel: {
    schema: createCompositeModelSchema.properties.links,
    submit: 'create-model'
  },
  createModel: {
    schema: createModelSchema,
    submit: null,
    nextForm: async (data: IDict) => {
      if (data[createModelSchema.$id]['Model type'] === 'unit') {
        return createFromBuild('createUnitModelInputOutputs');
      }
      return createFromBuild('createCompositeModel');
    },
    initFormData: async (data: IDict) => {
      // If editing (data has editModelSchema.$id), load existing data
      if (editModelSchema.$id in data) {
        return await getModelHeaderData(
          data[editModelSchema.$id].package,
          data[editModelSchema.$id].model
        );
      }
      return {};
    },
    initSchema: async (data: IDict) => {
      const schema = JSONExt.deepCopy(createModelSchema) as IDict;
      const packages = await getPackages();
      schema.properties.Path.enum = packages;

      // If editing, make Path and Model type readonly
      if (editModelSchema.$id in data) {
        schema.properties.Path.readOnly = true;
        schema.properties['Model type'].readOnly = true;
      }

      return schema;
    }
  },
  editModel: {
    schema: editModelSchema,
    submit: null,
    lock: true,
    nextForm: async (data: IDict) => {
      return createFromBuild('createModel');
    },
    initSchema: async (data: IDict) => {
      const schema = JSONExt.deepCopy(editModelSchema) as IDict;
      const currentData = data[editModelSchema.$id];

      // If we already have data (navigating back), remove enums since fields will be readonly
      if (currentData?.package && currentData?.model) {
        delete schema.properties.package.enum;
        delete schema.properties.model.enum;
      } else {
        // First time: load packages enum
        const packages = await getPackages();
        schema.properties.package.enum = packages;
      }

      return schema;
    },
    onDataChanged: async (e: IChangeEvent) => {
      const schema = JSONExt.deepCopy(e.schema) as IDict;
      const endpoint = 'get-models';
      const params = new URLSearchParams({ package: e.formData.package });
      return requestAPI<any>(`${endpoint}?${params.toString()}`, {
        method: 'GET'
      })
        .then(data => {
          schema.properties.model.enum = data.models;
          return schema;
        })
        .catch(reason => {
          console.error(
            `An error occurred while getting the packages list.\n${reason}`
          );
          return null;
        });
    }
  },
  crop2MLToPlatform: {
    schema: platformTransformSchema,
    submit: 'Crop2ML-to-platform',
    initSchema: async (data: IDict) => {
      const schema = JSONExt.deepCopy(platformTransformSchema) as IDict;
      const packages = await getPackages();
      schema.properties.Path.enum = packages;
      return schema;
    }
  },
  platformToCrop2ML: {
    schema: platformTransformSchema,
    submit: 'platform-to-Crop2ML',
    initSchema: async (data: IDict) => {
      const schema = JSONExt.deepCopy(platformTransformSchema) as IDict;
      const packages = await getPackages();
      schema.properties.Path.enum = packages;
      schema.properties.Languages.properties.Java.readOnly = true;
      schema.properties.Languages.properties.CSharp.readOnly = true;
      schema.properties.Languages.properties.Fortran.readOnly = true;
      schema.properties.Languages.properties.Python.readOnly = true;
      schema.properties.Languages.properties.R.readOnly = true;
      schema.properties.Languages.properties.Cpp.readOnly = true;
      schema.properties.Platforms.properties.Record.readOnly = true;
      schema.properties.Platforms.properties.Apsim.readOnly = true;
      return schema;
    }
  },
  displayModel: {
    schema: displayModelSchema,
    submit: 'display-model',
    initSchema: async (data: IDict) => {
      const schema = JSONExt.deepCopy(displayModelSchema) as IDict;
      const packages = await getPackages();
      schema.properties.Path.enum = packages;
      return schema;
    }
  },
  downloadPackage: {
    schema: downloadPackageSchema,
    submit: 'download-package',
    initSchema: async (data: IDict) => {
      const schema = JSONExt.deepCopy(downloadPackageSchema) as IDict;
      const packages = await getPackages();
      schema.properties.Path.enum = packages;
      return schema;
    }
  }
};

export const menuItems: { [title: string]: IMenuItem } = {
  [createPackageSchema.title]: {
    formBuilder: () => createFromBuild('createPackage')
  },
  [importPackageSchema.title]: {
    formBuilder: () => createFromBuild('importPackage')
  },
  [createModelSchema.title]: {
    formBuilder: () => createFromBuild('createModel')
  },
  [editModelSchema.title]: {
    formBuilder: () => createFromBuild('editModel')
  },
  'Crop2ML to platform': {
    formBuilder: () => createFromBuild('crop2MLToPlatform')
  },
  'Platform to Crop2ML': {
    formBuilder: () => createFromBuild('platformToCrop2ML')
  },
  [displayModelSchema.title]: {
    formBuilder: () => createFromBuild('displayModel')
  },
  [downloadPackageSchema.title]: {
    formBuilder: () => createFromBuild('downloadPackage')
  },
  About: {
    displayComponent: About
  }
};
