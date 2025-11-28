import { JSONExt } from '@lumino/coreutils';

import { IDict, IFormBuild } from './types';

import createModelSchema from './_schema/create-model.json';
import createUnitModelSchema from './_schema/unit-model.json';
import createCompositeModelSchema from './_schema/composition-model.json';
import createPackageSchema from './_schema/create-package.json';
import editModelSchema from './_schema/edit-model.json';
import importPackageSchema from './_schema/import-package.json';
import { getModelUnitInputsOutputs, getModelUnitParametersets, getModelUnitTestsets, getPackages } from './utils';

function createFromBuild(name: string): IFormBuild {
  const form = formBuilds[name];
  return {
    ...form,
    schema: JSONExt.deepCopy(form.schema),
    sourceData: {}, // Always start with empty data when creating from menu
    uiSchema: JSONExt.deepCopy(form.uiSchema ?? {})
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
    initSchema: async (data: IDict) => {
      const schema = JSONExt.deepCopy(createModelSchema) as IDict;
      const packages = await getPackages();
      schema.properties.Path.enum = packages;
      return schema;
    }
  }
};

export const menuItems: { [title: string]: () => IFormBuild } = {
  [createPackageSchema.title]: () => createFromBuild('createPackage'),
  [importPackageSchema.title]: () => createFromBuild('importPackage'),
  [createModelSchema.title]: () => createFromBuild('createModel'),
};
