import { Button } from '@jupyterlab/ui-components';
import { FieldProps } from '@rjsf/utils';
import React from 'react';
import DataGrid, { Column } from 'react-data-grid';

/**
 * Generic row structure - dynamically typed based on schema.
 * All properties come from the schema at runtime.
 */
interface ITableRow {
  // Internal ID for tracking in react-data-grid
  _id: string;
  // All other properties are dynamic based on schema
  [key: string]: any;
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
}: IEditorProps<ITableRow> & { options: string[] }) {
  const value = row[column.key as string] as string;

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
}: IEditorProps<ITableRow>) {
  const value = row[column.key as string] as string;

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
  const rows: ITableRow[] = React.useMemo(() => {
    return (formData as any[]).map((item, index) => ({
      ...item,
      _id: `row-${index}-${item.Name || 'unnamed'}`
    }));
  }, [formData]);

  // Extract schema for items
  const itemSchema = (schema.items as any) || {};

  // Extract conditional category enums from schema
  // This maps InputType values to their corresponding Category enums
  const extractConditionalCategoryEnums = (): Record<string, string[]> => {
    const conditionalEnums: Record<string, string[]> = {};

    // Parse allOf conditionals to extract category enums based on InputType
    if (itemSchema.allOf && Array.isArray(itemSchema.allOf)) {
      itemSchema.allOf.forEach((condition: any) => {
        // Check if this is a condition on InputType
        if (condition.if?.properties?.InputType?.const) {
          const inputTypeValue = condition.if.properties.InputType.const;
          const categoryEnums =
            condition.then?.properties?.Category?.enum || [];
          if (categoryEnums.length > 0) {
            conditionalEnums[inputTypeValue] = categoryEnums;
          }
        }
      });
    }

    return conditionalEnums;
  };

  const categoryEnumsByInputType = extractConditionalCategoryEnums();

  // Get category options for a specific row based on its InputType
  const getCategoryOptions = (row: ITableRow): string[] => {
    if (row.InputType && categoryEnumsByInputType[row.InputType]) {
      return categoryEnumsByInputType[row.InputType];
    }
    // Fallback: return all possible categories if InputType not set
    return Object.values(categoryEnumsByInputType).reduce(
      (acc, curr) => acc.concat(curr),
      [] as string[]
    );
  };

  // Get conditional options for a field based on row values
  const getConditionalOptions = (
    fieldKey: string,
    row: ITableRow
  ): string[] | null => {
    // Special handling for Category field with InputType condition
    if (fieldKey === 'Category') {
      return getCategoryOptions(row);
    }
    // Add more conditional logic here for other fields if needed
    return null;
  };

  // Generate columns dynamically from schema
  const columns: Column<ITableRow>[] = React.useMemo(() => {
    const schemaProperties = itemSchema.properties || {};
    const generatedColumns: Column<ITableRow>[] = [];

    // Add index column first
    generatedColumns.push({
      key: 'index',
      name: '#',
      width: 50,
      resizable: false,
      formatter: ({ rowIdx }) => <div>{rowIdx + 1}</div>
    });

    // Generate columns from schema properties
    Object.keys(schemaProperties).forEach(key => {
      const propSchema = schemaProperties[key];
      const hasEnum = propSchema.enum && Array.isArray(propSchema.enum);

      // Determine column name from schema or use key
      const columnName = propSchema.title || key;

      // Determine width based on field type
      let width = 120;
      if (key === 'Description') {
        width = 200;
      } else if (key === 'Name') {
        width = 150;
      } else if (['Len', 'Min', 'Max'].includes(key)) {
        width = 80;
      } else if (key === 'DataType') {
        width = 140;
      } else if (key === 'Uri') {
        width = 150;
      }

      // Create column definition
      const column: Column<ITableRow> = {
        key,
        name: columnName,
        width,
        resizable: true,
        editable: true,
        editor: hasEnum
          ? p => <EnumEditor {...p} options={propSchema.enum} />
          : TextEditor
      };

      // Check for conditional enums (like Category)
      const conditionalField = (fieldKey: any) => {
        if (fieldKey === 'Category' && categoryEnumsByInputType) {
          return (p: any) => (
            <EnumEditor
              {...p}
              options={getConditionalOptions(fieldKey, p.row) || []}
            />
          );
        }
        return null;
      };

      const conditionalEditor = conditionalField(key);
      if (conditionalEditor) {
        column.editor = conditionalEditor;
      }

      generatedColumns.push(column);
    });

    return generatedColumns;
  }, [itemSchema, categoryEnumsByInputType]);

  // Handle row updates
  const handleRowsChange = (newRows: ITableRow[]) => {
    // Remove internal _id before passing to RJSF
    const cleanedRows = newRows.map(row => {
      const { _id, ...rest } = row;
      void _id;
      return rest;
    });
    onChange(cleanedRows);
  };

  // Handle adding a new row with default values from schema
  const handleAddRow = () => {
    const schemaProperties = itemSchema.properties || {};
    const requiredFields = itemSchema.required || [];
    const newRow: Record<string, any> = {};

    // Set default values based on schema
    Object.keys(schemaProperties).forEach(key => {
      const propSchema = schemaProperties[key];

      // Use default value from schema if available
      if (propSchema.default !== undefined) {
        newRow[key] = propSchema.default;
      }
      // For enum fields, use first value if field is required
      else if (propSchema.enum && propSchema.enum.length > 0) {
        if (requiredFields.includes(key)) {
          newRow[key] = propSchema.enum[0];
        }
      }
      // For string fields, use empty string if required
      else if (propSchema.type === 'string') {
        if (requiredFields.includes(key)) {
          newRow[key] = '';
        }
      }
    });

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
            rowKeyGetter={(row: ITableRow) => row._id}
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
