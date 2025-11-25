import createPackageSchema from './schema/create-package.json';
import importPackageSchema from './schema/import-package.json';
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

export const menuItems: IMenuItem[] = [createPackage, importPackage];
