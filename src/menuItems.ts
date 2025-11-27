import { JSONExt } from '@lumino/coreutils';

import { requestAPI } from './request';
import { IDict, IFormBuild } from './types';

import createModelSchema from './_schema/create-model.json';
import createUnitModelSchema from './_schema/unit-model.json';
import createCompositeModelSchema from './_schema/composition-model.json';
import createPackageSchema from './_schema/create-package.json';
import importPackageSchema from './_schema/import-package.json';

function createFromBuild(name: string): IFormBuild {
  const form = formBuilds[name];
  return {
    ...form,
    schema: JSONExt.deepCopy(form.schema),
    sourceData: JSONExt.deepCopy(form.sourceData ?? {}),
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
  createUnitModelTestSets: {
    schema: createUnitModelSchema.properties.testsets,
    submit: 'create-model'
  },
  createUnitModelParamSets: {
    schema: createUnitModelSchema.properties.parametersets,
    submit: null,
    nextForm: async (data: IDict) => createFromBuild('createUnitModelTestSets')
  },
  createUnitModelInputOutputs: {
    schema: createUnitModelSchema.properties.inputsOutputs,
    submit: null,
    nextForm: async (data: IDict) => createFromBuild('createUnitModelParamSets')
  },
  createCompositeModel: {
    schema: createCompositeModelSchema.properties.links,
    submit: 'create-model'
  },
  createModel: {
    schema: createModelSchema,
    submit: null,
    nextForm: async (data: IDict) => {
      if (data['Model type'] === 'unit') {
        return createFromBuild('createUnitModelInputOutputs');
      }
      return createFromBuild('createCompositeModel');
    },
    initSchema: async () => {
      const schema = { ...createModelSchema } as IDict;
      return requestAPI<any>('get-packages', {
        method: 'GET'
      })
        .then(data => {
          schema.properties.Path.enum = data.packages;
          return schema;
        })
        .catch(reason => {
          console.error(
            `An error occurred while getting the packages list.\n${reason}`
          );
          return schema;
        });
    }
  }
};

export const menuItems: { [title: string]: () => IFormBuild } = {
  [createPackageSchema.title]: () => createFromBuild('createPackage'),
  [importPackageSchema.title]: () => createFromBuild('importPackage'),
  [createModelSchema.title]: () => createFromBuild('createModel'),
};
