import createPackageSchema from './schema/createpackage.json';
import { IDict } from './types';

export interface IMenuItem {
  label: string;
  schema: IDict;
  endpoint: string;
  getFormData?: () => Promise<IDict>;
}

const createPackage: IMenuItem = {
  label: createPackageSchema.label,
  schema: createPackageSchema,
  endpoint: 'createpackage'
};

export const menuItems: IMenuItem[] = [createPackage];
