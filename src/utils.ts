import { requestAPI } from './request';
import { IDict } from './types';

/**
 * Get the package list (list of path).
 */
export async function getPackages(): Promise<string[]> {
  return requestAPI<any>('get-packages', {
    method: 'GET'
  })
    .then(data => {
      return data.packages;
    })
    .catch(reason => {
      console.error(
        `An error occurred while getting the packages list.\n${reason}`
      );
      return [];
    });
}

/**
 * Get the model header data given a package and a model.
 */
export async function getModelHeaderData(
  packagePath: string,
  model: string
): Promise<IDict> {
  const endpoint = 'get-model-header';
  const params = new URLSearchParams({
    package: packagePath,
    model
  });
  return requestAPI<any>(`${endpoint}?${params.toString()}`, {
    method: 'GET'
  })
    .then(response => {
      return response.data;
    })
    .catch(reason => {
      console.error(
        `An error occurred while getting the packages list.\n${reason}`
      );
      return {};
    });
}

/**
 * Get the unit model inputs/outputs/functions given a package and a model.
 */
export async function getModelUnitInputsOutputs(
  packagePath: string,
  model: string
): Promise<IDict> {
  const endpoint = 'get-model-unit-inputs-outputs';
  const params = new URLSearchParams({
    package: packagePath,
    model
  });
  return requestAPI<any>(`${endpoint}?${params.toString()}`, {
    method: 'GET'
  })
    .then(response => {
      return response.data;
    })
    .catch(reason => {
      console.error(
        `An error occurred while getting the packages list.\n${reason}`
      );
      return {};
    });
}

/**
 * Get the unit model parametersets given a package and a model.
 */
export async function getModelUnitParametersets(
  packagePath: string,
  model: string
): Promise<IDict> {
  const endpoint = 'get-model-unit-parametersets';
  const params = new URLSearchParams({
    package: packagePath,
    model
  });
  return requestAPI<any>(`${endpoint}?${params.toString()}`, {
    method: 'GET'
  })
    .then(response => {
      return response.data;
    })
    .catch(reason => {
      console.error(
        `An error occurred while getting the parametersets.\n${reason}`
      );
      return {};
    });
}

/**
 * Get the unit model testsets given a package and a model.
 */
export async function getModelUnitTestsets(
  packagePath: string,
  model: string
): Promise<IDict> {
  const endpoint = 'get-model-unit-testsets';
  const params = new URLSearchParams({
    package: packagePath,
    model
  });
  return requestAPI<any>(`${endpoint}?${params.toString()}`, {
    method: 'GET'
  })
    .then(response => {
      return response.data;
    })
    .catch(reason => {
      console.error(`An error occurred while getting the testsets.\n${reason}`);
      return {};
    });
}
