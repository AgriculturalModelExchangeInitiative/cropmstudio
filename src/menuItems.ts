import createPackageSchema from './schema/create-package.json';
import importPackageSchema from './schema/import-package.json';
import { IDict } from './types';

export interface IMenuItem {
  label: string;
  schema: IDict;
  endpoint: string;
  uiSchema?: IDict;
  getFormData?: () => Promise<IDict>;
}

const createPackage: IMenuItem = {
  label: createPackageSchema.title,
  schema: createPackageSchema,
  endpoint: 'create-package'
};

const importPackage: IMenuItem = {
  label: importPackageSchema.title,
  schema: importPackageSchema,
  endpoint: 'import-package',
  uiSchema: {
    package: {
      'ui:options': { accept: '.zip' }
    }
  }
};

export const menuItems: IMenuItem[] = [createPackage, importPackage];
