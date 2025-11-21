import { Button } from '@jupyterlab/ui-components';
import React from 'react';

import { IMenuItem, menuItems } from '../menuItems';
import { IFormInit } from '../types';

/**
 * The menu properties.
 */
export interface IMenuProps {
  /**
   * The function called when clicking a menu button.
   */
  onClick: (endpoint: string, formInit: IFormInit) => void;
}

/**
 * The component including all the menu buttons.
 */
export function Menu(props: IMenuProps): JSX.Element {
  const onclick = async (item: IMenuItem) => {
    const { schema } = item;
    let sourceData = {};
    if (item.getFormData) {
      sourceData = await item?.getFormData();
    }
    props.onClick(item.endpoint, { schema, sourceData });
  };

  return (
    <div>
      <div className={'menu-container'}>
        {menuItems.map(item => (
          <Button
            className={'jp-mod-styled'}
            key={item.schema.title}
            onClick={() => onclick(item)}
            title={item.label}
          >
            {item.label}
          </Button>
        ))}
      </div>

      <div className={'menu-tooltip'}>
        <div>Select an action to display the form</div>
      </div>
    </div>
  );
}
