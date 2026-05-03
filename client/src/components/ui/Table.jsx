import React, { useState } from 'react';

const Table = ({ headers, data, renderRow, emptyMessage = 'No data available' }) => {
  const [hoveredRow, setHoveredRow] = useState(null);

  return (
    <div className="table-wrapper">
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        textAlign: 'left',
        fontSize: '0.95rem'
      }}>
        <thead style={{
          backgroundColor: 'var(--surface-secondary)',
          borderBottom: '2px solid var(--border-color)'
        }}>
          <tr>
            {headers.map((header, index) => (
              <th
                key={index}
                style={{
                  padding: '1rem 1.25rem',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  borderRight: index < headers.length - 1 ? '1px solid var(--border-light)' : 'none',
                  whiteSpace: 'nowrap'
                }}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={headers.length}
                style={{
                  padding: '3rem 1.5rem',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '1rem',
                  fontStyle: 'italic'
                }}
              >
                📭 {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, index) => (
              <tr
                key={item._id || index}
                style={{
                  borderBottom: '1px solid var(--border-light)',
                  backgroundColor: hoveredRow === index ? 'var(--surface-secondary)' : 'var(--surface)',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={() => setHoveredRow(index)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                {renderRow(item, index)}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
