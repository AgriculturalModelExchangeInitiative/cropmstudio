import { requestAPI } from './request';
import createModelSchema from './_schema/create-model.json';
import createUnitModelSchema from './_schema/unit-model.json';
import createCompositeModelSchema from './_schema/composition-model.json';
import createPackageSchema from './_schema/create-package.json';
import importPackageSchema from './_schema/import-package.json';
import { IDict, IFormBuild } from './types';

export interface IMenuItem extends IFormBuild {
  label: string;
  disabled?: () => Promise<boolean>;
}

const createPackage: IMenuItem = {
  label: createPackageSchema.title,
  schema: createPackageSchema,
  submit: 'create-package'
};

const importPackage: IMenuItem = {
  label: importPackageSchema.title,
  schema: importPackageSchema,
  submit: 'import-package',
  uiSchema: {
    package: {
      'ui:options': { accept: '.zip' }
    }
  }
};

export const createUnitModelTestSets: IFormBuild = {
  schema: createUnitModelSchema.properties.testsets,
  submit: 'create-model'
};

export const createUnitModelParamSets: IFormBuild = {
  schema: createUnitModelSchema.properties.parametersets,
  submit: null,
  nextForm: createUnitModelTestSets
};

export const createUnitModelInputOutputs: IFormBuild = {
  schema: createUnitModelSchema.properties.inputsOutputs,
  submit: null,
  nextForm: createUnitModelParamSets
};

export const createCompositeModel: IFormBuild = {
  schema: createCompositeModelSchema.properties.links,
  submit: 'create-model'
};

const createModel: IMenuItem = {
  label: createModelSchema.title,
  schema: createModelSchema,
  submit: null,
  nextForm: (data: IDict) => {
    if (data['Model type'] === 'unit') {
      return createUnitModelInputOutputs;
    }
    return createCompositeModel;
  },
  updateSchema: async () => {
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
};

export const menuItems: IMenuItem[] = [
  createPackage,
  importPackage,
  createModel
];
