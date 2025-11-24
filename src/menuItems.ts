import createPackageSchema from './schema/createpackage.json';
import importPackageSchema from './schema/importpackage.json';
import { IDict } from './types';

export interface IMenuItem {
  label: string;
  schema: IDict;
  endpoint: string;
  uiSchema?: IDict;
  getFormData?: () => Promise<IDict>;
}

const createPackage: IMenuItem = {
  label: createPackageSchema.label,
  schema: createPackageSchema,
  endpoint: 'createpackage'
};

const importPackage: IMenuItem = {
  label: importPackageSchema.label,
  schema: importPackageSchema,
  endpoint: 'importpackage',
  uiSchema: {
    package: {
      'ui:options': { accept: '.zip' }
    }
  }
};

export const menuItems: IMenuItem[] = [createPackage, importPackage];
