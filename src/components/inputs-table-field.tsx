import { Button } from '@jupyterlab/ui-components';
import { FieldProps } from '@rjsf/utils';
import React from 'react';
import DataGrid, { Column } from 'react-data-grid';

/**
 * Input/Output row structure based on the schema
 */
interface IInputOutputRow {
  Type: 'input' | 'output' | 'input & output';
  Name: string;
  Description: string;
  InputType?: 'variable' | 'parameter';
  Category: string;
  DataType:
    | 'DOUBLE'
    | 'DOUBLELIST'
    | 'DOUBLEARRAY'
    | 'INT'
    | 'INTLIST'
    | 'INTARRAY'
    | 'STRING'
    | 'STRINGLIST'
    | 'STRINGARRAY'
    | 'BOOLEAN'
    | 'DATE'
    | 'DATELIST'
    | 'DATEARRAY';
  Len?: string;
  Default?: string;
  Min?: string;
  Max?: string;
  Unit: string;
  Uri?: string;
  // Internal ID for tracking
  _id: string;
}

/**
 * Editor props interface
 */
interface IEditorProps<TRow> {
  row: TRow;
  column: Column<TRow>;
  onRowChange: (row: TRow, commitChanges?: boolean) => void;
  onClose: (commitChanges?: boolean) => void;
}

/**
 * Enum editor component for dropdown cells
 */
function EnumEditor({
  row,
  column,
  onRowChange,
  onClose,
  options
}: IEditorProps<IInputOutputRow> & { options: string[] }) {
  const value = row[column.key as keyof IInputOutputRow] as string;

  return (
    <select
      className="rdg-text-editor"
      value={value || ''}
      onChange={event => {
        onRowChange({ ...row, [column.key]: event.target.value }, true);
        onClose(true);
      }}
      autoFocus
      style={{ width: '100%', height: '100%' }}
    >
      <option value="">Select...</option>
      {options.map((opt: any) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}

/**
 * Text editor component for text cells
 */
function TextEditor({
  row,
  column,
  onRowChange,
  onClose
}: IEditorProps<IInputOutputRow>) {
  const value = row[column.key as keyof IInputOutputRow] as string;

  return (
    <input
      className="rdg-text-editor"
      type="text"
      value={value || ''}
      onChange={event => {
        onRowChange({ ...row, [column.key]: event.target.value });
      }}
      onBlur={() => {
        onRowChange(row, true);
        onClose(true);
      }}
      autoFocus
      style={{ width: '100%', height: '100%' }}
    />
  );
}

/**
 * Custom Array Field using react-data-grid for Inputs/Outputs
 */
export function InputsTableField(props: FieldProps): JSX.Element | null {
  const { formData = [], onChange, schema, uiSchema, name, required } = props;

  // Create rows with internal IDs for tracking
  const rows: IInputOutputRow[] = React.useMemo(() => {
    return (formData as any[]).map((item, index) => ({
      ...item,
      _id: `row-${index}-${item.Name || 'unnamed'}`
    }));
  }, [formData]);

  // Get enum values from the schema
  const itemSchema = (schema.items as any) || {};
  const typeEnum = itemSchema.properties?.Type?.enum || [
    'input',
    'output',
    'input & output'
  ];
  const inputTypeEnum = itemSchema.properties?.InputType?.enum || [
    'variable',
    'parameter'
  ];
  const dataTypeEnum = itemSchema.properties?.DataType?.enum || [
    'DOUBLE',
    'DOUBLELIST',
    'DOUBLEARRAY',
    'INT',
    'INTLIST',
    'INTARRAY',
    'STRING',
    'STRINGLIST',
    'STRINGARRAY',
    'BOOLEAN',
    'DATE',
    'DATELIST',
    'DATEARRAY'
  ];

  // Get all possible category values
  const categoryEnum = [
    'constant',
    'species',
    'genotypic',
    'soil',
    'private',
    'state',
    'rate',
    'auxiliary',
    'exogenous'
  ];

  // Define columns for the data grid
  const columns: Column<IInputOutputRow>[] = [
    {
      key: 'index',
      name: '#',
      width: 50,
      resizable: false,
      formatter: ({ rowIdx }) => <div>{rowIdx + 1}</div>
    },
    {
      key: 'Type',
      name: 'Type',
      width: 120,
      resizable: true,
      editable: true,
      editor: p => <EnumEditor {...p} options={typeEnum} />
    },
    {
      key: 'Name',
      name: 'Name',
      width: 150,
      resizable: true,
      editable: true,
      editor: TextEditor
    },
    {
      key: 'Description',
      name: 'Description',
      width: 200,
      resizable: true,
      editable: true,
      editor: TextEditor
    },
    {
      key: 'InputType',
      name: 'Input Type',
      width: 120,
      resizable: true,
      editable: true,
      editor: p => <EnumEditor {...p} options={inputTypeEnum} />
    },
    {
      key: 'Category',
      name: 'Category',
      width: 120,
      resizable: true,
      editable: true,
      editor: p => <EnumEditor {...p} options={categoryEnum} />
    },
    {
      key: 'DataType',
      name: 'Data Type',
      width: 140,
      resizable: true,
      editable: true,
      editor: p => <EnumEditor {...p} options={dataTypeEnum} />
    },
    {
      key: 'Len',
      name: 'Length',
      width: 80,
      resizable: true,
      editable: true,
      editor: TextEditor
    },
    {
      key: 'Default',
      name: 'Default',
      width: 100,
      resizable: true,
      editable: true,
      editor: TextEditor
    },
    {
      key: 'Min',
      name: 'Min',
      width: 80,
      resizable: true,
      editable: true,
      editor: TextEditor
    },
    {
      key: 'Max',
      name: 'Max',
      width: 80,
      resizable: true,
      editable: true,
      editor: TextEditor
    },
    {
      key: 'Unit',
      name: 'Unit',
      width: 100,
      resizable: true,
      editable: true,
      editor: TextEditor
    },
    {
      key: 'Uri',
      name: 'URI',
      width: 150,
      resizable: true,
      editable: true,
      editor: TextEditor
    }
  ];

  // Handle row updates
  const handleRowsChange = (newRows: IInputOutputRow[]) => {
    // Remove internal _id before passing to RJSF
    const cleanedRows = newRows.map(row => {
      const { _id, ...rest } = row;
      void _id;
      return rest;
    });
    onChange(cleanedRows);
  };

  // Handle adding a new row
  const handleAddRow = () => {
    const newRow: Partial<IInputOutputRow> = {
      Type: 'input',
      Name: '',
      Description: '',
      InputType: 'variable',
      Category: 'state',
      DataType: 'DOUBLE',
      Unit: ''
    };
    onChange([...(formData as any[]), newRow]);
  };

  // Handle removing a row
  const handleRemoveRow = (rowId: string) => {
    const index = rows.findIndex(row => row._id === rowId);
    if (index !== -1) {
      const newData = [...(formData as any[])];
      newData.splice(index, 1);
      onChange(newData);
    }
  };

  const title =
    (uiSchema?.['ui:title'] as string) || schema.title || name || 'Items';

  return (
    <div className="jp-cropmstudio-inputs-table">
      <div className="table-header">
        <h3>
          {title}
          {required && <span className="required"> *</span>}
        </h3>
      </div>

      {rows.length === 0 ? (
        <div className="empty-message">
          No inputs/outputs defined. Click "Add Row" to add one.
        </div>
      ) : (
        <div className="table-container">
          <DataGrid
            columns={columns}
            rows={rows}
            onRowsChange={handleRowsChange}
            rowKeyGetter={(row: IInputOutputRow) => row._id}
            className="rdg-light"
            style={{
              height: Math.min(500, rows.length * 35 + 35),
              minHeight: 150,
              width: '100%'
            }}
          />
        </div>
      )}

      <div className="table-footer">
        <Button
          className="jp-mod-styled jp-mod-accept add-row-button"
          onClick={handleAddRow}
        >
          + Add Row
        </Button>
        {rows.length > 0 && (
          <div className="remove-row-controls">
            <label htmlFor="remove-row-select">Remove row: </label>
            <select
              id="remove-row-select"
              onChange={e => {
                if (e.target.value) {
                  handleRemoveRow(e.target.value);
                  e.target.value = '';
                }
              }}
              defaultValue=""
            >
              <option value="">Select a row...</option>
              {rows.map((row, index) => (
                <option key={row._id} value={row._id}>
                  {index + 1}. {row.Name || '(unnamed)'}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
